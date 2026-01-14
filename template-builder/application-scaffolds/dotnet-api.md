# .NET Core Web API Template

## Overview

Production-ready .NET 8 Web API with Entity Framework Core, JWT authentication, clean architecture, and comprehensive middleware. Features repository pattern, CQRS with MediatR, FluentValidation, and Swagger documentation.

## Quick Start

```bash
# Create new project
dotnet new webapi -n MyApi -f net8.0
cd MyApi

# Add required packages
dotnet add package Microsoft.EntityFrameworkCore.Design
dotnet add package Npgsql.EntityFrameworkCore.PostgreSQL
dotnet add package Microsoft.AspNetCore.Authentication.JwtBearer
dotnet add package MediatR
dotnet add package FluentValidation.AspNetCore
dotnet add package Swashbuckle.AspNetCore
dotnet add package Serilog.AspNetCore
dotnet add package Serilog.Sinks.Console
dotnet add package Serilog.Sinks.Seq
dotnet add package Mapster
dotnet add package BCrypt.Net-Next
dotnet add package Microsoft.Extensions.Caching.StackExchangeRedis

# Run migrations
dotnet ef migrations add InitialCreate
dotnet ef database update

# Run the application
dotnet run
```

## Project Structure

```
MyApi/
├── src/
│   ├── MyApi.Api/
│   │   ├── Controllers/
│   │   │   ├── AuthController.cs
│   │   │   ├── UsersController.cs
│   │   │   ├── ItemsController.cs
│   │   │   └── BaseController.cs
│   │   ├── Middleware/
│   │   │   ├── ExceptionMiddleware.cs
│   │   │   ├── RequestLoggingMiddleware.cs
│   │   │   └── RateLimitingMiddleware.cs
│   │   ├── Filters/
│   │   │   ├── ValidationFilter.cs
│   │   │   └── AuthorizeFilter.cs
│   │   ├── Extensions/
│   │   │   ├── ServiceExtensions.cs
│   │   │   └── ApplicationExtensions.cs
│   │   ├── Program.cs
│   │   ├── appsettings.json
│   │   └── appsettings.Development.json
│   ├── MyApi.Application/
│   │   ├── Common/
│   │   │   ├── Interfaces/
│   │   │   │   ├── IRepository.cs
│   │   │   │   ├── IUnitOfWork.cs
│   │   │   │   └── ICurrentUserService.cs
│   │   │   ├── Behaviors/
│   │   │   │   ├── ValidationBehavior.cs
│   │   │   │   └── LoggingBehavior.cs
│   │   │   ├── Mappings/
│   │   │   │   └── MappingConfig.cs
│   │   │   └── Models/
│   │   │       ├── Result.cs
│   │   │       └── PaginatedList.cs
│   │   ├── Features/
│   │   │   ├── Auth/
│   │   │   │   ├── Commands/
│   │   │   │   │   ├── RegisterCommand.cs
│   │   │   │   │   ├── LoginCommand.cs
│   │   │   │   │   └── RefreshTokenCommand.cs
│   │   │   │   └── Queries/
│   │   │   │       └── GetCurrentUserQuery.cs
│   │   │   ├── Users/
│   │   │   │   ├── Commands/
│   │   │   │   │   ├── UpdateUserCommand.cs
│   │   │   │   │   └── DeleteUserCommand.cs
│   │   │   │   └── Queries/
│   │   │   │       ├── GetUserQuery.cs
│   │   │   │       └── GetUsersQuery.cs
│   │   │   └── Items/
│   │   │       ├── Commands/
│   │   │       │   ├── CreateItemCommand.cs
│   │   │       │   ├── UpdateItemCommand.cs
│   │   │       │   └── DeleteItemCommand.cs
│   │   │       └── Queries/
│   │   │           ├── GetItemQuery.cs
│   │   │           └── GetItemsQuery.cs
│   │   └── DependencyInjection.cs
│   ├── MyApi.Domain/
│   │   ├── Entities/
│   │   │   ├── BaseEntity.cs
│   │   │   ├── User.cs
│   │   │   ├── Item.cs
│   │   │   └── RefreshToken.cs
│   │   ├── Enums/
│   │   │   └── UserRole.cs
│   │   ├── Events/
│   │   │   ├── DomainEvent.cs
│   │   │   └── UserCreatedEvent.cs
│   │   └── Exceptions/
│   │       ├── DomainException.cs
│   │       └── NotFoundException.cs
│   └── MyApi.Infrastructure/
│       ├── Persistence/
│       │   ├── ApplicationDbContext.cs
│       │   ├── Configurations/
│       │   │   ├── UserConfiguration.cs
│       │   │   └── ItemConfiguration.cs
│       │   └── Migrations/
│       ├── Repositories/
│       │   ├── Repository.cs
│       │   ├── UserRepository.cs
│       │   └── ItemRepository.cs
│       ├── Services/
│       │   ├── TokenService.cs
│       │   ├── CurrentUserService.cs
│       │   └── DateTimeService.cs
│       └── DependencyInjection.cs
├── tests/
│   ├── MyApi.UnitTests/
│   │   ├── Features/
│   │   │   └── Items/
│   │   │       └── CreateItemCommandTests.cs
│   │   └── Common/
│   │       └── Mappings/
│   │           └── MappingTests.cs
│   └── MyApi.IntegrationTests/
│       ├── Controllers/
│       │   └── ItemsControllerTests.cs
│       └── CustomWebApplicationFactory.cs
├── docker-compose.yml
├── Dockerfile
├── MyApi.sln
└── README.md
```

## Configuration

### appsettings.json

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning",
      "Microsoft.EntityFrameworkCore": "Warning"
    }
  },
  "AllowedHosts": "*",
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=myapi_db;Username=postgres;Password=postgres",
    "Redis": "localhost:6379"
  },
  "JwtSettings": {
    "Secret": "your-super-secret-key-with-at-least-32-characters",
    "Issuer": "MyApi",
    "Audience": "MyApi",
    "AccessTokenExpirationMinutes": 15,
    "RefreshTokenExpirationDays": 7
  },
  "RateLimiting": {
    "PermitLimit": 100,
    "WindowSeconds": 60
  },
  "Cors": {
    "AllowedOrigins": ["http://localhost:3000"]
  },
  "Serilog": {
    "MinimumLevel": {
      "Default": "Information",
      "Override": {
        "Microsoft": "Warning",
        "System": "Warning"
      }
    },
    "WriteTo": [
      { "Name": "Console" },
      {
        "Name": "Seq",
        "Args": { "serverUrl": "http://localhost:5341" }
      }
    ]
  }
}
```

### MyApi.sln

```xml
Microsoft Visual Studio Solution File, Format Version 12.00
# Visual Studio Version 17
VisualStudioVersion = 17.0.31903.59
MinimumVisualStudioVersion = 10.0.40219.1
Project("{FAE04EC0-301F-11D3-BF4B-00C04F79EFBC}") = "MyApi.Api", "src\MyApi.Api\MyApi.Api.csproj", "{GUID1}"
EndProject
Project("{FAE04EC0-301F-11D3-BF4B-00C04F79EFBC}") = "MyApi.Application", "src\MyApi.Application\MyApi.Application.csproj", "{GUID2}"
EndProject
Project("{FAE04EC0-301F-11D3-BF4B-00C04F79EFBC}") = "MyApi.Domain", "src\MyApi.Domain\MyApi.Domain.csproj", "{GUID3}"
EndProject
Project("{FAE04EC0-301F-11D3-BF4B-00C04F79EFBC}") = "MyApi.Infrastructure", "src\MyApi.Infrastructure\MyApi.Infrastructure.csproj", "{GUID4}"
EndProject
```

### MyApi.Api.csproj

```xml
<Project Sdk="Microsoft.NET.Sdk.Web">
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="Microsoft.AspNetCore.Authentication.JwtBearer" Version="8.0.0" />
    <PackageReference Include="Swashbuckle.AspNetCore" Version="6.5.0" />
    <PackageReference Include="Serilog.AspNetCore" Version="8.0.0" />
    <PackageReference Include="Serilog.Sinks.Console" Version="5.0.0" />
    <PackageReference Include="Serilog.Sinks.Seq" Version="6.0.0" />
    <PackageReference Include="FluentValidation.AspNetCore" Version="11.3.0" />
  </ItemGroup>

  <ItemGroup>
    <ProjectReference Include="..\MyApi.Application\MyApi.Application.csproj" />
    <ProjectReference Include="..\MyApi.Infrastructure\MyApi.Infrastructure.csproj" />
  </ItemGroup>
