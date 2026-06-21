using SupermarketPlanner.Api.Application.DTOs;

namespace SupermarketPlanner.Api.Tests.Builders;

public sealed class ProductDtoBuilder
{
    private string id = Guid.NewGuid().ToString();
    private string name = "Leche Entera";
    private string supermarket = "mercadona";
    private string category = "dairy";
    private double price = 1.5;
    private double pricePerUnit = 1.5;
    private string unit = "L";
    private string? image = null;
    private string? url = null;
    private string taxType = "UNKNOWN";
    private DateTimeOffset scrapedAt = DateTimeOffset.UtcNow;

    public ProductDtoBuilder ForSupermarket(string supermarketName)
    {
        supermarket = supermarketName;
        return this;
    }

    public ProductDtoBuilder Named(string productName)
    {
        name = productName;
        return this;
    }

    public ProductDtoBuilder PricedAt(double productPrice, double productPricePerUnit)
    {
        price = productPrice;
        pricePerUnit = productPricePerUnit;
        return this;
    }

    public ProductDtoBuilder WithCategory(string productCategory)
    {
        category = productCategory;
        return this;
    }

    public ProductDtoBuilder ScrapedAt(DateTimeOffset scrapedAtTime)
    {
        scrapedAt = scrapedAtTime;
        return this;
    }

    public ProductDtoBuilder WithId(string productId)
    {
        id = productId;
        return this;
    }

    public ProductDto Build() =>
        new(id, name, supermarket, category, price, pricePerUnit, unit, image, url, taxType, scrapedAt);
}
