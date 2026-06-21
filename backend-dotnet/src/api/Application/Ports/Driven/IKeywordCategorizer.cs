using SupermarketPlanner.Api.Domain.Models;

namespace SupermarketPlanner.Api.Application.Ports.Driven;

public interface IKeywordCategorizer
{
    ProductCategory? Match(string productName);
}