</Project>
```

### MyApi.Domain.csproj

```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
  </PropertyGroup>
</Project>
```

### MyApi.Application.csproj

```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="MediatR" Version="12.2.0" />
    <PackageReference Include="FluentValidation" Version="11.9.0" />
    <PackageReference Include="Mapster" Version="7.4.0" />
    <PackageReference Include="Microsoft.Extensions.DependencyInjection.Abstractions" Version="8.0.0" />
  </ItemGroup>

  <ItemGroup>
    <ProjectReference Include="..\MyApi.Domain\MyApi.Domain.csproj" />
  </ItemGroup>
</Project>
```

### MyApi.Infrastructure.csproj

```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="Microsoft.EntityFrameworkCore" Version="8.0.0" />
    <PackageReference Include="Microsoft.EntityFrameworkCore.Design" Version="8.0.0" />
    <PackageReference Include="Npgsql.EntityFrameworkCore.PostgreSQL" Version="8.0.0" />
    <PackageReference Include="BCrypt.Net-Next" Version="4.0.3" />
    <PackageReference Include="Microsoft.Extensions.Caching.StackExchangeRedis" Version="8.0.0" />
    <PackageReference Include="Microsoft.AspNetCore.Http.Abstractions" Version="2.2.0" />
  </ItemGroup>

  <ItemGroup>
    <ProjectReference Include="..\MyApi.Application\MyApi.Application.csproj" />
  </ItemGroup>
</Project>
```

## Domain Layer

### BaseEntity.cs

```csharp
namespace MyApi.Domain.Entities;

public abstract class BaseEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    private readonly List<DomainEvent> _domainEvents = new();
    public IReadOnlyCollection<DomainEvent> DomainEvents => _domainEvents.AsReadOnly();

    public void AddDomainEvent(DomainEvent domainEvent)
    {
        _domainEvents.Add(domainEvent);
    }

    public void ClearDomainEvents()
    {
        _domainEvents.Clear();
    }
}
```

### User.cs

```csharp
using MyApi.Domain.Enums;

namespace MyApi.Domain.Entities;

public class User : BaseEntity
{
    public string Email { get; private set; } = string.Empty;
    public string PasswordHash { get; private set; } = string.Empty;
    public string Name { get; private set; } = string.Empty;
    public UserRole Role { get; private set; } = UserRole.User;
    public bool IsActive { get; private set; } = true;
    public DateTime? LastLoginAt { get; private set; }

    public ICollection<Item> Items { get; private set; } = new List<Item>();
    public ICollection<RefreshToken> RefreshTokens { get; private set; } = new List<RefreshToken>();

    private User() { } // EF Core constructor

    public static User Create(string email, string passwordHash, string name, UserRole role = UserRole.User)
    {
        var user = new User
        {
            Email = email.ToLowerInvariant(),
            PasswordHash = passwordHash,
            Name = name,
            Role = role
        };

        user.AddDomainEvent(new UserCreatedEvent(user.Id, user.Email));
        return user;
    }

    public void UpdateProfile(string name, string? email = null)
    {
        Name = name;
        if (email != null)
            Email = email.ToLowerInvariant();
        UpdatedAt = DateTime.UtcNow;
    }

    public void ChangePassword(string passwordHash)
    {
        PasswordHash = passwordHash;
        UpdatedAt = DateTime.UtcNow;
    }

    public void RecordLogin()
    {
        LastLoginAt = DateTime.UtcNow;
    }

    public void Deactivate()
    {
        IsActive = false;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Activate()
    {
        IsActive = true;
        UpdatedAt = DateTime.UtcNow;
    }

    public void ChangeRole(UserRole role)
    {
        Role = role;
        UpdatedAt = DateTime.UtcNow;
    }
}
```

### Item.cs

```csharp
namespace MyApi.Domain.Entities;

public class Item : BaseEntity
{
    public string Title { get; private set; } = string.Empty;
    public string Description { get; private set; } = string.Empty;
    public decimal Price { get; private set; }
    public int Quantity { get; private set; }
    public bool IsActive { get; private set; } = true;

    public Guid UserId { get; private set; }
    public User User { get; private set; } = null!;

    private Item() { } // EF Core constructor

    public static Item Create(string title, string description, decimal price, int quantity, Guid userId)
    {
        if (price < 0)
            throw new DomainException("Price cannot be negative");
        if (quantity < 0)
            throw new DomainException("Quantity cannot be negative");

        return new Item
        {
            Title = title,
            Description = description,
            Price = price,
            Quantity = quantity,
            UserId = userId
        };
    }

    public void Update(string title, string description, decimal price, int quantity)
    {
        if (price < 0)
            throw new DomainException("Price cannot be negative");
        if (quantity < 0)
            throw new DomainException("Quantity cannot be negative");

        Title = title;
        Description = description;
        Price = price;
        Quantity = quantity;
        UpdatedAt = DateTime.UtcNow;
    }

    public void AdjustQuantity(int adjustment)
    {
        var newQuantity = Quantity + adjustment;
        if (newQuantity < 0)
            throw new DomainException("Quantity cannot be negative");
        Quantity = newQuantity;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Deactivate()
    {
        IsActive = false;
        UpdatedAt = DateTime.UtcNow;
    }
}
```

### RefreshToken.cs

```csharp
namespace MyApi.Domain.Entities;

public class RefreshToken : BaseEntity
{
    public string Token { get; private set; } = string.Empty;
    public string TokenHash { get; private set; } = string.Empty;
    public DateTime ExpiresAt { get; private set; }
    public DateTime? RevokedAt { get; private set; }
    public string? ReplacedByToken { get; private set; }
    public string? RevokedReason { get; private set; }

    public Guid UserId { get; private set; }
    public User User { get; private set; } = null!;

    public bool IsExpired => DateTime.UtcNow >= ExpiresAt;
    public bool IsRevoked => RevokedAt != null;
    public bool IsActive => !IsRevoked && !IsExpired;

    private RefreshToken() { }

    public static RefreshToken Create(Guid userId, string token, string tokenHash, int expirationDays)
    {
        return new RefreshToken
        {
            UserId = userId,
            Token = token,
            TokenHash = tokenHash,
            ExpiresAt = DateTime.UtcNow.AddDays(expirationDays)
        };
    }

    public void Revoke(string? reason = null, string? replacedByToken = null)
    {
        RevokedAt = DateTime.UtcNow;
        RevokedReason = reason;
        ReplacedByToken = replacedByToken;
    }
}
```

### UserRole.cs

```csharp
namespace MyApi.Domain.Enums;

public enum UserRole
{
    User = 0,
    Admin = 1,
    SuperAdmin = 2
}
```

### DomainEvent.cs

```csharp
namespace MyApi.Domain.Events;

public abstract class DomainEvent
{
    public Guid Id { get; } = Guid.NewGuid();
    public DateTime OccurredAt { get; } = DateTime.UtcNow;
}
```

### UserCreatedEvent.cs

```csharp
namespace MyApi.Domain.Events;

public class UserCreatedEvent : DomainEvent
{
    public Guid UserId { get; }
    public string Email { get; }

