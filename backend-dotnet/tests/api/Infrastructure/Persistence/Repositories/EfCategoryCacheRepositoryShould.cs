using SupermarketPlanner.Api.Application.Ports.Driven;
using SupermarketPlanner.Api.Infrastructure.Adapters.Driven.Persistence.Repositories;

namespace SupermarketPlanner.Api.Tests.Infrastructure.Persistence.Repositories;

[Property("Category", "Integration")]
[ClassDataSource<PostgresContainerFixture>(Shared = SharedType.PerClass)]
public sealed class EfCategoryCacheRepositoryShould(PostgresContainerFixture fixture)
{
    [Test]
    public async Task FindNothingForUncachedNormalizedName()
    {
        await using var dbContext = await fixture.CreateFreshDbContext();
        var repository = new EfCategoryCacheRepository(dbContext);

        var result = await repository.FindByNormalizedName("nonexistent product", CancellationToken.None);

        await Assert.That(result.IsNone).IsTrue();
    }

    [Test]
    public async Task FindCategoryByNormalizedName()
    {
        await using var dbContext = await fixture.CreateFreshDbContext();
        var repository = new EfCategoryCacheRepository(dbContext);

        var entries = new List<CategoryCacheEntry> { new("leche entera", "dairy") };
        await repository.UpsertMany(entries, CancellationToken.None);

        var result = await repository.FindByNormalizedName("leche entera", CancellationToken.None);

        await Assert.That(result.IsSome).IsTrue();
        await Assert.That(result.Match(onSome: c => c, onNone: () => null!)).IsEqualTo("dairy");
    }

    [Test]
    public async Task FindMultipleCategoriesByNormalizedNames()
    {
        await using var dbContext = await fixture.CreateFreshDbContext();
        var repository = new EfCategoryCacheRepository(dbContext);

        var entries = new List<CategoryCacheEntry>
        {
            new("leche entera", "dairy"),
            new("pan integral", "bakery"),
            new("manzana fuji", "fruits")
        };
        await repository.UpsertMany(entries, CancellationToken.None);

        var result = await repository.FindByNormalizedNames(["leche entera", "manzana fuji"], CancellationToken.None);

        await Assert.That(result.Count).IsEqualTo(2);
        await Assert.That(result["leche entera"]).IsEqualTo("dairy");
        await Assert.That(result["manzana fuji"]).IsEqualTo("fruits");
    }

    [Test]
    public async Task UpsertOverwritesExistingCategory()
    {
        await using var dbContext = await fixture.CreateFreshDbContext();
        var repository = new EfCategoryCacheRepository(dbContext);

        await repository.UpsertMany([new("leche entera", "unknown")], CancellationToken.None);
        await repository.UpsertMany([new("leche entera", "dairy")], CancellationToken.None);

        var result = await repository.FindByNormalizedName("leche entera", CancellationToken.None);

        await Assert.That(result.IsSome).IsTrue();
        await Assert.That(result.Match(onSome: c => c, onNone: () => null!)).IsEqualTo("dairy");
    }
}
