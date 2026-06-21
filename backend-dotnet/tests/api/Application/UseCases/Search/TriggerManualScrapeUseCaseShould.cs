using Microsoft.Extensions.Logging;
using NSubstitute;
using NSubstitute.ExceptionExtensions;
using SharpMonads.Core;
using SupermarketPlanner.Api.Application.DTOs;
using SupermarketPlanner.Api.Application.Ports.Driven;
using SupermarketPlanner.Api.Application.UseCases.Search;
using SupermarketPlanner.Api.Domain;

namespace SupermarketPlanner.Api.Tests.Application.UseCases.Search;

[Property("Category", "Unit")]
public sealed class TriggerManualScrapeUseCaseShould
{
    private static ProductDto MakeProduct(string name, string supermarket, double pricePerUnit) =>
        new($"{supermarket}-{name}", name, supermarket, "other", pricePerUnit, pricePerUnit, "ud", null, null, "UNKNOWN", DateTimeOffset.UtcNow);

    [Test]
    public async Task CaptureRejectedScrapersAsWarningsAndKeepFulfilledResults()
    {
        var okScraper = Substitute.For<ISupermarketSearchPort>();
        okScraper.Name.Returns("OKMarket");
        okScraper.Search("milk", "35010", Arg.Any<CancellationToken>())
            .Returns(Either<DomainError, IReadOnlyList<ProductDto>>.FromRight([MakeProduct("Milk", "OKMarket", 1.2)]));

        var failingScraper = Substitute.For<ISupermarketSearchPort>();
        failingScraper.Name.Returns("FailMarket");
        failingScraper.Search("milk", "35010", Arg.Any<CancellationToken>())
            .Returns(Either<DomainError, IReadOnlyList<ProductDto>>.FromLeft(DomainError.InvalidOperation("upstream timeout")));

        var useCase = new TriggerManualScrapeUseCase(
            [okScraper, failingScraper],
            Substitute.For<ILogger<TriggerManualScrapeUseCase>>());

        var result = await useCase.Invoke(new TriggerManualScrapeInput("milk", "35010"), CancellationToken.None);

        var searchResult = result.Right;
        await Assert.That(searchResult.Results.Count).IsEqualTo(1);
        await Assert.That(searchResult.Results[0].Supermarket).IsEqualTo("OKMarket");
        await Assert.That(searchResult.Warnings.Count).IsEqualTo(1);
        await Assert.That(searchResult.Warnings[0]).Contains("FailMarket");
        await Assert.That(searchResult.Source).IsEqualTo("live");
    }

    [Test]
    public async Task ProduceEmptyResultsAndWarningsForSingleFailingScraper()
    {
        var failingScraper = Substitute.For<ISupermarketSearchPort>();
        failingScraper.Name.Returns("JsonFail");
        failingScraper.Search("rice", "35010", Arg.Any<CancellationToken>())
            .Returns(Either<DomainError, IReadOnlyList<ProductDto>>.FromLeft(DomainError.InvalidOperation("RATE_LIMIT")));

        var useCase = new TriggerManualScrapeUseCase(
            [failingScraper],
            Substitute.For<ILogger<TriggerManualScrapeUseCase>>());

        var result = await useCase.Invoke(new TriggerManualScrapeInput("rice", "35010"), CancellationToken.None);

        var searchResult = result.Right;
        await Assert.That(searchResult.Results.Count).IsEqualTo(0);
        await Assert.That(searchResult.Warnings.Count).IsEqualTo(1);
    }
}
