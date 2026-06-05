import type { ShoppingSessionMetricsApiSnapshot } from "./ShoppingHistoryMetricsContracts";
import type { ShoppingHistoryInsightsModel } from "./ShoppingHistoryMetricsContracts";
import { ShoppingHistoryMetricsChartMapper } from "./ShoppingHistoryMetricsChartMapper";
import { ShoppingHistoryMetricsFormatter } from "./ShoppingHistoryMetricsFormatter";

export class ShoppingHistoryInsightsModelAssembler {
	constructor(
		private readonly chartMapper: ShoppingHistoryMetricsChartMapper,
		private readonly metricsFormatter: ShoppingHistoryMetricsFormatter,
	) {}

	assemble(
		apiSnapshot: ShoppingSessionMetricsApiSnapshot,
	): ShoppingHistoryInsightsModel {
		const snapshot = this.chartMapper.toInsightsSnapshot(apiSnapshot);
		const formattedTicketMetrics = this.metricsFormatter.formatTicketMetrics(
			snapshot.ticketMetrics,
		);

		return {
			snapshot,
			formattedTicketMetrics,
		};
	}
}
