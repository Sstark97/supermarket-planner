using SupermarketPlanner.Api.Domain.Entities;

namespace SupermarketPlanner.Api.Tests.Builders;

public sealed class ActiveCartBuilder
{
    private string id = "cart-uuid-1";
    private string userId = "user-123";
    private DateTimeOffset updatedAt = new DateTimeOffset(2026, 5, 31, 0, 0, 0, TimeSpan.Zero);
    private List<ActiveCartItem> items = [];

    public ActiveCartBuilder WithId(string cartId)
    {
        id = cartId;
        return this;
    }

    public ActiveCartBuilder ForUser(string cartUserId)
    {
        userId = cartUserId;
        return this;
    }

    public ActiveCartBuilder WithItems(IEnumerable<ActiveCartItem> cartItems)
    {
        items = cartItems.ToList();
        return this;
    }

    public ActiveCartEntity Build() =>
        ActiveCartEntity.Create(id, userId, updatedAt, items);
}
