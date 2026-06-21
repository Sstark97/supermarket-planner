using SharpMonads.Core;
using SupermarketPlanner.Api.Application.UseCases.Search;
using SupermarketPlanner.Api.Domain;

namespace SupermarketPlanner.Api.Application.Ports.Driving;

public interface ITriggerManualScrapeUseCase
{
    Task<Either<DomainError, SearchResult>> Invoke(
        TriggerManualScrapeInput input,
        CancellationToken cancellationToken);
}
