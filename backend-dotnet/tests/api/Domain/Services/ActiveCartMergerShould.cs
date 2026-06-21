using SupermarketPlanner.Api.Domain.Entities;
using SupermarketPlanner.Api.Domain.Services;
using SupermarketPlanner.Api.Tests.Builders;

namespace SupermarketPlanner.Api.Tests.Domain.Services;

[Property("Category", "Unit")]
public sealed class ActiveCartMergerShould
{
    private static ActiveCartItem MakeItem(
        string productName = "Leche Entera",
        string supermarket = "mercadona",
        int quantity = 1,
        double price = 1.05,
        string? image = null) =>
        new ActiveCartItemBuilder()
            .Named(productName)
            .ForSupermarket(supermarket)
            .WithQuantity(quantity)
            .PricedAt(price, price)
            .WithImage(image ?? string.Empty)
            .Build();

    [Test]
    public async Task ProduceIncomingItemsWhenExistingItemsAreEmpty()
    {
        var incoming = new[] { MakeItem(quantity: 2) };

        var result = ActiveCartMerger.Merge([], incoming);

        await Assert.That(result.Count).IsEqualTo(1);
        await Assert.That(result[0].Quantity).IsEqualTo(2);
    }

    [Test]
    public async Task PreserveExistingItemsWhenIncomingItemsAreEmpty()
    {
        var existing = new[] { MakeItem(quantity: 3) };

        var result = ActiveCartMerger.Merge(existing, []);

        await Assert.That(result.Count).IsEqualTo(1);
        await Assert.That(result[0].Quantity).IsEqualTo(3);
    }

    [Test]
    public async Task ProduceEmptyArrayWhenBothListsAreEmpty()
    {
        var result = ActiveCartMerger.Merge([], []);

        await Assert.That(result.Count).IsEqualTo(0);
    }

    [Test]
    public async Task ReplaceExistingQuantityWithIncomingQuantityForMatchingCompositeKey()
    {
        var existing = new[] { MakeItem(quantity: 5) };
        var incoming = new[] { MakeItem(quantity: 2) };

        var result = ActiveCartMerger.Merge(existing, incoming);

        await Assert.That(result.Count).IsEqualTo(1);
        await Assert.That(result[0].Quantity).IsEqualTo(2);
    }

    [Test]
    public async Task AppendIncomingItemsThatDoNotMatchAnyExistingItem()
    {
        var existing = new[] { MakeItem("Leche Entera", "mercadona") };
        var incoming = new[] { MakeItem("Pan Integral", "lidl") };

        var result = ActiveCartMerger.Merge(existing, incoming);

        await Assert.That(result.Count).IsEqualTo(2);
        var names = result.Select(item => item.ProductName).ToList();
        await Assert.That(names).Contains("Leche Entera");
        await Assert.That(names).Contains("Pan Integral");
    }

    [Test]
    public async Task DistinguishItemsWithSameProductNameButDifferentSupermarkets()
    {
        var existing = new[] { MakeItem("Leche Entera", "mercadona", quantity: 1) };
        var incoming = new[] { MakeItem("Leche Entera", "aldi", quantity: 3) };

        var result = ActiveCartMerger.Merge(existing, incoming);

        await Assert.That(result.Count).IsEqualTo(2);
        var mercadonaItem = result.Single(item => item.Supermarket == "mercadona");
        var aldiItem = result.Single(item => item.Supermarket == "aldi");
        await Assert.That(mercadonaItem.Quantity).IsEqualTo(1);
        await Assert.That(aldiItem.Quantity).IsEqualTo(3);
    }

    [Test]
    public async Task DistinguishItemsWithSameSupermarketButDifferentProductNames()
    {
        var existing = new[] { MakeItem("Leche Entera", "mercadona", quantity: 2) };
        var incoming = new[] { MakeItem("Leche Semidesnatada", "mercadona", quantity: 4) };

        var result = ActiveCartMerger.Merge(existing, incoming);

        await Assert.That(result.Count).IsEqualTo(2);
    }

    [Test]
    public async Task HandleMixOfOverlappingAndNewItemsCorrectly()
    {
        var existing = new[]
        {
            MakeItem("Leche Entera", "mercadona", quantity: 5),
            MakeItem("Pan Integral", "lidl", quantity: 1),
        };
        var incoming = new[]
        {
            MakeItem("Leche Entera", "mercadona", quantity: 2),
            MakeItem("Huevos", "aldi", quantity: 6),
        };

        var result = ActiveCartMerger.Merge(existing, incoming);

        await Assert.That(result.Count).IsEqualTo(3);
        var lecheItem = result.Single(item => item.ProductName == "Leche Entera" && item.Supermarket == "mercadona");
        await Assert.That(lecheItem.Quantity).IsEqualTo(2);
        var panItem = result.Single(item => item.ProductName == "Pan Integral");
        await Assert.That(panItem.Quantity).IsEqualTo(1);
        var huevosItem = result.Single(item => item.ProductName == "Huevos");
        await Assert.That(huevosItem.Quantity).IsEqualTo(6);
    }
}
