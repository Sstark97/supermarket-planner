using Microsoft.Extensions.Logging;
using NSubstitute;
using SharpMonads.Core;
using SupermarketPlanner.Api.Application.DTOs;
using SupermarketPlanner.Api.Application.Ports.Driven;
using SupermarketPlanner.Api.Application.Services;
using SupermarketPlanner.Api.Application.UseCases.Categorization;
using SupermarketPlanner.Api.Domain;

namespace SupermarketPlanner.Api.Tests.Application.UseCases.Categorization;

[Property("Category", "Unit")]
public sealed class CategorizePendingProductsUseCaseShould
{
    private static int productSequence;

    private static ProductDto MakeOtherProduct(string name) =>
        new($"product-{++productSequence}", name, "TestMart", "Other", 1.0, 1.0, "1 u", null, null, "UNKNOWN", DateTimeOffset.UtcNow);

    private static (
        IProductCatalogRepository Repository,
        IBatchCategorizer BatchCategorizer,
        CategorizePendingProductsUseCase UseCase) BuildUseCase(
        IReadOnlyList<ProductDto> pendingProducts,
        IReadOnlyDictionary<string, string>? categorized = null,
        int failed = 0,
        int? updateCount = null)
    {
        var repository = Substitute.For<IProductCatalogRepository>();
        repository.FindByCategory("Other", Arg.Any<CancellationToken>())
            .Returns((IReadOnlyList<ProductDto>)pendingProducts);
        repository.UpdateCategoryByNormalizedNames(Arg.Any<IReadOnlyList<NormalizedNameCategoryUpdate>>(), Arg.Any<CancellationToken>())
            .Returns(Either<DomainError, int>.FromRight(updateCount ?? pendingProducts.Count));

        var batchCategorizer = Substitute.For<IBatchCategorizer>();
        batchCategorizer.Categorize(Arg.Any<IReadOnlyList<string>>(), Arg.Any<CancellationToken>())
            .Returns(Task.FromResult(Either<DomainError, BatchCategorizationResult>.FromRight(
                new BatchCategorizationResult(
                    categorized ?? new Dictionary<string, string>(),
                    failed))));

        var useCase = new CategorizePendingProductsUseCase(
            repository,
            batchCategorizer,
            Substitute.For<ILogger<CategorizePendingProductsUseCase>>());

        return (repository, batchCategorizer, useCase);
    }

    [Test]
    public async Task ProduceZerosWhenNoPendingProductsFound()
    {
        var (_, _, useCase) = BuildUseCase([]);

        var result = await useCase.Invoke(CancellationToken.None);

        await Assert.That(result.Right).IsEqualTo(new CategorizePendingProductsResult(0, 0, 0));
    }

    [Test]
    public async Task CategorizePendingProductsAndReturnSummaryWithCount()
    {
        var pending = new[] { MakeOtherProduct("Leche entera"), MakeOtherProduct("Pan integral") };
        var categorized = new Dictionary<string, string>
        {
            ["leche entera"] = "Dairy",
            ["pan integral"] = "Bakery",
        };
        var (repository, _, useCase) = BuildUseCase(pending, categorized: categorized, updateCount: 2);

        var result = await useCase.Invoke(CancellationToken.None);

        await Assert.That(result.Right.TotalPending).IsEqualTo(2);
        await Assert.That(result.Right.Categorized).IsEqualTo(2);
        await Assert.That(result.Right.Failed).IsEqualTo(0);
        await repository.Received(1).UpdateCategoryByNormalizedNames(
            Arg.Any<IReadOnlyList<NormalizedNameCategoryUpdate>>(), Arg.Any<CancellationToken>());
    }

    [Test]
    public async Task ReportTotalPendingAsRawProductCountNotDeduplicatedCount()
    {
        var pending = new[] { MakeOtherProduct("Leche Entera"), MakeOtherProduct("LECHE ENTERA") };
        var categorized = new Dictionary<string, string> { ["leche entera"] = "Dairy" };
        var (_, _, useCase) = BuildUseCase(pending, categorized: categorized, updateCount: 2);

        var result = await useCase.Invoke(CancellationToken.None);

        await Assert.That(result.Right.TotalPending).IsEqualTo(2);
    }

    [Test]
    public async Task PassDeduplicatedNormalizedNamesToBatchCategorizer()
    {
        var pending = new[]
        {
            MakeOtherProduct("Leche Entera"),
            MakeOtherProduct("LECHE ENTERA"),
            MakeOtherProduct("leche entera"),
        };
        var (_, batchCategorizer, useCase) = BuildUseCase(pending);

        await useCase.Invoke(CancellationToken.None);

        await batchCategorizer.Received(1).Categorize(
            Arg.Is<IReadOnlyList<string>>(names => names.Count == 1 && names[0] == "leche entera"),
            Arg.Any<CancellationToken>());
    }

    [Test]
    public async Task PropagateFailedCountFromBatchCategorizer()
    {
        var pending = new[] { MakeOtherProduct("Producto raro") };
        var (_, _, useCase) = BuildUseCase(pending, failed: 1, updateCount: 0);

        var result = await useCase.Invoke(CancellationToken.None);

        await Assert.That(result.Right.Failed).IsEqualTo(1);
    }
}