    public UserCreatedEvent(Guid userId, string email)
    {
        UserId = userId;
        Email = email;
    }
}
```

### DomainException.cs

```csharp
namespace MyApi.Domain.Exceptions;

public class DomainException : Exception
{
    public DomainException(string message) : base(message) { }
}
```

### NotFoundException.cs

```csharp
namespace MyApi.Domain.Exceptions;

public class NotFoundException : Exception
{
    public NotFoundException(string name, object key)
        : base($"Entity \"{name}\" ({key}) was not found.") { }
}
```

## Application Layer

### IRepository.cs

```csharp
using System.Linq.Expressions;
using MyApi.Domain.Entities;

namespace MyApi.Application.Common.Interfaces;

public interface IRepository<T> where T : BaseEntity
{
    Task<T?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<T>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<T>> FindAsync(Expression<Func<T, bool>> predicate, CancellationToken cancellationToken = default);
    Task<T?> FindOneAsync(Expression<Func<T, bool>> predicate, CancellationToken cancellationToken = default);
    Task<T> AddAsync(T entity, CancellationToken cancellationToken = default);
    Task UpdateAsync(T entity, CancellationToken cancellationToken = default);
    Task DeleteAsync(T entity, CancellationToken cancellationToken = default);
    Task<bool> ExistsAsync(Expression<Func<T, bool>> predicate, CancellationToken cancellationToken = default);
    Task<int> CountAsync(Expression<Func<T, bool>>? predicate = null, CancellationToken cancellationToken = default);
    IQueryable<T> Query();
}
```

### IUnitOfWork.cs

```csharp
using MyApi.Domain.Entities;

namespace MyApi.Application.Common.Interfaces;

public interface IUnitOfWork : IDisposable
{
    IRepository<User> Users { get; }
    IRepository<Item> Items { get; }
    IRepository<RefreshToken> RefreshTokens { get; }
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    Task BeginTransactionAsync(CancellationToken cancellationToken = default);
    Task CommitTransactionAsync(CancellationToken cancellationToken = default);
    Task RollbackTransactionAsync(CancellationToken cancellationToken = default);
}
```

### ICurrentUserService.cs

```csharp
namespace MyApi.Application.Common.Interfaces;

public interface ICurrentUserService
{
    Guid? UserId { get; }
    string? Email { get; }
    string? Role { get; }
    bool IsAuthenticated { get; }
}
```

### ITokenService.cs

```csharp
using MyApi.Domain.Entities;

namespace MyApi.Application.Common.Interfaces;

public interface ITokenService
{
    (string accessToken, string refreshToken) GenerateTokens(User user);
    string HashToken(string token);
    bool ValidateRefreshToken(string token, string tokenHash);
    Guid? GetUserIdFromExpiredToken(string token);
}
```

### Result.cs

```csharp
namespace MyApi.Application.Common.Models;

public class Result<T>
{
    public bool IsSuccess { get; }
    public T? Value { get; }
    public string? Error { get; }
    public string? ErrorCode { get; }

    private Result(bool isSuccess, T? value, string? error, string? errorCode)
    {
        IsSuccess = isSuccess;
        Value = value;
        Error = error;
        ErrorCode = errorCode;
    }

    public static Result<T> Success(T value) => new(true, value, null, null);
    public static Result<T> Failure(string error, string? errorCode = null) => new(false, default, error, errorCode);
}

public class Result
{
    public bool IsSuccess { get; }
    public string? Error { get; }
    public string? ErrorCode { get; }

    private Result(bool isSuccess, string? error, string? errorCode)
    {
        IsSuccess = isSuccess;
        Error = error;
        ErrorCode = errorCode;
    }

    public static Result Success() => new(true, null, null);
    public static Result Failure(string error, string? errorCode = null) => new(false, error, errorCode);
}
```

### PaginatedList.cs

```csharp
using Microsoft.EntityFrameworkCore;

namespace MyApi.Application.Common.Models;

public class PaginatedList<T>
{
    public List<T> Items { get; }
    public int Page { get; }
    public int PageSize { get; }
    public int TotalCount { get; }
    public int TotalPages { get; }
    public bool HasPreviousPage => Page > 1;
    public bool HasNextPage => Page < TotalPages;

    public PaginatedList(List<T> items, int count, int page, int pageSize)
    {
        Items = items;
        TotalCount = count;
        Page = page;
        PageSize = pageSize;
        TotalPages = (int)Math.Ceiling(count / (double)pageSize);
    }

    public static async Task<PaginatedList<T>> CreateAsync(
        IQueryable<T> source, int page, int pageSize, CancellationToken cancellationToken = default)
    {
        var count = await source.CountAsync(cancellationToken);
        var items = await source
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);
        return new PaginatedList<T>(items, count, page, pageSize);
    }
}
```

### ValidationBehavior.cs

```csharp
using FluentValidation;
using MediatR;

namespace MyApi.Application.Common.Behaviors;

public class ValidationBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    private readonly IEnumerable<IValidator<TRequest>> _validators;

    public ValidationBehavior(IEnumerable<IValidator<TRequest>> validators)
    {
        _validators = validators;
    }

    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        if (!_validators.Any())
            return await next();

        var context = new ValidationContext<TRequest>(request);

        var validationResults = await Task.WhenAll(
            _validators.Select(v => v.ValidateAsync(context, cancellationToken)));

        var failures = validationResults
            .SelectMany(r => r.Errors)
            .Where(f => f != null)
            .ToList();

        if (failures.Count != 0)
            throw new ValidationException(failures);

        return await next();
    }
}
```

### LoggingBehavior.cs

```csharp
using MediatR;
using Microsoft.Extensions.Logging;
using System.Diagnostics;

namespace MyApi.Application.Common.Behaviors;

public class LoggingBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    private readonly ILogger<LoggingBehavior<TRequest, TResponse>> _logger;
    private readonly ICurrentUserService _currentUserService;

    public LoggingBehavior(ILogger<LoggingBehavior<TRequest, TResponse>> logger, ICurrentUserService currentUserService)
    {
        _logger = logger;
        _currentUserService = currentUserService;
    }

    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        var requestName = typeof(TRequest).Name;
        var userId = _currentUserService.UserId?.ToString() ?? "Anonymous";

        _logger.LogInformation(
            "Handling {RequestName} for user {UserId}",
            requestName, userId);

        var stopwatch = Stopwatch.StartNew();

        try
        {
            var response = await next();
            stopwatch.Stop();

            _logger.LogInformation(
                "Handled {RequestName} for user {UserId} in {ElapsedMs}ms",
                requestName, userId, stopwatch.ElapsedMilliseconds);

            return response;
        }
        catch (Exception ex)
        {
            stopwatch.Stop();

            _logger.LogError(ex,
                "Error handling {RequestName} for user {UserId} after {ElapsedMs}ms",
                requestName, userId, stopwatch.ElapsedMilliseconds);

            throw;
        }
    }
}
```

### MappingConfig.cs

```csharp
using Mapster;
using MyApi.Domain.Entities;

namespace MyApi.Application.Common.Mappings;

public static class MappingConfig
{
    public static void Configure()
    {
        TypeAdapterConfig<User, UserDto>.NewConfig()
            .Map(dest => dest.Id, src => src.Id)
            .Map(dest => dest.Email, src => src.Email)
            .Map(dest => dest.Name, src => src.Name)
            .Map(dest => dest.Role, src => src.Role.ToString())
            .Map(dest => dest.CreatedAt, src => src.CreatedAt);

        TypeAdapterConfig<Item, ItemDto>.NewConfig()
            .Map(dest => dest.Id, src => src.Id)
            .Map(dest => dest.Title, src => src.Title)
            .Map(dest => dest.Description, src => src.Description)
            .Map(dest => dest.Price, src => src.Price)
            .Map(dest => dest.Quantity, src => src.Quantity)
            .Map(dest => dest.UserId, src => src.UserId)
            .Map(dest => dest.CreatedAt, src => src.CreatedAt);
    }
}

public record UserDto(Guid Id, string Email, string Name, string Role, DateTime CreatedAt);
public record ItemDto(Guid Id, string Title, string Description, decimal Price, int Quantity, Guid UserId, DateTime CreatedAt);
```

### Application DependencyInjection.cs

```csharp
using FluentValidation;
using MediatR;
using Microsoft.Extensions.DependencyInjection;
using MyApi.Application.Common.Behaviors;
using MyApi.Application.Common.Mappings;
using System.Reflection;

