using SharpMonads.Core;
using SupermarketPlanner.Api.Domain;

namespace SupermarketPlanner.Api.Application.Services;

public sealed record BatchCategorizationResult(
    IReadOnlyDictionary<string, string> Categorized,
    int Failed);

public interface IBatchCategorizer
{
    Task<Either<DomainError, BatchCategorizationResult>> Categorize(
        IReadOnlyList<string> normalizedNames,
        CancellationToken cancellationToken);
}
