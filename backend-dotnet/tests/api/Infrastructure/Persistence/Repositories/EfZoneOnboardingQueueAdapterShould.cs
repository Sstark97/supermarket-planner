using SupermarketPlanner.Api.Infrastructure.Adapters.Driven.Persistence;
using SupermarketPlanner.Api.Infrastructure.Adapters.Driven.Persistence.Repositories;
using SupermarketPlanner.Api.Tests.Builders;
using DomainQueueState = SupermarketPlanner.Api.Domain.Ports.ZoneOnboardingQueueState;
using InfraQueueState = SupermarketPlanner.Api.Infrastructure.Adapters.Driven.Persistence.ZoneOnboardingQueueState;

namespace SupermarketPlanner.Api.Tests.Infrastructure.Persistence.Repositories;

[Property("Category", "Integration")]
[ClassDataSource<PostgresContainerFixture>(Shared = SharedType.PerClass)]
public sealed class EfZoneOnboardingQueueAdapterShould(PostgresContainerFixture fixture)
{
    [Test]
    public async Task PublishNewQueueItem()
    {
        await using var dbContext = await fixture.CreateFreshDbContext();
        var adapter = new EfZoneOnboardingQueueAdapter(dbContext);

        var result = await adapter.PublishZoneOnboardingRequest("35001", null, DateTimeOffset.UtcNow, CancellationToken.None);

        await Assert.That(result.IsRight).IsTrue();
        await Assert.That(result.Right.PostalCode).IsEqualTo("35001");
        await Assert.That(result.Right.State).IsEqualTo(DomainQueueState.Pending);
    }

    [Test]
    public async Task DeduplicateSamePostalCodeAndDay()
    {
        await using var dbContext = await fixture.CreateFreshDbContext();
        var adapter = new EfZoneOnboardingQueueAdapter(dbContext);
        var today = DateTimeOffset.UtcNow;

        await adapter.PublishZoneOnboardingRequest("35002", null, today, CancellationToken.None);
        await adapter.PublishZoneOnboardingRequest("35002", null, today, CancellationToken.None);

        var items = await adapter.FetchPendingItems(50, CancellationToken.None);

        await Assert.That(items.IsRight).IsTrue();
        var postalCode35002Items = items.Right.Where(item => item.PostalCode == "35002").ToList();
        await Assert.That(postalCode35002Items.Count).IsEqualTo(1);
    }

    [Test]
    public async Task FetchPendingItemsInCreationOrder()
    {
        await using var dbContext = await fixture.CreateFreshDbContext();
        var adapter = new EfZoneOnboardingQueueAdapter(dbContext);

        await adapter.PublishZoneOnboardingRequest("35010", null, DateTimeOffset.UtcNow, CancellationToken.None);
        await adapter.PublishZoneOnboardingRequest("35011", null, DateTimeOffset.UtcNow, CancellationToken.None);

        var items = await adapter.FetchPendingItems(50, CancellationToken.None);

        await Assert.That(items.IsRight).IsTrue();
        var fetchedItems = items.Right
            .Where(item => item.PostalCode == "35010" || item.PostalCode == "35011")
            .ToList();
        await Assert.That(fetchedItems.Count).IsEqualTo(2);
        await Assert.That(fetchedItems[0].PostalCode).IsEqualTo("35010");
    }

    [Test]
    public async Task MarkItemAsProcessingIncrementsAttempts()
    {
        await using var dbContext = await fixture.CreateFreshDbContext();
        var adapter = new EfZoneOnboardingQueueAdapter(dbContext);

        var publishResult = await adapter.PublishZoneOnboardingRequest("35020", null, DateTimeOffset.UtcNow, CancellationToken.None);
        var itemId = publishResult.Right.Id;

        var markResult = await adapter.MarkItemAsProcessing(itemId, CancellationToken.None);

        await Assert.That(markResult.IsRight).IsTrue();
        var entity = await dbContext.ZoneOnboardingQueue.FindAsync(itemId);
        await Assert.That(entity).IsNotNull();
        await Assert.That(entity!.State).IsEqualTo(InfraQueueState.PROCESSING);
        await Assert.That(entity.Attempts).IsEqualTo(1);
    }

