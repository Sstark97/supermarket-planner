using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SupermarketPlanner.Worker.Infrastructure.Adapters.Driving;

namespace SupermarketPlanner.Worker.Infrastructure.Composition;

internal static class WorkerServiceCollectionExtensions
{
    internal static IServiceCollection AddSupermarketPlannerWorker(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddHostedService<WorkerHeartbeatService>();

        return services;
    }
}
