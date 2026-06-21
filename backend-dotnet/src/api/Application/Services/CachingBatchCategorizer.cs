using SharpMonads.Core;
using SupermarketPlanner.Api.Application.Ports.Driven;
using SupermarketPlanner.Api.Domain;

namespace SupermarketPlanner.Api.Application.Services;

public sealed record BatchCategorizationOptions(int BatchSize, int BatchDelayMs);

public sealed class CachingBatchCategorizer(
    ICategoryCacheRepository categoryCacheRepository,
    IAiBatchCategorizer aiBatchCategorizer,
    ILogger<CachingBatchCategorizer> logger,
    BatchCategorizationOptions options) : IBatchCategorizer
{
    public Task<Either<DomainError, BatchCategorizationResult>> Categorize(
        IReadOnlyList<string> normalizedNames,
        CancellationToken cancellationToken) =>
        categoryCacheRepository
            .FindByNormalizedNames(normalizedNames, cancellationToken)
            .BindAsync(cached => RunWithCache(normalizedNames, cached, cancellationToken));

    private async Task<Either<DomainError, BatchCategorizationResult>> RunWithCache(
        IReadOnlyList<string> normalizedNames,
        IReadOnlyDictionary<string, string> cached,
        CancellationToken cancellationToken)
    {
        var uncachedNames = normalizedNames.Where(n => !cached.ContainsKey(n)).ToList();
        var (allResults, failed) = await RunBatches(uncachedNames, cached, cancellationToken);
        return Either<DomainError, BatchCategorizationResult>.FromRight(
            new BatchCategorizationResult(allResults, failed));
    }

    private async Task<(Dictionary<string, string> Results, int Failed)> RunBatches(
        List<string> uncachedNames,
        IReadOnlyDictionary<string, string> cached,
        CancellationToken cancellationToken)
    {
        var accumulator = new Dictionary<string, string>(cached);
        var failed = 0;
        var batches = ToBatches(uncachedNames);

        if (batches.Count > 0)
            logger.LogInformation(
                "[CachingBatchCategorizer] Categorizing {Count} uncached names in {Batches} batch(es).",
                uncachedNames.Count, batches.Count);

        foreach (var batch in batches)
        {
            await Task.Delay(options.BatchDelayMs, cancellationToken);
            failed += await ProcessBatch(batch, accumulator, cancellationToken);
        }

        return (accumulator, failed);
    }

    private async Task<int> ProcessBatch(
        List<string> batch,
        Dictionary<string, string> accumulator,
        CancellationToken cancellationToken)
    {
        var result = await aiBatchCategorizer.CategorizeBatch(batch, cancellationToken);

        return await result.Match<Task<int>>(
            onLeft: _ => Task.FromResult(batch.Count),
            onRight: async categorized =>
            {
                await UpsertToCache(categorized, cancellationToken);
                foreach (var pair in categorized)
                    accumulator[pair.Key] = pair.Value;
                return batch.Count - categorized.Count;
            });
    }

    private async Task UpsertToCache(
        IReadOnlyDictionary<string, string> results,
        CancellationToken cancellationToken)
    {
        var upsertResult = await categoryCacheRepository.UpsertMany(
            [.. from pair in results select new CategoryCacheEntry(pair.Key, pair.Value)],
            cancellationToken);

        upsertResult.Match<Unit>(
            onLeft: error =>
            {
                logger.LogWarning(
                    "[CachingBatchCategorizer] Cache upsert failed: {Error}", error.Message);
                return Unit.Value;
            },
            onRight: _ => Unit.Value);
    }

    private List<List<string>> ToBatches(List<string> names) =>
        [.. from indexed in names.Select((name, i) => (name, i))
            group indexed.name by indexed.i / options.BatchSize
            into batch
            select batch.ToList()];
}
