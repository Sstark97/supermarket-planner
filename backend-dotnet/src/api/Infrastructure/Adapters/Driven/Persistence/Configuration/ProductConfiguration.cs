using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace SupermarketPlanner.Api.Infrastructure.Adapters.Driven.Persistence.Configuration;

internal sealed class ProductConfiguration : IEntityTypeConfiguration<ProductEntity>
{
    public void Configure(EntityTypeBuilder<ProductEntity> builder)
    {
        builder.ToTable("Product");

        builder.HasKey(product => product.Id);

        builder.Property(product => product.Id)
            .HasColumnName("id")
            .HasColumnType("text")
            .ValueGeneratedOnAdd()
            .HasDefaultValueSql("gen_random_uuid()");

        builder.Property(product => product.Name)
            .HasColumnName("name")
            .HasColumnType("text")
            .IsRequired();

        builder.Property(product => product.Supermarket)
            .HasColumnName("supermarket")
            .HasColumnType("text")
            .IsRequired();

        builder.Property(product => product.Category)
            .HasColumnName("category")
            .HasColumnType("text")
            .IsRequired();

        builder.Property(product => product.Sku)
            .HasColumnName("sku")
            .HasColumnType("text")
            .IsRequired();

        builder.Property(product => product.Unit)
            .HasColumnName("unit")
            .HasColumnType("text")
            .IsRequired();

        builder.Property(product => product.Image)
            .HasColumnName("image")
            .HasColumnType("text");

        builder.Property(product => product.Url)
            .HasColumnName("url")
            .HasColumnType("text");

        builder.Property(product => product.TaxType)
            .HasColumnName("taxType")
            .HasColumnType("text")
            .IsRequired();

        builder.HasIndex(product => new { product.Supermarket, product.Sku })
            .IsUnique();

        builder.HasIndex(product => product.Name);
        builder.HasIndex(product => product.Category);
        builder.HasIndex(product => product.Supermarket);
    }
}
