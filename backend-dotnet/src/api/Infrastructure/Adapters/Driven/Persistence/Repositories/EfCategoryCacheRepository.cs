using EFCore.BulkExtensions;
using Microsoft.EntityFrameworkCore;
using SharpMonads.Core;
using SupermarketPlanner.Api.Application.Ports.Driven;
using SupermarketPlanner.Api.Domain;

namespace SupermarketPlanner.Api.Infrastructure.Adapters.Driven.Persistence.Repositories;

public sealed class EfCategoryCacheRepository(SupermarketPlannerDbContext dbContext)
    : ICategoryCacheRepository
{
    public async Task<Option<string>> FindByNormalizedName(
        string normalizedName,
        CancellationToken cancellationToken)
    {
        var entry = await dbContext.ProductCategoryCache
            .AsNoTracking()
            .Where(cache => cache.NormalizedName == normalizedName)
            .Select(cache => cache.Category)
            .FirstOrDefaultAsync(cancellationToken);

        return entry is null
            ? Option<string>.None
            : Option<string>.Some(entry);
    }

    public async Task<IReadOnlyDictionary<string, string>> FindByNormalizedNames(
        IReadOnlyList<string> normalizedNames,
        CancellationToken cancellationToken)
    {
        var entries = await dbContext.ProductCategoryCache
            .AsNoTracking()
            .Where(cache => normalizedNames.Contains(cache.NormalizedName))
            .Select(cache => new { cache.NormalizedName, cache.Category })
            .ToListAsync(cancellationToken);

        return entries.ToDictionary(entry => entry.NormalizedName, entry => entry.Category);
    }

    public async Task<Either<DomainError, Unit>> UpsertMany(
        IReadOnlyList<CategoryCacheEntry> entries,
        CancellationToken cancellationToken)
    {
        if (entries.Count == 0)
            return Either<DomainError, Unit>.FromRight(Unit.Value);

        try
        {
            var entities = entries
                .Select(entry => new ProductCategoryCacheEntity
                {
                    Id = Guid.NewGuid().ToString(),
                    NormalizedName = entry.NormalizedName,
                    Category = entry.Category,
                    CreatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Unspecified)
                })
                .ToList();

            var bulkConfig = new BulkConfig
            {
                UpdateByProperties = [nameof(ProductCategoryCacheEntity.NormalizedName)],
                PropertiesToExcludeOnUpdate = [
                    nameof(ProductCategoryCacheEntity.Id),
                    nameof(ProductCategoryCacheEntity.CreatedAt)
                ]
            };

            await dbContext.BulkInsertOrUpdateAsync(entities, bulkConfig, cancellationToken: cancellationToken);
            return Either<DomainError, Unit>.FromRight(Unit.Value);
        }
        catch (Exception exception)
        {
            return Either<DomainError, Unit>.FromLeft(
                DomainError.InvalidOperation($"Failed to upsert category cache: {exception.Message}"));
        }
    }
}
