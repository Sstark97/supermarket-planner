using System.Globalization;
using System.Text.RegularExpressions;

namespace SupermarketPlanner.Api.Domain.Services;

public sealed partial class PriceNormalizer
{
    [GeneratedRegex(@"\b(kg|kilos?|gr(?:amos?)?|g|l|lt|litros?|ml|cl|uds?|u|unid(?:ad(?:es)?)?|pack)\b", RegexOptions.IgnoreCase | RegexOptions.Compiled, "es-ES")]
    private static partial Regex UnitPattern();
    [GeneratedRegex(@"(\d[\d.,\s]*)\s*(?:€|eur\b)|(?:€|eur\b)\s*(\d[\d.,\s]*)", RegexOptions.IgnoreCase | RegexOptions.Compiled, "es-ES")]
    private static partial Regex CurrencyRegex();
    [GeneratedRegex(@"\d[\d.,\s]*", RegexOptions.Compiled)]
    private static partial Regex NumericRegex();
    [GeneratedRegex(@"(\d[\d.,\s]*)\s*(kg|kilos?|gr(?:amos?)?|g|l|lt|litros?|ml|cl|uds?|u|unid(?:ad(?:es)?)?|pack)\b", RegexOptions.IgnoreCase | RegexOptions.Compiled, "es-ES")]
    private static partial Regex AmountAndUnitRegex();
    [GeneratedRegex(@"(?:€|eur)\s*\/?\s*", RegexOptions.IgnoreCase | RegexOptions.Compiled, "es-ES")]
    private static partial Regex EurPrefix();
    [GeneratedRegex(@"\bpor\b", RegexOptions.IgnoreCase | RegexOptions.Compiled, "es-ES")]
    private static partial Regex PorWord();
    [GeneratedRegex(@"[  ]", RegexOptions.Compiled)]
    private static partial Regex NonBreakingSpaces();
    [GeneratedRegex(@"\s+", RegexOptions.Compiled)]
    private static partial Regex MultipleSpaces();
    
    public readonly record struct ParsedPrice(double Price, double PricePerUnit, string Unit);

    private readonly record struct UnitDefinition(string NormalizedUnit, double FactorToBase);

    private static readonly Dictionary<string, UnitDefinition> UnitDefinitions = new(StringComparer.OrdinalIgnoreCase)
    {
        ["kg"] = new UnitDefinition("kg", 1),
        ["kilo"] = new UnitDefinition("kg", 1),
        ["kilos"] = new UnitDefinition("kg", 1),
        ["g"] = new UnitDefinition("kg", 0.001),
        ["gr"] = new UnitDefinition("kg", 0.001),
        ["gramo"] = new UnitDefinition("kg", 0.001),
        ["gramos"] = new UnitDefinition("kg", 0.001),
        ["l"] = new UnitDefinition("L", 1),
        ["lt"] = new UnitDefinition("L", 1),
        ["litro"] = new UnitDefinition("L", 1),
        ["litros"] = new UnitDefinition("L", 1),
        ["ml"] = new UnitDefinition("L", 0.001),
        ["cl"] = new UnitDefinition("L", 0.01),
        ["ud"] = new UnitDefinition("ud", 1),
        ["uds"] = new UnitDefinition("ud", 1),
        ["u"] = new UnitDefinition("ud", 1),
        ["unidad"] = new UnitDefinition("ud", 1),
        ["unidades"] = new UnitDefinition("ud", 1),
        ["unid"] = new UnitDefinition("ud", 1),
        ["pack"] = new UnitDefinition("ud", 1),
    };

    public static double ParsePrice(string raw)
    {
        var text = SanitizeRawText(raw);

        var currencyCandidates = new List<string>();
        foreach (Match match in CurrencyRegex().Matches(text))
        {
            var candidate = (match.Groups[1].Value.Length > 0 ? match.Groups[1].Value : match.Groups[2].Value).Trim();
            if (!string.IsNullOrEmpty(candidate))
                currencyCandidates.Add(candidate);
        }

        if (currencyCandidates.Count > 0)
            return NormalizeNumericToken(currencyCandidates[^1]);

        var numericCandidates = NumericRegex().Matches(text)
            .Select(match => match.Value.Trim())
            .ToList();

        if (numericCandidates.Count == 0)
            return 0;

        return NormalizeNumericToken(numericCandidates[^1]);
    }

