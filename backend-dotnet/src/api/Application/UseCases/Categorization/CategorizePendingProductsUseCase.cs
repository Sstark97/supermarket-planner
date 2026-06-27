using SharpMonads.Core;
using SupermarketPlanner.Api.Application.DTOs;
using SupermarketPlanner.Api.Application.Ports.Driven;
using SupermarketPlanner.Api.Application.Services;
using SupermarketPlanner.Api.Domain;
using SupermarketPlanner.Api.Domain.Models;
using SupermarketPlanner.Api.Domain.Services;

namespace SupermarketPlanner.Api.Application.UseCases.Categorization;

public sealed class CategorizePendingProductsUseCase(
    IProductCatalogRepository productCatalogRepository,
    IBatchCategorizer batchCategorizer,
    ILogger<CategorizePendingProductsUseCase> logger)
{
    public async Task<Either<DomainError, CategorizePendingProductsResult>> Invoke(
        CancellationToken cancellationToken)
    {
        var pending = await productCatalogRepository.FindByCategory(nameof(ProductCategory.Other), cancellationToken);
        return await CategorizePending(pending, cancellationToken);
    }

    private Task<Either<DomainError, CategorizePendingProductsResult>> CategorizePending(
        IReadOnlyList<ProductDto> pending,
        CancellationToken cancellationToken)
    {
        logger.LogInformation(
            "[CategorizePendingProductsUseCase] Found {Count} pending products.", pending.Count);

        return batchCategorizer
            .Categorize(DeduplicateNormalizedNames(pending), cancellationToken)
            .BindAsync(result => UpdateCatalog(pending.Count, result, cancellationToken));
    }

    private Task<Either<DomainError, CategorizePendingProductsResult>> UpdateCatalog(
        int totalPending,
        BatchCategorizationResult categorization,
        CancellationToken cancellationToken) =>
        productCatalogRepository
            .UpdateCategoryByNormalizedNames(ToCategoryUpdates(categorization.Categorized), cancellationToken)
            .MapAsync(categorized =>
            {
                logger.LogInformation(
                    "[CategorizePendingProductsUseCase] Updated {Categorized} rows. Failed: {Failed}.",
                    categorized, categorization.Failed);
                return new CategorizePendingProductsResult(totalPending, categorized, categorization.Failed);
            });

    private static List<NormalizedNameCategoryUpdate> ToCategoryUpdates(
        IReadOnlyDictionary<string, string> results) =>
        [.. from pair in results select new NormalizedNameCategoryUpdate(pair.Key, pair.Value)];

    private static List<string> DeduplicateNormalizedNames(IReadOnlyList<ProductDto> products) =>
        [.. (from product in products select ProductNameNormalizer.Normalize(product.Name)).ToHashSet()];
}