namespace MyApi.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddMediatR(cfg => {
            cfg.RegisterServicesFromAssembly(Assembly.GetExecutingAssembly());
        });

        services.AddValidatorsFromAssembly(Assembly.GetExecutingAssembly());

        services.AddTransient(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));
        services.AddTransient(typeof(IPipelineBehavior<,>), typeof(LoggingBehavior<,>));

        MappingConfig.Configure();

        return services;
    }
}
```

### RegisterCommand.cs

```csharp
using FluentValidation;
using MediatR;
using MyApi.Application.Common.Interfaces;
using MyApi.Application.Common.Models;
using MyApi.Domain.Entities;

namespace MyApi.Application.Features.Auth.Commands;

public record RegisterCommand(string Email, string Password, string Name) : IRequest<Result<AuthResponse>>;

public record AuthResponse(string AccessToken, string RefreshToken, UserDto User);

public class RegisterCommandValidator : AbstractValidator<RegisterCommand>
{
    private readonly IUnitOfWork _unitOfWork;

    public RegisterCommandValidator(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required")
            .EmailAddress().WithMessage("Invalid email format")
            .MustAsync(BeUniqueEmail).WithMessage("Email already exists");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Password is required")
            .MinimumLength(8).WithMessage("Password must be at least 8 characters")
            .Matches("[A-Z]").WithMessage("Password must contain uppercase letter")
            .Matches("[a-z]").WithMessage("Password must contain lowercase letter")
            .Matches("[0-9]").WithMessage("Password must contain a number");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Name is required")
            .MaximumLength(100).WithMessage("Name must not exceed 100 characters");
    }

    private async Task<bool> BeUniqueEmail(string email, CancellationToken cancellationToken)
    {
        return !await _unitOfWork.Users.ExistsAsync(u => u.Email == email.ToLowerInvariant(), cancellationToken);
    }
}

public class RegisterCommandHandler : IRequestHandler<RegisterCommand, Result<AuthResponse>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ITokenService _tokenService;

    public RegisterCommandHandler(IUnitOfWork unitOfWork, ITokenService tokenService)
    {
        _unitOfWork = unitOfWork;
        _tokenService = tokenService;
    }

    public async Task<Result<AuthResponse>> Handle(RegisterCommand request, CancellationToken cancellationToken)
    {
        var passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);
        var user = User.Create(request.Email, passwordHash, request.Name);

        await _unitOfWork.Users.AddAsync(user, cancellationToken);

        var (accessToken, refreshToken) = _tokenService.GenerateTokens(user);
        var refreshTokenHash = _tokenService.HashToken(refreshToken);

        var refreshTokenEntity = RefreshToken.Create(user.Id, refreshToken, refreshTokenHash, 7);
        await _unitOfWork.RefreshTokens.AddAsync(refreshTokenEntity, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var userDto = new UserDto(user.Id, user.Email, user.Name, user.Role.ToString(), user.CreatedAt);
        return Result<AuthResponse>.Success(new AuthResponse(accessToken, refreshToken, userDto));
    }
}
```

### LoginCommand.cs

```csharp
using FluentValidation;
using MediatR;
using MyApi.Application.Common.Interfaces;
using MyApi.Application.Common.Models;

namespace MyApi.Application.Features.Auth.Commands;

public record LoginCommand(string Email, string Password) : IRequest<Result<AuthResponse>>;

public class LoginCommandValidator : AbstractValidator<LoginCommand>
{
    public LoginCommandValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Password).NotEmpty();
    }
}

public class LoginCommandHandler : IRequestHandler<LoginCommand, Result<AuthResponse>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ITokenService _tokenService;

    public LoginCommandHandler(IUnitOfWork unitOfWork, ITokenService tokenService)
    {
        _unitOfWork = unitOfWork;
        _tokenService = tokenService;
    }

    public async Task<Result<AuthResponse>> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        var user = await _unitOfWork.Users.FindOneAsync(
            u => u.Email == request.Email.ToLowerInvariant(), cancellationToken);

        if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            return Result<AuthResponse>.Failure("Invalid email or password", "INVALID_CREDENTIALS");

        if (!user.IsActive)
            return Result<AuthResponse>.Failure("Account is deactivated", "ACCOUNT_INACTIVE");

        user.RecordLogin();

        var (accessToken, refreshToken) = _tokenService.GenerateTokens(user);
        var refreshTokenHash = _tokenService.HashToken(refreshToken);

        var refreshTokenEntity = RefreshToken.Create(user.Id, refreshToken, refreshTokenHash, 7);
        await _unitOfWork.RefreshTokens.AddAsync(refreshTokenEntity, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var userDto = new UserDto(user.Id, user.Email, user.Name, user.Role.ToString(), user.CreatedAt);
        return Result<AuthResponse>.Success(new AuthResponse(accessToken, refreshToken, userDto));
    }
}
```

### RefreshTokenCommand.cs

```csharp
using FluentValidation;
using MediatR;
using MyApi.Application.Common.Interfaces;
using MyApi.Application.Common.Models;
using MyApi.Domain.Entities;

namespace MyApi.Application.Features.Auth.Commands;

public record RefreshTokenCommand(string AccessToken, string RefreshToken) : IRequest<Result<AuthResponse>>;

public class RefreshTokenCommandValidator : AbstractValidator<RefreshTokenCommand>
{
    public RefreshTokenCommandValidator()
    {
        RuleFor(x => x.AccessToken).NotEmpty();
        RuleFor(x => x.RefreshToken).NotEmpty();
    }
}

public class RefreshTokenCommandHandler : IRequestHandler<RefreshTokenCommand, Result<AuthResponse>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ITokenService _tokenService;

    public RefreshTokenCommandHandler(IUnitOfWork unitOfWork, ITokenService tokenService)
    {
        _unitOfWork = unitOfWork;
        _tokenService = tokenService;
    }

    public async Task<Result<AuthResponse>> Handle(RefreshTokenCommand request, CancellationToken cancellationToken)
    {
        var userId = _tokenService.GetUserIdFromExpiredToken(request.AccessToken);
        if (userId == null)
            return Result<AuthResponse>.Failure("Invalid token", "INVALID_TOKEN");

        var tokenHash = _tokenService.HashToken(request.RefreshToken);
        var storedToken = await _unitOfWork.RefreshTokens.FindOneAsync(
            t => t.UserId == userId && t.TokenHash == tokenHash, cancellationToken);

        if (storedToken == null || !storedToken.IsActive)
            return Result<AuthResponse>.Failure("Invalid refresh token", "INVALID_REFRESH_TOKEN");

        var user = await _unitOfWork.Users.GetByIdAsync(userId.Value, cancellationToken);
        if (user == null || !user.IsActive)
            return Result<AuthResponse>.Failure("User not found or inactive", "USER_INACTIVE");

        // Rotate refresh token
        var (newAccessToken, newRefreshToken) = _tokenService.GenerateTokens(user);
        var newRefreshTokenHash = _tokenService.HashToken(newRefreshToken);

        storedToken.Revoke("Replaced by new token", newRefreshToken);

        var newRefreshTokenEntity = RefreshToken.Create(user.Id, newRefreshToken, newRefreshTokenHash, 7);
        await _unitOfWork.RefreshTokens.AddAsync(newRefreshTokenEntity, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var userDto = new UserDto(user.Id, user.Email, user.Name, user.Role.ToString(), user.CreatedAt);
        return Result<AuthResponse>.Success(new AuthResponse(newAccessToken, newRefreshToken, userDto));
    }
}
```

### CreateItemCommand.cs

```csharp
using FluentValidation;
using Mapster;
using MediatR;
using MyApi.Application.Common.Interfaces;
using MyApi.Application.Common.Mappings;
using MyApi.Application.Common.Models;
using MyApi.Domain.Entities;

namespace MyApi.Application.Features.Items.Commands;

public record CreateItemCommand(string Title, string Description, decimal Price, int Quantity) : IRequest<Result<ItemDto>>;

