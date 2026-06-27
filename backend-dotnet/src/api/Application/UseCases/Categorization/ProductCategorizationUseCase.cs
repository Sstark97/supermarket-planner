using Microsoft.Extensions.Logging;
using SharpMonads.Core;
using SupermarketPlanner.Api.Application.Ports.Driven;
using SupermarketPlanner.Api.Domain;
using SupermarketPlanner.Api.Domain.Models;
using SupermarketPlanner.Api.Domain.Services;

namespace SupermarketPlanner.Api.Application.UseCases.Categorization;

public sealed record ProductCategorizationOptions(int AiTimeoutMs);

public sealed class ProductCategorizationUseCase(
    IKeywordCategorizer keywordCategorizer,
    IAiCategorizer? aiCategorizer,
    ICategoryCacheRepository? categoryCache,
    ILogger<ProductCategorizationUseCase>? logger,
    ProductCategorizationOptions options)
{
    public async Task<Either<DomainError, string>> Invoke(string productName, CancellationToken cancellationToken)
    {
        var normalizedName = ProductNameNormalizer.Normalize(productName);

        var cachedCategory = await LookupInCache(normalizedName, cancellationToken);
        if (cachedCategory is not null)
            return Either<DomainError, string>.FromRight(cachedCategory);

        var keywordCategory = keywordCategorizer.Match(productName);
        if (keywordCategory is ProductCategory category)
        {
            await WriteThroughToCache(normalizedName, category.ToString(), cancellationToken);
            return Either<DomainError, string>.FromRight(category.ToString());
        }

        return Either<DomainError, string>.FromRight(
            await GetAiCategory(productName, normalizedName, cancellationToken));
    }

    private async Task<string> GetAiCategory(string productName,
        string normalizedName, CancellationToken cancellationToken)
    {
        if (aiCategorizer is null)
            return nameof(ProductCategory.Other);

        try
        {
            var aiCategory = await RunWithTimeout(
                aiCategorizer.Categorize(productName, cancellationToken),
                options.AiTimeoutMs,
                cancellationToken);

            if (aiCategory is not ProductCategory resolvedCategory)
            {
                logger?.LogWarning(
                    "[ProductCategorizationUseCase] AI categorization timed out after {TimeoutMs}ms",
                    options.AiTimeoutMs);
                return nameof(ProductCategory.Other);
            }

            await WriteThroughToCache(normalizedName, resolvedCategory.ToString(), cancellationToken);
            return resolvedCategory.ToString();
        }
        catch (Exception ex)
        {
            logger?.LogError(
                "[ProductCategorizationUseCase] AI fallback failed: {Error}",
                ex.Message);
            return nameof(ProductCategory.Other);
        }
    }

    private async Task<string?> LookupInCache(string normalizedName, CancellationToken cancellationToken)
    {
        if (categoryCache is null)
            return null;

        try
        {
            var result = await categoryCache.FindByNormalizedName(normalizedName, cancellationToken);
            return result.Match<string?>(onSome: category => category, onNone: () => null);
        }
        catch (Exception exception)
        {
            logger?.LogWarning(
                "[ProductCategorizationUseCase] Cache lookup failed, falling through: {Error}",
                exception.Message);
            return null;
        }
    }

    private async Task WriteThroughToCache(string normalizedName, string category, CancellationToken cancellationToken)
    {
        if (categoryCache is null)
            return;

        (await categoryCache.UpsertMany(
            [new CategoryCacheEntry(normalizedName, category)],
            cancellationToken))
            .Match(
                onLeft: error =>
                {
                    logger?.LogWarning(
                        "[ProductCategorizationUseCase] Cache write-through failed: {Error}",
                        error.Message);
                    return Unit.Value;
                },
                onRight: _ => Unit.Value);
    }

    private static async Task<ProductCategory?> RunWithTimeout(
        Task<ProductCategory?> task, int timeoutMs, CancellationToken cancellationToken)
    {
        using var timeoutCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        timeoutCts.CancelAfter(timeoutMs);
        var completedTask = await Task.WhenAny(task, Task.Delay(timeoutMs, timeoutCts.Token));
        if (completedTask != task) return null;
        await timeoutCts.CancelAsync();
        return await task;
    }
}
