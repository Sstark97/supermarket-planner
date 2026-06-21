namespace SupermarketPlanner.Api.Infrastructure.Adapters.Driven.Persistence;

public enum ZoneOnboardingQueueState
{
    PENDING,
    PROCESSING,
    COMPLETED,
    FAILED
}

public sealed class ZoneOnboardingQueueEntity
{
    public string Id { get; set; } = string.Empty;
    public string PostalCode { get; set; } = string.Empty;
    public DateTime RequestedDay { get; set; }
    public ZoneOnboardingQueueState State { get; set; } = ZoneOnboardingQueueState.PENDING;
    public int Attempts { get; set; }
    public string? RequestedByUserId { get; set; }
    public string? ErrorMessage { get; set; }
    public DateTime? ProcessedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
