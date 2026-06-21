using SupermarketPlanner.Api.Domain;

namespace SupermarketPlanner.Api.Tests.Domain;

[Property("Category", "Unit")]
public sealed class DomainErrorShould
{
    [Test]
    public async Task HaveValidationCodeAndFieldAndReasonMessage()
    {
        var error = DomainError.Validation("field", "reason");

        await Assert.That(error.Code).IsEqualTo("VALIDATION");
        await Assert.That(error.Message).Contains("field");
        await Assert.That(error.Message).Contains("reason");
    }

    [Test]
    public async Task HaveNotFoundCodeWithEntityAndIdentifier()
    {
        var error = DomainError.NotFound("Product", "abc-123");

        await Assert.That(error.Code).IsEqualTo("NOT_FOUND");
        await Assert.That(error.Message).Contains("Product");
        await Assert.That(error.Message).Contains("abc-123");
    }

    [Test]
    public async Task HaveInvalidOperationCodeAndReason()
    {
        var error = DomainError.InvalidOperation("something went wrong");

        await Assert.That(error.Code).IsEqualTo("INVALID_OPERATION");
        await Assert.That(error.Message).Contains("something went wrong");
    }
}
