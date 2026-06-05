import type {
	ShoppingSessionMetricsSnapshot,
	ShoppingSessionRepository,
	ShoppingSessionTrendPointSnapshot,
} from "@application/ports/outgoing/ShoppingSessionRepository";
import type { ShoppingSession } from "@domain/entities/ShoppingSession";
import { prisma } from "./prisma";
import { PrismaShoppingSessionMapper } from "./PrismaShoppingSessionMapper";

export class PrismaShoppingSessionRepository
	implements ShoppingSessionRepository
{
	async save(session: ShoppingSession): Promise<ShoppingSession> {
		const createPayload = PrismaShoppingSessionMapper.toCreatePayload(session);

		const savedRecord = await prisma.shoppingSession.create({
			data: createPayload,
			include: { items: true },
		});

		return PrismaShoppingSessionMapper.toDomainEntity(savedRecord);
	}

	async findByUserId(userId: string): Promise<ShoppingSession[]> {
		const records = await prisma.shoppingSession.findMany({
			where: { userId },
			orderBy: [{ shoppedAt: "desc" }, { createdAt: "desc" }],
			include: { items: true },
		});

		return records.map((record) =>
			PrismaShoppingSessionMapper.toDomainEntity(record),
		);
	}

	async deleteByIdForUser(sessionId: string, userId: string): Promise<boolean> {
		const result = await prisma.shoppingSession.deleteMany({
			where: {
				id: sessionId,
				userId,
			},
		});

		return result.count > 0;
	}

	async getMetricsForUser(
		userId: string,
	): Promise<ShoppingSessionMetricsSnapshot> {
		const [
			ticketAggregate,
			supermarketDominanceRows,
			weeklyAverageRows,
			monthlyTotalRows,
			yearlyTotalRows,
			frequentDayRows,
		] = await Promise.all([
			prisma.shoppingSession.aggregate({
				where: { userId },
				_sum: { totalPrice: true },
				_avg: { totalPrice: true },
				_count: { id: true },
			}),
			prisma.$queryRaw<
				Array<{ supermarket: string; totalSpent: number; totalItems: bigint }>
			>`
					SELECT
						si."supermarket" AS "supermarket",
						COALESCE(SUM(si."price" * si."quantity"), 0)::double precision AS "totalSpent",
						COALESCE(SUM(si."quantity"), 0)::bigint AS "totalItems"
					FROM "ShoppingSessionItem" si
					INNER JOIN "ShoppingSession" ss ON ss."id" = si."sessionId"
					WHERE ss."userId" = ${userId}
					GROUP BY si."supermarket"
					ORDER BY "totalSpent" DESC
				`,
			this.fetchTrendRows(userId, "week", "YYYY-MM-DD", true),
			this.fetchTrendRows(userId, "month", "YYYY-MM", false),
			this.fetchTrendRows(userId, "year", "YYYY", false),
			prisma.$queryRaw<Array<{ dayOfWeek: number; totalTickets: bigint }>>`
					SELECT
						EXTRACT(DOW FROM ss."shoppedAt")::int AS "dayOfWeek",
						COUNT(*)::bigint AS "totalTickets"
					FROM "ShoppingSession" ss
					WHERE ss."userId" = ${userId}
					GROUP BY EXTRACT(DOW FROM ss."shoppedAt")::int
					ORDER BY "totalTickets" DESC, "dayOfWeek" ASC
					LIMIT 1
				`,
		]);

		const mostFrequentGroceryDay =
			frequentDayRows.length > 0
				? this.mapDayOfWeekToLabel(frequentDayRows[0].dayOfWeek)
				: null;

		return {
			supermarketDominance: supermarketDominanceRows.map((row) => ({
				supermarket: row.supermarket,
				totalSpent: row.totalSpent,
				totalItems: Number(row.totalItems),
			})),
			spendingTrends: {
				weeklyAverage: weeklyAverageRows,
				monthlyTotal: monthlyTotalRows,
				yearlyTotal: yearlyTotalRows,
			},
			ticketMetrics: {
				averageTicketCost: ticketAggregate._avg.totalPrice ?? 0,
				totalSpentToDate: ticketAggregate._sum.totalPrice ?? 0,
				totalTickets: ticketAggregate._count.id,
				mostFrequentGroceryDay,
			},
		};
	}

	private async fetchTrendRows(
		userId: string,
		bucket: "week" | "month" | "year",
		format: "YYYY-MM-DD" | "YYYY-MM" | "YYYY",
		useAverage: boolean,
	): Promise<ShoppingSessionTrendPointSnapshot[]> {
		const operation = useAverage
			? prisma.$queryRaw<Array<{ period: string; amount: number }>>`
				SELECT
					TO_CHAR(DATE_TRUNC(${bucket}, ss."shoppedAt"), ${format}) AS "period",
					COALESCE(AVG(ss."totalPrice"), 0)::double precision AS "amount"
				FROM "ShoppingSession" ss
				WHERE ss."userId" = ${userId}
				GROUP BY DATE_TRUNC(${bucket}, ss."shoppedAt")
				ORDER BY DATE_TRUNC(${bucket}, ss."shoppedAt") ASC
			`
			: prisma.$queryRaw<Array<{ period: string; amount: number }>>`
				SELECT
					TO_CHAR(DATE_TRUNC(${bucket}, ss."shoppedAt"), ${format}) AS "period",
					COALESCE(SUM(ss."totalPrice"), 0)::double precision AS "amount"
				FROM "ShoppingSession" ss
				WHERE ss."userId" = ${userId}
				GROUP BY DATE_TRUNC(${bucket}, ss."shoppedAt")
				ORDER BY DATE_TRUNC(${bucket}, ss."shoppedAt") ASC
			`;

		return operation;
	}

	private mapDayOfWeekToLabel(dayOfWeek: number): string {
		switch (dayOfWeek) {
			case 0:
				return "Domingo";
			case 1:
				return "Lunes";
			case 2:
				return "Martes";
			case 3:
				return "Miércoles";
			case 4:
				return "Jueves";
			case 5:
				return "Viernes";
			default:
				return "Sábado";
		}
	}
}
