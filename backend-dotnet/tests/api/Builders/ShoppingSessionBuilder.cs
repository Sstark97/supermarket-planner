using SupermarketPlanner.Api.Domain.Entities;

namespace SupermarketPlanner.Api.Tests.Builders;

public sealed class ShoppingSessionBuilder
{
    private string id = "session-uuid-1";
    private string userId = "user-123";
    private DateTimeOffset shoppedAt = new DateTimeOffset(2026, 6, 1, 10, 0, 0, TimeSpan.Zero);
    private double totalPrice = 12.5;
    private DateTimeOffset createdAt = new DateTimeOffset(2026, 6, 1, 10, 5, 0, TimeSpan.Zero);
    private List<ShoppingSessionItem> items = [];

    public ShoppingSessionBuilder WithId(string sessionId)
    {
        id = sessionId;
        return this;
    }

    public ShoppingSessionBuilder ForUser(string sessionUserId)
    {
        userId = sessionUserId;
        return this;
    }

    public ShoppingSessionBuilder ShoppedOn(DateTimeOffset when)
    {
        shoppedAt = when;
        return this;
    }

    public ShoppingSessionBuilder WithTotalPrice(double total)
    {
        totalPrice = total;
        return this;
    }

    public ShoppingSessionBuilder WithItems(IEnumerable<ShoppingSessionItem> sessionItems)
    {
        items = sessionItems.ToList();
        return this;
    }

    public ShoppingSessionEntity Build() =>
        new(id, userId, shoppedAt, totalPrice, createdAt, items);
}
