using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace SupermarketPlanner.Api.Infrastructure.Adapters.Driven.Persistence.Configuration;

internal sealed class ShoppingSessionItemConfiguration : IEntityTypeConfiguration<ShoppingSessionItemEntity>
{
    public void Configure(EntityTypeBuilder<ShoppingSessionItemEntity> builder)
    {
        builder.ToTable("ShoppingSessionItem");

        builder.HasKey(item => item.Id);

        builder.Property(item => item.Id)
            .HasColumnName("id")
            .HasColumnType("text")
            .ValueGeneratedOnAdd()
            .HasDefaultValueSql("gen_random_uuid()");

        builder.Property(item => item.SessionId)
            .HasColumnName("sessionId")
            .HasColumnType("text")
            .IsRequired();

        builder.Property(item => item.ProductName)
            .HasColumnName("productName")
            .HasColumnType("text")
            .IsRequired();

        builder.Property(item => item.Supermarket)
            .HasColumnName("supermarket")
            .HasColumnType("text")
            .IsRequired();

        builder.Property(item => item.Category)
            .HasColumnName("category")
            .HasColumnType("text")
            .IsRequired();

        builder.Property(item => item.Price)
            .HasColumnName("price")
            .HasColumnType("double precision")
            .IsRequired();

        builder.Property(item => item.PricePerUnit)
            .HasColumnName("pricePerUnit")
            .HasColumnType("double precision")
            .IsRequired();

        builder.Property(item => item.Unit)
            .HasColumnName("unit")
            .HasColumnType("text")
            .IsRequired();

        builder.Property(item => item.TaxType)
            .HasColumnName("taxType")
            .HasColumnType("text")
            .IsRequired();

        builder.Property(item => item.Quantity)
            .HasColumnName("quantity")
            .IsRequired();

        builder.Property(item => item.Image)
            .HasColumnName("image")
            .HasColumnType("text");

        builder.Property(item => item.Url)
            .HasColumnName("url")
            .HasColumnType("text");

        builder.HasOne(item => item.Session)
            .WithMany(session => session.Items)
            .HasForeignKey(item => item.SessionId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(item => item.SessionId);
    }
}
