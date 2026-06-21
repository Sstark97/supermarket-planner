using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace SupermarketPlanner.Api.Infrastructure.Adapters.Driven.Persistence.Configuration;

internal sealed class ActiveCartItemConfiguration : IEntityTypeConfiguration<ActiveCartItemEntity>
{
    public void Configure(EntityTypeBuilder<ActiveCartItemEntity> builder)
    {
        builder.ToTable("ActiveCartItem");

        builder.HasKey(item => item.Id);

        builder.Property(item => item.Id)
            .HasColumnName("id")
            .HasColumnType("text")
            .ValueGeneratedOnAdd()
            .HasDefaultValueSql("gen_random_uuid()");

        builder.Property(item => item.CartId)
            .HasColumnName("cartId")
            .HasColumnType("text")
            .IsRequired();

        builder.Property(item => item.ProductId)
            .HasColumnName("productId")
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

        builder.HasOne(item => item.Cart)
            .WithMany(cart => cart.Items)
            .HasForeignKey(item => item.CartId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(item => new { item.CartId, item.Supermarket, item.ProductName })
            .IsUnique();

        builder.HasIndex(item => item.CartId);
    }
}
