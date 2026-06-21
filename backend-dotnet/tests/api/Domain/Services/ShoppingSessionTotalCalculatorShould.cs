using SupermarketPlanner.Api.Domain.Services;

namespace SupermarketPlanner.Api.Tests.Domain.Services;

[Property("Category", "Unit")]
public sealed class ShoppingSessionTotalCalculatorShould
{
    [Test]
    public async Task ProduceZeroForEmptyItemsArray()
    {
        var total = ShoppingSessionTotalCalculator.Calculate([]);

        await Assert.That(total).IsEqualTo(0.0);
    }

    [Test]
    public async Task CalculateTotalForSingleItemWithQuantityOne()
    {
        var total = ShoppingSessionTotalCalculator.Calculate([(2.5, 1)]);

        await Assert.That(total).IsEqualTo(2.5);
    }

    [Test]
    public async Task CalculateTotalForSingleItemWithQuantityGreaterThanOne()
    {
        var total = ShoppingSessionTotalCalculator.Calculate([(2.5, 3)]);

        await Assert.That(total).IsEqualTo(7.5);
    }

    [Test]
    public async Task SumTotalsAcrossMultipleItemsWithDifferentQuantities()
    {
        var total = ShoppingSessionTotalCalculator.Calculate(
        [
            (1.0, 2),
            (3.5, 1),
            (0.99, 4),
        ]);

        await Assert.That(total).IsEqualTo(9.46);
    }

    [Test]
    public async Task RoundToTwoDecimalPlacesToAvoidFloatingPointDrift()
    {
        var total = ShoppingSessionTotalCalculator.Calculate([(1.33, 3)]);

        await Assert.That(total).IsEqualTo(3.99);
    }

    [Test]
    public async Task HandleLargeQuantitiesWithoutPrecisionLoss()
    {
        var total = ShoppingSessionTotalCalculator.Calculate([(0.1, 10)]);

        await Assert.That(total).IsEqualTo(1.0);
    }
}
