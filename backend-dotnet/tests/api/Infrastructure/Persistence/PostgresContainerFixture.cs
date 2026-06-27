using Microsoft.EntityFrameworkCore;
using Npgsql;
using SupermarketPlanner.Api.Infrastructure.Adapters.Driven.Persistence;
using Testcontainers.PostgreSql;
using TUnit.Core.Interfaces;

namespace SupermarketPlanner.Api.Tests.Infrastructure.Persistence;

public sealed class PostgresContainerFixture : IAsyncInitializer, IAsyncDisposable
{
    private readonly PostgreSqlContainer container = new PostgreSqlBuilder("postgres:17-alpine")
        .Build();

    private string adminConnectionString = string.Empty;

    public async Task InitializeAsync()
    {
        await container.StartAsync();
        adminConnectionString = container.GetConnectionString();
    }

    public async Task<SupermarketPlannerDbContext> CreateFreshDbContext()
    {
        var databaseName = $"testdb_{Guid.NewGuid():N}";
        await using var adminConnection = new NpgsqlConnection(adminConnectionString);
        await adminConnection.OpenAsync();
        await using var command = adminConnection.CreateCommand();
        command.CommandText = $"CREATE DATABASE \"{databaseName}\"";
        await command.ExecuteNonQueryAsync();

        var builder = new NpgsqlConnectionStringBuilder(adminConnectionString) { Database = databaseName };
        var options = new DbContextOptionsBuilder<SupermarketPlannerDbContext>()
            .UseNpgsql(builder.ConnectionString)
            .Options;

        var dbContext = new SupermarketPlannerDbContext(options);
        await dbContext.Database.EnsureCreatedAsync();
        return dbContext;
    }

    public async ValueTask DisposeAsync()
    {
        await container.DisposeAsync();
    }
}