public class CreateItemCommandValidator : AbstractValidator<CreateItemCommand>
{
    public CreateItemCommandValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Title is required")
            .MaximumLength(200).WithMessage("Title must not exceed 200 characters");

        RuleFor(x => x.Description)
            .MaximumLength(2000).WithMessage("Description must not exceed 2000 characters");

        RuleFor(x => x.Price)
            .GreaterThanOrEqualTo(0).WithMessage("Price must be non-negative");

        RuleFor(x => x.Quantity)
            .GreaterThanOrEqualTo(0).WithMessage("Quantity must be non-negative");
    }
}

public class CreateItemCommandHandler : IRequestHandler<CreateItemCommand, Result<ItemDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;

    public CreateItemCommandHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUserService)
    {
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
    }

    public async Task<Result<ItemDto>> Handle(CreateItemCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId;
        if (userId == null)
            return Result<ItemDto>.Failure("User not authenticated", "UNAUTHORIZED");

        var item = Item.Create(request.Title, request.Description, request.Price, request.Quantity, userId.Value);

        await _unitOfWork.Items.AddAsync(item, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<ItemDto>.Success(item.Adapt<ItemDto>());
    }
}
```

### UpdateItemCommand.cs

```csharp
using FluentValidation;
using Mapster;
using MediatR;
using MyApi.Application.Common.Interfaces;
using MyApi.Application.Common.Mappings;
using MyApi.Application.Common.Models;
using MyApi.Domain.Enums;
using MyApi.Domain.Exceptions;

namespace MyApi.Application.Features.Items.Commands;

public record UpdateItemCommand(Guid Id, string Title, string Description, decimal Price, int Quantity) : IRequest<Result<ItemDto>>;

public class UpdateItemCommandValidator : AbstractValidator<UpdateItemCommand>
{
    public UpdateItemCommandValidator()
    {
        RuleFor(x => x.Id).NotEmpty();
        RuleFor(x => x.Title).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Description).MaximumLength(2000);
        RuleFor(x => x.Price).GreaterThanOrEqualTo(0);
        RuleFor(x => x.Quantity).GreaterThanOrEqualTo(0);
    }
}

public class UpdateItemCommandHandler : IRequestHandler<UpdateItemCommand, Result<ItemDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;

    public UpdateItemCommandHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUserService)
    {
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
    }

    public async Task<Result<ItemDto>> Handle(UpdateItemCommand request, CancellationToken cancellationToken)
    {
        var item = await _unitOfWork.Items.GetByIdAsync(request.Id, cancellationToken);
        if (item == null)
            throw new NotFoundException(nameof(Item), request.Id);

        var userId = _currentUserService.UserId;
        var userRole = _currentUserService.Role;

        if (item.UserId != userId && userRole != UserRole.Admin.ToString())
            return Result<ItemDto>.Failure("Not authorized to update this item", "FORBIDDEN");

        item.Update(request.Title, request.Description, request.Price, request.Quantity);

        await _unitOfWork.Items.UpdateAsync(item, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<ItemDto>.Success(item.Adapt<ItemDto>());
    }
}
```

### GetItemsQuery.cs

```csharp
using Mapster;
using MediatR;
using Microsoft.EntityFrameworkCore;
using MyApi.Application.Common.Interfaces;
using MyApi.Application.Common.Mappings;
using MyApi.Application.Common.Models;

namespace MyApi.Application.Features.Items.Queries;

public record GetItemsQuery(
    int Page = 1,
    int PageSize = 20,
    string? Search = null,
    decimal? MinPrice = null,
    decimal? MaxPrice = null,
    string? SortBy = null,
    bool SortDescending = false
) : IRequest<PaginatedList<ItemDto>>;

public class GetItemsQueryHandler : IRequestHandler<GetItemsQuery, PaginatedList<ItemDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetItemsQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<PaginatedList<ItemDto>> Handle(GetItemsQuery request, CancellationToken cancellationToken)
    {
        var query = _unitOfWork.Items.Query().Where(i => i.IsActive);

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.ToLower();
            query = query.Where(i =>
                i.Title.ToLower().Contains(search) ||
                i.Description.ToLower().Contains(search));
        }

        if (request.MinPrice.HasValue)
            query = query.Where(i => i.Price >= request.MinPrice.Value);

        if (request.MaxPrice.HasValue)
            query = query.Where(i => i.Price <= request.MaxPrice.Value);

        query = request.SortBy?.ToLower() switch
        {
            "title" => request.SortDescending ? query.OrderByDescending(i => i.Title) : query.OrderBy(i => i.Title),
            "price" => request.SortDescending ? query.OrderByDescending(i => i.Price) : query.OrderBy(i => i.Price),
            "createdat" => request.SortDescending ? query.OrderByDescending(i => i.CreatedAt) : query.OrderBy(i => i.CreatedAt),
            _ => query.OrderByDescending(i => i.CreatedAt)
        };

        var itemsQuery = query.ProjectToType<ItemDto>();

        return await PaginatedList<ItemDto>.CreateAsync(itemsQuery, request.Page, request.PageSize, cancellationToken);
    }
}
```

## Infrastructure Layer

### ApplicationDbContext.cs

```csharp
using Microsoft.EntityFrameworkCore;
using MyApi.Domain.Entities;

namespace MyApi.Infrastructure.Persistence;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Item> Items => Set<Item>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);

        base.OnModelCreating(modelBuilder);
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        foreach (var entry in ChangeTracker.Entries<BaseEntity>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.Entity.CreatedAt = DateTime.UtcNow;
                    entry.Entity.UpdatedAt = DateTime.UtcNow;
                    break;
                case EntityState.Modified:
                    entry.Entity.UpdatedAt = DateTime.UtcNow;
                    break;
            }
        }

        return await base.SaveChangesAsync(cancellationToken);
    }
}
```

### UserConfiguration.cs

```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MyApi.Domain.Entities;

namespace MyApi.Infrastructure.Persistence.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("users");

        builder.HasKey(u => u.Id);

        builder.Property(u => u.Email)
            .HasMaxLength(255)
            .IsRequired();

        builder.HasIndex(u => u.Email).IsUnique();

        builder.Property(u => u.PasswordHash)
            .HasMaxLength(255)
            .IsRequired();

        builder.Property(u => u.Name)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(u => u.Role)
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.HasMany(u => u.Items)
            .WithOne(i => i.User)
            .HasForeignKey(i => i.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(u => u.RefreshTokens)
            .WithOne(t => t.User)
            .HasForeignKey(t => t.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Ignore(u => u.DomainEvents);
    }
}
```

### ItemConfiguration.cs

```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MyApi.Domain.Entities;

namespace MyApi.Infrastructure.Persistence.Configurations;

public class ItemConfiguration : IEntityTypeConfiguration<Item>
{
    public void Configure(EntityTypeBuilder<Item> builder)
    {
        builder.ToTable("items");

        builder.HasKey(i => i.Id);

        builder.Property(i => i.Title)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(i => i.Description)
            .HasMaxLength(2000);

        builder.Property(i => i.Price)
            .HasPrecision(18, 2);

        builder.HasIndex(i => i.UserId);
        builder.HasIndex(i => i.IsActive);
        builder.HasIndex(i => i.CreatedAt);

        builder.Ignore(i => i.DomainEvents);
    }
}
```

### Repository.cs

```csharp
using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using MyApi.Application.Common.Interfaces;
using MyApi.Domain.Entities;
using MyApi.Infrastructure.Persistence;

namespace MyApi.Infrastructure.Repositories;

public class Repository<T> : IRepository<T> where T : BaseEntity
{
    protected readonly ApplicationDbContext _context;
    protected readonly DbSet<T> _dbSet;

    public Repository(ApplicationDbContext context)
    {
        _context = context;
        _dbSet = context.Set<T>();
    }

