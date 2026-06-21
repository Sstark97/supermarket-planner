using Microsoft.Extensions.Logging;
using SharpMonads.Core;
using SupermarketPlanner.Api.Application.DTOs;
using SupermarketPlanner.Api.Application.Ports.Driven;
using SupermarketPlanner.Api.Application.Ports.Driving;
using SupermarketPlanner.Api.Domain;
using SupermarketPlanner.Api.Domain.Services;

namespace SupermarketPlanner.Api.Application.UseCases.Search;

public sealed class TriggerManualScrapeUseCase(
    IReadOnlyList<ISupermarketSearchPort> scrapers,
    ILogger<TriggerManualScrapeUseCase> logger) : ITriggerManualScrapeUseCase
{
    public async Task<Either<DomainError, SearchResult>> Invoke(
        TriggerManualScrapeInput input,
        CancellationToken cancellationToken)
    {
        logger.LogInformation(
            "[TriggerManualScrapeUseCase] Starting parallel scrapers for: \"{Query}\"",
            input.Query);

        var startedAt = DateTimeOffset.UtcNow;
        var scraperOutcomes = await Task.WhenAll(
            scrapers.Select(scraper => RunScraper(scraper, input, cancellationToken)));

        logger.LogInformation(
            "[TriggerManualScrapeUseCase] All scrapers finished in {ElapsedMs}ms.",
            (DateTimeOffset.UtcNow - startedAt).TotalMilliseconds);

        var results = (from outcome in scraperOutcomes
                       where outcome.Products is not null
                       from product in outcome.Products
                       orderby product.PricePerUnit
                       select product).ToList();

        var warnings = (from outcome in scraperOutcomes
                        where outcome.Products is null
                        select $"{outcome.ScraperName}: {outcome.Error ?? "Unknown error"}").ToList();

        return Either<DomainError, SearchResult>.FromRight(new SearchResult(
            Query: input.Query,
            Results: results,
            Warnings: warnings,
            TotalCount: results.Count,
            NextCursor: null,
            Source: "live",
            ScrapedAt: DateTimeOffset.UtcNow.ToString("o"),
            ActiveRefresh: RefreshDecision.None));
    }

    private async Task<(string ScraperName, IReadOnlyList<ProductDto>? Products, string? Error)> RunScraper(
        ISupermarketSearchPort scraper,
        TriggerManualScrapeInput input,
        CancellationToken cancellationToken)
    {
        var scraperStartedAt = DateTimeOffset.UtcNow;
        try
        {
            var searchResult = await scraper.Search(input.Query, input.PostalCode, cancellationToken);
            return searchResult.Match<(string, IReadOnlyList<ProductDto>?, string?)>(
                onLeft: error =>
                {
                    logger.LogError(
                        "[TriggerManualScrapeUseCase] {Name} failed in {ElapsedMs}ms: {Error}",
                        scraper.Name, (DateTimeOffset.UtcNow - scraperStartedAt).TotalMilliseconds, error.Message);
                    return (scraper.Name, null, error.Message);
                },
                onRight: products =>
                {
                    logger.LogInformation(
                        "[TriggerManualScrapeUseCase] {Name} completed: {Count} results in {ElapsedMs}ms",
                        scraper.Name, products.Count, (DateTimeOffset.UtcNow - scraperStartedAt).TotalMilliseconds);
                    return (scraper.Name, products, null);
                });
        }
        catch (Exception ex)
        {
            logger.LogError(
                "[TriggerManualScrapeUseCase] {Name} failed after {ElapsedMs}ms: {Error}",
                scraper.Name, (DateTimeOffset.UtcNow - scraperStartedAt).TotalMilliseconds, ex.Message);
            return (scraper.Name, null, ex.Message);
        }
    }
}
