using Microsoft.Extensions.Logging;
using NSubstitute;
using SharpMonads.Core;
using SupermarketPlanner.Api.Application.DTOs;
using SupermarketPlanner.Api.Application.Ports.Driven;
using SupermarketPlanner.Api.Application.UseCases.Search;
using SupermarketPlanner.Api.Domain;
using SupermarketPlanner.Api.Domain.Services;
using SupermarketPlanner.Api.Tests.Builders;

namespace SupermarketPlanner.Api.Tests.Application.UseCases.Search;

[Property("Category", "Unit")]
public sealed class SearchProductsUseCaseShould
{
    private readonly IProductCatalogRepository repository;
    private readonly IBackgroundRefreshQueue queue;
    private readonly SearchProductsUseCase useCase;
    private static int productSequence;

    public SearchProductsUseCaseShould()
    {
        repository = Substitute.For<IProductCatalogRepository>();
        queue = Substitute.For<IBackgroundRefreshQueue>();
        useCase = new SearchProductsUseCase(
            repository,
            queue,
            Substitute.For<ILogger<SearchProductsUseCase>>());
    }

    private static ProductDto MakeDistinctProduct(int index, string? name = null, string? supermarket = null, double? price = null, double? pricePerUnit = null) =>
        new ProductDtoBuilder()
            .WithId($"product-{++productSequence}")
            .Named(name ?? $"Product {index}")
            .ForSupermarket(supermarket ?? $"Store {index}")
            .PricedAt(price ?? index, pricePerUnit ?? index)
            .Build();

    private void SetupRepository(params ProductDto[] products)
    {
        repository.Find(Arg.Any<ProductCatalogFilters>(), Arg.Any<CancellationToken>())
            .Returns(Either<DomainError, IReadOnlyList<ProductDto>>.FromRight(products));
    }

    [Test]
    public async Task DeduplicateBySupermarketAndNormalizedNameKeepingCheapestPricePerUnit()
    {
        SetupRepository(
            new ProductDtoBuilder().Named("Leche Entera").ForSupermarket("lidl").PricedAt(1.8, 1.8).Build(),
            new ProductDtoBuilder().Named("LECHE   ENTERA!!!").ForSupermarket("lidl").PricedAt(1.2, 1.2).Build(),
            new ProductDtoBuilder().Named("Leche Entera").ForSupermarket("aldi").PricedAt(1.1, 1.1).Build());

        var result = await useCase.Invoke(new SearchProductsInput("leche", null, null, null, null, null, null), CancellationToken.None);

        var searchResult = result.Right;
        await Assert.That(searchResult.Results.Count).IsEqualTo(2);
        var lidlProduct = searchResult.Results.First(product => product.Supermarket == "lidl");
        await Assert.That(lidlProduct.PricePerUnit).IsEqualTo(1.2);
    }

    [Test]
    public async Task SortResultsByPriceDescendingWhenSortByIsPriceDesc()
    {
        SetupRepository(
            new ProductDtoBuilder().ForSupermarket("lidl").PricedAt(2.4, 2.4).Build(),
            new ProductDtoBuilder().Named("Product B").ForSupermarket("aldi").PricedAt(1.2, 1.2).Build(),
            new ProductDtoBuilder().Named("Product C").ForSupermarket("carrefour").PricedAt(1.9, 1.9).Build());

        var result = await useCase.Invoke(new SearchProductsInput("leche", null, null, null, "price_desc", null, null), CancellationToken.None);

        var prices = result.Right.Results.Select(product => product.Price).ToList();
        await Assert.That(prices).IsEquivalentTo([2.4, 1.9, 1.2]);
    }

    [Test]
    public async Task NotTriggerRefreshWhenQueryIsEmpty()
    {
        SetupRepository();

        var result = await useCase.Invoke(new SearchProductsInput(string.Empty, null, null, null, null, null, null), CancellationToken.None);

        queue.DidNotReceive().Enqueue(Arg.Any<string>(), Arg.Any<string>());
        await Assert.That(result.Right.ActiveRefresh.ShouldRefresh).IsFalse();
    }

