namespace SupermarketPlanner.Api.Domain.Ports;

public sealed record ZoneOnboardingQueueItem(
    string Id,
    string PostalCode,
    DateTimeOffset RequestedDay,
    ZoneOnboardingQueueState State,
    int Attempts,
    string? RequestedByUserId,
    string? ErrorMessage,
    DateTimeOffset? ProcessedAt,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);
