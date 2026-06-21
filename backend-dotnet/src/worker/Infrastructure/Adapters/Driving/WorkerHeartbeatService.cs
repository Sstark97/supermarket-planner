using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace SupermarketPlanner.Worker.Infrastructure.Adapters.Driving;

internal sealed class WorkerHeartbeatService(ILogger<WorkerHeartbeatService> logger) : BackgroundService
{
    protected override Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("Worker started — heartbeat service is running");
        return Task.CompletedTask;
    }
}
