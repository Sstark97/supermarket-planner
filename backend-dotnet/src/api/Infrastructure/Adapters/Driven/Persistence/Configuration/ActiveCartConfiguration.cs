using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace SupermarketPlanner.Api.Infrastructure.Adapters.Driven.Persistence.Configuration;

internal sealed class ActiveCartConfiguration : IEntityTypeConfiguration<ActiveCartEntity>
{
    public void Configure(EntityTypeBuilder<ActiveCartEntity> builder)
    {
        builder.ToTable("ActiveCart");

        builder.HasKey(cart => cart.Id);

        builder.Property(cart => cart.Id)
            .HasColumnName("id")
            .HasColumnType("text")
            .ValueGeneratedOnAdd()
            .HasDefaultValueSql("gen_random_uuid()");

        builder.Property(cart => cart.UserId)
            .HasColumnName("userId")
            .HasColumnType("text")
            .IsRequired();

        builder.Property(cart => cart.UpdatedAt)
            .HasColumnName("updatedAt")
            .HasColumnType("timestamp(3)");

        builder.HasIndex(cart => cart.UserId)
            .IsUnique();
    }
}
