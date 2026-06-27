using Microsoft.EntityFrameworkCore;
using SharpMonads.Core;
using SupermarketPlanner.Api.Application.Ports.Driven;
using SupermarketPlanner.Api.Domain;
using SupermarketPlanner.Api.Infrastructure.Adapters.Driven.Persistence.Mappers;
using DomainActiveCart = SupermarketPlanner.Api.Domain.Entities.ActiveCartEntity;

namespace SupermarketPlanner.Api.Infrastructure.Adapters.Driven.Persistence.Repositories;

public sealed class EfActiveCartRepository(SupermarketPlannerDbContext dbContext)
    : IActiveCartRepository
{
    public async Task<Option<DomainActiveCart>> FindByUserId(
        string userId,
        CancellationToken cancellationToken)
    {
        var entity = await dbContext.ActiveCarts
            .AsNoTracking()
            .Include(cart => cart.Items)
            .FirstOrDefaultAsync(cart => cart.UserId == userId, cancellationToken);

        return entity is null
            ? Option<DomainActiveCart>.None
            : Option<DomainActiveCart>.Some(ActiveCartEntityMapper.ToDomain(entity));
    }

    public async Task<Either<DomainError, DomainActiveCart>> Upsert(
        DomainActiveCart cartEntity,
        CancellationToken cancellationToken)
    {
        var strategy = dbContext.Database.CreateExecutionStrategy();

        return await strategy.ExecuteAsync(async () =>
        {
            try
            {
                await using var transaction = await dbContext.Database
                    .BeginTransactionAsync(cancellationToken);

                var existingCart = await FindExistingCartFor(cartEntity.UserId, cancellationToken);
                var cartId = existingCart.Match(onSome: cart => cart.Id, onNone: () => cartEntity.Id);

                await existingCart.Match<Task>(
                    onSome: async _ => await ClearItemsFrom(cartId, cancellationToken),
                    onNone: async () => await CreateEmptyCart(cartId, cartEntity.UserId, cancellationToken));

                await ReplaceItemsIn(cartId, cartEntity, cancellationToken);

                await transaction.CommitAsync(cancellationToken);

                return Either<DomainError, DomainActiveCart>.FromRight(
                    await ReloadCart(cartId, cancellationToken));
            }
            catch (Exception exception)
            {
                return Either<DomainError, DomainActiveCart>.FromLeft(
                    DomainError.InvalidOperation($"Failed to upsert cart: {exception.Message}"));
            }
        });
    }

    private async Task<Option<ActiveCartEntity>> FindExistingCartFor(
        string userId,
        CancellationToken cancellationToken)
    {
        var entity = await dbContext.ActiveCarts
            .FirstOrDefaultAsync(cart => cart.UserId == userId, cancellationToken);

        return entity is null
            ? Option<ActiveCartEntity>.None
            : Option<ActiveCartEntity>.Some(entity);
    }

    private async Task ClearItemsFrom(string cartId, CancellationToken cancellationToken) =>
        await dbContext.ActiveCartItems
            .Where(item => item.CartId == cartId)
            .ExecuteDeleteAsync(cancellationToken);

    private async Task CreateEmptyCart(string cartId, string userId, CancellationToken cancellationToken)
    {
        dbContext.ActiveCarts.Add(new ActiveCartEntity { Id = cartId, UserId = userId });
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private async Task ReplaceItemsIn(
        string cartId,
        DomainActiveCart cartEntity,
        CancellationToken cancellationToken)
    {
        var infraItems = cartEntity.Items
            .Select(item => ActiveCartEntityMapper.ToInfraItem(item, cartId))
            .ToList();

        dbContext.ActiveCartItems.AddRange(infraItems);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private async Task<DomainActiveCart> ReloadCart(string cartId, CancellationToken cancellationToken)
    {
        var reloaded = await dbContext.ActiveCarts
            .AsNoTracking()
            .Include(cart => cart.Items)
            .FirstAsync(cart => cart.Id == cartId, cancellationToken);

        return ActiveCartEntityMapper.ToDomain(reloaded);
    }
}
