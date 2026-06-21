using Microsoft.Extensions.Logging;
using NSubstitute;
using SharpMonads.Core;
using SupermarketPlanner.Api.Application.Ports.Driven;
using SupermarketPlanner.Api.Application.UseCases.ShoppingSession;
using SupermarketPlanner.Api.Domain;

namespace SupermarketPlanner.Api.Tests.Application.UseCases.ShoppingSession;

[Property("Category", "Unit")]
public sealed class DeleteShoppingSessionUseCaseShould
{
    private readonly IShoppingSessionRepository repository;
    private readonly DeleteShoppingSessionUseCase useCase;

    public DeleteShoppingSessionUseCaseShould()
    {
        repository = Substitute.For<IShoppingSessionRepository>();
        repository.DeleteByIdForUser(Arg.Any<string>(), Arg.Any<string>(), Arg.Any<CancellationToken>())
            .Returns(Either<DomainError, bool>.FromRight(true));

        useCase = new DeleteShoppingSessionUseCase(
            repository,
            Substitute.For<ILogger<DeleteShoppingSessionUseCase>>());
    }

    [Test]
    public async Task DeleteSessionWhenOwnershipMatches()
    {
        var result = await useCase.Invoke(new DeleteShoppingSessionInput("session-1", "user-1"), CancellationToken.None);

        await repository.Received(1).DeleteByIdForUser("session-1", "user-1", Arg.Any<CancellationToken>());
        await Assert.That(result.Right.Deleted).IsTrue();
    }

    [Test]
    public async Task ProduceNotDeletedWhenNoOwnedRowExists()
    {
        repository.DeleteByIdForUser(Arg.Any<string>(), Arg.Any<string>(), Arg.Any<CancellationToken>())
            .Returns(Either<DomainError, bool>.FromRight(false));

        var result = await useCase.Invoke(new DeleteShoppingSessionInput("session-1", "user-1"), CancellationToken.None);

        await Assert.That(result.Right.Deleted).IsFalse();
    }

    [Test]
    public async Task RejectEmptySessionIdWithDomainError()
    {
        var result = await useCase.Invoke(new DeleteShoppingSessionInput("  ", "user-1"), CancellationToken.None);

        await Assert.That(result.IsLeft).IsTrue();
        await Assert.That(result.Left.Code).IsEqualTo("VALIDATION");
        await Assert.That(result.Left.Message).Contains("sessionId");
    }

    [Test]
    public async Task RejectEmptyUserIdWithDomainError()
    {
        var result = await useCase.Invoke(new DeleteShoppingSessionInput("session-1", string.Empty), CancellationToken.None);

        await Assert.That(result.IsLeft).IsTrue();
        await Assert.That(result.Left.Code).IsEqualTo("VALIDATION");
        await Assert.That(result.Left.Message).Contains("userId");
    }
}
