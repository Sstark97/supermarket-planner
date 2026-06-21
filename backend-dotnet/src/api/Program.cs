using SupermarketPlanner.Api.Infrastructure.Adapters.Driving;
using SupermarketPlanner.Api.Infrastructure.Composition;

var builder = WebApplication.CreateBuilder(args);

builder.Configuration.AddJsonFile("appsettings.secret.json", optional: true, reloadOnChange: true);

builder.Services.AddSupermarketPlannerInfrastructure(builder.Configuration);

var app = builder.Build();

app.MapHealthEndpoints();

app.Run();

public partial class Program { }
