using Microsoft.Extensions.Logging;
using NSubstitute;
using SharpMonads.Core;
using SupermarketPlanner.Api.Application.Ports.Driven;
using SupermarketPlanner.Api.Application.UseCases.ShoppingSession;
using SupermarketPlanner.Api.Domain;

namespace SupermarketPlanner.Api.Tests.Application.UseCases.ShoppingSession;

[Property("Category", "Unit")]
public sealed class GetShoppingSessionMetricsUseCaseShould
{
    private static ShoppingSessionMetricsSnapshot MakeMetricsSnapshot() =>
        new(
            SupermarketDominance:
            [
                new ShoppingSessionSupermarketDominanceMetric("mercadona", 120, 42)
            ],
            SpendingTrends: new ShoppingSessionSpendingTrends(
                WeeklyAverage: [new ShoppingSessionTrendPoint("2026-23", 30)],
                MonthlyTotal: [new ShoppingSessionTrendPoint("2026-06", 420)],
                YearlyTotal: [new ShoppingSessionTrendPoint("2026", 1800)]),
            TicketMetrics: new ShoppingSessionTicketMetrics(37.5, 1800, "Sábado", 48));

    [Test]
    public async Task ServeShoppingSessionMetricsForAuthenticatedUser()
    {
        var repository = Substitute.For<IShoppingSessionRepository>();
        repository.MetricsForUser("user-1", Arg.Any<CancellationToken>())
            .Returns(Either<DomainError, ShoppingSessionMetricsSnapshot>.FromRight(MakeMetricsSnapshot()));

        var useCase = new GetShoppingSessionMetricsUseCase(
            repository,
            Substitute.For<ILogger<GetShoppingSessionMetricsUseCase>>());

        var result = await useCase.Invoke(new GetShoppingSessionMetricsInput("user-1"), CancellationToken.None);

        await repository.Received(1).MetricsForUser("user-1", Arg.Any<CancellationToken>());
        await Assert.That(result.Right.SupermarketDominance[0].Supermarket).IsEqualTo("mercadona");
        await Assert.That(result.Right.TicketMetrics.TotalSpentToDate).IsEqualTo(1800);
    }

    [Test]
    public async Task RejectWhenUserIdIsEmptyWithDomainError()
    {
        var repository = Substitute.For<IShoppingSessionRepository>();
        var useCase = new GetShoppingSessionMetricsUseCase(
            repository,
            Substitute.For<ILogger<GetShoppingSessionMetricsUseCase>>());

        var result = await useCase.Invoke(new GetShoppingSessionMetricsInput("  "), CancellationToken.None);

        await Assert.That(result.IsLeft).IsTrue();
        await Assert.That(result.Left.Code).IsEqualTo("VALIDATION");
    }
}
