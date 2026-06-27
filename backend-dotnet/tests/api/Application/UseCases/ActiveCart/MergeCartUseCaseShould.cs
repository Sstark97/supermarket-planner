using Microsoft.Extensions.Logging;
using NSubstitute;
using SharpMonads.Core;
using SupermarketPlanner.Api.Application.Ports.Driven;
using SupermarketPlanner.Api.Application.UseCases.ActiveCart;
using SupermarketPlanner.Api.Domain;
using SupermarketPlanner.Api.Domain.Entities;
using SupermarketPlanner.Api.Tests.Builders;

namespace SupermarketPlanner.Api.Tests.Application.UseCases.ActiveCart;

[Property("Category", "Unit")]
public sealed class MergeCartUseCaseShould
{
    private readonly IActiveCartRepository repository;
    private readonly MergeCartUseCase useCase;

    public MergeCartUseCaseShould()
    {
        repository = Substitute.For<IActiveCartRepository>();
        repository.FindByUserId(Arg.Any<string>(), Arg.Any<CancellationToken>())
            .Returns(Option<ActiveCartEntity>.None);
        repository.Upsert(Arg.Any<ActiveCartEntity>(), Arg.Any<CancellationToken>())
            .Returns(callInfo => Either<DomainError, ActiveCartEntity>.FromRight(callInfo.Arg<ActiveCartEntity>()));

        useCase = new MergeCartUseCase(repository, Substitute.For<ILogger<MergeCartUseCase>>());
    }

    private static MergeCartInput MakeValidInput(
        string userId = "user-123",
        IReadOnlyList<MergeCartItemInput>? items = null) =>
        new(userId, items ?? [new MergeCartItemInput(
            "prod-uuid-1", "Leche Entera", "mercadona", "dairy",
            1.05, 1.05, "l", "IGIC", 2, null, null)]);

    [Test]
    public async Task CallFindByUserIdWithCorrectUserId()
    {
        var input = MakeValidInput(userId: "user-abc");

        await useCase.Invoke(input, CancellationToken.None);

        await repository.Received(1).FindByUserId("user-abc", Arg.Any<CancellationToken>());
    }

    [Test]
    public async Task CallUpsertWithMergedCartAfterMerge()
    {
        var input = MakeValidInput();

        await useCase.Invoke(input, CancellationToken.None);

        await repository.Received(1).Upsert(Arg.Any<ActiveCartEntity>(), Arg.Any<CancellationToken>());
    }

    [Test]
    public async Task GenerateNewUuidForCartIdWhenNoExistingCartIsFound()
    {
        repository.FindByUserId(Arg.Any<string>(), Arg.Any<CancellationToken>())
            .Returns(Option<ActiveCartEntity>.None);

        await useCase.Invoke(MakeValidInput(), CancellationToken.None);

        var upsertCalls = repository.ReceivedCalls()
            .Where(call => call.GetMethodInfo().Name == "Upsert")
            .ToList();
        await Assert.That(upsertCalls.Count).IsEqualTo(1);
        var cartArg = (ActiveCartEntity)upsertCalls[0].GetArguments()[0]!;
        await Assert.That(cartArg.Id).IsNotNullOrEmpty();
    }

    [Test]
    public async Task ReuseExistingCartIdWhenExistingCartIsFound()
    {
        var existingCart = new ActiveCartBuilder().WithId("existing-cart-id").Build();
        repository.FindByUserId(Arg.Any<string>(), Arg.Any<CancellationToken>())
            .Returns(Option<ActiveCartEntity>.Some(existingCart));

        await useCase.Invoke(MakeValidInput(), CancellationToken.None);

        var upsertCalls = repository.ReceivedCalls()
            .Where(call => call.GetMethodInfo().Name == "Upsert")
            .ToList();
        var cartArg = (ActiveCartEntity)upsertCalls[0].GetArguments()[0]!;
        await Assert.That(cartArg.Id).IsEqualTo("existing-cart-id");
    }

    [Test]
    public async Task MergeIncomingItemsWithExistingItemsUsingClientWinsSemantics()
    {
        var existingCart = new ActiveCartBuilder()
            .WithId("cart-id")
            .WithItems([
                new ActiveCartItemBuilder().Named("Leche Entera").ForSupermarket("mercadona").WithQuantity(5).Build(),
                new ActiveCartItemBuilder().Named("Pan Integral").ForSupermarket("lidl").WithQuantity(1).Build(),
            ])
            .Build();
        repository.FindByUserId(Arg.Any<string>(), Arg.Any<CancellationToken>())
            .Returns(Option<ActiveCartEntity>.Some(existingCart));

        var input = MakeValidInput(items: [
            new MergeCartItemInput("prod-1", "Leche Entera", "mercadona", "dairy", 1.05, 1.05, "l", "IGIC", 2, null, null)
        ]);

        await useCase.Invoke(input, CancellationToken.None);

        var upsertCalls = repository.ReceivedCalls()
            .Where(call => call.GetMethodInfo().Name == "Upsert")
            .ToList();
        var cartArg = (ActiveCartEntity)upsertCalls[0].GetArguments()[0]!;
        await Assert.That(cartArg.Items.Count).IsEqualTo(2);
        var lecheItem = cartArg.Items.Single(item => item.ProductName == "Leche Entera");
        await Assert.That(lecheItem.Quantity).IsEqualTo(2);
    }

    [Test]
    public async Task ProduceResultWithCorrectCartIdUserIdAndItemCount()
    {
        var returnedCart = new ActiveCartBuilder()
            .WithId("returned-cart-id")
            .ForUser("user-123")
            .WithItems([new ActiveCartItemBuilder().Named("Leche Entera").WithQuantity(2).Build()])
            .Build();
        repository.Upsert(Arg.Any<ActiveCartEntity>(), Arg.Any<CancellationToken>())
            .Returns(Either<DomainError, ActiveCartEntity>.FromRight(returnedCart));

        var result = await useCase.Invoke(MakeValidInput(), CancellationToken.None);

        await Assert.That(result.Right.CartId).IsEqualTo("returned-cart-id");
        await Assert.That(result.Right.UserId).IsEqualTo("user-123");
        await Assert.That(result.Right.TotalItems).IsEqualTo(1);
        await Assert.That(result.Right.Items.Count).IsEqualTo(1);
    }

    [Test]
    public async Task HandleEmptyIncomingItemsAndKeepExistingItemsIntact()
    {
        var existingCart = new ActiveCartBuilder()
            .WithItems([new ActiveCartItemBuilder().Named("Leche Entera").WithQuantity(3).Build()])
            .Build();
        repository.FindByUserId(Arg.Any<string>(), Arg.Any<CancellationToken>())
            .Returns(Option<ActiveCartEntity>.Some(existingCart));

        var input = MakeValidInput(items: []);

        await useCase.Invoke(input, CancellationToken.None);

        var upsertCalls = repository.ReceivedCalls()
            .Where(call => call.GetMethodInfo().Name == "Upsert")
            .ToList();
        var cartArg = (ActiveCartEntity)upsertCalls[0].GetArguments()[0]!;
        await Assert.That(cartArg.Items.Count).IsEqualTo(1);
        await Assert.That(cartArg.Items[0].Quantity).IsEqualTo(3);
    }
}
