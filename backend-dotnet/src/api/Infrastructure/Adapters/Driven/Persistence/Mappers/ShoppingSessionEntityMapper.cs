using DomainSession = SupermarketPlanner.Api.Domain.Entities.ShoppingSessionEntity;
using DomainSessionItem = SupermarketPlanner.Api.Domain.Entities.ShoppingSessionItem;

namespace SupermarketPlanner.Api.Infrastructure.Adapters.Driven.Persistence.Mappers;

public static class ShoppingSessionEntityMapper
{
    public static DomainSession ToDomain(ShoppingSessionEntity entity) =>
        new(
            Id: entity.Id,
            UserId: entity.UserId,
            ShoppedAt: new DateTimeOffset(entity.ShoppedAt, TimeSpan.Zero),
            TotalPrice: entity.TotalPrice,
            CreatedAt: new DateTimeOffset(entity.CreatedAt, TimeSpan.Zero),
            Items: entity.Items.Select(MapItemToDomain).ToList());

    public static ShoppingSessionEntity ToInfra(DomainSession session) =>
        new()
        {
            Id = session.Id,
            UserId = session.UserId,
            ShoppedAt = DateTime.SpecifyKind(session.ShoppedAt.UtcDateTime, DateTimeKind.Unspecified),
            TotalPrice = session.TotalPrice,
            CreatedAt = DateTime.SpecifyKind(session.CreatedAt.UtcDateTime, DateTimeKind.Unspecified),
            Items = session.Items.Select(item => MapItemToInfra(item, session.Id)).ToList()
        };

    private static DomainSessionItem MapItemToDomain(ShoppingSessionItemEntity item) =>
        new(
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

    private static ShoppingSessionItemEntity MapItemToInfra(DomainSessionItem item, string sessionId) =>
        new()
        {
            Id = Guid.NewGuid().ToString(),
            SessionId = sessionId,
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
}
