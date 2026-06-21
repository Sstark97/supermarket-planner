namespace SupermarketPlanner.Api.Domain;

public sealed record DomainError(string Code, string Message)
{
    public static DomainError Validation(string field, string reason) =>
        new("VALIDATION", $"{field}: {reason}");

    public static DomainError NotFound(string entity, string identifier) =>
        new("NOT_FOUND", $"{entity} with identifier '{identifier}' was not found");

    public static DomainError InvalidOperation(string reason) =>
        new("INVALID_OPERATION", reason);
}
