using System.Text;
using System.Text.RegularExpressions;

namespace SupermarketPlanner.Api.Domain.Services;

public sealed partial class ProductSkuBuilder
{
    [GeneratedRegex(@"[^a-z0-9:/._|-]", RegexOptions.Compiled)]
    private static partial Regex NonAlphanumericChars();
    [GeneratedRegex(@"[̀-ͯ]", RegexOptions.Compiled)]
    private static partial Regex CombiningCharacters();
    [GeneratedRegex(@"\s+", RegexOptions.Compiled)]
    private static partial Regex MultipleSpaces();
    
    public static string Build(string name, string supermarket, string category, string unit, string? url)
    {
        if (!string.IsNullOrWhiteSpace(url))
            return $"url:{NormalizeToken(url)}";

        var stableName = NormalizeToken(name);
        var stableUnit = NormalizeToken(unit);
        var stableCategory = NormalizeToken(category);
        return $"name:{stableName}|unit:{stableUnit}|category:{stableCategory}";
    }

    private static string NormalizeToken(string value) =>
        NonAlphanumericChars().Replace(
            MultipleSpaces().Replace(
                CombiningCharacters().Replace(
                    value.Normalize(NormalizationForm.FormD).ToLowerInvariant().Trim(),
                    ""),
                "-"),
            "");
}