    public static ParsedPrice NormalizePricePerUnit(string priceRaw, string quantityRaw)
    {
        var price = ParsePrice(priceRaw);
        var parsedUnit = ExtractAmountAndUnit(quantityRaw);

        if (parsedUnit is null)
            return new ParsedPrice(price, price, "ud");

        var (amount, unit) = parsedUnit.Value;

        if (amount <= 0)
            return new ParsedPrice(price, price, "ud");

        return unit == "ud" ? new ParsedPrice(price, amount > 1 ? price / amount : price, unit) : new ParsedPrice(price, price / amount, unit);
    }

    public static string DetectTaxType(string text)
    {
        var upper = text.ToUpperInvariant();
        if (upper.Contains("IGIC")) return "IGIC";
        return upper.Contains("IVA") ? "IVA" : "UNKNOWN";
    }

    private static string SanitizeRawText(string raw) =>
        MultipleSpaces().Replace(NonBreakingSpaces().Replace(raw.ToLowerInvariant(), " "), " ").Trim();

    private static double NormalizeNumericToken(string rawNumber)
    {
        var compact = rawNumber.Replace(" ", "");
        if (string.IsNullOrEmpty(compact)) return 0;

        var hasComma = compact.Contains(',');
        var hasDot = compact.Contains('.');

        if (hasComma && hasDot)
        {
            var lastComma = compact.LastIndexOf(',');
            var lastDot = compact.LastIndexOf('.');
            var decimalSeparator = lastComma > lastDot ? ',' : '.';
            var thousandSeparator = decimalSeparator == ',' ? '.' : ',';

            var normalized = compact
                .Replace(thousandSeparator.ToString(), "")
                .Replace(decimalSeparator, '.');

            return double.TryParse(normalized, NumberStyles.Any,
                CultureInfo.InvariantCulture, out var parsedBoth)
                ? parsedBoth
                : 0;
        }

        if (hasComma)
        {
            var withoutDots = compact.Replace(".", "").Replace(',', '.');
            return double.TryParse(withoutDots, NumberStyles.Any,
                CultureInfo.InvariantCulture, out var parsedComma)
                ? parsedComma
                : 0;
        }

        var withoutCommas = compact.Replace(",", "");
        return double.TryParse(withoutCommas, NumberStyles.Any,
            CultureInfo.InvariantCulture, out var parsed)
            ? parsed
            : 0;
    }

    private static (double Amount, string Unit)? ExtractAmountAndUnit(string quantityRaw)
    {
        var quantity = PorWord().Replace(EurPrefix().Replace(SanitizeRawText(quantityRaw), ""), " ");

        var amountAndUnitMatch = AmountAndUnitRegex().Match(quantity);
        if (amountAndUnitMatch.Success)
        {
            var amount = NormalizeNumericToken(amountAndUnitMatch.Groups[1].Value);
            var rawUnit = amountAndUnitMatch.Groups[2].Value.ToLowerInvariant();

            if (!UnitDefinitions.TryGetValue(rawUnit, out var definition) || amount <= 0)
                return null;

            return (amount * definition.FactorToBase, definition.NormalizedUnit);
        }

        var standaloneUnits = UnitPattern().Matches(quantity)
            .Select(match => match.Groups[1].Value.ToLowerInvariant())
            .ToList();

        var uniqueUnits = standaloneUnits.Distinct().ToList();
        if (uniqueUnits.Count == 1 && UnitDefinitions.TryGetValue(uniqueUnits[0], out var singleDef))
            return (1, singleDef.NormalizedUnit);

        return null;
    }
}
