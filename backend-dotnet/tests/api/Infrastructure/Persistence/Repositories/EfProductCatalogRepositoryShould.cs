using SupermarketPlanner.Api.Application.Ports.Driven;
using SupermarketPlanner.Api.Infrastructure.Adapters.Driven.Persistence.Repositories;
using SupermarketPlanner.Api.Tests.Builders;

namespace SupermarketPlanner.Api.Tests.Infrastructure.Persistence.Repositories;

[Property("Category", "Integration")]
[ClassDataSource<PostgresContainerFixture>(Shared = SharedType.PerClass)]
public sealed class EfProductCatalogRepositoryShould(PostgresContainerFixture fixture)
{
    [Test]
    public async Task SaveProductsAndFindByQuery()
    {
        await using var dbContext = await fixture.CreateFreshDbContext();
        var repository = new EfProductCatalogRepository(dbContext);
        var (zone, postalCode) = new PricingZoneBuilder().Build("35001");
        dbContext.PricingZones.Add(zone);
        dbContext.PostalCodes.Add(postalCode);
        await dbContext.SaveChangesAsync();

        var milkProduct = new ProductDtoBuilder().Named("Leche Entera").ForSupermarket("mercadona").Build();
        await repository.Save([milkProduct], "35001", CancellationToken.None);

        var filters = new ProductCatalogFilters(Query: "leche", Category: null, Supermarket: null, PostalCode: "35001", Limit: 10);
        var result = await repository.Find(filters, CancellationToken.None);

        await Assert.That(result.Count).IsEqualTo(1);
        await Assert.That(result[0].Name).IsEqualTo("Leche Entera");
    }

    [Test]
    public async Task FindNothingWhenPostalCodeHasNoZone()
    {
        await using var dbContext = await fixture.CreateFreshDbContext();
        var repository = new EfProductCatalogRepository(dbContext);

        var filters = new ProductCatalogFilters(Query: "leche", Category: null, Supermarket: null, PostalCode: "99999", Limit: 10);
        var result = await repository.Find(filters, CancellationToken.None);

        await Assert.That(result.Count).IsEqualTo(0);
    }

    [Test]
    public async Task FallBackToMostPopulatedZoneInProvince()
    {
        await using var dbContext = await fixture.CreateFreshDbContext();
        var repository = new EfProductCatalogRepository(dbContext);

        var (populatedZone, populatedPostalCode) = new PricingZoneBuilder()
            .WithZoneId("zone-35-main")
            .WithZoneName("Las Palmas Principal")
            .Build("35001");
        dbContext.PricingZones.Add(populatedZone);
        dbContext.PostalCodes.Add(populatedPostalCode);
        await dbContext.SaveChangesAsync();

        var milkProduct = new ProductDtoBuilder().Named("Leche Entera").Build();
        await repository.Save([milkProduct], "35001", CancellationToken.None);

        var filtersForUnknownPostal = new ProductCatalogFilters(Query: "leche", Category: null, Supermarket: null, PostalCode: "35999", Limit: 10);
        var result = await repository.Find(filtersForUnknownPostal, CancellationToken.None);

        await Assert.That(result.Count).IsEqualTo(1);
    }

    [Test]
    public async Task PerformCaseInsensitiveSearch()
    {
        await using var dbContext = await fixture.CreateFreshDbContext();
        var repository = new EfProductCatalogRepository(dbContext);
        var (zone, postalCode) = new PricingZoneBuilder().Build("35001");
        dbContext.PricingZones.Add(zone);
        dbContext.PostalCodes.Add(postalCode);
        await dbContext.SaveChangesAsync();

        var milkProduct = new ProductDtoBuilder().Named("leche entera").Build();
        await repository.Save([milkProduct], "35001", CancellationToken.None);

        var filtersWithUppercase = new ProductCatalogFilters(Query: "LECHE", Category: null, Supermarket: null, PostalCode: "35001", Limit: 10);
        var result = await repository.Find(filtersWithUppercase, CancellationToken.None);

        await Assert.That(result.Count).IsEqualTo(1);
    }

