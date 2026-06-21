namespace SupermarketPlanner.Api.Application.Ports.Driven;

public interface IBackgroundRefreshQueue
{
    bool Enqueue(string query, string postalCode);
}
