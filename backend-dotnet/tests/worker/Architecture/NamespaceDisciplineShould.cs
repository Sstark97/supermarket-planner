using NetArchTest.Rules;
using SupermarketPlanner.Worker.Infrastructure.Adapters.Driving;

namespace SupermarketPlanner.Worker.Tests.Architecture;

public sealed class NamespaceDisciplineShould
{
    private static readonly string[] ForbiddenFrameworks =
    [
        "Microsoft.EntityFrameworkCore",
        "Npgsql",
        "Microsoft.AspNetCore",
        "Microsoft.Playwright"
    ];

    [Test]
    public async Task NotDependOnForbiddenFrameworksFromDomainNamespace()
    {
        var result = Types.InAssembly(typeof(WorkerHeartbeatService).Assembly)
            .That().ResideInNamespaceMatching(@"SupermarketPlanner\.Worker\.Domain($|\..*)")
            .ShouldNot().HaveDependencyOnAny(ForbiddenFrameworks)
            .GetResult();

        await Assert.That(result.IsSuccessful).IsTrue()
            .Because("Domain/ must stay free of EF Core, ASP.NET Core, Playwright, and Npgsql dependencies");
    }

    [Test]
    public async Task NotDependOnForbiddenFrameworksFromApplicationNamespace()
    {
        var result = Types.InAssembly(typeof(WorkerHeartbeatService).Assembly)
            .That().ResideInNamespaceMatching(@"SupermarketPlanner\.Worker\.Application($|\..*)")
            .ShouldNot().HaveDependencyOnAny(ForbiddenFrameworks)
            .GetResult();

        await Assert.That(result.IsSuccessful).IsTrue()
            .Because("Application/ must stay free of EF Core, ASP.NET Core, Playwright, and Npgsql dependencies");
    }
}
