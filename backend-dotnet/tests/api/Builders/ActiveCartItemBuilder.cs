using SupermarketPlanner.Api.Domain.Entities;

namespace SupermarketPlanner.Api.Tests.Builders;

public sealed class ActiveCartItemBuilder
{
    private string productId = "prod-uuid-1";
    private string productName = "Leche Entera";
    private string supermarket = "mercadona";
    private string category = "dairy";
    private double price = 1.05;
    private double pricePerUnit = 1.05;
    private string unit = "l";
    private string taxType = "IGIC";
    private int quantity = 1;
    private string? image = null;
    private string? url = null;

    public ActiveCartItemBuilder Named(string name)
    {
        productName = name;
        return this;
    }

    public ActiveCartItemBuilder ForSupermarket(string supermarketName)
    {
        supermarket = supermarketName;
        return this;
    }

    public ActiveCartItemBuilder WithQuantity(int itemQuantity)
    {
        quantity = itemQuantity;
        return this;
    }

    public ActiveCartItemBuilder PricedAt(double itemPrice, double itemPricePerUnit)
    {
        price = itemPrice;
        pricePerUnit = itemPricePerUnit;
        return this;
    }

    public ActiveCartItemBuilder WithImage(string imageUrl)
    {
        image = imageUrl;
        return this;
    }

    public ActiveCartItem Build() =>
        new(productId, productName, supermarket, category, price, pricePerUnit, unit, taxType, quantity, image, url);
}
