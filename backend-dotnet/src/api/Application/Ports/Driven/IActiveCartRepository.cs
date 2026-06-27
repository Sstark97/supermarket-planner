using SharpMonads.Core;
using SupermarketPlanner.Api.Domain;
using SupermarketPlanner.Api.Domain.Entities;

namespace SupermarketPlanner.Api.Application.Ports.Driven;

public interface IActiveCartRepository
{
    Task<Option<ActiveCartEntity>> FindByUserId(
        string userId,
        CancellationToken cancellationToken);

    Task<Either<DomainError, ActiveCartEntity>> Upsert(
        ActiveCartEntity cartEntity,
        CancellationToken cancellationToken);
}
