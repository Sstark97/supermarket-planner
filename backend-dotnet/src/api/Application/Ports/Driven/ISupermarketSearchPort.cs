using SharpMonads.Core;
using SupermarketPlanner.Api.Application.DTOs;
using SupermarketPlanner.Api.Domain;

namespace SupermarketPlanner.Api.Application.Ports.Driven;

public sealed record CircuitBreakerStatus(
    string State,
    bool IsOpen,
    int FailureCount,
    int Threshold);

public interface ISupermarketSearchPort
{
    string Name { get; }
    bool IsCircuitOpen { get; }

    Task<Either<DomainError, IReadOnlyList<ProductDto>>> Search(
        string query,
        string postalCode,
        CancellationToken cancellationToken);

    CircuitBreakerStatus CircuitStatus();
}
