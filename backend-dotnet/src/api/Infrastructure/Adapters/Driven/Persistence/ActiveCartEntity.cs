namespace SupermarketPlanner.Api.Infrastructure.Adapters.Driven.Persistence;

public sealed class ActiveCartEntity
{
    public string Id { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public DateTime UpdatedAt { get; set; }

    public ICollection<ActiveCartItemEntity> Items { get; set; } = [];
}
