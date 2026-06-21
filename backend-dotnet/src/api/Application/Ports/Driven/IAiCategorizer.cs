using SupermarketPlanner.Api.Domain.Models;

namespace SupermarketPlanner.Api.Application.Ports.Driven;

public interface IAiCategorizer
{
    Task<ProductCategory?> Categorize(string productName, CancellationToken cancellationToken);
}
