using Microsoft.EntityFrameworkCore;
using SharpMonads.Core;
using SupermarketPlanner.Api.Application.Ports.Driven;
using SupermarketPlanner.Api.Domain;
using SupermarketPlanner.Api.Infrastructure.Adapters.Driven.Persistence.Mappers;
using DomainSession = SupermarketPlanner.Api.Domain.Entities.ShoppingSessionEntity;

namespace SupermarketPlanner.Api.Infrastructure.Adapters.Driven.Persistence.Repositories;

public sealed class EfShoppingSessionRepository(SupermarketPlannerDbContext dbContext)
    : IShoppingSessionRepository
{
    private sealed record TicketAggregateRow(double TotalSpent, double AverageTicket, long TotalTickets);
    private sealed record SupermarketDominanceRow(string Supermarket, double TotalSpent, long TotalItems);
    private sealed record TrendRow(string Period, double Amount);
    private sealed record FrequentDayRow(int DayOfWeek, long TotalTickets);

    public async Task<Either<DomainError, DomainSession>> Save(
        DomainSession sessionEntity,
        CancellationToken cancellationToken)
    {
        try
        {
            var infraEntity = ShoppingSessionEntityMapper.ToInfra(sessionEntity);
            dbContext.ShoppingSessions.Add(infraEntity);
            await dbContext.SaveChangesAsync(cancellationToken);

            var saved = await dbContext.ShoppingSessions
                .AsNoTracking()
                .Include(session => session.Items)
                .FirstAsync(session => session.Id == infraEntity.Id, cancellationToken);

            return Either<DomainError, DomainSession>.FromRight(
                ShoppingSessionEntityMapper.ToDomain(saved));
        }
        catch (Exception exception)
        {
            return Either<DomainError, DomainSession>.FromLeft(
                DomainError.InvalidOperation($"Failed to save shopping session: {exception.Message}"));
        }
    }

    public async Task<IReadOnlyList<DomainSession>> FindByUserId(
        string userId,
        CancellationToken cancellationToken)
    {
        var entities = await dbContext.ShoppingSessions
            .AsNoTracking()
            .Include(session => session.Items)
            .Where(session => session.UserId == userId)
            .OrderByDescending(session => session.ShoppedAt)
            .ThenByDescending(session => session.CreatedAt)
            .ToListAsync(cancellationToken);

        return entities.Select(ShoppingSessionEntityMapper.ToDomain).ToList();
    }

    public async Task<Either<DomainError, bool>> DeleteByIdForUser(
        string sessionId,
        string userId,
        CancellationToken cancellationToken)
    {
        try
        {
            var deletedCount = await dbContext.ShoppingSessions
                .Where(session => session.Id == sessionId && session.UserId == userId)
                .ExecuteDeleteAsync(cancellationToken);

            return Either<DomainError, bool>.FromRight(deletedCount > 0);
        }
        catch (Exception exception)
        {
            return Either<DomainError, bool>.FromLeft(
                DomainError.InvalidOperation($"Failed to delete session: {exception.Message}"));
        }
    }

    public async Task<Either<DomainError, ShoppingSessionMetricsSnapshot>> MetricsForUser(
        string userId,
        CancellationToken cancellationToken)
    {
        try
        {
            var ticketRows = await dbContext.Database
                .SqlQueryRaw<TicketAggregateRow>(
                    """
                    SELECT
                      COALESCE(SUM("totalPrice"), 0)::double precision AS "TotalSpent",
                      COALESCE(AVG("totalPrice"), 0)::double precision AS "AverageTicket",
                      COUNT("id")::bigint AS "TotalTickets"
                    FROM "ShoppingSession"
                    WHERE "userId" = {0}
                    """, userId)
                .ToListAsync(cancellationToken);

            var dominanceRows = await dbContext.Database
                .SqlQueryRaw<SupermarketDominanceRow>(
                    """
                    SELECT
                      si."supermarket" AS "Supermarket",
                      COALESCE(SUM(si."price" * si."quantity"), 0)::double precision AS "TotalSpent",
                      COALESCE(SUM(si."quantity"), 0)::bigint AS "TotalItems"
                    FROM "ShoppingSessionItem" si
                    INNER JOIN "ShoppingSession" ss ON ss."id" = si."sessionId"
                    WHERE ss."userId" = {0}
                    GROUP BY si."supermarket"
                    ORDER BY "TotalSpent" DESC
                    """, userId)
                .ToListAsync(cancellationToken);

            var weeklyRows = await dbContext.Database
                .SqlQueryRaw<TrendRow>(
                    """
                    SELECT
                      TO_CHAR(DATE_TRUNC('week', ss."shoppedAt"), 'YYYY-MM-DD') AS "Period",
                      COALESCE(AVG(ss."totalPrice"), 0)::double precision AS "Amount"
                    FROM "ShoppingSession" ss
                    WHERE ss."userId" = {0}
                    GROUP BY DATE_TRUNC('week', ss."shoppedAt")
                    ORDER BY DATE_TRUNC('week', ss."shoppedAt") ASC
                    """, userId)
                .ToListAsync(cancellationToken);

            var monthlyRows = await dbContext.Database
                .SqlQueryRaw<TrendRow>(
                    """
                    SELECT
                      TO_CHAR(DATE_TRUNC('month', ss."shoppedAt"), 'YYYY-MM') AS "Period",
                      COALESCE(SUM(ss."totalPrice"), 0)::double precision AS "Amount"
                    FROM "ShoppingSession" ss
                    WHERE ss."userId" = {0}
                    GROUP BY DATE_TRUNC('month', ss."shoppedAt")
                    ORDER BY DATE_TRUNC('month', ss."shoppedAt") ASC
                    """, userId)
                .ToListAsync(cancellationToken);

            var yearlyRows = await dbContext.Database
                .SqlQueryRaw<TrendRow>(
                    """
                    SELECT
                      TO_CHAR(DATE_TRUNC('year', ss."shoppedAt"), 'YYYY') AS "Period",
                      COALESCE(SUM(ss."totalPrice"), 0)::double precision AS "Amount"
                    FROM "ShoppingSession" ss
                    WHERE ss."userId" = {0}
                    GROUP BY DATE_TRUNC('year', ss."shoppedAt")
                    ORDER BY DATE_TRUNC('year', ss."shoppedAt") ASC
                    """, userId)
                .ToListAsync(cancellationToken);

            var frequentDayRows = await dbContext.Database
                .SqlQueryRaw<FrequentDayRow>(
                    """
                    SELECT
                      EXTRACT(DOW FROM ss."shoppedAt")::int AS "DayOfWeek",
                      COUNT(*)::bigint AS "TotalTickets"
                    FROM "ShoppingSession" ss
                    WHERE ss."userId" = {0}
                    GROUP BY EXTRACT(DOW FROM ss."shoppedAt")::int
                    ORDER BY "TotalTickets" DESC, "DayOfWeek" ASC
                    LIMIT 1
                    """, userId)
                .ToListAsync(cancellationToken);

            var ticketRow = ticketRows.FirstOrDefault();
            var frequentDayRow = frequentDayRows.FirstOrDefault();

            var ticketMetrics = new ShoppingSessionTicketMetrics(
                AverageTicketCost: ticketRow?.AverageTicket ?? 0,
                TotalSpentToDate: ticketRow?.TotalSpent ?? 0,
                MostFrequentGroceryDay: frequentDayRow is null
                    ? null
                    : MapDayOfWeekToLabel(frequentDayRow.DayOfWeek),
                TotalTickets: (int)(ticketRow?.TotalTickets ?? 0));

            var supermarketDominance = dominanceRows
                .Select(row => new ShoppingSessionSupermarketDominanceMetric(
                    Supermarket: row.Supermarket,
                    TotalSpent: row.TotalSpent,
                    TotalItems: (int)row.TotalItems))
                .ToList();

            var spendingTrends = new ShoppingSessionSpendingTrends(
                WeeklyAverage: weeklyRows
                    .Select(row => new ShoppingSessionTrendPoint(row.Period, row.Amount))
                    .ToList(),
                MonthlyTotal: monthlyRows
                    .Select(row => new ShoppingSessionTrendPoint(row.Period, row.Amount))
                    .ToList(),
                YearlyTotal: yearlyRows
                    .Select(row => new ShoppingSessionTrendPoint(row.Period, row.Amount))
                    .ToList());

            var snapshot = new ShoppingSessionMetricsSnapshot(
                SupermarketDominance: supermarketDominance,
                SpendingTrends: spendingTrends,
                TicketMetrics: ticketMetrics);

            return Either<DomainError, ShoppingSessionMetricsSnapshot>.FromRight(snapshot);
        }
        catch (Exception exception)
        {
            return Either<DomainError, ShoppingSessionMetricsSnapshot>.FromLeft(
                DomainError.InvalidOperation($"Failed to compute metrics: {exception.Message}"));
        }
    }

    private static string MapDayOfWeekToLabel(int dayOfWeek) =>
        dayOfWeek switch
        {
            0 => "Domingo",
            1 => "Lunes",
            2 => "Martes",
            3 => "Miércoles",
            4 => "Jueves",
            5 => "Viernes",
            _ => "Sábado"
        };
}
