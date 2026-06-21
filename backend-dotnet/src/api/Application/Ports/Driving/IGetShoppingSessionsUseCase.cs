using SharpMonads.Core;
using SupermarketPlanner.Api.Application.UseCases.ShoppingSession;
using SupermarketPlanner.Api.Domain;

namespace SupermarketPlanner.Api.Application.Ports.Driving;

public interface IGetShoppingSessionsUseCase
{
    Task<Either<DomainError, GetShoppingSessionsResult>> Invoke(
        GetShoppingSessionsInput input,
        CancellationToken cancellationToken);
}
