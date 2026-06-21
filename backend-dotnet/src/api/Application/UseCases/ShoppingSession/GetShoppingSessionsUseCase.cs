using Microsoft.Extensions.Logging;
using SharpMonads.Core;
using SupermarketPlanner.Api.Application.Ports.Driven;
using SupermarketPlanner.Api.Application.Ports.Driving;
using SupermarketPlanner.Api.Domain;
using SupermarketPlanner.Api.Domain.Entities;

namespace SupermarketPlanner.Api.Application.UseCases.ShoppingSession;

public sealed class GetShoppingSessionsUseCase(
    IShoppingSessionRepository shoppingSessionRepository,
    ILogger<GetShoppingSessionsUseCase> logger) : IGetShoppingSessionsUseCase
{
    public Task<Either<DomainError, GetShoppingSessionsResult>> Invoke(
        GetShoppingSessionsInput input,
        CancellationToken cancellationToken)
    {
        logger.LogInformation(
            "[GetShoppingSessionsUseCase] Invoke - userId: \"{UserId}\"",
            input.UserId);

        return shoppingSessionRepository.FindByUserId(input.UserId, cancellationToken)
            .MapAsync(sessions => new GetShoppingSessionsResult(
                sessions.Select(MapSession).ToList()));
    }

    private static ShoppingSessionHistoryEntry MapSession(ShoppingSessionEntity session) =>
        new(
            SessionId: session.Id,
            ShoppedAt: session.ShoppedAt.ToUniversalTime().ToString("o"),
            TotalPrice: session.TotalPrice,
            CreatedAt: session.CreatedAt.ToUniversalTime().ToString("o"),
            Items: session.Items.Select(MapSessionItemToOutput).ToList());

    private static ShoppingSessionHistoryItem MapSessionItemToOutput(ShoppingSessionItem item) =>
        new(item.ProductName, item.Supermarket, item.Category, item.Price,
            item.PricePerUnit, item.Unit, item.TaxType, item.Quantity, item.Image, item.Url);
}
