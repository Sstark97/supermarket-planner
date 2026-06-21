namespace SupermarketPlanner.Api.Domain.Services;

public readonly record struct RefreshDecision(bool ShouldRefresh, string? Reason)
{
    private static readonly TimeSpan StaleThreshold = TimeSpan.FromHours(24);

    public static readonly RefreshDecision None = new(false, null);

    public static RefreshDecision Compute(string query, int productsCount, DateTimeOffset? latestScrapedAt)
    {
        if (string.IsNullOrEmpty(query)) return None;
        if (productsCount == 0) return new(true, "empty");
        var isStale = latestScrapedAt is not null && DateTimeOffset.UtcNow - latestScrapedAt.Value > StaleThreshold;
        return isStale ? new(true, "stale") : None;
    }
}