    public virtual async Task<T?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _dbSet.FindAsync(new object[] { id }, cancellationToken);
    }

    public virtual async Task<IReadOnlyList<T>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _dbSet.ToListAsync(cancellationToken);
    }

    public virtual async Task<IReadOnlyList<T>> FindAsync(
        Expression<Func<T, bool>> predicate, CancellationToken cancellationToken = default)
    {
        return await _dbSet.Where(predicate).ToListAsync(cancellationToken);
    }

    public virtual async Task<T?> FindOneAsync(
        Expression<Func<T, bool>> predicate, CancellationToken cancellationToken = default)
    {
        return await _dbSet.FirstOrDefaultAsync(predicate, cancellationToken);
    }

    public virtual async Task<T> AddAsync(T entity, CancellationToken cancellationToken = default)
    {
        await _dbSet.AddAsync(entity, cancellationToken);
        return entity;
    }

    public virtual Task UpdateAsync(T entity, CancellationToken cancellationToken = default)
    {
        _dbSet.Update(entity);
        return Task.CompletedTask;
    }

    public virtual Task DeleteAsync(T entity, CancellationToken cancellationToken = default)
    {
        _dbSet.Remove(entity);
        return Task.CompletedTask;
    }

    public virtual async Task<bool> ExistsAsync(
        Expression<Func<T, bool>> predicate, CancellationToken cancellationToken = default)
    {
        return await _dbSet.AnyAsync(predicate, cancellationToken);
    }

    public virtual async Task<int> CountAsync(
        Expression<Func<T, bool>>? predicate = null, CancellationToken cancellationToken = default)
    {
        return predicate == null
            ? await _dbSet.CountAsync(cancellationToken)
            : await _dbSet.CountAsync(predicate, cancellationToken);
    }

    public virtual IQueryable<T> Query() => _dbSet.AsQueryable();
}
```

### UnitOfWork.cs

```csharp
using Microsoft.EntityFrameworkCore.Storage;
using MyApi.Application.Common.Interfaces;
using MyApi.Domain.Entities;
using MyApi.Infrastructure.Persistence;

namespace MyApi.Infrastructure.Repositories;

public class UnitOfWork : IUnitOfWork
{
    private readonly ApplicationDbContext _context;
    private IDbContextTransaction? _transaction;

    private IRepository<User>? _users;
    private IRepository<Item>? _items;
    private IRepository<RefreshToken>? _refreshTokens;

    public UnitOfWork(ApplicationDbContext context)
    {
        _context = context;
    }

    public IRepository<User> Users => _users ??= new Repository<User>(_context);
    public IRepository<Item> Items => _items ??= new Repository<Item>(_context);
    public IRepository<RefreshToken> RefreshTokens => _refreshTokens ??= new Repository<RefreshToken>(_context);

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task BeginTransactionAsync(CancellationToken cancellationToken = default)
    {
        _transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
    }

    public async Task CommitTransactionAsync(CancellationToken cancellationToken = default)
    {
        if (_transaction != null)
        {
            await _transaction.CommitAsync(cancellationToken);
            await _transaction.DisposeAsync();
            _transaction = null;
        }
    }

    public async Task RollbackTransactionAsync(CancellationToken cancellationToken = default)
    {
        if (_transaction != null)
        {
            await _transaction.RollbackAsync(cancellationToken);
            await _transaction.DisposeAsync();
            _transaction = null;
        }
    }

    public void Dispose()
    {
        _transaction?.Dispose();
        _context.Dispose();
    }
}
```

### TokenService.cs

```csharp
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using MyApi.Application.Common.Interfaces;
using MyApi.Domain.Entities;

namespace MyApi.Infrastructure.Services;

public class JwtSettings
{
    public string Secret { get; set; } = string.Empty;
    public string Issuer { get; set; } = string.Empty;
    public string Audience { get; set; } = string.Empty;
    public int AccessTokenExpirationMinutes { get; set; }
    public int RefreshTokenExpirationDays { get; set; }
}

public class TokenService : ITokenService
{
    private readonly JwtSettings _jwtSettings;

    public TokenService(IOptions<JwtSettings> jwtSettings)
    {
        _jwtSettings = jwtSettings.Value;
    }

    public (string accessToken, string refreshToken) GenerateTokens(User user)
    {
        var accessToken = GenerateAccessToken(user);
        var refreshToken = GenerateRefreshToken();
        return (accessToken, refreshToken);
    }

    private string GenerateAccessToken(User user)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.Secret));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(ClaimTypes.Name, user.Name),
            new Claim(ClaimTypes.Role, user.Role.ToString()),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var token = new JwtSecurityToken(
            issuer: _jwtSettings.Issuer,
            audience: _jwtSettings.Audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(_jwtSettings.AccessTokenExpirationMinutes),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private string GenerateRefreshToken()
    {
        var randomBytes = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomBytes);
        return Convert.ToBase64String(randomBytes);
    }

    public string HashToken(string token)
    {
        using var sha256 = SHA256.Create();
        var hash = sha256.ComputeHash(Encoding.UTF8.GetBytes(token));
        return Convert.ToBase64String(hash);
    }

    public bool ValidateRefreshToken(string token, string tokenHash)
    {
        return HashToken(token) == tokenHash;
    }

    public Guid? GetUserIdFromExpiredToken(string token)
    {
        var tokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = false, // We want to validate expired tokens
            ValidateIssuerSigningKey = true,
            ValidIssuer = _jwtSettings.Issuer,
            ValidAudience = _jwtSettings.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.Secret))
        };

        try
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var principal = tokenHandler.ValidateToken(token, tokenValidationParameters, out var securityToken);

            if (securityToken is not JwtSecurityToken jwtSecurityToken ||
                !jwtSecurityToken.Header.Alg.Equals(SecurityAlgorithms.HmacSha256, StringComparison.InvariantCultureIgnoreCase))
            {
                return null;
            }

            var userIdClaim = principal.FindFirst(ClaimTypes.NameIdentifier) ?? principal.FindFirst(JwtRegisteredClaimNames.Sub);
            if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
                return null;

            return userId;
        }
        catch
        {
            return null;
        }
    }
}
```

### CurrentUserService.cs

```csharp
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using MyApi.Application.Common.Interfaces;

namespace MyApi.Infrastructure.Services;

public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public Guid? UserId
    {
        get
        {
            var userId = _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return userId != null ? Guid.Parse(userId) : null;
        }
    }

    public string? Email => _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.Email)?.Value;
    public string? Role => _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.Role)?.Value;
    public bool IsAuthenticated => _httpContextAccessor.HttpContext?.User?.Identity?.IsAuthenticated ?? false;
}
```

### Infrastructure DependencyInjection.cs

```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using MyApi.Application.Common.Interfaces;
using MyApi.Infrastructure.Persistence;
using MyApi.Infrastructure.Repositories;
using MyApi.Infrastructure.Services;

namespace MyApi.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseNpgsql(
                configuration.GetConnectionString("DefaultConnection"),
                b => b.MigrationsAssembly(typeof(ApplicationDbContext).Assembly.FullName)));

        services.AddScoped<IUnitOfWork, UnitOfWork>();

        services.Configure<JwtSettings>(configuration.GetSection("JwtSettings"));
        services.AddScoped<ITokenService, TokenService>();
        services.AddScoped<ICurrentUserService, CurrentUserService>();

        services.AddStackExchangeRedisCache(options =>
        {
            options.Configuration = configuration.GetConnectionString("Redis");
            options.InstanceName = "MyApi_";
        });

        return services;
    }
}
```

## API Layer

### Program.cs

```csharp
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Serilog;
using MyApi.Application;
using MyApi.Infrastructure;
using MyApi.Api.Middleware;

var builder = WebApplication.CreateBuilder(args);

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .CreateLogger();

builder.Host.UseSerilog();

// Add services
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

