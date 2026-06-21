using Microsoft.Extensions.Logging;
using SharpMonads.Core;
using SupermarketPlanner.Api.Application.DTOs;
using SupermarketPlanner.Api.Application.Ports.Driven;
using SupermarketPlanner.Api.Application.Ports.Driving;
using SupermarketPlanner.Api.Application.Services;
using SupermarketPlanner.Api.Domain;
using SupermarketPlanner.Api.Domain.Services;
using SupermarketPlanner.Api.Domain.ValueObjects;

namespace SupermarketPlanner.Api.Application.UseCases.Search;

public sealed class SearchProductsUseCase(
    IProductCatalogRepository productCatalogRepository,
    IBackgroundRefreshQueue backgroundRefreshQueue,
    ILogger<SearchProductsUseCase> logger) : ISearchProductsUseCase
{
    private const int DefaultPageLimit = 20;
    private const int MaxPageLimit = 100;
    private const string DefaultSource = "database";
    private const string PriceDesc = "price_desc";

    public Task<Either<DomainError, SearchResult>> Invoke(
        SearchProductsInput input,
        CancellationToken cancellationToken)
    {
        logger.LogInformation(
            "[SearchProductsUseCase] Invoke - query: \"{Query}\", category: \"{Category}\", supermarket: \"{Supermarket}\", sortBy: \"{SortBy}\"",
            input.Query, input.Category, input.Supermarket, input.SortBy);

        var normalizedQuery = input.Query?.Trim() ?? string.Empty;
        var effectivePostalCode = input.PostalCode ?? PostalCode.Default.AsString();
        var productCatalogFilters = new ProductCatalogFilters(normalizedQuery, input.Category, input.Supermarket, effectivePostalCode, 500);
        
        return productCatalogRepository
            .Find(productCatalogFilters, cancellationToken)
            .MapAsync(catalogProducts => BuildSearchResult(normalizedQuery, effectivePostalCode, catalogProducts, input));
    }

    private SearchResult BuildSearchResult(
        string normalizedQuery,
        string effectivePostalCode,
        IReadOnlyList<ProductDto> catalogProducts,
        SearchProductsInput input)
    {
        var sorted = SortByPrice(ProductCatalogDeduplicator.Deduplicate(catalogProducts), input.SortBy);
        var refreshDecision = RefreshDecision.Compute(normalizedQuery, sorted.Count, FindLatestScrapedAt(catalogProducts));
        if (refreshDecision.ShouldRefresh)
            backgroundRefreshQueue.Enqueue(normalizedQuery, effectivePostalCode);
        var effectiveLimit = Math.Min(input.Limit ?? DefaultPageLimit, MaxPageLimit);
        var (pageSlice, nextCursor, totalCount) = ApplyPaginationWindow(sorted, input.Cursor, effectiveLimit);

        return new SearchResult(
            Query: normalizedQuery,
            Results: pageSlice,
            Warnings: [],
            TotalCount: totalCount,
            NextCursor: nextCursor,
            Source: DefaultSource,
            ScrapedAt: DateTimeOffset.UtcNow.ToString("o"),
            ActiveRefresh: refreshDecision);
    }

    private static IReadOnlyList<ProductDto> SortByPrice(IReadOnlyList<ProductDto> products, string? sortBy) =>
        sortBy == PriceDesc
            ? [.. products.OrderByDescending(p => p.Price)]
            : [.. products.OrderBy(p => p.Price)];

    private static DateTimeOffset? FindLatestScrapedAt(IReadOnlyList<ProductDto> products) =>
        products.Select(p => (DateTimeOffset?)p.ScrapedAt).DefaultIfEmpty().Max();

    private static (IReadOnlyList<ProductDto> PageSlice, int? NextCursor, int TotalCount) ApplyPaginationWindow(
        IReadOnlyList<ProductDto> products,
        int? cursor,
        int limit)
    {
        var totalCount = products.Count;
        var offset = Math.Max(cursor ?? 0, 0);
        var pageSlice = products.Skip(offset).Take(limit).ToList();
        var nextCursor = offset + limit < totalCount ? offset + limit : (int?)null;
        return (pageSlice, nextCursor, totalCount);
    }
}
