using SupermarketPlanner.Api.Domain.Services;

namespace SupermarketPlanner.Api.Tests.Domain.Services;

[Property("Category", "Unit")]
public sealed class PriceNormalizerShould
{
    [Test]
    [Arguments("0,99 EUR/l", 0.99)]
    [Arguments("1,50 €/kg", 1.5)]
    [Arguments("2.45 €/unidad", 2.45)]
    [Arguments("Before 3,00€ Now 1,99€", 1.99)]
    [Arguments("PVP 1.234,56 €", 1234.56)]
    public async Task ParseComplexSupermarketPriceTexts(string raw, double expected)
    {
        var result = PriceNormalizer.ParsePrice(raw);

        await Assert.That(result).IsEqualTo(expected).Within(0.000001);
    }

    [Test]
    public async Task NormalizeSixteenSupermarketFormatVariations()
    {
        var cases = new (string PriceRaw, string QuantityRaw, double ExpectedPrice, double ExpectedPricePerUnit, string ExpectedUnit)[]
        {
            ("1,50 €/kg", "kg", 1.5, 1.5, "kg"),
            ("0,99 EUR/l", "l", 0.99, 0.99, "L"),
            ("2.45 €/unidad", "unidad", 2.45, 2.45, "ud"),
            ("Before 3,00€ Now 1,99€", "1 ud", 1.99, 1.99, "ud"),
            ("1,20€", "500 g", 1.2, 2.4, "kg"),
            ("0,80€", "250 gr", 0.8, 3.2, "kg"),
            ("2,70€", "1500 ml", 2.7, 1.8, "L"),
            ("3,00€", "75 cl", 3.0, 4.0, "L"),
            ("3,60€", "pack 6 ud", 3.6, 0.6, "ud"),
            ("6,00€", "12 unidades", 6.0, 0.5, "ud"),
            ("PVP 1.234,56 €", "2 kg", 1234.56, 617.28, "kg"),
            ("EUR 1,234.56", "4 l", 1234.56, 308.64, "L"),
            ("1,75€", "€/kg", 1.75, 1.75, "kg"),
            ("2,10 eur", "eur/litro", 2.1, 2.1, "L"),
            ("1,99€", "formato especial", 1.99, 1.99, "ud"),
            ("2,50€", "kg / l", 2.5, 2.5, "ud"),
        };

        foreach (var (priceRaw, quantityRaw, expectedPrice, expectedPricePerUnit, expectedUnit) in cases)
        {
            var normalized = PriceNormalizer.NormalizePricePerUnit(priceRaw, quantityRaw);

            await Assert.That(normalized.Price).IsEqualTo(expectedPrice).Within(0.000001);
            await Assert.That(normalized.PricePerUnit).IsEqualTo(expectedPricePerUnit).Within(0.000001);
            await Assert.That(normalized.Unit).IsEqualTo(expectedUnit);
        }
    }

    [Test]
    [Arguments("precio con IGIC incluido", "IGIC")]
    [Arguments("precio con IVA incluido", "IVA")]
    [Arguments("precio sin impuesto", "UNKNOWN")]
    public async Task DetectTaxTypeFromText(string text, string expectedTaxType)
    {
        var result = PriceNormalizer.DetectTaxType(text);

        await Assert.That(result).IsEqualTo(expectedTaxType);
    }
}