builder.Services.AddHttpContextAccessor();
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// Configure Swagger
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "MyApi",
        Version = "v1",
        Description = "A production-ready .NET 8 Web API"
    });

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter JWT token"
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// Configure JWT Authentication
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(jwtSettings["Secret"]!)),
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy => policy.RequireRole("Admin", "SuperAdmin"));
    options.AddPolicy("SuperAdminOnly", policy => policy.RequireRole("SuperAdmin"));
});

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("DefaultPolicy", policy =>
    {
        var origins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>();
        policy.WithOrigins(origins ?? Array.Empty<string>())
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

// Configure Rate Limiting
builder.Services.AddRateLimiter(options =>
{
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
        RateLimitPartition.GetFixedWindowLimiter(
            context.User?.Identity?.Name ?? context.Request.Headers.Host.ToString(),
            factory => new FixedWindowRateLimiterOptions
            {
                AutoReplenishment = true,
                PermitLimit = builder.Configuration.GetValue<int>("RateLimiting:PermitLimit"),
                Window = TimeSpan.FromSeconds(builder.Configuration.GetValue<int>("RateLimiting:WindowSeconds"))
            }));
});

var app = builder.Build();

// Configure pipeline
app.UseMiddleware<ExceptionMiddleware>();
app.UseMiddleware<RequestLoggingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("DefaultPolicy");
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Apply migrations on startup
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    await dbContext.Database.MigrateAsync();
}

app.Run();

public partial class Program { } // For integration tests
```

### ExceptionMiddleware.cs

```csharp
using System.Net;
using System.Text.Json;
using FluentValidation;
using MyApi.Domain.Exceptions;

namespace MyApi.Api.Middleware;

public class ExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionMiddleware> _logger;

    public ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An unhandled exception occurred");
            await HandleExceptionAsync(context, ex);
        }
    }

    private static async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";

        var (statusCode, errorCode, message, errors) = exception switch
        {
            ValidationException validationEx => (
                HttpStatusCode.BadRequest,
                "VALIDATION_ERROR",
                "One or more validation errors occurred",
                validationEx.Errors.Select(e => new { field = e.PropertyName, message = e.ErrorMessage })),
            NotFoundException notFoundEx => (
                HttpStatusCode.NotFound,
                "NOT_FOUND",
                notFoundEx.Message,
                (object?)null),
            DomainException domainEx => (
                HttpStatusCode.BadRequest,
                "DOMAIN_ERROR",
                domainEx.Message,
                (object?)null),
            UnauthorizedAccessException => (
                HttpStatusCode.Unauthorized,
                "UNAUTHORIZED",
                "Unauthorized access",
                (object?)null),
            _ => (
                HttpStatusCode.InternalServerError,
                "INTERNAL_ERROR",
                "An internal error occurred",
                (object?)null)
        };

        context.Response.StatusCode = (int)statusCode;

        var response = new
        {
            success = false,
            error = new
            {
                code = errorCode,
                message,
                errors
            }
        };

        var jsonOptions = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
        await context.Response.WriteAsync(JsonSerializer.Serialize(response, jsonOptions));
    }
}
```

### RequestLoggingMiddleware.cs

```csharp
using System.Diagnostics;

namespace MyApi.Api.Middleware;

public class RequestLoggingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<RequestLoggingMiddleware> _logger;

    public RequestLoggingMiddleware(RequestDelegate next, ILogger<RequestLoggingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var correlationId = context.Request.Headers["X-Correlation-ID"].FirstOrDefault() ?? Guid.NewGuid().ToString();
        context.Response.Headers["X-Correlation-ID"] = correlationId;

        using var _ = Serilog.Context.LogContext.PushProperty("CorrelationId", correlationId);

        var stopwatch = Stopwatch.StartNew();

        _logger.LogInformation(
            "Request started: {Method} {Path}",
            context.Request.Method,
            context.Request.Path);

        await _next(context);

        stopwatch.Stop();

        _logger.LogInformation(
            "Request completed: {Method} {Path} - {StatusCode} in {ElapsedMs}ms",
            context.Request.Method,
            context.Request.Path,
            context.Response.StatusCode,
            stopwatch.ElapsedMilliseconds);
    }
}
```

### BaseController.cs

```csharp
using Microsoft.AspNetCore.Mvc;
using MediatR;
using MyApi.Application.Common.Models;

namespace MyApi.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public abstract class BaseController : ControllerBase
{
    private ISender? _mediator;
    protected ISender Mediator => _mediator ??= HttpContext.RequestServices.GetRequiredService<ISender>();

    protected IActionResult HandleResult<T>(Result<T> result)
    {
        if (result.IsSuccess)
            return Ok(new { success = true, data = result.Value });

        return result.ErrorCode switch
        {
            "NOT_FOUND" => NotFound(new { success = false, error = new { code = result.ErrorCode, message = result.Error } }),
            "FORBIDDEN" => Forbid(),
            "UNAUTHORIZED" => Unauthorized(new { success = false, error = new { code = result.ErrorCode, message = result.Error } }),
            _ => BadRequest(new { success = false, error = new { code = result.ErrorCode, message = result.Error } })
        };
    }

    protected IActionResult HandleResult(Result result)
    {
        if (result.IsSuccess)
            return Ok(new { success = true });

        return BadRequest(new { success = false, error = new { code = result.ErrorCode, message = result.Error } });
    }
}
```

### AuthController.cs

```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MyApi.Application.Features.Auth.Commands;

namespace MyApi.Api.Controllers;

