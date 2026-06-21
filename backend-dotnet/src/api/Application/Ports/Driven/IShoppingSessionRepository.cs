using SharpMonads.Core;
using SupermarketPlanner.Api.Domain;
using SupermarketPlanner.Api.Domain.Entities;

namespace SupermarketPlanner.Api.Application.Ports.Driven;

public sealed record ShoppingSessionSupermarketDominanceMetric(
    string Supermarket,
    double TotalSpent,
    int TotalItems);

public sealed record ShoppingSessionTrendPoint(
    string Period,
    double Amount);

public sealed record ShoppingSessionSpendingTrends(
    IReadOnlyList<ShoppingSessionTrendPoint> WeeklyAverage,
    IReadOnlyList<ShoppingSessionTrendPoint> MonthlyTotal,
    IReadOnlyList<ShoppingSessionTrendPoint> YearlyTotal);

public sealed record ShoppingSessionTicketMetrics(
    double AverageTicketCost,
    double TotalSpentToDate,
    string? MostFrequentGroceryDay,
    int TotalTickets);

public sealed record ShoppingSessionMetricsSnapshot(
    IReadOnlyList<ShoppingSessionSupermarketDominanceMetric> SupermarketDominance,
    ShoppingSessionSpendingTrends SpendingTrends,
    ShoppingSessionTicketMetrics TicketMetrics);

public interface IShoppingSessionRepository
{
    Task<Either<DomainError, ShoppingSessionEntity>> Save(
        ShoppingSessionEntity sessionEntity,
        CancellationToken cancellationToken);

    Task<Either<DomainError, IReadOnlyList<ShoppingSessionEntity>>> FindByUserId(
        string userId,
        CancellationToken cancellationToken);

    Task<Either<DomainError, bool>> DeleteByIdForUser(
        string sessionId,
        string userId,
        CancellationToken cancellationToken);

    Task<Either<DomainError, ShoppingSessionMetricsSnapshot>> MetricsForUser(
        string userId,
        CancellationToken cancellationToken);
}
