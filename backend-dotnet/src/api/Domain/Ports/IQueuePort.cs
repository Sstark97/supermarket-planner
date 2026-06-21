using SharpMonads.Core;

namespace SupermarketPlanner.Api.Domain.Ports;

public interface IQueuePort
{
    Task<Either<DomainError, ZoneOnboardingQueueItem>> PublishZoneOnboardingRequest(
        string postalCode,
        string? requestedByUserId,
        DateTimeOffset? requestedAt,
        CancellationToken cancellationToken);

    Task<Either<DomainError, IReadOnlyList<ZoneOnboardingQueueItem>>> FetchPendingItems(
        int limit,
        CancellationToken cancellationToken);

    Task<Either<DomainError, bool>> IsPricingZoneEmpty(
        string postalCode,
        CancellationToken cancellationToken);

    Task<Either<DomainError, Unit>> MarkItemAsProcessing(
        string queueItemId,
        CancellationToken cancellationToken);

    Task<Either<DomainError, Unit>> MarkItemAsProcessed(
        string queueItemId,
        CancellationToken cancellationToken);

    Task<Either<DomainError, Unit>> MarkItemAsFailed(
        string queueItemId,
        string errorMessage,
        CancellationToken cancellationToken);
}
