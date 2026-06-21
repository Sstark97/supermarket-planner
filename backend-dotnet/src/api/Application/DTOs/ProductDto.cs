namespace SupermarketPlanner.Api.Application.DTOs;

public sealed record ProductDto(
    string Id,
    string Name,
    string Supermarket,
    string Category,
    double Price,
    double PricePerUnit,
    string Unit,
    string? Image,
    string? Url,
    string TaxType,
    DateTimeOffset ScrapedAt);
