using SupermarketPlanner.Api.Domain.Entities;
using SupermarketPlanner.Api.Infrastructure.Adapters.Driven.Persistence.Repositories;
using SupermarketPlanner.Api.Tests.Builders;

namespace SupermarketPlanner.Api.Tests.Infrastructure.Persistence.Repositories;

[Property("Category", "Integration")]
[ClassDataSource<PostgresContainerFixture>(Shared = SharedType.PerClass)]
public sealed class EfActiveCartRepositoryShould(PostgresContainerFixture fixture)
{
    [Test]
    public async Task FindNothingForUnknownUser()
    {
        await using var dbContext = await fixture.CreateFreshDbContext();
        var repository = new EfActiveCartRepository(dbContext);

        var result = await repository.FindByUserId("ghost-user", CancellationToken.None);

        await Assert.That(result.IsNone).IsTrue();
    }

    [Test]
    public async Task UpsertNewCartForUser()
    {
        await using var dbContext = await fixture.CreateFreshDbContext();
        var repository = new EfActiveCartRepository(dbContext);
        var newCart = new ActiveCartBuilder().ForUser("user-new").WithItems([]).Build();

        var result = await repository.Upsert(newCart, CancellationToken.None);

        await Assert.That(result.IsRight).IsTrue();
        await Assert.That(result.Right.UserId).IsEqualTo("user-new");
    }

    [Test]
    public async Task ReplaceCartItemsOnSubsequentUpsert()
    {
        await using var dbContext = await fixture.CreateFreshDbContext();
        var repository = new EfActiveCartRepository(dbContext);

        var initialCart = new ActiveCartBuilder()
            .ForUser("user-replace")
            .WithItems([new ActiveCartItemBuilder().Named("Leche Entera").WithQuantity(3).Build()])
            .Build();
        await repository.Upsert(initialCart, CancellationToken.None);

        var updatedCart = new ActiveCartBuilder()
            .ForUser("user-replace")
            .WithItems([
                new ActiveCartItemBuilder().Named("Pan Integral").WithQuantity(1).Build(),
                new ActiveCartItemBuilder().Named("Yogur Natural").WithQuantity(2).Build()
            ])
            .Build();
        var result = await repository.Upsert(updatedCart, CancellationToken.None);

        await Assert.That(result.IsRight).IsTrue();
        await Assert.That(result.Right.Items.Count).IsEqualTo(2);
        await Assert.That(result.Right.Items.Any(item => item.ProductName == "Pan Integral")).IsTrue();
        await Assert.That(result.Right.Items.Any(item => item.ProductName == "Yogur Natural")).IsTrue();
    }

    [Test]
    public async Task FindCartWithAllItems()
    {
        await using var dbContext = await fixture.CreateFreshDbContext();
        var repository = new EfActiveCartRepository(dbContext);

        var cartWithItems = new ActiveCartBuilder()
            .ForUser("user-items")
            .WithItems([
                new ActiveCartItemBuilder().Named("Leche Entera").WithQuantity(2).Build(),
                new ActiveCartItemBuilder().Named("Pan Integral").WithQuantity(1).Build()
            ])
            .Build();
        await repository.Upsert(cartWithItems, CancellationToken.None);

        var found = await repository.FindByUserId("user-items", CancellationToken.None);

        await Assert.That(found.IsSome).IsTrue();
        var foundCart = found.Match(onSome: cart => cart, onNone: () => null!);
        await Assert.That(foundCart.Items.Count).IsEqualTo(2);
    }
}
