using SharpMonads.Core;
using SupermarketPlanner.Api.Domain;

namespace SupermarketPlanner.Api.Application.Ports.Driven;

public sealed record CategoryCacheEntry(
    string NormalizedName,
    string Category);

public interface ICategoryCacheRepository
{
    Task<Option<string>> FindByNormalizedName(
        string normalizedName,
        CancellationToken cancellationToken);

    Task<IReadOnlyDictionary<string, string>> FindByNormalizedNames(
        IReadOnlyList<string> normalizedNames,
        CancellationToken cancellationToken);

    Task<Either<DomainError, Unit>> UpsertMany(
        IReadOnlyList<CategoryCacheEntry> entries,
        CancellationToken cancellationToken);
}
