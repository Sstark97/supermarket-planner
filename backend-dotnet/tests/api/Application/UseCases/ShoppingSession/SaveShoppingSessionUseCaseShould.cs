using Microsoft.Extensions.Logging;
using NSubstitute;
using SharpMonads.Core;
using SupermarketPlanner.Api.Application.Ports.Driven;
using SupermarketPlanner.Api.Application.UseCases.ShoppingSession;
using SupermarketPlanner.Api.Domain;
using SupermarketPlanner.Api.Domain.Entities;

namespace SupermarketPlanner.Api.Tests.Application.UseCases.ShoppingSession;

[Property("Category", "Unit")]
public sealed class SaveShoppingSessionUseCaseShould
{
    private readonly IShoppingSessionRepository repository;
    private readonly SaveShoppingSessionUseCase useCase;

    public SaveShoppingSessionUseCaseShould()
    {
        repository = Substitute.For<IShoppingSessionRepository>();
        repository.Save(Arg.Any<ShoppingSessionEntity>(), Arg.Any<CancellationToken>())
            .Returns(callInfo => Either<DomainError, ShoppingSessionEntity>.FromRight(
                callInfo.Arg<ShoppingSessionEntity>()));

        useCase = new SaveShoppingSessionUseCase(
            repository,
            Substitute.For<ILogger<SaveShoppingSessionUseCase>>());
    }

    private static SaveShoppingSessionInput MakeValidInput(
        string userId = "user-google-123",
        string shoppedAt = "2026-05-31",
        IReadOnlyList<SaveShoppingSessionItemInput>? items = null) =>
        new(userId, shoppedAt, items ?? [new SaveShoppingSessionItemInput(
            "Leche Entera", "mercadona", "dairy", 1.05, 1.05, "l", "IGIC", 2, null, null)]);

    [Test]
    public async Task SaveSessionAndReturnCorrectResultForValidInput()
    {
        var input = MakeValidInput();

        var result = await useCase.Invoke(input, CancellationToken.None);

        await Assert.That(result.IsRight).IsTrue();
        await Assert.That(result.Right.SessionId).IsNotNullOrEmpty();
        await Assert.That(result.Right.TotalPrice).IsEqualTo(2.1);
        await Assert.That(result.Right.ItemCount).IsEqualTo(1);
    }

    [Test]
    public async Task GenerateUniqueUuidForEachSession()
    {
        var first = await useCase.Invoke(MakeValidInput(), CancellationToken.None);
        var second = await useCase.Invoke(MakeValidInput(), CancellationToken.None);

        await Assert.That(first.Right.SessionId).IsNotEqualTo(second.Right.SessionId);
    }

    [Test]
    public async Task PassUserIdFromInputThroughToSavedSessionEntity()
    {
        var input = MakeValidInput(userId: "user-abc-456");

        await useCase.Invoke(input, CancellationToken.None);

        var savedSessions = repository.ReceivedCalls()
            .Where(call => call.GetMethodInfo().Name == "Save")
            .ToList();
        var sessionArg = (ShoppingSessionEntity)savedSessions[0].GetArguments()[0]!;
        await Assert.That(sessionArg.UserId).IsEqualTo("user-abc-456");
    }

    [Test]
    public async Task CorrectlyCalculateTotalPriceViaDomainCalculator()
    {
        var input = MakeValidInput(items: [
            new SaveShoppingSessionItemInput("Pan", "lidl", "bakery", 1.33, 1.33, "kg", "IGIC", 3, null, null)
        ]);

        var result = await useCase.Invoke(input, CancellationToken.None);

        await Assert.That(result.Right.TotalPrice).IsEqualTo(3.99);
    }

    [Test]
    public async Task DelegateToRepositoryWithFullSessionObject()
    {
        var input = MakeValidInput();

        await useCase.Invoke(input, CancellationToken.None);

        await repository.Received(1).Save(Arg.Any<ShoppingSessionEntity>(), Arg.Any<CancellationToken>());
        var savedSessions = repository.ReceivedCalls()
            .Where(call => call.GetMethodInfo().Name == "Save")
            .ToList();
        var sessionArg = (ShoppingSessionEntity)savedSessions[0].GetArguments()[0]!;
        await Assert.That(sessionArg.Items.Count).IsEqualTo(1);
        await Assert.That(sessionArg.Items[0].ProductName).IsEqualTo("Leche Entera");
    }

    [Test]
    public async Task RejectEmptyItemsArrayWithDomainError()
    {
        var input = MakeValidInput(items: []);

        var result = await useCase.Invoke(input, CancellationToken.None);

        await Assert.That(result.IsLeft).IsTrue();
        await Assert.That(result.Left.Code).IsEqualTo("VALIDATION");
    }

    [Test]
    public async Task RejectInvalidShoppedAtDateStringWithDomainError()
    {
        var input = MakeValidInput(shoppedAt: "not-a-date");

        var result = await useCase.Invoke(input, CancellationToken.None);

        await Assert.That(result.IsLeft).IsTrue();
        await Assert.That(result.Left.Code).IsEqualTo("VALIDATION");
    }
}
