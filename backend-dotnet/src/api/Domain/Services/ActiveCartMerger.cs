using SupermarketPlanner.Api.Domain.Entities;

namespace SupermarketPlanner.Api.Domain.Services;

public sealed class ActiveCartMerger
{
    public static IReadOnlyList<ActiveCartItem> Merge(
        IReadOnlyList<ActiveCartItem> existingItems,
        IReadOnlyList<ActiveCartItem> incomingItems)
    {
        var resultMap = new Dictionary<string, ActiveCartItem>();

        foreach (var item in existingItems)
            resultMap[CompositeKey(item)] = item;

        foreach (var item in incomingItems)
            resultMap[CompositeKey(item)] = item;

        return resultMap.Values.ToList();
    }

    private static string CompositeKey(ActiveCartItem item) =>
        $"{item.Supermarket}:{item.ProductName}";
}
