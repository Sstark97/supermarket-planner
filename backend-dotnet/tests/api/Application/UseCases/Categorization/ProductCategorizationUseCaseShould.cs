using Microsoft.Extensions.Logging;
using NSubstitute;
using SharpMonads.Core;
using SupermarketPlanner.Api.Application.Ports.Driven;
using SupermarketPlanner.Api.Application.UseCases.Categorization;
using SupermarketPlanner.Api.Domain;
using SupermarketPlanner.Api.Domain.Models;

namespace SupermarketPlanner.Api.Tests.Application.UseCases.Categorization;

[Property("Category", "Unit")]
public sealed class ProductCategorizationUseCaseShould
{
    [Test]
    public async Task UseKeywordCategoryWithoutCallingAi()
    {
        var keywordCategorizer = Substitute.For<IKeywordCategorizer>();
        keywordCategorizer.Match("Leche entera").Returns(ProductCategory.Dairy);

        var aiCategorizer = Substitute.For<IAiCategorizer>();
        aiCategorizer.Categorize(Arg.Any<string>(), Arg.Any<CancellationToken>())
            .Returns(ProductCategory.Other);

        var useCase = new ProductCategorizationUseCase(keywordCategorizer, aiCategorizer, null, null, new ProductCategorizationOptions(1500));

        var category = await useCase.Invoke("Leche entera", CancellationToken.None);

        await Assert.That(category.Right).IsEqualTo("Dairy");
        await aiCategorizer.DidNotReceive().Categorize(Arg.Any<string>(), Arg.Any<CancellationToken>());
    }

    [Test]
    public async Task UseAiFallbackWhenKeywordHasNoMatch()
    {
        var keywordCategorizer = Substitute.For<IKeywordCategorizer>();
        keywordCategorizer.Match(Arg.Any<string>()).Returns((ProductCategory?)null);

        var aiCategorizer = Substitute.For<IAiCategorizer>();
        aiCategorizer.Categorize(Arg.Any<string>(), Arg.Any<CancellationToken>())
            .Returns(ProductCategory.Cleaning);

        var useCase = new ProductCategorizationUseCase(keywordCategorizer, aiCategorizer, null, null, new ProductCategorizationOptions(1500));

        var category = await useCase.Invoke("Producto sin keyword", CancellationToken.None);

        await Assert.That(category.Right).IsEqualTo("Cleaning");
        await aiCategorizer.Received(1).Categorize(Arg.Any<string>(), Arg.Any<CancellationToken>());
    }

    [Test]
    public async Task FallBackToOtherWhenAiFails()
    {
        var keywordCategorizer = Substitute.For<IKeywordCategorizer>();
        keywordCategorizer.Match(Arg.Any<string>()).Returns((ProductCategory?)null);

        var aiCategorizer = Substitute.For<IAiCategorizer>();
        aiCategorizer.Categorize(Arg.Any<string>(), Arg.Any<CancellationToken>())
            .Returns<Task<ProductCategory?>>(_ => throw new InvalidOperationException("boom"));

        var logger = Substitute.For<ILogger<ProductCategorizationUseCase>>();
        var useCase = new ProductCategorizationUseCase(keywordCategorizer, aiCategorizer, null, logger, new ProductCategorizationOptions(1500));

        var category = await useCase.Invoke("Producto sin keyword", CancellationToken.None);

        await Assert.That(category.Right).IsEqualTo("Other");
        logger.Received(1).Log(
            LogLevel.Error,
            Arg.Any<EventId>(),
            Arg.Any<object>(),
            Arg.Any<Exception>(),
            Arg.Any<Func<object, Exception?, string>>());
    }

    [Test]
    public async Task FallBackToOtherWhenAiFallbackTimesOut()
    {
        var keywordCategorizer = Substitute.For<IKeywordCategorizer>();
        keywordCategorizer.Match(Arg.Any<string>()).Returns((ProductCategory?)null);

        var aiCategorizer = Substitute.For<IAiCategorizer>();
        aiCategorizer.Categorize(Arg.Any<string>(), Arg.Any<CancellationToken>())
            .Returns(Task.Delay(10000).ContinueWith(_ => (ProductCategory?)null));

        var logger = Substitute.For<ILogger<ProductCategorizationUseCase>>();
        var useCase = new ProductCategorizationUseCase(keywordCategorizer, aiCategorizer, null, logger, new ProductCategorizationOptions(5));

        var category = await useCase.Invoke("Producto sin keyword", CancellationToken.None);

        await Assert.That(category.Right).IsEqualTo("Other");
        logger.Received().Log(
            LogLevel.Warning,
            Arg.Any<EventId>(),
            Arg.Any<object>(),
            Arg.Any<Exception>(),
            Arg.Any<Func<object, Exception?, string>>());
    }

    [Test]
    public async Task ServeCachedCategoryWithoutCallingKeywordOrAi()
    {
        var cache = Substitute.For<ICategoryCacheRepository>();
        cache.FindByNormalizedName("gambas congeladas", Arg.Any<CancellationToken>())
            .Returns(Option<string>.Some("Frozen"));

        var keywordCategorizer = Substitute.For<IKeywordCategorizer>();
        var aiCategorizer = Substitute.For<IAiCategorizer>();

        var useCase = new ProductCategorizationUseCase(keywordCategorizer, aiCategorizer, cache, null, new ProductCategorizationOptions(1500));

        var category = await useCase.Invoke("Gambas congeladas", CancellationToken.None);

        await Assert.That(category.Right).IsEqualTo("Frozen");
        keywordCategorizer.DidNotReceive().Match(Arg.Any<string>());
        await aiCategorizer.DidNotReceive().Categorize(Arg.Any<string>(), Arg.Any<CancellationToken>());
    }

