using System.Text.RegularExpressions;
using SupermarketPlanner.Api.Application.DTOs;

namespace SupermarketPlanner.Api.Application.Services;

public static partial class ProductCatalogDeduplicator
{
    [GeneratedRegex(@"\s{2,}")]
    private static partial Regex MultipleSpaces();

    [GeneratedRegex(@"[.,/#!$%^&*;:{}=\-_`~()]")]
    private static partial Regex Punctuation();

    public static IReadOnlyList<ProductDto> Deduplicate(IReadOnlyList<ProductDto> products)
    {
        var uniqueMap = new Dictionary<string, ProductDto>();
        foreach (var product in products)
        {
            var key = $"{product.Supermarket}:{NormalizeKey(product.Name)}";
            if (!uniqueMap.TryGetValue(key, out var existing) || product.PricePerUnit < existing.PricePerUnit)
                uniqueMap[key] = product;
        }
        return [.. uniqueMap.Values];
    }

    private static string NormalizeKey(string name) =>
        MultipleSpaces().Replace(
            Punctuation().Replace(name.ToLowerInvariant(), ""),
            " ").Trim();
}
