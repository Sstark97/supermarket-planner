using SupermarketPlanner.Api.Application.DTOs;
using SupermarketPlanner.Api.Domain.Services;

namespace SupermarketPlanner.Api.Application.UseCases.Search;

public sealed record SearchProductsInput(
    string? Query,
    string? Category,
    string? Supermarket,
    string? PostalCode,
    string? SortBy,
    int? Limit,
    int? Cursor);

public sealed record TriggerManualScrapeInput(
    string Query,
    string PostalCode);

public sealed record RefreshProductsCatalogInput(
    string Query,
    string PostalCode);

public sealed record SearchResult(
    string Query,
    IReadOnlyList<ProductDto> Results,
    IReadOnlyList<string> Warnings,
    int TotalCount,
    int? NextCursor,
    string Source,
    string ScrapedAt,
    RefreshDecision ActiveRefresh);
