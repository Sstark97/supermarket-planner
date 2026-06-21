using Microsoft.Extensions.Logging;
using SharpMonads.Core;
using SupermarketPlanner.Api.Application.Ports.Driven;
using SupermarketPlanner.Api.Application.Ports.Driving;
using SupermarketPlanner.Api.Domain;

namespace SupermarketPlanner.Api.Application.UseCases.ShoppingSession;

public sealed class GetShoppingSessionMetricsUseCase(
    IShoppingSessionRepository shoppingSessionRepository,
    ILogger<GetShoppingSessionMetricsUseCase> logger) : IGetShoppingSessionMetricsUseCase
{
    public Task<Either<DomainError, GetShoppingSessionMetricsResult>> Invoke(
        GetShoppingSessionMetricsInput input,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(input.UserId))
            return Task.FromResult(Either<DomainError, GetShoppingSessionMetricsResult>.FromLeft(
                DomainError.Validation(nameof(input.UserId), "User id is required to load shopping session metrics.")));

        logger.LogInformation(
            "[GetShoppingSessionMetricsUseCase] Invoke - userId: \"{UserId}\"",
            input.UserId);

        return shoppingSessionRepository.MetricsForUser(input.UserId, cancellationToken)
            .MapAsync(snapshot => new GetShoppingSessionMetricsResult(
                SupermarketDominance: snapshot.SupermarketDominance,
                SpendingTrends: snapshot.SpendingTrends,
                TicketMetrics: snapshot.TicketMetrics));
    }
}
