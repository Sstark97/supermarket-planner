using SupermarketPlanner.Api.Domain.Services;

namespace SupermarketPlanner.Api.Tests.Domain.Services;

[Property("Category", "Unit")]
public sealed class ProductNameNormalizerShould
{
    [Test]
    public async Task ConvertUppercaseLettersToLowercase()
    {
        var result = ProductNameNormalizer.Normalize("LECHE ENTERA");

        await Assert.That(result).IsEqualTo("leche entera");
    }

    [Test]
    public async Task ConvertMixedCaseStringsToLowercase()
    {
        var result = ProductNameNormalizer.Normalize("Leche Entera");

        await Assert.That(result).IsEqualTo("leche entera");
    }

    [Test]
    public async Task RemoveAcuteAccentsFromSpanishVowels()
    {
        var result = ProductNameNormalizer.Normalize("Atún en aceite");

        await Assert.That(result).IsEqualTo("atun en aceite");
    }

    [Test]
    public async Task RemoveAccentsFromAllAccentedVowelsInProductName()
    {
        var result = ProductNameNormalizer.Normalize("Plátanos de Canarias");

        await Assert.That(result).IsEqualTo("platanos de canarias");
    }

    [Test]
    public async Task HandleNByKeepingItAsNAfterNfdNormalization()
    {
        var result = ProductNameNormalizer.Normalize("Piñones tostados");

        await Assert.That(result).IsEqualTo("pinones tostados");
    }

    [Test]
    public async Task StripAccentsFromProductNamesWithMultipleDiacritics()
    {
        var result = ProductNameNormalizer.Normalize("Café con Leche Azúcar");

        await Assert.That(result).IsEqualTo("cafe con leche azucar");
    }

    [Test]
    public async Task TrimLeadingWhitespace()
    {
        var result = ProductNameNormalizer.Normalize("  leche entera");

        await Assert.That(result).IsEqualTo("leche entera");
    }

    [Test]
    public async Task TrimTrailingWhitespace()
    {
        var result = ProductNameNormalizer.Normalize("leche entera  ");

        await Assert.That(result).IsEqualTo("leche entera");
    }

    [Test]
    public async Task PreserveNumericQuantitiesInGrams()
    {
        var result = ProductNameNormalizer.Normalize("Patatas fritas 150g");

        await Assert.That(result).IsEqualTo("patatas fritas 150g");
    }

    [Test]
    public async Task ProduceTheSameResultWhenAppliedTwice()
    {
        var name = "Bebida de Avena sin Azúcar";
        var firstPass = ProductNameNormalizer.Normalize(name);
        var secondPass = ProductNameNormalizer.Normalize(firstPass);

        await Assert.That(firstPass).IsEqualTo(secondPass);
    }

    [Test]
    public async Task ProduceEmptyStringWhenGivenEmptyString()
    {
        var result = ProductNameNormalizer.Normalize(string.Empty);

        await Assert.That(result).IsEqualTo(string.Empty);
    }
}
