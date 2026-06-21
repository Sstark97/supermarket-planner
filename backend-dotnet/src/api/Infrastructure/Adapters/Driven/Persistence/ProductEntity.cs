namespace SupermarketPlanner.Api.Infrastructure.Adapters.Driven.Persistence;

public sealed class ProductEntity
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Supermarket { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Sku { get; set; } = string.Empty;
    public string Unit { get; set; } = string.Empty;
    public string? Image { get; set; }
    public string? Url { get; set; }
    public string TaxType { get; set; } = string.Empty;

    public ICollection<ProductPriceEntity> Prices { get; set; } = [];
}
