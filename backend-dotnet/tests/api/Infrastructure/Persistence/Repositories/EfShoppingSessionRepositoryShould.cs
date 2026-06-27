using SupermarketPlanner.Api.Infrastructure.Adapters.Driven.Persistence.Repositories;
using SupermarketPlanner.Api.Tests.Builders;

namespace SupermarketPlanner.Api.Tests.Infrastructure.Persistence.Repositories;

[Property("Category", "Integration")]
[ClassDataSource<PostgresContainerFixture>(Shared = SharedType.PerClass)]
public sealed class EfShoppingSessionRepositoryShould(PostgresContainerFixture fixture)
{
    [Test]
    public async Task SaveSessionWithItems()
    {
        await using var dbContext = await fixture.CreateFreshDbContext();
        var repository = new EfShoppingSessionRepository(dbContext);

        var session = new ShoppingSessionBuilder()
            .ForUser("user-save")
            .WithTotalPrice(15.50)
            .WithItems([
                new ShoppingSessionItemBuilder().Named("Leche Entera").WithQuantity(2).Build(),
                new ShoppingSessionItemBuilder().Named("Pan Integral").WithQuantity(1).Build()
            ])
            .Build();

        var result = await repository.Save(session, CancellationToken.None);

        await Assert.That(result.IsRight).IsTrue();
        await Assert.That(result.Right.Items.Count).IsEqualTo(2);
        await Assert.That(result.Right.UserId).IsEqualTo("user-save");
    }

    [Test]
    public async Task FindSessionsByUserIdOrderedByDate()
    {
        await using var dbContext = await fixture.CreateFreshDbContext();
        var repository = new EfShoppingSessionRepository(dbContext);

        var olderSession = new ShoppingSessionBuilder()
            .ForUser("user-order")
            .WithId("session-older")
            .ShoppedOn(new DateTimeOffset(2026, 1, 1, 10, 0, 0, TimeSpan.Zero))
            .Build();
        var newerSession = new ShoppingSessionBuilder()
            .ForUser("user-order")
            .WithId("session-newer")
            .ShoppedOn(new DateTimeOffset(2026, 6, 1, 10, 0, 0, TimeSpan.Zero))
            .Build();

        await repository.Save(olderSession, CancellationToken.None);
        await repository.Save(newerSession, CancellationToken.None);

        var result = await repository.FindByUserId("user-order", CancellationToken.None);

        await Assert.That(result.Count).IsEqualTo(2);
        await Assert.That(result[0].Id).IsEqualTo("session-newer");
    }

    [Test]
    public async Task DeleteSessionForUser()
    {
        await using var dbContext = await fixture.CreateFreshDbContext();
        var repository = new EfShoppingSessionRepository(dbContext);

        var session = new ShoppingSessionBuilder().ForUser("user-delete").WithId("session-to-delete").Build();
        await repository.Save(session, CancellationToken.None);

        var result = await repository.DeleteByIdForUser("session-to-delete", "user-delete", CancellationToken.None);

        await Assert.That(result.IsRight).IsTrue();
        await Assert.That(result.Right).IsTrue();
    }

    [Test]
    public async Task IgnoreDeleteForNonexistentSession()
    {
        await using var dbContext = await fixture.CreateFreshDbContext();
        var repository = new EfShoppingSessionRepository(dbContext);

        var result = await repository.DeleteByIdForUser("ghost-session", "user-ghost", CancellationToken.None);

        await Assert.That(result.IsRight).IsTrue();
        await Assert.That(result.Right).IsFalse();
    }

    [Test]
    public async Task CalculateMetricsForUser()
    {
        await using var dbContext = await fixture.CreateFreshDbContext();
        var repository = new EfShoppingSessionRepository(dbContext);

        var mercadonaSession = new ShoppingSessionBuilder()
            .ForUser("user-metrics")
            .WithId("session-mercadona")
            .WithTotalPrice(20.0)
            .WithItems([new ShoppingSessionItemBuilder().ForSupermarket("mercadona").WithQuantity(2).Build()])
            .Build();
        await repository.Save(mercadonaSession, CancellationToken.None);

        var result = await repository.MetricsForUser("user-metrics", CancellationToken.None);

        await Assert.That(result.IsRight).IsTrue();
        var metrics = result.Right;
        await Assert.That(metrics.TicketMetrics).IsNotNull();
        await Assert.That(metrics.TicketMetrics.TotalTickets).IsEqualTo(1);
        await Assert.That(metrics.TicketMetrics.TotalSpentToDate).IsEqualTo(20.0);
        await Assert.That(metrics.SpendingTrends).IsNotNull();
        await Assert.That(metrics.SupermarketDominance).IsNotNull();
        await Assert.That(metrics.SupermarketDominance.Count).IsGreaterThan(0);
    }

    [Test]
    public async Task ProduceZeroMetricsForUserWithNoSessions()
    {
        await using var dbContext = await fixture.CreateFreshDbContext();
        var repository = new EfShoppingSessionRepository(dbContext);

        var result = await repository.MetricsForUser("user-no-sessions", CancellationToken.None);

        await Assert.That(result.IsRight).IsTrue();
        var metrics = result.Right;
        await Assert.That(metrics.TicketMetrics.TotalTickets).IsEqualTo(0);
        await Assert.That(metrics.TicketMetrics.TotalSpentToDate).IsEqualTo(0.0);
        await Assert.That(metrics.TicketMetrics.MostFrequentGroceryDay).IsNull();
    }
}
