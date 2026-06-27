using Microsoft.Extensions.Logging;
using NSubstitute;
using SharpMonads.Core;
using SupermarketPlanner.Api.Application.Ports.Driven;
using SupermarketPlanner.Api.Application.Services;
using SupermarketPlanner.Api.Domain;

namespace SupermarketPlanner.Api.Tests.Application.Services;

[Property("Category", "Unit")]
public sealed class CachingBatchCategorizerShould
{
    private static (
        ICategoryCacheRepository Cache,
        IAiBatchCategorizer AiBatchCategorizer,
        CachingBatchCategorizer Service) BuildService(
        IReadOnlyDictionary<string, string>? cachedNames = null,
        IReadOnlyDictionary<string, string>? batchResults = null,
        int batchSize = 50,
        int batchDelayMs = 0)
    {
        var cache = Substitute.For<ICategoryCacheRepository>();
        var cachedMap = (cachedNames ?? new Dictionary<string, string>()).ToDictionary();
        cache.FindByNormalizedNames(Arg.Any<IReadOnlyList<string>>(), Arg.Any<CancellationToken>())
            .Returns((IReadOnlyDictionary<string, string>)cachedMap);
        cache.UpsertMany(Arg.Any<IReadOnlyList<CategoryCacheEntry>>(), Arg.Any<CancellationToken>())
            .Returns(Task.FromResult(Either<DomainError, Unit>.FromRight(Unit.Value)));

        var aiBatchCategorizer = Substitute.For<IAiBatchCategorizer>();
        var defaultResults = (batchResults ?? new Dictionary<string, string>()).ToDictionary();
        aiBatchCategorizer.CategorizeBatch(Arg.Any<IReadOnlyList<string>>(), Arg.Any<CancellationToken>())
            .Returns(Task.FromResult(Either<DomainError, IReadOnlyDictionary<string, string>>.FromRight(
                (IReadOnlyDictionary<string, string>)defaultResults)));

        var service = new CachingBatchCategorizer(
            cache,
            aiBatchCategorizer,
            Substitute.For<ILogger<CachingBatchCategorizer>>(),
            new BatchCategorizationOptions(batchSize, batchDelayMs));

        return (cache, aiBatchCategorizer, service);
    }

    [Test]
    public async Task ServeCachedResultsWithoutCallingAiWhenAllNamesAreCached()
    {
        var cached = new Dictionary<string, string> { ["leche entera"] = "Dairy" };
        var (_, aiBatchCategorizer, service) = BuildService(cachedNames: cached);

        var result = await service.Categorize(["leche entera"], CancellationToken.None);

        await Assert.That(result.Right.Failed).IsEqualTo(0);
        await aiBatchCategorizer.DidNotReceive().CategorizeBatch(Arg.Any<IReadOnlyList<string>>(), Arg.Any<CancellationToken>());
    }

    [Test]
    public async Task CallAiOnlyForNamesNotPresentInCache()
    {
        var cached = new Dictionary<string, string> { ["leche entera"] = "Dairy" };
        var batchResults = new Dictionary<string, string> { ["pan integral"] = "Bakery" };
        var (_, aiBatchCategorizer, service) = BuildService(cachedNames: cached, batchResults: batchResults);

        await service.Categorize(["leche entera", "pan integral"], CancellationToken.None);

        await aiBatchCategorizer.Received(1).CategorizeBatch(
            Arg.Is<IReadOnlyList<string>>(names => names.Count == 1 && names[0] == "pan integral"),
            Arg.Any<CancellationToken>());
    }

    [Test]
    public async Task UpsertAiResultsIntoCacheAfterSuccessfulBatch()
    {
        var batchResults = new Dictionary<string, string> { ["leche entera"] = "Dairy" };
        var (cache, _, service) = BuildService(batchResults: batchResults);

        await service.Categorize(["leche entera"], CancellationToken.None);

        await cache.Received(1).UpsertMany(
            Arg.Is<IReadOnlyList<CategoryCacheEntry>>(entries =>
                entries.Count == 1 &&
                entries[0].NormalizedName == "leche entera" &&
                entries[0].Category == "Dairy"),
            Arg.Any<CancellationToken>());
    }

    [Test]
    public async Task MergeCachedAndAiResultsInFinalOutput()
    {
        var cached = new Dictionary<string, string> { ["leche entera"] = "Dairy" };
        var batchResults = new Dictionary<string, string> { ["pan integral"] = "Bakery" };
        var (_, _, service) = BuildService(cachedNames: cached, batchResults: batchResults);

        var result = await service.Categorize(["leche entera", "pan integral"], CancellationToken.None);

        await Assert.That(result.Right.Categorized.Count).IsEqualTo(2);
        await Assert.That(result.Right.Categorized["leche entera"]).IsEqualTo("Dairy");
        await Assert.That(result.Right.Categorized["pan integral"]).IsEqualTo("Bakery");
    }

    [Test]
    public async Task SplitNamesIntoBatchesOfConfiguredSize()
    {
        var (_, aiBatchCategorizer, service) = BuildService(batchSize: 3);

        await service.Categorize(["p1", "p2", "p3", "p4", "p5"], CancellationToken.None);

        await aiBatchCategorizer.Received(2).CategorizeBatch(Arg.Any<IReadOnlyList<string>>(), Arg.Any<CancellationToken>());
    }

    [Test]
    public async Task CountNamesNotReturnedByAiAsFailed()
    {
        var batchResults = new Dictionary<string, string>
        {
            ["leche entera"] = "Dairy",
            ["pan integral"] = "Bakery",
        };
        var (_, _, service) = BuildService(batchResults: batchResults);

        var result = await service.Categorize(
            ["leche entera", "pan integral", "producto raro xyz"], CancellationToken.None);

        await Assert.That(result.Right.Failed).IsEqualTo(1);
    }
}
