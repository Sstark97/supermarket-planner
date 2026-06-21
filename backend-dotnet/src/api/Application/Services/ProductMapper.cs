using System.Globalization;
using SupermarketPlanner.Api.Application.DTOs;
using SupermarketPlanner.Api.Domain.Services;

namespace SupermarketPlanner.Api.Application.Services;

public sealed record ProductMappingInput(
    string Supermarket,
    string Name,
    string Category,
    string PriceRaw,
    string? PricePerUnitRaw,
    string? QuantityRaw,
    string? UnitRaw,
    string? Image,
    string? Url,
    string? TaxHint);

public sealed class ProductMapper
{
    private readonly Func<string> createId;
    private readonly Func<DateTimeOffset> nowAt;

    public ProductMapper(Func<string> createId, Func<DateTimeOffset> nowAt)
    {
        this.createId = createId;
        this.nowAt = nowAt;
    }

    public ProductDto MapToDto(ProductMappingInput input)
    {
        var safeName = input.Name.Trim().Length > 0
            ? input.Name.Trim()
            : $"{input.Supermarket} product";

        var normalizedPrice = PriceNormalizer.NormalizePricePerUnit(
            input.PriceRaw,
            input.QuantityRaw ?? "1 ud");

        var explicitPricePerUnit = ToFiniteDouble(input.PricePerUnitRaw);

        return new ProductDto(
            Id: createId(),
            Name: safeName,
            Supermarket: input.Supermarket,
            Category: input.Category,
            Price: normalizedPrice.Price,
            PricePerUnit: explicitPricePerUnit > 0 ? explicitPricePerUnit : normalizedPrice.PricePerUnit,
            Unit: !string.IsNullOrWhiteSpace(input.UnitRaw) ? input.UnitRaw.Trim() : normalizedPrice.Unit,
            Image: input.Image,
            Url: input.Url,
            TaxType: PriceNormalizer.DetectTaxType(input.TaxHint ?? safeName),
            ScrapedAt: nowAt());
    }

    private static double ToFiniteDouble(string? value)
    {
        if (value is null) return 0;
        var normalized = value.Replace(",", ".");
        return double.TryParse(normalized, NumberStyles.Any,
            CultureInfo.InvariantCulture, out var result) && double.IsFinite(result)
            ? result
            : 0;
    }
}