    [Test]
    public async Task UpsertWithoutCreatingDuplicates()
    {
        await using var dbContext = await fixture.CreateFreshDbContext();
        var repository = new EfProductCatalogRepository(dbContext);
        var (zone, postalCode) = new PricingZoneBuilder().Build("35001");
        dbContext.PricingZones.Add(zone);
        dbContext.PostalCodes.Add(postalCode);
        await dbContext.SaveChangesAsync();

        var milkProduct = new ProductDtoBuilder().Named("Leche Entera").ForSupermarket("mercadona").Build();
        await repository.Save([milkProduct], "35001", CancellationToken.None);
        await repository.Save([milkProduct], "35001", CancellationToken.None);

        var filters = new ProductCatalogFilters(Query: "leche", Category: null, Supermarket: null, PostalCode: "35001", Limit: 50);
        var result = await repository.Find(filters, CancellationToken.None);

        await Assert.That(result.Count).IsEqualTo(1);
    }

    [Test]
    public async Task FilterByCategory()
    {
        await using var dbContext = await fixture.CreateFreshDbContext();
        var repository = new EfProductCatalogRepository(dbContext);
        var (zone, postalCode) = new PricingZoneBuilder().Build("35001");
        dbContext.PricingZones.Add(zone);
        dbContext.PostalCodes.Add(postalCode);
        await dbContext.SaveChangesAsync();

        var milkProduct = new ProductDtoBuilder().Named("Leche Entera").WithCategory("dairy").ForSupermarket("mercadona").Build();
        var breadProduct = new ProductDtoBuilder().Named("Pan Integral").WithCategory("bakery").ForSupermarket("mercadona").Build();
        await repository.Save([milkProduct, breadProduct], "35001", CancellationToken.None);

        var dairyFilters = new ProductCatalogFilters(Query: null, Category: "dairy", Supermarket: null, PostalCode: "35001", Limit: 50);
        var result = await repository.Find(dairyFilters, CancellationToken.None);

        await Assert.That(result.Count).IsEqualTo(1);
        await Assert.That(result[0].Category).IsEqualTo("dairy");
    }

    [Test]
    public async Task FilterBySupermarket()
    {
        await using var dbContext = await fixture.CreateFreshDbContext();
        var repository = new EfProductCatalogRepository(dbContext);
        var (zone, postalCode) = new PricingZoneBuilder().Build("35001");
        dbContext.PricingZones.Add(zone);
        dbContext.PostalCodes.Add(postalCode);
        await dbContext.SaveChangesAsync();

        var mercadonaProduct = new ProductDtoBuilder().Named("Leche Entera").ForSupermarket("mercadona").Build();
        var lidlProduct = new ProductDtoBuilder().Named("Leche Desnatada").ForSupermarket("lidl").Build();
        await repository.Save([mercadonaProduct, lidlProduct], "35001", CancellationToken.None);

        var mercadonaFilters = new ProductCatalogFilters(Query: null, Category: null, Supermarket: "mercadona", PostalCode: "35001", Limit: 50);
        var result = await repository.Find(mercadonaFilters, CancellationToken.None);

        await Assert.That(result.Count).IsEqualTo(1);
        await Assert.That(result[0].Supermarket).IsEqualTo("mercadona");
    }

    [Test]
    public async Task UpdateCategoryByNormalizedNames()
    {
        await using var dbContext = await fixture.CreateFreshDbContext();
        var repository = new EfProductCatalogRepository(dbContext);
        var (zone, postalCode) = new PricingZoneBuilder().Build("35001");
        dbContext.PricingZones.Add(zone);
        dbContext.PostalCodes.Add(postalCode);
        await dbContext.SaveChangesAsync();

        var milkProduct = new ProductDtoBuilder().Named("Leche Entera").WithCategory("unknown").ForSupermarket("mercadona").Build();
        await repository.Save([milkProduct], "35001", CancellationToken.None);

        var updates = new List<NormalizedNameCategoryUpdate>
        {
            new("leche entera", "dairy")
        };
        var updateResult = await repository.UpdateCategoryByNormalizedNames(updates, CancellationToken.None);

        await Assert.That(updateResult.IsRight).IsTrue();
        await Assert.That(updateResult.Right).IsGreaterThan(0);
    }

    [Test]
    public async Task FindNothingByUnknownCategory()
    {
        await using var dbContext = await fixture.CreateFreshDbContext();
        var repository = new EfProductCatalogRepository(dbContext);

        var result = await repository.FindByCategory("nonexistent-category", CancellationToken.None);

        await Assert.That(result.Count).IsEqualTo(0);
    }
}
