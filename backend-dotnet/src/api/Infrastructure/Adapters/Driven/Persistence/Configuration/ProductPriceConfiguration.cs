using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace SupermarketPlanner.Api.Infrastructure.Adapters.Driven.Persistence.Configuration;

internal sealed class ProductPriceConfiguration : IEntityTypeConfiguration<ProductPriceEntity>
{
    public void Configure(EntityTypeBuilder<ProductPriceEntity> builder)
    {
        builder.ToTable("ProductPrice");

        builder.HasKey(price => price.Id);

        builder.Property(price => price.Id)
            .HasColumnName("id")
            .HasColumnType("text")
            .ValueGeneratedOnAdd()
            .HasDefaultValueSql("gen_random_uuid()");

        builder.Property(price => price.ProductId)
            .HasColumnName("productId")
            .HasColumnType("text")
            .IsRequired();

        builder.Property(price => price.ZoneId)
            .HasColumnName("zoneId")
            .HasColumnType("text")
            .IsRequired();

        builder.Property(price => price.Price)
            .HasColumnName("price")
            .HasColumnType("double precision")
            .IsRequired();

        builder.Property(price => price.PricePerUnit)
            .HasColumnName("pricePerUnit")
            .HasColumnType("double precision")
            .IsRequired();

        builder.Property(price => price.ScrapedAt)
            .HasColumnName("scrapedAt")
            .HasColumnType("timestamp(3)")
            .HasDefaultValueSql("now()");

        builder.HasOne(price => price.Product)
            .WithMany(product => product.Prices)
            .HasForeignKey(price => price.ProductId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(price => price.Zone)
            .WithMany(zone => zone.Prices)
            .HasForeignKey(price => price.ZoneId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(price => new { price.ProductId, price.ZoneId })
            .IsUnique();

        builder.HasIndex(price => price.ZoneId);
        builder.HasIndex(price => price.ProductId);
    }
}
