using Microsoft.Extensions.Logging;
using NSubstitute;
using SharpMonads.Core;
using SupermarketPlanner.Api.Application.Ports.Driven;
using SupermarketPlanner.Api.Application.UseCases.ShoppingSession;
using SupermarketPlanner.Api.Domain;
using SupermarketPlanner.Api.Domain.Entities;
using SupermarketPlanner.Api.Tests.Builders;

namespace SupermarketPlanner.Api.Tests.Application.UseCases.ShoppingSession;

[Property("Category", "Unit")]
public sealed class GetShoppingSessionsUseCaseShould
{
    [Test]
    public async Task ServeSerializedShoppingSessionsForUser()
    {
        var session = new ShoppingSessionBuilder()
            .WithId("session-1")
            .ForUser("user-1")
            .ShoppedOn(new DateTimeOffset(2026, 6, 1, 10, 0, 0, TimeSpan.Zero))
            .WithItems([new ShoppingSessionItemBuilder().Named("Pan").Build()])
            .Build();

        var repository = Substitute.For<IShoppingSessionRepository>();
        repository.FindByUserId("user-1", Arg.Any<CancellationToken>())
            .Returns((IReadOnlyList<ShoppingSessionEntity>)[session]);

        var useCase = new GetShoppingSessionsUseCase(
            repository,
            Substitute.For<ILogger<GetShoppingSessionsUseCase>>());

        var result = await useCase.Invoke(new GetShoppingSessionsInput("user-1"), CancellationToken.None);

        await repository.Received(1).FindByUserId("user-1", Arg.Any<CancellationToken>());
        await Assert.That(result.Right.Sessions.Count).IsEqualTo(1);
        await Assert.That(result.Right.Sessions[0].SessionId).IsEqualTo("session-1");
        await Assert.That(result.Right.Sessions[0].ShoppedAt).IsEqualTo("2026-06-01T10:00:00.0000000+00:00");
        await Assert.That(result.Right.Sessions[0].Items[0].ProductName).IsEqualTo("Pan");
    }
}
