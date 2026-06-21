namespace SupermarketPlanner.Api.Domain.Entities;

public sealed record ShoppingSessionItem(
    string ProductName,
    string Supermarket,
    string Category,
    double Price,
    double PricePerUnit,
    string Unit,
    string TaxType,
    int Quantity,
    string? Image,
    string? Url);
