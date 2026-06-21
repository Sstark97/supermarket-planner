namespace SupermarketPlanner.Api.Infrastructure.Adapters.Driven.Persistence;

public sealed class ShoppingSessionEntity
{
    public string Id { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public DateTime ShoppedAt { get; set; }
    public double TotalPrice { get; set; }
    public DateTime CreatedAt { get; set; }

    public ICollection<ShoppingSessionItemEntity> Items { get; set; } = [];
}
