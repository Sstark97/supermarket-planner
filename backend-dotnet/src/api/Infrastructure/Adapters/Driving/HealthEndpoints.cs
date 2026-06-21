using Microsoft.EntityFrameworkCore;
using SupermarketPlanner.Api.Infrastructure.Adapters.Driven.Persistence;

namespace SupermarketPlanner.Api.Infrastructure.Adapters.Driving;

internal static class HealthEndpoints
{
    internal static IEndpointRouteBuilder MapHealthEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/health", async (
            SupermarketPlannerDbContext dbContext,
            ILogger<SupermarketPlannerDbContext> logger,
            CancellationToken cancellationToken) =>
        {
            var dbConnected = await CanConnectToDatabaseAsync(dbContext, logger, cancellationToken);

            return Results.Ok(new
            {
                status = "ok",
                dbConnected,
                scrapers = Array.Empty<object>()
            });
        });

        return app;
    }

    private static async Task<bool> CanConnectToDatabaseAsync(
        SupermarketPlannerDbContext dbContext,
        ILogger<SupermarketPlannerDbContext> logger,
        CancellationToken cancellationToken)
    {
        try
        {
            return await dbContext.Database.CanConnectAsync(cancellationToken);
        }
        catch (Exception exception)
        {
            logger.LogWarning(exception, "Database connectivity check failed");
            return false;
        }
    }
}
