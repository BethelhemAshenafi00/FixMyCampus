using FixMyCampus.Infrastructure.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FixMyCampus.Infrastructure.Migrations;

[DbContext(typeof(AppDbContext))]
[Migration("20261005145500_AddUserDepartmentAndUniqueEmail")]
public partial class AddUserDepartmentAndUniqueEmail : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "Department",
            table: "Users",
            type: "text",
            nullable: true);

        migrationBuilder.Sql(
            """UPDATE "Users" SET "Email" = lower(trim("Email"));""");

        migrationBuilder.CreateIndex(
            name: "IX_Users_Email",
            table: "Users",
            column: "Email",
            unique: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex(
            name: "IX_Users_Email",
            table: "Users");

        migrationBuilder.DropColumn(
            name: "Department",
            table: "Users");
    }
}
