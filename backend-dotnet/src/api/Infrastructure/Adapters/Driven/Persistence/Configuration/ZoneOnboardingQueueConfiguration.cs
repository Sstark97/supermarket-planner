using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace SupermarketPlanner.Api.Infrastructure.Adapters.Driven.Persistence.Configuration;

internal sealed class ZoneOnboardingQueueConfiguration : IEntityTypeConfiguration<ZoneOnboardingQueueEntity>
{
    public void Configure(EntityTypeBuilder<ZoneOnboardingQueueEntity> builder)
    {
        builder.ToTable("ZoneOnboardingQueue");

        builder.HasKey(queue => queue.Id);

        builder.Property(queue => queue.Id)
            .HasColumnName("id")
            .HasColumnType("text")
            .ValueGeneratedOnAdd()
            .HasDefaultValueSql("gen_random_uuid()");

        builder.Property(queue => queue.PostalCode)
            .HasColumnName("postalCode")
            .HasColumnType("text")
            .IsRequired();

        builder.Property(queue => queue.RequestedDay)
            .HasColumnName("requestedDay")
            .HasColumnType("timestamp(3)")
            .IsRequired();

        builder.Property(queue => queue.State)
            .HasColumnName("state")
            .HasColumnType("text")
            .HasConversion(new EnumToStringConverter<ZoneOnboardingQueueState>())
            .HasDefaultValue(ZoneOnboardingQueueState.PENDING);

        builder.Property(queue => queue.Attempts)
            .HasColumnName("attempts")
            .HasDefaultValue(0);

        builder.Property(queue => queue.RequestedByUserId)
            .HasColumnName("requestedByUserId")
            .HasColumnType("text");

        builder.Property(queue => queue.ErrorMessage)
            .HasColumnName("errorMessage")
            .HasColumnType("text");

        builder.Property(queue => queue.ProcessedAt)
            .HasColumnName("processedAt")
            .HasColumnType("timestamp(3)");

        builder.Property(queue => queue.CreatedAt)
            .HasColumnName("createdAt")
            .HasColumnType("timestamp(3)")
            .HasDefaultValueSql("now()");

        builder.Property(queue => queue.UpdatedAt)
            .HasColumnName("updatedAt")
            .HasColumnType("timestamp(3)");

        builder.HasIndex(queue => new { queue.PostalCode, queue.RequestedDay })
            .IsUnique();

        builder.HasIndex(queue => new { queue.State, queue.RequestedDay });
        builder.HasIndex(queue => queue.PostalCode);
    }
}
