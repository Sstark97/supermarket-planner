using SupermarketPlanner.Api.Domain.Entities;

namespace SupermarketPlanner.Api.Tests.Builders;

public sealed class ShoppingSessionItemBuilder
{
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

    public ShoppingSessionItemBuilder Named(string name)
    {
        productName = name;
        return this;
    }

    public ShoppingSessionItemBuilder ForSupermarket(string supermarketName)
    {
        supermarket = supermarketName;
        return this;
    }

    public ShoppingSessionItemBuilder WithQuantity(int itemQuantity)
    {
        quantity = itemQuantity;
        return this;
    }

    public ShoppingSessionItem Build() =>
        new(productName, supermarket, category, price, pricePerUnit, unit, taxType, quantity, image, url);
}
