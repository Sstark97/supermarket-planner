using SupermarketPlanner.Api.Infrastructure.Adapters.Driven.Persistence;

namespace SupermarketPlanner.Api.Tests.Builders;

public sealed class ProductEntityBuilder
{
    private string id = Guid.NewGuid().ToString();
    private string name = "Leche Entera";
    private string supermarket = "mercadona";
    private string category = "dairy";
    private string sku = "leche-entera-mercadona-dairy-l";
    private string unit = "L";
    private string? image = null;
    private string? url = null;
    private string taxType = "UNKNOWN";

    public ProductEntityBuilder WithId(string productId)
    {
        id = productId;
        return this;
    }

    public ProductEntityBuilder Named(string productName)
    {
        name = productName;
        return this;
    }

    public ProductEntityBuilder ForSupermarket(string supermarketName)
    {
        supermarket = supermarketName;
        return this;
    }

    public ProductEntityBuilder WithCategory(string productCategory)
    {
        category = productCategory;
        return this;
    }

    public ProductEntityBuilder WithSku(string productSku)
    {
        sku = productSku;
        return this;
    }

    public ProductEntityBuilder WithUnit(string productUnit)
    {
        unit = productUnit;
        return this;
    }

    public ProductEntity Build() =>
        new()
        {
            Id = id,
            Name = name,
            Supermarket = supermarket,
            Category = category,
            Sku = sku,
            Unit = unit,
            Image = image,
            Url = url,
            TaxType = taxType
        };
}