    [Test]
    public async Task MarkItemAsProcessedSetsCompletedState()
    {
        await using var dbContext = await fixture.CreateFreshDbContext();
        var adapter = new EfZoneOnboardingQueueAdapter(dbContext);

        var publishResult = await adapter.PublishZoneOnboardingRequest("35021", null, DateTimeOffset.UtcNow, CancellationToken.None);
        var itemId = publishResult.Right.Id;

        var markResult = await adapter.MarkItemAsProcessed(itemId, CancellationToken.None);

        await Assert.That(markResult.IsRight).IsTrue();
        var entity = await dbContext.ZoneOnboardingQueue.FindAsync(itemId);
        await Assert.That(entity).IsNotNull();
        await Assert.That(entity!.State).IsEqualTo(InfraQueueState.COMPLETED);
        await Assert.That(entity.ProcessedAt).IsNotNull();
    }

    [Test]
    public async Task MarkItemAsFailedStoresErrorMessage()
    {
        await using var dbContext = await fixture.CreateFreshDbContext();
        var adapter = new EfZoneOnboardingQueueAdapter(dbContext);

        var publishResult = await adapter.PublishZoneOnboardingRequest("35022", null, DateTimeOffset.UtcNow, CancellationToken.None);
        var itemId = publishResult.Right.Id;

        var markResult = await adapter.MarkItemAsFailed(itemId, "Scraping timeout", CancellationToken.None);

        await Assert.That(markResult.IsRight).IsTrue();
        var entity = await dbContext.ZoneOnboardingQueue.FindAsync(itemId);
        await Assert.That(entity).IsNotNull();
        await Assert.That(entity!.State).IsEqualTo(InfraQueueState.FAILED);
        await Assert.That(entity.ErrorMessage).IsEqualTo("Scraping timeout");
    }

    [Test]
    public async Task DetectEmptyPricingZone()
    {
        await using var dbContext = await fixture.CreateFreshDbContext();
        var adapter = new EfZoneOnboardingQueueAdapter(dbContext);

        var (zone, postalCode) = new PricingZoneBuilder().WithZoneId("zone-empty").Build("35030");
        dbContext.PricingZones.Add(zone);
        dbContext.PostalCodes.Add(postalCode);
        await dbContext.SaveChangesAsync();

        var result = await adapter.IsPricingZoneEmpty("35030", CancellationToken.None);

        await Assert.That(result.IsRight).IsTrue();
        await Assert.That(result.Right).IsTrue();
    }

    [Test]
    public async Task DetectNonEmptyPricingZone()
    {
        await using var dbContext = await fixture.CreateFreshDbContext();
        var adapter = new EfZoneOnboardingQueueAdapter(dbContext);

        var (zone, postalCode) = new PricingZoneBuilder().WithZoneId("zone-populated").Build("35031");
        dbContext.PricingZones.Add(zone);
        dbContext.PostalCodes.Add(postalCode);
        await dbContext.SaveChangesAsync();

        var product = new ProductEntityBuilder().WithId(Guid.NewGuid().ToString()).ForSupermarket("mercadona").Build();
        dbContext.Products.Add(product);
        await dbContext.SaveChangesAsync();

        dbContext.ProductPrices.Add(new ProductPriceEntity
        {
            Id = Guid.NewGuid().ToString(),
            ProductId = product.Id,
            ZoneId = "zone-populated",
            Price = 1.50,
            PricePerUnit = 1.50,
            ScrapedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Unspecified)
        });
        await dbContext.SaveChangesAsync();

        var result = await adapter.IsPricingZoneEmpty("35031", CancellationToken.None);

        await Assert.That(result.IsRight).IsTrue();
        await Assert.That(result.Right).IsFalse();
    }
}
