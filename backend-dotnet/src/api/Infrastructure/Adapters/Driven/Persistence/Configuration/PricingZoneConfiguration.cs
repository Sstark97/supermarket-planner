using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace SupermarketPlanner.Api.Infrastructure.Adapters.Driven.Persistence.Configuration;

internal sealed class PricingZoneConfiguration : IEntityTypeConfiguration<PricingZoneEntity>
{
    public void Configure(EntityTypeBuilder<PricingZoneEntity> builder)
    {
        builder.ToTable("PricingZone");

        builder.HasKey(zone => zone.Id);

        builder.Property(zone => zone.Id)
            .HasColumnName("id")
            .HasColumnType("text")
            .ValueGeneratedNever();

        builder.Property(zone => zone.Name)
            .HasColumnName("name")
            .HasColumnType("text")
            .IsRequired();

        builder.HasIndex(zone => zone.Name);
    }
}
