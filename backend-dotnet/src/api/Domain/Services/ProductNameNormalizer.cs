using System.Text;
using System.Text.RegularExpressions;

namespace SupermarketPlanner.Api.Domain.Services;

public sealed partial class ProductNameNormalizer
{
    
    [GeneratedRegex(@"[̀-ͯ]", RegexOptions.Compiled)]
    private static partial Regex CombiningCharacters();
    
    public static string Normalize(string name) =>
        CombiningCharacters()
            .Replace(name.ToLowerInvariant().Normalize(NormalizationForm.FormD), "")
            .Trim();
}
