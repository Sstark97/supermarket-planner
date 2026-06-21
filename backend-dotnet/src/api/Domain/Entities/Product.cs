using SupermarketPlanner.Api.Domain.Models;
using SupermarketPlanner.Api.Domain.ValueObjects;

namespace SupermarketPlanner.Api.Domain.Entities;

public sealed record Product
{
    private Product(
        string id,
        string sku,
        string name,
        SupermarketName supermarket,
        ProductCategory category,
        Price price,
        Price pricePerUnit,
        NormalizedUnit unit,
        TaxType tax,
        DateTimeOffset scrapedAt,
        string? image,
        string? url)
    {
        Id = id;
        Sku = sku;
        Name = name;
        Supermarket = supermarket;
        Category = category;
        Price = price;
        PricePerUnit = pricePerUnit;
        Unit = unit;
        Tax = tax;
        ScrapedAt = scrapedAt;
        Image = image;
        Url = url;
    }

    public string Id { get; }
    public string Sku { get; }
    public string Name { get; }
    public SupermarketName Supermarket { get; }
    public ProductCategory Category { get; }
    public Price Price { get; }
    public Price PricePerUnit { get; }
    public NormalizedUnit Unit { get; }
    public TaxType Tax { get; }
    public DateTimeOffset ScrapedAt { get; }
    public string? Image { get; }
    public string? Url { get; }

    public static Product Scraped(
        string id,
        string sku,
        string name,
        SupermarketName supermarket,
        ProductCategory category,
        Price price,
        Price pricePerUnit,
        NormalizedUnit unit,
        TaxType tax,
        DateTimeOffset scrapedAt,
        string? image,
        string? url) =>
        new(id, sku, name, supermarket, category, price, pricePerUnit, unit, tax, scrapedAt, image, url);
}
