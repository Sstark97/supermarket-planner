using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace SupermarketPlanner.Api.Infrastructure.Adapters.Driven.Persistence.Configuration;

internal sealed class PostalCodeConfiguration : IEntityTypeConfiguration<PostalCodeEntity>
{
    public void Configure(EntityTypeBuilder<PostalCodeEntity> builder)
    {
        builder.ToTable("PostalCode");

        builder.HasKey(postalCode => postalCode.Code);

        builder.Property(postalCode => postalCode.Code)
            .HasColumnName("code")
            .HasColumnType("text")
            .ValueGeneratedNever();

        builder.Property(postalCode => postalCode.ZoneId)
            .HasColumnName("zoneId")
            .HasColumnType("text")
            .IsRequired();

        builder.HasOne(postalCode => postalCode.Zone)
            .WithMany(zone => zone.PostalCodes)
            .HasForeignKey(postalCode => postalCode.ZoneId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(postalCode => postalCode.ZoneId);
    }
}
