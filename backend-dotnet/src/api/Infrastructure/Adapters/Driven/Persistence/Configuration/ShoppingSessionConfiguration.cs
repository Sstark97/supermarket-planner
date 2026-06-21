using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace SupermarketPlanner.Api.Infrastructure.Adapters.Driven.Persistence.Configuration;

internal sealed class ShoppingSessionConfiguration : IEntityTypeConfiguration<ShoppingSessionEntity>
{
    public void Configure(EntityTypeBuilder<ShoppingSessionEntity> builder)
    {
        builder.ToTable("ShoppingSession");

        builder.HasKey(session => session.Id);

        builder.Property(session => session.Id)
            .HasColumnName("id")
            .HasColumnType("text")
            .ValueGeneratedOnAdd()
            .HasDefaultValueSql("gen_random_uuid()");

        builder.Property(session => session.UserId)
            .HasColumnName("userId")
            .HasColumnType("text")
            .IsRequired();

        builder.Property(session => session.ShoppedAt)
            .HasColumnName("shoppedAt")
            .HasColumnType("timestamp(3)")
            .IsRequired();

        builder.Property(session => session.TotalPrice)
            .HasColumnName("totalPrice")
            .HasColumnType("double precision")
            .IsRequired();

        builder.Property(session => session.CreatedAt)
            .HasColumnName("createdAt")
            .HasColumnType("timestamp(3)")
            .HasDefaultValueSql("now()");

        builder.HasIndex(session => session.UserId);
        builder.HasIndex(session => session.ShoppedAt);
    }
}
