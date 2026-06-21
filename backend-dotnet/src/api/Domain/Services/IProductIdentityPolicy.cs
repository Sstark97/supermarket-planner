namespace SupermarketPlanner.Api.Domain.Services;

public interface IProductIdentityPolicy
{
    string BuildSku(string name, string supermarket, string unit);
}