public class AuthController : BaseController
{
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterCommand command)
    {
        var result = await Mediator.Send(command);
        return HandleResult(result);
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginCommand command)
    {
        var result = await Mediator.Send(command);
        return HandleResult(result);
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh([FromBody] RefreshTokenCommand command)
    {
        var result = await Mediator.Send(command);
        return HandleResult(result);
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> GetCurrentUser()
    {
        var result = await Mediator.Send(new GetCurrentUserQuery());
        return HandleResult(result);
    }
}
```

### ItemsController.cs

```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MyApi.Application.Features.Items.Commands;
using MyApi.Application.Features.Items.Queries;

namespace MyApi.Api.Controllers;

[Authorize]
public class ItemsController : BaseController
{
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetItems([FromQuery] GetItemsQuery query)
    {
        var result = await Mediator.Send(query);
        return Ok(new
        {
            success = true,
            data = result.Items,
            pagination = new
            {
                page = result.Page,
                pageSize = result.PageSize,
                totalCount = result.TotalCount,
                totalPages = result.TotalPages,
                hasNextPage = result.HasNextPage,
                hasPreviousPage = result.HasPreviousPage
            }
        });
    }

    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetItem(Guid id)
    {
        var result = await Mediator.Send(new GetItemQuery(id));
        return HandleResult(result);
    }

    [HttpPost]
    public async Task<IActionResult> CreateItem([FromBody] CreateItemCommand command)
    {
        var result = await Mediator.Send(command);
        return HandleResult(result);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateItem(Guid id, [FromBody] UpdateItemRequest request)
    {
        var command = new UpdateItemCommand(id, request.Title, request.Description, request.Price, request.Quantity);
        var result = await Mediator.Send(command);
        return HandleResult(result);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteItem(Guid id)
    {
        var result = await Mediator.Send(new DeleteItemCommand(id));
        return HandleResult(result);
    }
}

public record UpdateItemRequest(string Title, string Description, decimal Price, int Quantity);
```

## Docker Configuration

### Dockerfile

```dockerfile
# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy solution and project files
COPY *.sln .
COPY src/MyApi.Api/*.csproj ./src/MyApi.Api/
COPY src/MyApi.Application/*.csproj ./src/MyApi.Application/
COPY src/MyApi.Domain/*.csproj ./src/MyApi.Domain/
COPY src/MyApi.Infrastructure/*.csproj ./src/MyApi.Infrastructure/

# Restore dependencies
RUN dotnet restore

# Copy everything and build
COPY . .
RUN dotnet build -c Release --no-restore

# Publish
FROM build AS publish
RUN dotnet publish src/MyApi.Api/MyApi.Api.csproj -c Release -o /app/publish --no-build

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

# Create non-root user
RUN adduser --disabled-password --gecos "" appuser && chown -R appuser /app
USER appuser

COPY --from=publish /app/publish .

EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

ENTRYPOINT ["dotnet", "MyApi.Api.dll"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  api:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "5000:8080"
    environment:
      - ASPNETCORE_ENVIRONMENT=Development
      - ConnectionStrings__DefaultConnection=Host=postgres;Database=myapi_db;Username=postgres;Password=postgres
      - ConnectionStrings__Redis=redis:6379
      - JwtSettings__Secret=your-super-secret-key-with-at-least-32-characters-for-production
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started
    networks:
      - app-network

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: myapi_db
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - app-network

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - app-network

  seq:
    image: datalust/seq:latest
    environment:
      - ACCEPT_EULA=Y
    ports:
      - "5341:80"
    volumes:
      - seq_data:/data
    networks:
      - app-network

volumes:
  postgres_data:
  redis_data:
  seq_data:

networks:
  app-network:
    driver: bridge
```

## Testing

### CustomWebApplicationFactory.cs

```csharp
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using MyApi.Infrastructure.Persistence;

namespace MyApi.IntegrationTests;

public class CustomWebApplicationFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureServices(services =>
        {
            // Remove the existing DbContext registration
            var descriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(DbContextOptions<ApplicationDbContext>));
            if (descriptor != null)
                services.Remove(descriptor);

            // Add in-memory database
            services.AddDbContext<ApplicationDbContext>(options =>
            {
                options.UseInMemoryDatabase("TestDb");
            });

            // Build service provider
            var sp = services.BuildServiceProvider();

            // Create scope and initialize database
            using var scope = sp.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            db.Database.EnsureCreated();
        });
    }
}
```

### ItemsControllerTests.cs

```csharp
using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using MyApi.Application.Features.Auth.Commands;
using MyApi.Infrastructure.Persistence;
using Xunit;

namespace MyApi.IntegrationTests.Controllers;

public class ItemsControllerTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;
    private readonly CustomWebApplicationFactory _factory;

    public ItemsControllerTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    private async Task<string> GetAuthTokenAsync()
    {
        var response = await _client.PostAsJsonAsync("/api/auth/register", new
        {
            Email = $"test{Guid.NewGuid()}@example.com",
            Password = "Password123!",
            Name = "Test User"
        });

        var result = await response.Content.ReadFromJsonAsync<AuthResponseWrapper>();
        return result!.Data.AccessToken;
    }

    [Fact]
    public async Task GetItems_ReturnsEmptyList_WhenNoItems()
    {
        // Act
        var response = await _client.GetAsync("/api/items");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<ItemsResponse>();
        result!.Success.Should().BeTrue();
        result.Data.Should().BeEmpty();
    }

    [Fact]
    public async Task CreateItem_ReturnsCreatedItem_WhenAuthenticated()
    {
        // Arrange
        var token = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization = new("Bearer", token);

        var createRequest = new
        {
            Title = "Test Item",
            Description = "Test Description",
            Price = 99.99m,
            Quantity = 10
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/items", createRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<ItemResponse>();
        result!.Success.Should().BeTrue();
        result.Data.Title.Should().Be("Test Item");
    }

    [Fact]
    public async Task CreateItem_ReturnsUnauthorized_WhenNotAuthenticated()
    {
        // Arrange
        var createRequest = new
        {
            Title = "Test Item",
            Description = "Test Description",
            Price = 99.99m,
            Quantity = 10
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/items", createRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}

// Response DTOs for testing
public record AuthResponseWrapper(bool Success, AuthData Data);
public record AuthData(string AccessToken, string RefreshToken);
public record ItemsResponse(bool Success, List<ItemData> Data);
public record ItemResponse(bool Success, ItemData Data);
public record ItemData(Guid Id, string Title, string Description, decimal Price, int Quantity);
```

### CreateItemCommandTests.cs

```csharp
using FluentAssertions;
using Moq;
using MyApi.Application.Common.Interfaces;
using MyApi.Application.Features.Items.Commands;
using MyApi.Domain.Entities;
using Xunit;

namespace MyApi.UnitTests.Features.Items;

public class CreateItemCommandTests
{
    private readonly Mock<IUnitOfWork> _unitOfWorkMock;
    private readonly Mock<ICurrentUserService> _currentUserServiceMock;
    private readonly CreateItemCommandHandler _handler;

    public CreateItemCommandTests()
    {
        _unitOfWorkMock = new Mock<IUnitOfWork>();
        _currentUserServiceMock = new Mock<ICurrentUserService>();
        _handler = new CreateItemCommandHandler(_unitOfWorkMock.Object, _currentUserServiceMock.Object);
    }

    [Fact]
    public async Task Handle_ReturnsSuccess_WhenUserAuthenticated()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _currentUserServiceMock.Setup(x => x.UserId).Returns(userId);

        var itemRepoMock = new Mock<IRepository<Item>>();
        _unitOfWorkMock.Setup(x => x.Items).Returns(itemRepoMock.Object);

        var command = new CreateItemCommand("Test Item", "Description", 99.99m, 10);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().NotBeNull();
        result.Value!.Title.Should().Be("Test Item");

        itemRepoMock.Verify(x => x.AddAsync(It.IsAny<Item>(), It.IsAny<CancellationToken>()), Times.Once);
        _unitOfWorkMock.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_ReturnsFailure_WhenUserNotAuthenticated()
    {
        // Arrange
        _currentUserServiceMock.Setup(x => x.UserId).Returns((Guid?)null);

        var command = new CreateItemCommand("Test Item", "Description", 99.99m, 10);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.ErrorCode.Should().Be("UNAUTHORIZED");
    }
}
```

## CLAUDE.md Integration

```markdown
# .NET Core Web API Project

## Build & Run
- `dotnet build` - Build solution
- `dotnet run --project src/MyApi.Api` - Run API
- `dotnet watch --project src/MyApi.Api` - Run with hot reload
- `dotnet test` - Run all tests
- `dotnet ef migrations add <Name> --project src/MyApi.Infrastructure --startup-project src/MyApi.Api` - Add migration
- `dotnet ef database update --project src/MyApi.Infrastructure --startup-project src/MyApi.Api` - Apply migrations

## Architecture
- **Clean Architecture**: Domain → Application → Infrastructure → API
- **CQRS Pattern**: Commands (write) and Queries (read) separated via MediatR
- **Repository Pattern**: Generic repository with Unit of Work
- **Domain Events**: Decouple domain logic from infrastructure

## Code Patterns
- All domain logic in Domain entities (rich domain model)
- FluentValidation for request validation
- Mapster for object mapping
- Result<T> pattern for operation results
- Global exception handling via middleware

## Testing
- Unit tests: Domain and Application layer logic
- Integration tests: API endpoints with in-memory database
- Use CustomWebApplicationFactory for integration test setup

## Key Files
- `Program.cs` - Application configuration and DI
- `ApplicationDbContext.cs` - EF Core context with configurations
- `BaseController.cs` - Shared controller logic
- `ExceptionMiddleware.cs` - Global error handling

## Environment Variables
- `ConnectionStrings__DefaultConnection` - PostgreSQL connection
- `ConnectionStrings__Redis` - Redis connection
- `JwtSettings__Secret` - JWT signing key (min 32 chars)
```

## AI Suggestions

1. **Add Health Checks**: Implement health check endpoints for database, Redis, and external dependencies using `AspNetCore.HealthChecks` packages.

2. **Implement API Versioning**: Add API versioning with `Microsoft.AspNetCore.Mvc.Versioning` for backward compatibility as the API evolves.

3. **Add Response Caching**: Implement distributed caching with Redis for frequently accessed read endpoints.

4. **Background Job Processing**: Add Hangfire or Quartz.NET for scheduled jobs and background task processing.

5. **Add Request/Response Logging**: Enhance logging to capture request/response bodies (sanitized) for debugging and auditing.

6. **Implement Idempotency Keys**: Add idempotency support for POST/PUT operations to handle retries safely.

7. **Add GraphQL Support**: Consider adding HotChocolate for GraphQL alongside REST for flexible querying.

8. **Implement Outbox Pattern**: Add transactional outbox for reliable event publishing to message queues.

9. **Add API Documentation**: Generate XML comments and enhance Swagger with examples using Swashbuckle.AspNetCore.Filters.

10. **Implement Feature Flags**: Add LaunchDarkly or custom feature flag system for gradual feature rollouts and A/B testing.
