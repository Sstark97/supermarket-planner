using SharpMonads.Core;
using SupermarketPlanner.Api.Application.UseCases.ActiveCart;
using SupermarketPlanner.Api.Domain;

namespace SupermarketPlanner.Api.Application.Ports.Driving;

public interface IMergeCartUseCase
{
    Task<Either<DomainError, MergeCartResult>> Invoke(
        MergeCartInput input,
        CancellationToken cancellationToken);
}
