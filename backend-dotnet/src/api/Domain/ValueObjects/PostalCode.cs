using System.Text.RegularExpressions;
using SharpMonads.Core;

namespace SupermarketPlanner.Api.Domain.ValueObjects;

public readonly record struct PostalCode
{
    private static readonly Regex SpanishPostalCodePattern =
        new(@"^(?:0[1-9]|[1-4]\d|5[0-2])\d{3}$", RegexOptions.Compiled);

    private readonly string value;

    private PostalCode(string value) => this.value = value;

    public static Either<DomainError, PostalCode> Create(string value)
    {
        if (!SpanishPostalCodePattern.IsMatch(value))
            return Either<DomainError, PostalCode>.FromLeft(
                DomainError.Validation(nameof(value), $"Invalid Spanish postal code: \"{value}\""));

        return Either<DomainError, PostalCode>.FromRight(new PostalCode(value));
    }

    public static PostalCode Default => new("35001");

    public string AsString() => value;
}
