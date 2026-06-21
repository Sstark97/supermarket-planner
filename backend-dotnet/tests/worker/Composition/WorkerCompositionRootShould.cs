using Microsoft.Extensions.Hosting;
using SupermarketPlanner.Worker.Infrastructure.Composition;

namespace SupermarketPlanner.Worker.Tests.Composition;

public sealed class WorkerCompositionRootShould
{
    [Test]
    public async Task BuildHostWithoutThrowingWhenNoDatabaseIsPresent()
    {
        var builder = Host.CreateApplicationBuilder();

        builder.Services.AddSupermarketPlannerWorker(builder.Configuration);

        var host = builder.Build();

        await Assert.That(host).IsNotNull()
            .Because("the composition root must resolve without a database connection at build time");
    }
}
