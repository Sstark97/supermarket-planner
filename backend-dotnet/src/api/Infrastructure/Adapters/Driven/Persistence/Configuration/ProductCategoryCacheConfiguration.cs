using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace SupermarketPlanner.Api.Infrastructure.Adapters.Driven.Persistence.Configuration;

internal sealed class ProductCategoryCacheConfiguration : IEntityTypeConfiguration<ProductCategoryCacheEntity>
{
    public void Configure(EntityTypeBuilder<ProductCategoryCacheEntity> builder)
    {
        builder.ToTable("ProductCategoryCache");

        builder.HasKey(cache => cache.Id);

        builder.Property(cache => cache.Id)
            .HasColumnName("id")
            .HasColumnType("text")
            .ValueGeneratedOnAdd()
            .HasDefaultValueSql("gen_random_uuid()");

        builder.Property(cache => cache.NormalizedName)
            .HasColumnName("normalizedName")
            .HasColumnType("text")
            .IsRequired();

        builder.Property(cache => cache.Category)
            .HasColumnName("category")
            .HasColumnType("text")
            .IsRequired();

        builder.Property(cache => cache.CreatedAt)
            .HasColumnName("createdAt")
            .HasColumnType("timestamp(3)")
            .HasDefaultValueSql("now()");

        builder.HasIndex(cache => cache.NormalizedName)
            .IsUnique();
    }
}
