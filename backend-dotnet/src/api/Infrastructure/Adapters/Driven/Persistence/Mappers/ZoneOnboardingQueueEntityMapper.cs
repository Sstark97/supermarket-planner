using System.Diagnostics;
using SupermarketPlanner.Api.Domain.Ports;
using DomainState = SupermarketPlanner.Api.Domain.Ports.ZoneOnboardingQueueState;
using InfraState = SupermarketPlanner.Api.Infrastructure.Adapters.Driven.Persistence.ZoneOnboardingQueueState;

namespace SupermarketPlanner.Api.Infrastructure.Adapters.Driven.Persistence.Mappers;

public static class ZoneOnboardingQueueEntityMapper
{
    public static ZoneOnboardingQueueItem ToDomain(ZoneOnboardingQueueEntity entity) =>
        new(
            Id: entity.Id,
            PostalCode: entity.PostalCode,
            RequestedDay: new DateTimeOffset(entity.RequestedDay, TimeSpan.Zero),
            State: MapToDomainState(entity.State),
            Attempts: entity.Attempts,
            RequestedByUserId: entity.RequestedByUserId,
            ErrorMessage: entity.ErrorMessage,
            ProcessedAt: entity.ProcessedAt.HasValue
                ? new DateTimeOffset(entity.ProcessedAt.Value, TimeSpan.Zero)
                : null,
            CreatedAt: new DateTimeOffset(entity.CreatedAt, TimeSpan.Zero),
            UpdatedAt: new DateTimeOffset(entity.UpdatedAt, TimeSpan.Zero));

    public static DomainState MapToDomainState(InfraState infraState) =>
        infraState switch
        {
            InfraState.PENDING => DomainState.Pending,
            InfraState.PROCESSING => DomainState.Processing,
            InfraState.COMPLETED => DomainState.Completed,
            InfraState.FAILED => DomainState.Failed,
            _ => throw new UnreachableException($"Unknown infra state: {infraState}")
        };

    public static InfraState MapToInfraState(DomainState domainState) =>
        domainState switch
        {
            DomainState.Pending => InfraState.PENDING,
            DomainState.Processing => InfraState.PROCESSING,
            DomainState.Completed => InfraState.COMPLETED,
            DomainState.Failed => InfraState.FAILED,
            _ => throw new UnreachableException($"Unknown domain state: {domainState}")
        };
}
