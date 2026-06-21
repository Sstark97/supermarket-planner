using SharpMonads.Core;

namespace SupermarketPlanner.Api.Domain.ValueObjects;

public readonly record struct Price
{
    private readonly decimal euros;

    private Price(decimal euros) => this.euros = euros;

    public static Either<DomainError, Price> FromEuros(decimal euros)
    {
        if (euros < 0)
            return Either<DomainError, Price>.FromLeft(
                DomainError.Validation(nameof(euros), "Price cannot be negative"));

        return Either<DomainError, Price>.FromRight(new Price(Math.Round(euros, 4)));
    }

    public static Price Free => new(0m);

    public decimal InEuros() => euros;

    public decimal InCents() => euros * 100m;

    public Price Add(Price other) => new(euros + other.euros);

    public bool IsCheaperThan(Price other) => euros < other.euros;

    public static bool operator <(Price left, Price right) => left.euros < right.euros;

    public static bool operator >(Price left, Price right) => left.euros > right.euros;

    public static bool operator <=(Price left, Price right) => left.euros <= right.euros;

    public static bool operator >=(Price left, Price right) => left.euros >= right.euros;
}
