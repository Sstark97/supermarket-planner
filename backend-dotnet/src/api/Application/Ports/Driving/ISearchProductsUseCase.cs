using SharpMonads.Core;
using SupermarketPlanner.Api.Application.UseCases.Search;
using SupermarketPlanner.Api.Domain;

namespace SupermarketPlanner.Api.Application.Ports.Driving;

public interface ISearchProductsUseCase
{
    Task<Either<DomainError, SearchResult>> Invoke(
        SearchProductsInput input,
        CancellationToken cancellationToken);
}
