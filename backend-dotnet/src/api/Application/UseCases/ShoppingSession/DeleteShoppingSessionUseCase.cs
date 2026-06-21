using Microsoft.Extensions.Logging;
using SharpMonads.Core;
using SupermarketPlanner.Api.Application.Ports.Driven;
using SupermarketPlanner.Api.Application.Ports.Driving;
using SupermarketPlanner.Api.Domain;

namespace SupermarketPlanner.Api.Application.UseCases.ShoppingSession;

public sealed class DeleteShoppingSessionUseCase(
    IShoppingSessionRepository shoppingSessionRepository,
    ILogger<DeleteShoppingSessionUseCase> logger) : IDeleteShoppingSessionUseCase
{
    public Task<Either<DomainError, DeleteShoppingSessionResult>> Invoke(
        DeleteShoppingSessionInput input,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(input.SessionId))
            return Task.FromResult(Either<DomainError, DeleteShoppingSessionResult>.FromLeft(
                DomainError.Validation(nameof(input.SessionId), "sessionId is required.")));

        if (string.IsNullOrWhiteSpace(input.UserId))
            return Task.FromResult(Either<DomainError, DeleteShoppingSessionResult>.FromLeft(
                DomainError.Validation(nameof(input.UserId), "userId is required.")));

        logger.LogInformation(
            "[DeleteShoppingSessionUseCase] Invoke - userId: \"{UserId}\", sessionId: \"{SessionId}\"",
            input.UserId, input.SessionId);

        return shoppingSessionRepository.DeleteByIdForUser(input.SessionId, input.UserId, cancellationToken)
            .MapAsync(deleted => new DeleteShoppingSessionResult(Deleted: deleted));
    }
}
