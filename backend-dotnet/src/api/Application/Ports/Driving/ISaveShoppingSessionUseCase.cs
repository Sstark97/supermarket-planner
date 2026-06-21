using SharpMonads.Core;
using SupermarketPlanner.Api.Application.UseCases.ShoppingSession;
using SupermarketPlanner.Api.Domain;

namespace SupermarketPlanner.Api.Application.Ports.Driving;

public interface ISaveShoppingSessionUseCase
{
    Task<Either<DomainError, SaveShoppingSessionResult>> Invoke(
        SaveShoppingSessionInput input,
        CancellationToken cancellationToken);
}
