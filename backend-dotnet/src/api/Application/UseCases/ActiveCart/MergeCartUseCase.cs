using SharpMonads.Core;
using SupermarketPlanner.Api.Application.Ports.Driven;
using SupermarketPlanner.Api.Application.Ports.Driving;
using SupermarketPlanner.Api.Domain;
using SupermarketPlanner.Api.Domain.Entities;
using SupermarketPlanner.Api.Domain.Services;

namespace SupermarketPlanner.Api.Application.UseCases.ActiveCart;

public sealed class MergeCartUseCase(
    IActiveCartRepository activeCartRepository,
    ILogger<MergeCartUseCase> logger) : IMergeCartUseCase
{
    public async Task<Either<DomainError, MergeCartResult>> Invoke(
        MergeCartInput input,
        CancellationToken cancellationToken)
    {
        logger.LogInformation(
            "[MergeCartUseCase] Invoke - userId: \"{UserId}\", incomingItems: {Count}",
            input.UserId, input.Items.Count);

        var existingCart = await activeCartRepository.FindByUserId(input.UserId, cancellationToken);
        return await MergeAndUpsert(input, existingCart, cancellationToken);
    }

    private Task<Either<DomainError, MergeCartResult>> MergeAndUpsert(
        MergeCartInput input,
        Option<ActiveCartEntity> existingCart,
        CancellationToken cancellationToken)
    {
        var existingItems = existingCart.Match(onSome: cart => cart.Items, onNone: () => []);
        var incomingItems = input.Items.Select(ToActiveCartItem).ToList();
        var mergedItems = ActiveCartMerger.Merge(existingItems, incomingItems);

        var cartToUpsert = ActiveCartEntity.Create(
            id: existingCart.Match(onSome: cart => cart.Id, onNone: () => Guid.NewGuid().ToString()),
            userId: input.UserId,
            updatedAt: DateTimeOffset.UtcNow,
            items: mergedItems);

        return activeCartRepository.Upsert(cartToUpsert, cancellationToken)
            .MapAsync(savedCart =>
            {
                logger.LogInformation(
                    "[MergeCartUseCase] cart upserted - id: \"{CartId}\", totalItems: {Count}",
                    savedCart.Id, savedCart.Items.Count);
                return ToResult(savedCart);
            });
    }

    private static ActiveCartItem ToActiveCartItem(MergeCartItemInput item) =>
        new(item.ProductId, item.ProductName, item.Supermarket, item.Category,
            item.Price, item.PricePerUnit, item.Unit, item.TaxType, item.Quantity,
            item.Image, item.Url);

    private static MergeCartResult ToResult(ActiveCartEntity cartEntity) =>
        new(
            CartId: cartEntity.Id,
            UserId: cartEntity.UserId,
            TotalItems: cartEntity.Items.Count,
            Items: cartEntity.Items.Select(MapCartItemToResultItem).ToList());

    private static MergeCartResultItem MapCartItemToResultItem(ActiveCartItem item) =>
        new(item.ProductId, item.ProductName, item.Supermarket, item.Category,
            item.Price, item.PricePerUnit, item.Unit, item.TaxType, item.Quantity,
            item.Image, item.Url);
}