    [Test]
    public async Task TriggerRefreshAndMarkMetadataWhenResultsAreEmpty()
    {
        SetupRepository();

        var result = await useCase.Invoke(new SearchProductsInput("leche", null, null, null, null, null, null), CancellationToken.None);

        queue.Received(1).Enqueue("leche", Arg.Any<string>());
        var activeRefresh = result.Right.ActiveRefresh;
        await Assert.That(activeRefresh.ShouldRefresh).IsTrue();
        await Assert.That(activeRefresh.Reason).IsEqualTo("empty");
    }

    [Test]
    public async Task DoNotTriggerRefreshWhenCatalogHasFreshResults()
    {
        SetupRepository(
            new ProductDtoBuilder().ForSupermarket("lidl").PricedAt(1.5, 1.5).Build(),
            new ProductDtoBuilder().Named("Product B").ForSupermarket("aldi").PricedAt(1.2, 1.2).Build());

        var result = await useCase.Invoke(new SearchProductsInput("leche", null, null, null, null, null, null), CancellationToken.None);

        queue.DidNotReceive().Enqueue(Arg.Any<string>(), Arg.Any<string>());
        await Assert.That(result.Right.ActiveRefresh.ShouldRefresh).IsFalse();
    }

    [Test]
    public async Task ServeFirstTwentyProductsAndNextCursorWhenNoCursorIsProvided()
    {
        var products = Enumerable.Range(1, 35).Select(index => MakeDistinctProduct(index)).ToArray();
        SetupRepository(products);

        var result = await useCase.Invoke(new SearchProductsInput("product", null, null, null, null, null, null), CancellationToken.None);

        var searchResult = result.Right;
        await Assert.That(searchResult.Results.Count).IsEqualTo(20);
        await Assert.That(searchResult.NextCursor).IsEqualTo(20);
    }

    [Test]
    public async Task ServeCorrectPageSliceWhenCursorIsProvided()
    {
        var products = Enumerable.Range(1, 35).Select(index => MakeDistinctProduct(index)).ToArray();
        SetupRepository(products);

        var result = await useCase.Invoke(new SearchProductsInput("product", null, null, null, null, null, 20), CancellationToken.None);

        await Assert.That(result.Right.Results.Count).IsEqualTo(15);
    }

    [Test]
    public async Task ServeNullNextCursorWhenOnTheLastPage()
    {
        var products = Enumerable.Range(1, 20).Select(index => MakeDistinctProduct(index)).ToArray();
        SetupRepository(products);

        var result = await useCase.Invoke(new SearchProductsInput("product", null, null, null, null, null, null), CancellationToken.None);

        var searchResult = result.Right;
        await Assert.That(searchResult.Results.Count).IsEqualTo(20);
        await Assert.That(searchResult.NextCursor).IsNull();
    }

    [Test]
    public async Task RespectCustomLimitParameter()
    {
        var products = Enumerable.Range(1, 50).Select(index => MakeDistinctProduct(index)).ToArray();
        SetupRepository(products);

        var result = await useCase.Invoke(new SearchProductsInput("product", null, null, null, null, 10, null), CancellationToken.None);

        var searchResult = result.Right;
        await Assert.That(searchResult.Results.Count).IsEqualTo(10);
        await Assert.That(searchResult.NextCursor).IsEqualTo(10);
    }

    [Test]
    public async Task CapLimitAtOneHundred()
    {
        var products = Enumerable.Range(1, 150).Select(index => MakeDistinctProduct(index)).ToArray();
        SetupRepository(products);

        var result = await useCase.Invoke(new SearchProductsInput("product", null, null, null, null, 200, null), CancellationToken.None);

        var searchResult = result.Right;
        await Assert.That(searchResult.Results.Count).IsEqualTo(100);
        await Assert.That(searchResult.NextCursor).IsEqualTo(100);
    }

    [Test]
    public async Task SetTotalCountToFullDeduplicatedSetSizeNotPageSliceSize()
    {
        var products = Enumerable.Range(1, 35).Select(index => MakeDistinctProduct(index)).ToArray();
        SetupRepository(products);

        var result = await useCase.Invoke(new SearchProductsInput("product", null, null, null, null, 10, null), CancellationToken.None);

        var searchResult = result.Right;
        await Assert.That(searchResult.Results.Count).IsEqualTo(10);
        await Assert.That(searchResult.TotalCount).IsEqualTo(35);
    }
}
