using SupermarketPlanner.Api.Infrastructure.Adapters.Driven.Queue;

namespace SupermarketPlanner.Api.Tests.Infrastructure.Queue;

[Property("Category", "Unit")]
public sealed class InMemoryBackgroundRefreshQueueShould
{
    [Test]
    public async Task AcceptNewQuery()
    {
        var queue = new InMemoryBackgroundRefreshQueue();

        var enqueued = queue.Enqueue("leche", "35001");

        await Assert.That(enqueued).IsTrue();
    }

    [Test]
    public async Task RejectDuplicateQuery()
    {
        var queue = new InMemoryBackgroundRefreshQueue();
        queue.Enqueue("leche", "35001");

        var secondEnqueue = queue.Enqueue("leche", "35001");

        await Assert.That(secondEnqueue).IsFalse();
    }

    [Test]
    public async Task RejectBlankQuery()
    {
        var queue = new InMemoryBackgroundRefreshQueue();

        var enqueued = queue.Enqueue("   ", "35001");

        await Assert.That(enqueued).IsFalse();
    }

    [Test]
    public async Task NormalizeQueryToLowerCase()
    {
        var queue = new InMemoryBackgroundRefreshQueue();
        queue.Enqueue("LECHE", "35001");

        var duplicateWithDifferentCase = queue.Enqueue("leche", "35001");

        await Assert.That(duplicateWithDifferentCase).IsFalse();
    }
}
