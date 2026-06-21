using Microsoft.EntityFrameworkCore;
using SupermarketPlanner.Api.Infrastructure.Adapters.Driven.Persistence;

namespace SupermarketPlanner.Api.Infrastructure.Composition;

internal static class InfrastructureServiceCollectionExtensions
{
    internal static IServiceCollection AddSupermarketPlannerInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("Database")
            ?? throw new InvalidOperationException(
                "Connection string 'Database' is required. " +
                "Set ConnectionStrings:Database in appsettings.secret.json or via environment variable.");

        services.AddDbContext<SupermarketPlannerDbContext>(options =>
            options.UseNpgsql(connectionString, npgsql =>
                npgsql.UseQuerySplittingBehavior(QuerySplittingBehavior.SplitQuery)));

        return services;
    }
}
