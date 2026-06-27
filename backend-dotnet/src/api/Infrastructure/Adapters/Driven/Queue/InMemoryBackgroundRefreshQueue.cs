using System.Threading.Channels;
using SupermarketPlanner.Api.Application.Ports.Driven;

namespace SupermarketPlanner.Api.Infrastructure.Adapters.Driven.Queue;

public sealed class InMemoryBackgroundRefreshQueue : IBackgroundRefreshQueue
{
    private readonly HashSet<string> deduplicationKeys = [];
    private readonly Lock deduplicationLock = new();
    private readonly Channel<(string Query, string PostalCode)> channel =
        Channel.CreateUnbounded<(string, string)>();

    public ChannelReader<(string Query, string PostalCode)> Reader => channel.Reader;

    public bool Enqueue(string query, string postalCode)
    {
        var normalizedQuery = query.Trim().ToLowerInvariant();
        if (string.IsNullOrEmpty(normalizedQuery))
            return false;

        var key = $"{normalizedQuery}:{postalCode}";

        lock (deduplicationLock)
        {
            if (!deduplicationKeys.Add(key))
                return false;
        }

        channel.Writer.TryWrite((normalizedQuery, postalCode));
        return true;
    }
}
