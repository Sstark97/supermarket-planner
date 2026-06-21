namespace SupermarketPlanner.Api.Domain.Entities;

public sealed record ActiveCartEntity(
    string Id,
    string UserId,
    DateTimeOffset UpdatedAt,
    IReadOnlyList<ActiveCartItem> Items)
{
    public static ActiveCartEntity Create(
        string id,
        string userId,
        DateTimeOffset updatedAt,
        IReadOnlyList<ActiveCartItem> items) =>
        new(id, userId, updatedAt, items);
}
