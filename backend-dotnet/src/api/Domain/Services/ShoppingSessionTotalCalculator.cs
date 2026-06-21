namespace SupermarketPlanner.Api.Domain.Services;

public sealed class ShoppingSessionTotalCalculator
{
    public static double Calculate(IReadOnlyList<(double Price, int Quantity)> items)
    {
        var rawTotal = items.Sum(item => item.Price * item.Quantity);
        return Math.Round(rawTotal, 2, MidpointRounding.AwayFromZero);
    }
}
