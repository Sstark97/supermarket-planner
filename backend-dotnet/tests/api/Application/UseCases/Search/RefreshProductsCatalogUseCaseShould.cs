using Microsoft.Extensions.Logging;
using NSubstitute;
using SharpMonads.Core;
using SupermarketPlanner.Api.Application.DTOs;
using SupermarketPlanner.Api.Application.Ports.Driven;
using SupermarketPlanner.Api.Application.Ports.Driving;
using SupermarketPlanner.Api.Application.UseCases.Search;
using SupermarketPlanner.Api.Domain;
using SupermarketPlanner.Api.Domain.Services;
using SupermarketPlanner.Api.Tests.Builders;

namespace SupermarketPlanner.Api.Tests.Application.UseCases.Search;

[Property("Category", "Unit")]
public sealed class RefreshProductsCatalogUseCaseShould
{
    [Test]
    public async Task ForwardPostalCodeFromInputToRepositorySaveCall()
    {
        var liveProduct = new ProductDtoBuilder().Named("Leche Entera").Build();
        var liveResult = new SearchResult(
            "leche",
            [liveProduct],
            [],
            1,
            null,
            "live",
            DateTimeOffset.UtcNow.ToString("o"),
            RefreshDecision.None);

        var triggerManualScrapeUseCase = Substitute.For<ITriggerManualScrapeUseCase>();
        triggerManualScrapeUseCase
            .Invoke(Arg.Any<TriggerManualScrapeInput>(), Arg.Any<CancellationToken>())
            .Returns(Either<DomainError, SearchResult>.FromRight(liveResult));

        var repository = Substitute.For<IProductCatalogRepository>();
        repository
            .Save(Arg.Any<IReadOnlyList<ProductDto>>(), Arg.Any<string>(), Arg.Any<CancellationToken>())
            .Returns(Either<DomainError, int>.FromRight(1));

        var useCase = new RefreshProductsCatalogUseCase(
            triggerManualScrapeUseCase,
            repository,
            Substitute.For<ILogger<RefreshProductsCatalogUseCase>>());

        await useCase.Invoke(new RefreshProductsCatalogInput("leche", "35001"), CancellationToken.None);

        await triggerManualScrapeUseCase.Received(1).Invoke(
            Arg.Is<TriggerManualScrapeInput>(input => input.Query == "leche" && input.PostalCode == "35001"),
            Arg.Any<CancellationToken>());

        await repository.Received(1).Save(
            Arg.Any<IReadOnlyList<ProductDto>>(),
            "35001",
            Arg.Any<CancellationToken>());
    }
}
