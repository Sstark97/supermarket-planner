using SupermarketPlanner.Api.Domain.ValueObjects;

namespace SupermarketPlanner.Api.Tests.Domain.ValueObjects;

[Property("Category", "Unit")]
public sealed class PostalCodeShould
{
    [Test]
    public async Task CreateFromValidFiveDigitSpanishCode()
    {
        var result = PostalCode.Create("35001");

        await Assert.That(result.IsRight).IsTrue();
        await Assert.That(result.Right.AsString()).IsEqualTo("35001");
    }

    [Test]
    [Arguments("01001")]
    [Arguments("28001")]
    [Arguments("52001")]
    public async Task AcceptPostalCodesAcrossValidSpanishProvinceRanges(string code)
    {
        var result = PostalCode.Create(code);

        await Assert.That(result.IsRight).IsTrue();
    }

    [Test]
    [Arguments("00001")]
    [Arguments("53001")]
    public async Task RejectCodesOutsideValidSpanishProvinceRanges(string code)
    {
        var result = PostalCode.Create(code);

        await Assert.That(result.IsLeft).IsTrue();
    }

    [Test]
    [Arguments("3500")]
    [Arguments("350011")]
    [Arguments("3500a")]
    public async Task RejectCodesThatAreNotExactlyFiveDigits(string code)
    {
        var result = PostalCode.Create(code);

        await Assert.That(result.IsLeft).IsTrue();
    }

    [Test]
    public async Task BeEqualWhenBothCarryTheSameValue()
    {
        var first = PostalCode.Create("35001").Right;
        var second = PostalCode.Create("35001").Right;

        await Assert.That(first).IsEqualTo(second);
    }

    [Test]
    public async Task NotBeEqualWhenCarryingDifferentValues()
    {
        var first = PostalCode.Create("35001").Right;
        var second = PostalCode.Create("35010").Right;

        await Assert.That(first).IsNotEqualTo(second);
    }

    [Test]
    public async Task ExposeDefaultPostalCodeForLasPalmasDeGranCanaria()
    {
        await Assert.That(PostalCode.Default.AsString()).IsEqualTo("35001");
    }
}
