using DomainActiveCart = SupermarketPlanner.Api.Domain.Entities.ActiveCartEntity;
using DomainActiveCartItem = SupermarketPlanner.Api.Domain.Entities.ActiveCartItem;

namespace SupermarketPlanner.Api.Infrastructure.Adapters.Driven.Persistence.Mappers;

public static class ActiveCartEntityMapper
{
    public static DomainActiveCart ToDomain(ActiveCartEntity entity) =>
        DomainActiveCart.Create(
            id: entity.Id,
            userId: entity.UserId,
            updatedAt: new DateTimeOffset(entity.UpdatedAt, TimeSpan.Zero),
            items: entity.Items.Select(MapItemToDomain).ToList());

    public static ActiveCartItemEntity ToInfraItem(DomainActiveCartItem item, string cartId) =>
        new()
        {
            Id = Guid.NewGuid().ToString(),
            CartId = cartId,
            ProductId = item.ProductId,
            ProductName = item.ProductName,
            Supermarket = item.Supermarket,
            Category = item.Category,
            Price = item.Price,
            PricePerUnit = item.PricePerUnit,
            Unit = item.Unit,
            TaxType = item.TaxType,
            Quantity = item.Quantity,
            Image = item.Image,
            Url = item.Url
        };

    private static DomainActiveCartItem MapItemToDomain(ActiveCartItemEntity item) =>
        new(
            ProductId: item.ProductId,
            ProductName: item.ProductName,
            Supermarket: item.Supermarket,
            Category: item.Category,
            Price: item.Price,
            PricePerUnit: item.PricePerUnit,
            Unit: item.Unit,
            TaxType: item.TaxType,
            Quantity: item.Quantity,
            Image: item.Image,
            Url: item.Url);
}
