using Microsoft.EntityFrameworkCore;
using SupermarketPlanner.Api.Infrastructure.Adapters.Driven.Persistence.Configuration;

namespace SupermarketPlanner.Api.Infrastructure.Adapters.Driven.Persistence;

public sealed class SupermarketPlannerDbContext(DbContextOptions<SupermarketPlannerDbContext> options)
    : DbContext(options)
{
    public DbSet<ProductEntity> Products => Set<ProductEntity>();
    public DbSet<PricingZoneEntity> PricingZones => Set<PricingZoneEntity>();
    public DbSet<PostalCodeEntity> PostalCodes => Set<PostalCodeEntity>();
    public DbSet<ProductPriceEntity> ProductPrices => Set<ProductPriceEntity>();
    public DbSet<ZoneOnboardingQueueEntity> ZoneOnboardingQueue => Set<ZoneOnboardingQueueEntity>();
    public DbSet<ShoppingSessionEntity> ShoppingSessions => Set<ShoppingSessionEntity>();
    public DbSet<ShoppingSessionItemEntity> ShoppingSessionItems => Set<ShoppingSessionItemEntity>();
    public DbSet<ActiveCartEntity> ActiveCarts => Set<ActiveCartEntity>();
    public DbSet<ActiveCartItemEntity> ActiveCartItems => Set<ActiveCartItemEntity>();
    public DbSet<ProductCategoryCacheEntity> ProductCategoryCache => Set<ProductCategoryCacheEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfiguration(new ProductConfiguration());
        modelBuilder.ApplyConfiguration(new PricingZoneConfiguration());
        modelBuilder.ApplyConfiguration(new PostalCodeConfiguration());
        modelBuilder.ApplyConfiguration(new ProductPriceConfiguration());
        modelBuilder.ApplyConfiguration(new ZoneOnboardingQueueConfiguration());
        modelBuilder.ApplyConfiguration(new ShoppingSessionConfiguration());
        modelBuilder.ApplyConfiguration(new ShoppingSessionItemConfiguration());
        modelBuilder.ApplyConfiguration(new ActiveCartConfiguration());
        modelBuilder.ApplyConfiguration(new ActiveCartItemConfiguration());
        modelBuilder.ApplyConfiguration(new ProductCategoryCacheConfiguration());
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        StampUpdatedAt();
        return base.SaveChangesAsync(cancellationToken);
    }

    public override int SaveChanges()
    {
        StampUpdatedAt();
        return base.SaveChanges();
    }

    private void StampUpdatedAt()
    {
        var now = DateTime.UtcNow;

        foreach (var entry in ChangeTracker.Entries<ZoneOnboardingQueueEntity>())
        {
            if (entry.State is EntityState.Added or EntityState.Modified)
                entry.Entity.UpdatedAt = now;
        }

        foreach (var entry in ChangeTracker.Entries<ActiveCartEntity>())
        {
            if (entry.State is EntityState.Added or EntityState.Modified)
                entry.Entity.UpdatedAt = now;
        }
    }
}
