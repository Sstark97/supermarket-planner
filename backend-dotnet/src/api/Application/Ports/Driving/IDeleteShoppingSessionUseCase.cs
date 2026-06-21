using SharpMonads.Core;
using SupermarketPlanner.Api.Application.UseCases.ShoppingSession;
using SupermarketPlanner.Api.Domain;

namespace SupermarketPlanner.Api.Application.Ports.Driving;

public interface IDeleteShoppingSessionUseCase
{
    Task<Either<DomainError, DeleteShoppingSessionResult>> Invoke(
        DeleteShoppingSessionInput input,
        CancellationToken cancellationToken);
}
