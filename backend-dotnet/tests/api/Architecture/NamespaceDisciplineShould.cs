using NetArchTest.Rules;

namespace SupermarketPlanner.Api.Tests.Architecture;

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
        var result = Types.InAssembly(typeof(Program).Assembly)
            .That().ResideInNamespaceMatching(@"SupermarketPlanner\.Api\.Domain($|\..*)")
            .ShouldNot().HaveDependencyOnAny(ForbiddenFrameworks)
            .GetResult();

        await Assert.That(result.IsSuccessful).IsTrue()
            .Because("Domain/ must stay free of EF Core, ASP.NET Core, Playwright, and Npgsql dependencies");
    }

    [Test]
    public async Task NotDependOnForbiddenFrameworksFromApplicationNamespace()
    {
        var result = Types.InAssembly(typeof(Program).Assembly)
            .That().ResideInNamespaceMatching(@"SupermarketPlanner\.Api\.Application($|\..*)")
            .ShouldNot().HaveDependencyOnAny(ForbiddenFrameworks)
            .GetResult();

        await Assert.That(result.IsSuccessful).IsTrue()
            .Because("Application/ must stay free of EF Core, ASP.NET Core, Playwright, and Npgsql dependencies");
    }
}
