using EFCore.BulkExtensions;
using Microsoft.EntityFrameworkCore;
using SharpMonads.Core;
using SupermarketPlanner.Api.Application.DTOs;
using SupermarketPlanner.Api.Application.Ports.Driven;
using SupermarketPlanner.Api.Domain;
using SupermarketPlanner.Api.Domain.Services;
using SupermarketPlanner.Api.Infrastructure.Adapters.Driven.Persistence.Mappers;

namespace SupermarketPlanner.Api.Infrastructure.Adapters.Driven.Persistence.Repositories;

public sealed class EfProductCatalogRepository(SupermarketPlannerDbContext dbContext)
    : IProductCatalogRepository
{

    public async Task<IReadOnlyList<ProductDto>> Find(
        ProductCatalogFilters filters,
        CancellationToken cancellationToken)
    {
        var zoneId = await ResolveZoneIdForRead(filters.PostalCode ?? string.Empty, cancellationToken);

        if (zoneId is null)
            return [];

        var query = dbContext.Products
            .AsNoTracking()
            .Where(product => dbContext.ProductPrices
                .Any(price => price.ProductId == product.Id && price.ZoneId == zoneId));

        if (!string.IsNullOrWhiteSpace(filters.Query))
            query = query.Where(product => EF.Functions.ILike(product.Name, $"%{filters.Query}%"));

        if (!string.IsNullOrWhiteSpace(filters.Category))
            query = query.Where(product => product.Category == filters.Category);

        if (!string.IsNullOrWhiteSpace(filters.Supermarket))
            query = query.Where(product => product.Supermarket == filters.Supermarket);

        var products = await query
            .Take(filters.Limit ?? 500)
            .ToListAsync(cancellationToken);

        var productIds = products.Select(product => product.Id).ToList();

        var prices = await dbContext.ProductPrices
            .AsNoTracking()
            .Where(price => productIds.Contains(price.ProductId) && price.ZoneId == zoneId)
            .ToDictionaryAsync(price => price.ProductId, cancellationToken);

        return products
            .Where(product => prices.ContainsKey(product.Id))
            .Select(product => ProductEntityMapper.ToDto(product, prices[product.Id]))
            .ToList();
    }

    public async Task<Either<DomainError, int>> Save(
        IReadOnlyList<ProductDto> products,
        string postalCode,
        CancellationToken cancellationToken)
    {
        try
        {
            var zoneId = await ResolveZoneIdForWrite(postalCode, cancellationToken);

            if (zoneId is null)
                return Either<DomainError, int>.FromRight(0);

            var productEntities = products.Select(ToProductEntity).ToList();
            await BulkUpsertProducts(productEntities, cancellationToken);

            var actualIds = await FetchActualProductIds(productEntities, cancellationToken);
            await BulkUpsertPrices(products, productEntities, actualIds, zoneId, cancellationToken);

            return Either<DomainError, int>.FromRight(products.Count);
        }
        catch (Exception exception)
        {
            return Either<DomainError, int>.FromLeft(
                DomainError.InvalidOperation($"Failed to save products: {exception.Message}"));
        }
    }

    public async Task<IReadOnlyList<ProductDto>> FindByCategory(
        string category,
        CancellationToken cancellationToken)
    {
        var products = await dbContext.Products
            .AsNoTracking()
            .Where(product => product.Category == category)
            .ToListAsync(cancellationToken);

        var productIds = products.Select(product => product.Id).ToList();

        var prices = await dbContext.ProductPrices
            .AsNoTracking()
            .Where(price => productIds.Contains(price.ProductId))
            .ToListAsync(cancellationToken);

        var pricesByProductId = prices
            .GroupBy(price => price.ProductId)
            .ToDictionary(group => group.Key, group => group.First());

        return products
            .Where(product => pricesByProductId.ContainsKey(product.Id))
            .Select(product => ProductEntityMapper.ToDto(product, pricesByProductId[product.Id]))
            .ToList();
    }

    public async Task<Either<DomainError, int>> UpdateCategoryByNormalizedNames(
        IReadOnlyList<NormalizedNameCategoryUpdate> updates,
        CancellationToken cancellationToken)
    {
        if (updates.Count == 0)
            return Either<DomainError, int>.FromRight(0);

        try
        {
            var allProducts = await dbContext.Products
                .AsNoTracking()
                .Select(product => new { product.Id, product.Name })
                .ToListAsync(cancellationToken);

            var totalUpdated = 0;
            foreach (var update in updates)
            {
                var matchingIds = allProducts
                    .Where(product => ProductNameNormalizer.Normalize(product.Name) == update.NormalizedName)
                    .Select(product => product.Id)
                    .ToList();

                if (matchingIds.Count == 0)
                    continue;

                var updatedCount = await dbContext.Products
                    .Where(product => matchingIds.Contains(product.Id))
                    .ExecuteUpdateAsync(
                        setters => setters.SetProperty(product => product.Category, update.Category),
                        cancellationToken);

                totalUpdated += updatedCount;
            }

            return Either<DomainError, int>.FromRight(totalUpdated);
        }
        catch (Exception exception)
        {
            return Either<DomainError, int>.FromLeft(
                DomainError.InvalidOperation($"Failed to update categories: {exception.Message}"));
        }
    }

    private static ProductEntity ToProductEntity(ProductDto product) =>
        new()
        {
            Id = Guid.NewGuid().ToString(),
            Name = product.Name,
            Supermarket = product.Supermarket,
            Category = product.Category,
            Sku = ProductSkuBuilder.Build(product.Name, product.Supermarket, product.Category, product.Unit, product.Url),
            Unit = product.Unit,
            Image = product.Image,
            Url = product.Url,
            TaxType = product.TaxType
        };

    private async Task BulkUpsertProducts(List<ProductEntity> entities, CancellationToken cancellationToken)
    {
        var bulkConfig = new BulkConfig
        {
            UpdateByProperties = [nameof(ProductEntity.Supermarket), nameof(ProductEntity.Sku)],
            PropertiesToExcludeOnUpdate = [nameof(ProductEntity.Id)]
        };
        await dbContext.BulkInsertOrUpdateAsync(entities, bulkConfig, cancellationToken: cancellationToken);
    }

    private async Task<Dictionary<(string Supermarket, string Sku), string>> FetchActualProductIds(
        List<ProductEntity> productEntities,
        CancellationToken cancellationToken)
    {
        var skus = productEntities.Select(p => p.Sku).ToList();
        return await dbContext.Products
            .AsNoTracking()
            .Where(p => skus.Contains(p.Sku))
            .Select(p => new { p.Id, p.Supermarket, p.Sku })
            .ToDictionaryAsync(p => (p.Supermarket, p.Sku), p => p.Id, cancellationToken);
    }

    private async Task BulkUpsertPrices(
        IReadOnlyList<ProductDto> products,
        List<ProductEntity> productEntities,
        Dictionary<(string Supermarket, string Sku), string> actualIds,
        string zoneId,
        CancellationToken cancellationToken)
    {
        var priceEntities = products
            .Zip(productEntities)
            .Select(pair => new ProductPriceEntity
            {
                Id = Guid.NewGuid().ToString(),
                ProductId = actualIds[(pair.Second.Supermarket, pair.Second.Sku)],
                ZoneId = zoneId,
                Price = pair.First.Price,
                PricePerUnit = pair.First.PricePerUnit,
                ScrapedAt = DateTime.SpecifyKind(pair.First.ScrapedAt.UtcDateTime, DateTimeKind.Unspecified)
            })
            .ToList();

        var bulkConfig = new BulkConfig
        {
            UpdateByProperties = [nameof(ProductPriceEntity.ProductId), nameof(ProductPriceEntity.ZoneId)],
            PropertiesToExcludeOnUpdate = [nameof(ProductPriceEntity.Id)]
        };
        await dbContext.BulkInsertOrUpdateAsync(priceEntities, bulkConfig, cancellationToken: cancellationToken);
    }

    private async Task<string?> ResolveZoneIdForRead(
        string postalCode,
        CancellationToken cancellationToken)
    {
        var zoneId = await dbContext.PostalCodes
            .AsNoTracking()
            .Where(code => code.Code == postalCode)
            .Select(code => code.ZoneId)
            .FirstOrDefaultAsync(cancellationToken);

        if (zoneId is null)
            return await ResolveMostPopulatedZoneInProvince(postalCode, cancellationToken);

        var priceCount = await dbContext.ProductPrices
            .CountAsync(price => price.ZoneId == zoneId, cancellationToken);

        return priceCount > 0
            ? zoneId
            : await ResolveMostPopulatedZoneInProvince(postalCode, cancellationToken);
    }

    private async Task<string?> ResolveZoneIdForWrite(
        string postalCode,
        CancellationToken cancellationToken) =>
        await dbContext.PostalCodes
            .AsNoTracking()
            .Where(code => code.Code == postalCode)
            .Select(code => code.ZoneId)
            .FirstOrDefaultAsync(cancellationToken);

    private async Task<string?> ResolveMostPopulatedZoneInProvince(
        string postalCode,
        CancellationToken cancellationToken)
    {
        if (postalCode.Length < 2)
            return null;

        var provincePrefix = postalCode[..2];

        var zoneIdsInProvince = await dbContext.PostalCodes
            .AsNoTracking()
            .Where(code => code.Code.StartsWith(provincePrefix))
            .Select(code => code.ZoneId)
            .Distinct()
            .ToListAsync(cancellationToken);

        if (zoneIdsInProvince.Count == 0)
            return null;

        return await dbContext.ProductPrices
            .Where(price => zoneIdsInProvince.Contains(price.ZoneId))
            .GroupBy(price => price.ZoneId)
            .Select(group => new { ZoneId = group.Key, Count = group.Count() })
            .OrderByDescending(zone => zone.Count)
            .Select(zone => zone.ZoneId)
            .FirstOrDefaultAsync(cancellationToken);
    }
}
