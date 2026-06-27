using Microsoft.EntityFrameworkCore;
using SupermarketPlanner.Api.Application.Ports.Driven;
using SupermarketPlanner.Api.Domain.Ports;
using SupermarketPlanner.Api.Infrastructure.Adapters.Driven.Persistence;
using SupermarketPlanner.Api.Infrastructure.Adapters.Driven.Persistence.Repositories;
using SupermarketPlanner.Api.Infrastructure.Adapters.Driven.Queue;

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

        services.AddScoped<IProductCatalogRepository, EfProductCatalogRepository>();
        services.AddScoped<IActiveCartRepository, EfActiveCartRepository>();
        services.AddScoped<IShoppingSessionRepository, EfShoppingSessionRepository>();
        services.AddScoped<ICategoryCacheRepository, EfCategoryCacheRepository>();
        services.AddScoped<IQueuePort, EfZoneOnboardingQueueAdapter>();
        services.AddSingleton<IBackgroundRefreshQueue, InMemoryBackgroundRefreshQueue>();

        return services;
    }
}
