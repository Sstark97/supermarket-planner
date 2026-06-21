using Microsoft.EntityFrameworkCore;
using SupermarketPlanner.Api.Infrastructure.Adapters.Driven.Persistence;

namespace SupermarketPlanner.Api.Tests.Infrastructure.Persistence;

[ClassDataSource<InMemoryDbContextFactory>(Shared = SharedType.PerClass)]
public sealed class SupermarketPlannerDbContextShould(InMemoryDbContextFactory factory)
{
    [Test]
    public async Task BuildModelWithoutErrors()
    {
        await using var dbContext = factory.Create();

        var model = dbContext.Model;
        await Assert.That(model).IsNotNull();
    }

    [Test]
    public async Task RegisterAllTenEntitySets()
    {
        await using var dbContext = factory.Create();

        var entityTypeNames = dbContext.Model
            .GetEntityTypes()
            .Select(entityType => entityType.ClrType.Name)
            .ToHashSet();

        await Assert.That(entityTypeNames).Contains(nameof(ProductEntity));
        await Assert.That(entityTypeNames).Contains(nameof(PricingZoneEntity));
        await Assert.That(entityTypeNames).Contains(nameof(PostalCodeEntity));
        await Assert.That(entityTypeNames).Contains(nameof(ProductPriceEntity));
        await Assert.That(entityTypeNames).Contains(nameof(ZoneOnboardingQueueEntity));
        await Assert.That(entityTypeNames).Contains(nameof(ShoppingSessionEntity));
        await Assert.That(entityTypeNames).Contains(nameof(ShoppingSessionItemEntity));
        await Assert.That(entityTypeNames).Contains(nameof(ActiveCartEntity));
        await Assert.That(entityTypeNames).Contains(nameof(ActiveCartItemEntity));
        await Assert.That(entityTypeNames).Contains(nameof(ProductCategoryCacheEntity));
    }

    [Test]
    public async Task MapProductTableNameVerbatimAsInPrisma()
    {
        await using var dbContext = factory.Create();

        var productEntityType = dbContext.Model.FindEntityType(typeof(ProductEntity));
        var tableName = productEntityType!.GetTableName();

        await Assert.That(tableName).IsEqualTo("Product");
    }

    [Test]
    public async Task MapZoneOnboardingQueueTableNameVerbatimAsInPrisma()
    {
        await using var dbContext = factory.Create();

        var entityType = dbContext.Model.FindEntityType(typeof(ZoneOnboardingQueueEntity));
        var tableName = entityType!.GetTableName();

        await Assert.That(tableName).IsEqualTo("ZoneOnboardingQueue");
    }

    [Test]
    public async Task StorePricingZoneWithNoGeneratedKey()
    {
        await using var dbContext = factory.Create();

        var entityType = dbContext.Model.FindEntityType(typeof(PricingZoneEntity));
        var primaryKey = entityType!.FindPrimaryKey()!;
        var keyProperty = primaryKey.Properties.Single();

        await Assert.That(keyProperty.ValueGenerated).IsEqualTo(Microsoft.EntityFrameworkCore.Metadata.ValueGenerated.Never);
    }

    [Test]
    public async Task StoreZoneOnboardingQueueStateWithStringConverter()
    {
        await using var dbContext = factory.Create();

        var entityType = dbContext.Model.FindEntityType(typeof(ZoneOnboardingQueueEntity));
        var stateProperty = entityType!.FindProperty(nameof(ZoneOnboardingQueueEntity.State))!;
        var converter = stateProperty.GetValueConverter();

        await Assert.That(converter).IsNotNull()
            .Because("ZoneOnboardingQueueState must have a string value converter to persist as text");

        var providerClrType = converter!.ProviderClrType;
        await Assert.That(providerClrType).IsEqualTo(typeof(string))
            .Because("The converter must map enum to string so Postgres stores PENDING/PROCESSING/COMPLETED/FAILED");
    }

    [Test]
    public async Task MapCamelCaseColumnNamesAsInPrisma()
    {
        await using var dbContext = factory.Create();

        var productPriceType = dbContext.Model.FindEntityType(typeof(ProductPriceEntity));
        var pricePerUnitColumn = productPriceType!
            .FindProperty(nameof(ProductPriceEntity.PricePerUnit))!
            .GetColumnName();

        await Assert.That(pricePerUnitColumn).IsEqualTo("pricePerUnit");
    }
}

public sealed class InMemoryDbContextFactory
{
    public SupermarketPlannerDbContext Create()
    {
        var options = new DbContextOptionsBuilder<SupermarketPlannerDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        return new SupermarketPlannerDbContext(options);
    }
}
