using SupermarketPlanner.Api.Domain.ValueObjects;

namespace SupermarketPlanner.Api.Tests.Domain.ValueObjects;

[Property("Category", "Unit")]
public sealed class PriceShould
{
    [Test]
    public async Task CreateFromValidPositiveEuros()
    {
        var result = Price.FromEuros(1.99m);

        await Assert.That(result.IsRight).IsTrue();
        await Assert.That(result.Right.InEuros()).IsEqualTo(1.99m);
    }

    [Test]
    public async Task CreateFromZeroEuros()
    {
        var result = Price.FromEuros(0m);

        await Assert.That(result.IsRight).IsTrue();
        await Assert.That(result.Right.InEuros()).IsEqualTo(0m);
    }

    [Test]
    public async Task RejectNegativeEuros()
    {
        var result = Price.FromEuros(-0.01m);

        await Assert.That(result.IsLeft).IsTrue();
        await Assert.That(result.Left.Code).IsEqualTo("VALIDATION");
    }

    [Test]
    public async Task ExposeStaticFreeWithZeroValue()
    {
        var free = Price.Free;

        await Assert.That(free.InEuros()).IsEqualTo(0m);
    }

    [Test]
    public async Task ConvertEurosToCents()
    {
        var price = Price.FromEuros(1.5m).Right;

        await Assert.That(price.InCents()).IsEqualTo(150m);
    }

    [Test]
    public async Task AddTwoPricesTogether()
    {
        var first = Price.FromEuros(1.0m).Right;
        var second = Price.FromEuros(2.0m).Right;

        var sum = first.Add(second);

        await Assert.That(sum.InEuros()).IsEqualTo(3.0m);
    }

    [Test]
    public async Task DetermineWhenOnePriceIsCheaperThanAnother()
    {
        var cheap = Price.FromEuros(1.0m).Right;
        var expensive = Price.FromEuros(2.0m).Right;

        await Assert.That(cheap.IsCheaperThan(expensive)).IsTrue();
        await Assert.That(expensive.IsCheaperThan(cheap)).IsFalse();
    }

    [Test]
    public async Task SupportComparisonOperators()
    {
        var low = Price.FromEuros(1.0m).Right;
        var mid = Price.FromEuros(1.5m).Right;
        var high = Price.FromEuros(2.0m).Right;

        await Assert.That(low < high).IsTrue();
        await Assert.That(high > low).IsTrue();
        await Assert.That(low <= mid).IsTrue();
        await Assert.That(high >= mid).IsTrue();
    }

    [Test]
    public async Task RoundTo4DecimalPlaces()
    {
        var price = Price.FromEuros(1.12345678m).Right;

        await Assert.That(price.InEuros()).IsEqualTo(1.1235m);
    }
}
