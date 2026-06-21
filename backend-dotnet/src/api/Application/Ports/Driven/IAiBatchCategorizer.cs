using SharpMonads.Core;
using SupermarketPlanner.Api.Domain;

namespace SupermarketPlanner.Api.Application.Ports.Driven;

public interface IAiBatchCategorizer
{
    Task<Either<DomainError, IReadOnlyDictionary<string, string>>> CategorizeBatch(
        IReadOnlyList<string> productNames,
        CancellationToken cancellationToken);
}
