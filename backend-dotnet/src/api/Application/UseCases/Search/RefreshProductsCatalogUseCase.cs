using Microsoft.Extensions.Logging;
using SharpMonads.Core;
using SupermarketPlanner.Api.Application.Ports.Driven;
using SupermarketPlanner.Api.Application.Ports.Driving;
using SupermarketPlanner.Api.Domain;

namespace SupermarketPlanner.Api.Application.UseCases.Search;

public sealed class RefreshProductsCatalogUseCase(
    ITriggerManualScrapeUseCase triggerManualScrapeUseCase,
    IProductCatalogRepository productCatalogRepository,
    ILogger<RefreshProductsCatalogUseCase> logger)
{
    public Task<Either<DomainError, Unit>> Invoke(
        RefreshProductsCatalogInput input,
        CancellationToken cancellationToken)
    {
        logger.LogInformation(
            "[RefreshProductsCatalogUseCase] Background refresh started for query: \"{Query}\", postalCode: \"{PostalCode}\"",
            input.Query, input.PostalCode);

        return triggerManualScrapeUseCase
            .Invoke(new TriggerManualScrapeInput(input.Query, input.PostalCode), cancellationToken)
            .BindAsync(liveResult => SaveAndLog(input, liveResult, cancellationToken));
    }

    private Task<Either<DomainError, Unit>> SaveAndLog(
        RefreshProductsCatalogInput input,
        SearchResult liveResult,
        CancellationToken cancellationToken) =>
        productCatalogRepository.Save(liveResult.Results, input.PostalCode, cancellationToken)
            .MapAsync(saved =>
            {
                logger.LogInformation(
                    "[RefreshProductsCatalogUseCase] Background refresh completed for \"{Query}\". Saved: {Count}. Warnings: {WarningCount}",
                    input.Query, saved, liveResult.Warnings.Count);
                return Unit.Value;
            });
}
