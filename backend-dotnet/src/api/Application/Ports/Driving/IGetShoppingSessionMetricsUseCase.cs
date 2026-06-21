using SharpMonads.Core;
using SupermarketPlanner.Api.Application.UseCases.ShoppingSession;
using SupermarketPlanner.Api.Domain;

namespace SupermarketPlanner.Api.Application.Ports.Driving;

public interface IGetShoppingSessionMetricsUseCase
{
    Task<Either<DomainError, GetShoppingSessionMetricsResult>> Invoke(
        GetShoppingSessionMetricsInput input,
        CancellationToken cancellationToken);
}
