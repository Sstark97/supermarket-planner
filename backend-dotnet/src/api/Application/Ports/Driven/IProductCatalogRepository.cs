using SharpMonads.Core;
using SupermarketPlanner.Api.Application.DTOs;
using SupermarketPlanner.Api.Domain;

namespace SupermarketPlanner.Api.Application.Ports.Driven;

public sealed record ProductCatalogFilters(
    string? Query,
    string? Category,
    string? Supermarket,
    string? PostalCode,
    int? Limit);

public sealed record NormalizedNameCategoryUpdate(
    string NormalizedName,
    string Category);

public interface IProductCatalogRepository
{
    Task<Either<DomainError, IReadOnlyList<ProductDto>>> Find(
        ProductCatalogFilters filters,
        CancellationToken cancellationToken);

    Task<Either<DomainError, int>> Save(
        IReadOnlyList<ProductDto> products,
        string postalCode,
        CancellationToken cancellationToken);

    Task<Either<DomainError, IReadOnlyList<ProductDto>>> FindByCategory(
        string category,
        CancellationToken cancellationToken);

    Task<Either<DomainError, int>> UpdateCategoryByNormalizedNames(
        IReadOnlyList<NormalizedNameCategoryUpdate> updates,
        CancellationToken cancellationToken);
}
