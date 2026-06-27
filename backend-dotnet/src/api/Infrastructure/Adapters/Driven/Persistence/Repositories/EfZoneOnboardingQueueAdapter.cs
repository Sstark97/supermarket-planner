using Microsoft.EntityFrameworkCore;
using Npgsql;
using SharpMonads.Core;
using SupermarketPlanner.Api.Domain;
using SupermarketPlanner.Api.Domain.Ports;
using SupermarketPlanner.Api.Infrastructure.Adapters.Driven.Persistence.Mappers;

namespace SupermarketPlanner.Api.Infrastructure.Adapters.Driven.Persistence.Repositories;

public sealed class EfZoneOnboardingQueueAdapter(SupermarketPlannerDbContext dbContext) : IQueuePort
{
    public async Task<Either<DomainError, ZoneOnboardingQueueItem>> PublishZoneOnboardingRequest(
        string postalCode,
        string? requestedByUserId,
        DateTimeOffset? requestedAt,
        CancellationToken cancellationToken)
    {
        try
        {
            var requestedDay = DateTime.SpecifyKind((requestedAt ?? DateTimeOffset.UtcNow).UtcDateTime.Date, DateTimeKind.Unspecified);

            var entry = new ZoneOnboardingQueueEntity
            {
                Id = Guid.NewGuid().ToString(),
                PostalCode = postalCode,
                RequestedDay = requestedDay,
                State = ZoneOnboardingQueueState.PENDING,
                Attempts = 0,
                RequestedByUserId = requestedByUserId,
                CreatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Unspecified)
            };

            dbContext.ZoneOnboardingQueue.Add(entry);
            try
            {
                await dbContext.SaveChangesAsync(cancellationToken);
            }
            catch (DbUpdateException ex) when (ex.GetBaseException() is PostgresException { SqlState: "23505" })
            {
                dbContext.Entry(entry).State = EntityState.Detached;
            }

            var entity = await dbContext.ZoneOnboardingQueue
                .AsNoTracking()
                .FirstAsync(queue => queue.PostalCode == postalCode && queue.RequestedDay == requestedDay, cancellationToken);

            return Either<DomainError, ZoneOnboardingQueueItem>.FromRight(
                ZoneOnboardingQueueEntityMapper.ToDomain(entity));
        }
        catch (Exception exception)
        {
            return Either<DomainError, ZoneOnboardingQueueItem>.FromLeft(
                DomainError.InvalidOperation($"Failed to publish zone onboarding request: {exception.Message}"));
        }
    }

    public async Task<Either<DomainError, IReadOnlyList<ZoneOnboardingQueueItem>>> FetchPendingItems(
        int limit,
        CancellationToken cancellationToken)
    {
        try
        {
            var entities = await dbContext.ZoneOnboardingQueue
                .AsNoTracking()
                .Where(queue => queue.State == ZoneOnboardingQueueState.PENDING)
                .OrderBy(queue => queue.CreatedAt)
                .Take(limit)
                .ToListAsync(cancellationToken);

            IReadOnlyList<ZoneOnboardingQueueItem> items = entities
                .Select(ZoneOnboardingQueueEntityMapper.ToDomain)
                .ToList();

            return Either<DomainError, IReadOnlyList<ZoneOnboardingQueueItem>>.FromRight(items);
        }
        catch (Exception exception)
        {
            return Either<DomainError, IReadOnlyList<ZoneOnboardingQueueItem>>.FromLeft(
                DomainError.InvalidOperation($"Failed to fetch pending items: {exception.Message}"));
        }
    }

    public async Task<Either<DomainError, bool>> IsPricingZoneEmpty(
        string postalCode,
        CancellationToken cancellationToken)
    {
        try
        {
            var zoneId = await dbContext.PostalCodes
                .AsNoTracking()
                .Where(code => code.Code == postalCode)
                .Select(code => code.ZoneId)
                .FirstOrDefaultAsync(cancellationToken);

            if (zoneId is null)
                return Either<DomainError, bool>.FromRight(true);

            var priceCount = await dbContext.ProductPrices
                .CountAsync(price => price.ZoneId == zoneId, cancellationToken);

            return Either<DomainError, bool>.FromRight(priceCount == 0);
        }
        catch (Exception exception)
        {
            return Either<DomainError, bool>.FromLeft(
                DomainError.InvalidOperation($"Failed to check pricing zone emptiness: {exception.Message}"));
        }
    }

    public async Task<Either<DomainError, Unit>> MarkItemAsProcessing(
        string queueItemId,
        CancellationToken cancellationToken)
    {
        try
        {
            var entity = await dbContext.ZoneOnboardingQueue
                .FirstOrDefaultAsync(queue => queue.Id == queueItemId, cancellationToken);

            if (entity is null)
                return Either<DomainError, Unit>.FromLeft(
                    DomainError.NotFound("ZoneOnboardingQueueItem", queueItemId));

            entity.State = ZoneOnboardingQueueState.PROCESSING;
            entity.Attempts += 1;
            await dbContext.SaveChangesAsync(cancellationToken);

            return Either<DomainError, Unit>.FromRight(Unit.Value);
        }
        catch (Exception exception)
        {
            return Either<DomainError, Unit>.FromLeft(
                DomainError.InvalidOperation($"Failed to mark item as processing: {exception.Message}"));
        }
    }

    public async Task<Either<DomainError, Unit>> MarkItemAsProcessed(
        string queueItemId,
        CancellationToken cancellationToken)
    {
        try
        {
            var entity = await dbContext.ZoneOnboardingQueue
                .FirstOrDefaultAsync(queue => queue.Id == queueItemId, cancellationToken);

            if (entity is null)
                return Either<DomainError, Unit>.FromLeft(
                    DomainError.NotFound("ZoneOnboardingQueueItem", queueItemId));

            entity.State = ZoneOnboardingQueueState.COMPLETED;
            entity.ProcessedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Unspecified);
            await dbContext.SaveChangesAsync(cancellationToken);

            return Either<DomainError, Unit>.FromRight(Unit.Value);
        }
        catch (Exception exception)
        {
            return Either<DomainError, Unit>.FromLeft(
                DomainError.InvalidOperation($"Failed to mark item as processed: {exception.Message}"));
        }
    }

    public async Task<Either<DomainError, Unit>> MarkItemAsFailed(
        string queueItemId,
        string errorMessage,
        CancellationToken cancellationToken)
    {
        try
        {
            var entity = await dbContext.ZoneOnboardingQueue
                .FirstOrDefaultAsync(queue => queue.Id == queueItemId, cancellationToken);

            if (entity is null)
                return Either<DomainError, Unit>.FromLeft(
                    DomainError.NotFound("ZoneOnboardingQueueItem", queueItemId));

            entity.State = ZoneOnboardingQueueState.FAILED;
            entity.ErrorMessage = errorMessage;
            await dbContext.SaveChangesAsync(cancellationToken);

            return Either<DomainError, Unit>.FromRight(Unit.Value);
        }
        catch (Exception exception)
        {
            return Either<DomainError, Unit>.FromLeft(
                DomainError.InvalidOperation($"Failed to mark item as failed: {exception.Message}"));
        }
    }
}