    [Test]
    public async Task NormalizeProductNameBeforeLookingUpInCache()
    {
        var cache = Substitute.For<ICategoryCacheRepository>();
        cache.FindByNormalizedName("leche entera", Arg.Any<CancellationToken>())
            .Returns(Option<string>.Some("Dairy"));

        var keywordCategorizer = Substitute.For<IKeywordCategorizer>();
        var useCase = new ProductCategorizationUseCase(keywordCategorizer, null, cache, null, new ProductCategorizationOptions(1500));

        await useCase.Invoke("Leche Entera", CancellationToken.None);

        await cache.Received(1).FindByNormalizedName("leche entera", Arg.Any<CancellationToken>());
    }

    [Test]
    public async Task FallThroughToKeywordAndWriteResultToCache()
    {
        var cache = Substitute.For<ICategoryCacheRepository>();
        cache.FindByNormalizedName(Arg.Any<string>(), Arg.Any<CancellationToken>())
            .Returns(Option<string>.None);
        cache.UpsertMany(Arg.Any<IReadOnlyList<CategoryCacheEntry>>(), Arg.Any<CancellationToken>())
            .Returns(Task.FromResult(Either<DomainError, Unit>.FromRight(Unit.Value)));

        var keywordCategorizer = Substitute.For<IKeywordCategorizer>();
        keywordCategorizer.Match("Pan integral").Returns(ProductCategory.Bakery);

        var useCase = new ProductCategorizationUseCase(keywordCategorizer, null, cache, null, new ProductCategorizationOptions(1500));

        var category = await useCase.Invoke("Pan integral", CancellationToken.None);

        await Assert.That(category.Right).IsEqualTo("Bakery");
        await cache.Received(1).UpsertMany(
            Arg.Is<IReadOnlyList<CategoryCacheEntry>>(entries =>
                entries.Count == 1 && entries[0].NormalizedName == "pan integral" && entries[0].Category == "Bakery"),
            Arg.Any<CancellationToken>());
    }

    [Test]
    public async Task FallThroughToAiAndWriteResultToCache()
    {
        var cache = Substitute.For<ICategoryCacheRepository>();
        cache.FindByNormalizedName(Arg.Any<string>(), Arg.Any<CancellationToken>())
            .Returns(Option<string>.None);
        cache.UpsertMany(Arg.Any<IReadOnlyList<CategoryCacheEntry>>(), Arg.Any<CancellationToken>())
            .Returns(Task.FromResult(Either<DomainError, Unit>.FromRight(Unit.Value)));

        var keywordCategorizer = Substitute.For<IKeywordCategorizer>();
        keywordCategorizer.Match(Arg.Any<string>()).Returns((ProductCategory?)null);

        var aiCategorizer = Substitute.For<IAiCategorizer>();
        aiCategorizer.Categorize(Arg.Any<string>(), Arg.Any<CancellationToken>())
            .Returns(ProductCategory.Pet);

        var useCase = new ProductCategorizationUseCase(keywordCategorizer, aiCategorizer, cache, null, new ProductCategorizationOptions(1500));

        var category = await useCase.Invoke("Pienso premium gato", CancellationToken.None);

        await Assert.That(category.Right).IsEqualTo("Pet");
        await cache.Received(1).UpsertMany(
            Arg.Is<IReadOnlyList<CategoryCacheEntry>>(entries =>
                entries.Count == 1 && entries[0].NormalizedName == "pienso premium gato" && entries[0].Category == "Pet"),
            Arg.Any<CancellationToken>());
    }

    [Test]
    public async Task FallThroughToKeywordWhenCacheLookupFails()
    {
        var cache = Substitute.For<ICategoryCacheRepository>();
        cache.FindByNormalizedName(Arg.Any<string>(), Arg.Any<CancellationToken>())
            .Returns<Task<Option<string>>>(_ => throw new InvalidOperationException("DB connection lost"));
        cache.UpsertMany(Arg.Any<IReadOnlyList<CategoryCacheEntry>>(), Arg.Any<CancellationToken>())
            .Returns(Task.FromResult(Either<DomainError, Unit>.FromRight(Unit.Value)));

        var keywordCategorizer = Substitute.For<IKeywordCategorizer>();
        keywordCategorizer.Match("Cerveza").Returns(ProductCategory.Drinks);

        var logger = Substitute.For<ILogger<ProductCategorizationUseCase>>();
        var useCase = new ProductCategorizationUseCase(keywordCategorizer, null, cache, logger, new ProductCategorizationOptions(1500));

        var category = await useCase.Invoke("Cerveza", CancellationToken.None);

        await Assert.That(category.Right).IsEqualTo("Drinks");
        logger.Received().Log(
            LogLevel.Warning,
            Arg.Any<EventId>(),
            Arg.Any<object>(),
            Arg.Any<Exception>(),
            Arg.Any<Func<object, Exception?, string>>());
    }
}
