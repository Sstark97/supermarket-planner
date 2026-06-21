using Microsoft.Extensions.Logging;
using SharpMonads.Core;
using SupermarketPlanner.Api.Application.Ports.Driven;
using SupermarketPlanner.Api.Application.Ports.Driving;
using SupermarketPlanner.Api.Domain;
using SupermarketPlanner.Api.Domain.Entities;
using SupermarketPlanner.Api.Domain.Services;

namespace SupermarketPlanner.Api.Application.UseCases.ShoppingSession;

public sealed class SaveShoppingSessionUseCase(
    IShoppingSessionRepository shoppingSessionRepository,
    ILogger<SaveShoppingSessionUseCase> logger) : ISaveShoppingSessionUseCase
{
    public Task<Either<DomainError, SaveShoppingSessionResult>> Invoke(
        SaveShoppingSessionInput input,
        CancellationToken cancellationToken)
    {
        logger.LogInformation(
            "[SaveShoppingSessionUseCase] Invoke - userId: \"{UserId}\", items: {Count}",
            input.UserId, input.Items.Count);

        if (input.Items.Count == 0)
            return Task.FromResult(Either<DomainError, SaveShoppingSessionResult>.FromLeft(
                DomainError.Validation(nameof(input.Items), "Cannot save a shopping session with no items.")));

        if (!DateTimeOffset.TryParse(input.ShoppedAt, out var shoppedAt))
            return Task.FromResult(Either<DomainError, SaveShoppingSessionResult>.FromLeft(
                DomainError.Validation(nameof(input.ShoppedAt), $"Invalid shoppedAt date: \"{input.ShoppedAt}\"")));

        var totalPrice = ShoppingSessionTotalCalculator.Calculate(
            input.Items.Select(item => (item.Price, item.Quantity)).ToList());

        var session = new ShoppingSessionEntity(
            Id: Guid.NewGuid().ToString(),
            UserId: input.UserId,
            ShoppedAt: shoppedAt,
            TotalPrice: totalPrice,
            CreatedAt: DateTimeOffset.UtcNow,
            Items: input.Items.Select(MapInputItemToSessionItem).ToList());

        return shoppingSessionRepository.Save(session, cancellationToken)
            .MapAsync(savedSession =>
            {
                logger.LogInformation(
                    "[SaveShoppingSessionUseCase] session saved - id: \"{SessionId}\", total: {Total}",
                    savedSession.Id, savedSession.TotalPrice);
                return new SaveShoppingSessionResult(
                    SessionId: savedSession.Id,
                    TotalPrice: savedSession.TotalPrice,
                    ItemCount: savedSession.Items.Count);
            });
    }

    private static ShoppingSessionItem MapInputItemToSessionItem(SaveShoppingSessionItemInput item) =>
        new(item.ProductName, item.Supermarket, item.Category, item.Price,
            item.PricePerUnit, item.Unit, item.TaxType, item.Quantity, item.Image, item.Url);
}
