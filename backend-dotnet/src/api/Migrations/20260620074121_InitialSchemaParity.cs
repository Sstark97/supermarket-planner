using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SupermarketPlanner.Api.Migrations
{
    /// <inheritdoc />
    public partial class InitialSchemaParity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ActiveCart",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    userId = table.Column<string>(type: "text", nullable: false),
                    updatedAt = table.Column<DateTime>(type: "timestamp(3) without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ActiveCart", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "PricingZone",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false),
                    name = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PricingZone", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "Product",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    name = table.Column<string>(type: "text", nullable: false),
                    supermarket = table.Column<string>(type: "text", nullable: false),
                    category = table.Column<string>(type: "text", nullable: false),
                    sku = table.Column<string>(type: "text", nullable: false),
                    unit = table.Column<string>(type: "text", nullable: false),
                    image = table.Column<string>(type: "text", nullable: true),
                    url = table.Column<string>(type: "text", nullable: true),
                    taxType = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Product", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "ProductCategoryCache",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    normalizedName = table.Column<string>(type: "text", nullable: false),
                    category = table.Column<string>(type: "text", nullable: false),
                    createdAt = table.Column<DateTime>(type: "timestamp(3) without time zone", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProductCategoryCache", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "ShoppingSession",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    userId = table.Column<string>(type: "text", nullable: false),
                    shoppedAt = table.Column<DateTime>(type: "timestamp(3) without time zone", nullable: false),
                    totalPrice = table.Column<double>(type: "double precision", nullable: false),
                    createdAt = table.Column<DateTime>(type: "timestamp(3) without time zone", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ShoppingSession", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "ZoneOnboardingQueue",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    postalCode = table.Column<string>(type: "text", nullable: false),
                    requestedDay = table.Column<DateTime>(type: "timestamp(3) without time zone", nullable: false),
                    state = table.Column<string>(type: "text", nullable: false, defaultValue: "PENDING"),
                    attempts = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    requestedByUserId = table.Column<string>(type: "text", nullable: true),
                    errorMessage = table.Column<string>(type: "text", nullable: true),
                    processedAt = table.Column<DateTime>(type: "timestamp(3) without time zone", nullable: true),
                    createdAt = table.Column<DateTime>(type: "timestamp(3) without time zone", nullable: false, defaultValueSql: "now()"),
                    updatedAt = table.Column<DateTime>(type: "timestamp(3) without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ZoneOnboardingQueue", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "ActiveCartItem",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    cartId = table.Column<string>(type: "text", nullable: false),
                    productId = table.Column<string>(type: "text", nullable: false),
                    productName = table.Column<string>(type: "text", nullable: false),
                    supermarket = table.Column<string>(type: "text", nullable: false),
                    category = table.Column<string>(type: "text", nullable: false),
                    price = table.Column<double>(type: "double precision", nullable: false),
                    pricePerUnit = table.Column<double>(type: "double precision", nullable: false),
                    unit = table.Column<string>(type: "text", nullable: false),
                    taxType = table.Column<string>(type: "text", nullable: false),
                    quantity = table.Column<int>(type: "integer", nullable: false),
                    image = table.Column<string>(type: "text", nullable: true),
                    url = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ActiveCartItem", x => x.id);
                    table.ForeignKey(
                        name: "FK_ActiveCartItem_ActiveCart_cartId",
                        column: x => x.cartId,
                        principalTable: "ActiveCart",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PostalCode",
                columns: table => new
                {
                    code = table.Column<string>(type: "text", nullable: false),
                    zoneId = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PostalCode", x => x.code);
                    table.ForeignKey(
                        name: "FK_PostalCode_PricingZone_zoneId",
                        column: x => x.zoneId,
                        principalTable: "PricingZone",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ProductPrice",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    productId = table.Column<string>(type: "text", nullable: false),
                    zoneId = table.Column<string>(type: "text", nullable: false),
                    price = table.Column<double>(type: "double precision", nullable: false),
                    pricePerUnit = table.Column<double>(type: "double precision", nullable: false),
                    scrapedAt = table.Column<DateTime>(type: "timestamp(3) without time zone", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProductPrice", x => x.id);
                    table.ForeignKey(
                        name: "FK_ProductPrice_PricingZone_zoneId",
                        column: x => x.zoneId,
                        principalTable: "PricingZone",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ProductPrice_Product_productId",
                        column: x => x.productId,
                        principalTable: "Product",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ShoppingSessionItem",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    sessionId = table.Column<string>(type: "text", nullable: false),
                    productName = table.Column<string>(type: "text", nullable: false),
                    supermarket = table.Column<string>(type: "text", nullable: false),
                    category = table.Column<string>(type: "text", nullable: false),
                    price = table.Column<double>(type: "double precision", nullable: false),
                    pricePerUnit = table.Column<double>(type: "double precision", nullable: false),
                    unit = table.Column<string>(type: "text", nullable: false),
                    taxType = table.Column<string>(type: "text", nullable: false),
                    quantity = table.Column<int>(type: "integer", nullable: false),
                    image = table.Column<string>(type: "text", nullable: true),
                    url = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ShoppingSessionItem", x => x.id);
                    table.ForeignKey(
                        name: "FK_ShoppingSessionItem_ShoppingSession_sessionId",
                        column: x => x.sessionId,
                        principalTable: "ShoppingSession",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ActiveCart_userId",
                table: "ActiveCart",
                column: "userId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ActiveCartItem_cartId",
                table: "ActiveCartItem",
                column: "cartId");

            migrationBuilder.CreateIndex(
                name: "IX_ActiveCartItem_cartId_supermarket_productName",
                table: "ActiveCartItem",
                columns: new[] { "cartId", "supermarket", "productName" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PostalCode_zoneId",
                table: "PostalCode",
                column: "zoneId");

            migrationBuilder.CreateIndex(
                name: "IX_PricingZone_name",
                table: "PricingZone",
                column: "name");

            migrationBuilder.CreateIndex(
                name: "IX_Product_category",
                table: "Product",
                column: "category");

            migrationBuilder.CreateIndex(
                name: "IX_Product_name",
                table: "Product",
                column: "name");

            migrationBuilder.CreateIndex(
                name: "IX_Product_supermarket",
                table: "Product",
                column: "supermarket");

            migrationBuilder.CreateIndex(
                name: "IX_Product_supermarket_sku",
                table: "Product",
                columns: new[] { "supermarket", "sku" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ProductCategoryCache_normalizedName",
                table: "ProductCategoryCache",
                column: "normalizedName",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ProductPrice_productId",
                table: "ProductPrice",
                column: "productId");

            migrationBuilder.CreateIndex(
                name: "IX_ProductPrice_productId_zoneId",
                table: "ProductPrice",
                columns: new[] { "productId", "zoneId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ProductPrice_zoneId",
                table: "ProductPrice",
                column: "zoneId");

            migrationBuilder.CreateIndex(
                name: "IX_ShoppingSession_shoppedAt",
                table: "ShoppingSession",
                column: "shoppedAt");

            migrationBuilder.CreateIndex(
                name: "IX_ShoppingSession_userId",
                table: "ShoppingSession",
                column: "userId");

            migrationBuilder.CreateIndex(
                name: "IX_ShoppingSessionItem_sessionId",
                table: "ShoppingSessionItem",
                column: "sessionId");

            migrationBuilder.CreateIndex(
                name: "IX_ZoneOnboardingQueue_postalCode",
                table: "ZoneOnboardingQueue",
                column: "postalCode");

            migrationBuilder.CreateIndex(
                name: "IX_ZoneOnboardingQueue_postalCode_requestedDay",
                table: "ZoneOnboardingQueue",
                columns: new[] { "postalCode", "requestedDay" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ZoneOnboardingQueue_state_requestedDay",
                table: "ZoneOnboardingQueue",
                columns: new[] { "state", "requestedDay" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ActiveCartItem");

            migrationBuilder.DropTable(
                name: "PostalCode");

            migrationBuilder.DropTable(
                name: "ProductCategoryCache");

            migrationBuilder.DropTable(
                name: "ProductPrice");

            migrationBuilder.DropTable(
                name: "ShoppingSessionItem");

            migrationBuilder.DropTable(
                name: "ZoneOnboardingQueue");

            migrationBuilder.DropTable(
                name: "ActiveCart");

            migrationBuilder.DropTable(
                name: "PricingZone");

            migrationBuilder.DropTable(
                name: "Product");

            migrationBuilder.DropTable(
                name: "ShoppingSession");
        }
    }
}
