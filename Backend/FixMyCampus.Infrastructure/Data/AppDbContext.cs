using FixMyCampus.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace FixMyCampus.Infrastructure.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(
        DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<Users> Users => Set<Users>();

    public DbSet<Issue> Issues => Set<Issue>();

    public DbSet<IssueHistory> IssueStatusHistories
        => Set<IssueHistory>();

    protected override void OnModelCreating(
        ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Users>()
            .HasIndex(user => user.Email)
            .HasDatabaseName("IX_Users_Email")
            .IsUnique();

        modelBuilder.ApplyConfigurationsFromAssembly(
            typeof(AppDbContext).Assembly);
    }
}