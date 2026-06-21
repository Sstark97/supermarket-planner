using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using SupermarketPlanner.Worker.Infrastructure.Composition;

var builder = Host.CreateApplicationBuilder(args);

builder.Configuration.AddJsonFile("appsettings.secret.json", optional: true, reloadOnChange: true);

builder.Services.AddSupermarketPlannerWorker(builder.Configuration);

var host = builder.Build();

await host.RunAsync();
