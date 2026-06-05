"use client";

import { useState } from "react";
import { useSession, signIn } from "next-auth/react";
import Link from "next/link";
import { History, ShoppingBasket } from "lucide-react";
import { ClientContainerDI } from "@/lib/di/ClientContainerDI";
import { TimelinePanel } from "@/features/shopping-history/components/TimelinePanel";
import { TicketDetail } from "@/features/shopping-history/components/TicketDetail";
import { DeleteShoppingSessionConfirmationDialog } from "@/features/shopping-history/components/DeleteShoppingSessionConfirmationDialog";
import { ShoppingHistoryInsightsPanel } from "@/features/shopping-history/components/ShoppingHistoryInsightsPanel";
import {
	ShoppingHistoryViewTabs,
	type ShoppingHistoryViewMode,
} from "@/features/shopping-history/components/ShoppingHistoryViewTabs";
import { useShoppingHistoryState } from "@/features/shopping-history/hooks/useShoppingHistoryState";
import { useShoppingHistoryMetrics } from "@/features/shopping-history/hooks/useShoppingHistoryMetrics";
import { ShoppingHistoryDateFormatter } from "@/features/shopping-history/model/ShoppingHistoryDateFormatter";
import { ShoppingHistoryTimelineGrouper } from "@/features/shopping-history/model/ShoppingHistoryTimelineGrouper";
import { ShoppingHistoryEntryFilter } from "@/features/shopping-history/model/ShoppingHistoryEntryFilter";
import { ShoppingHistoryBreakdownCalculator } from "@/features/shopping-history/model/ShoppingHistoryBreakdownCalculator";
import { ShoppingHistoryAccordionStateProjector } from "@/features/shopping-history/model/ShoppingHistoryAccordionStateProjector";
import { ShoppingHistoryDeleteCoordinator } from "@/features/shopping-history/model/ShoppingHistoryDeleteCoordinator";
import { ShoppingHistoryMetricsChartMapper } from "@/features/shopping-history/model/ShoppingHistoryMetricsChartMapper";
import { ShoppingHistoryMetricsFormatter } from "@/features/shopping-history/model/ShoppingHistoryMetricsFormatter";
import { ShoppingHistoryInsightsModelAssembler } from "@/features/shopping-history/model/ShoppingHistoryInsightsModelAssembler";

const shoppingSessionGateway =
	new ClientContainerDI().resolveShoppingSessionGateway();
const dateFormatter = new ShoppingHistoryDateFormatter();
const timelineGrouper = new ShoppingHistoryTimelineGrouper(dateFormatter);
const entryFilter = new ShoppingHistoryEntryFilter();
const breakdownCalculator = new ShoppingHistoryBreakdownCalculator();
const accordionStateProjector = new ShoppingHistoryAccordionStateProjector();
const deleteCoordinator = new ShoppingHistoryDeleteCoordinator(
	shoppingSessionGateway,
);
const metricsChartMapper = new ShoppingHistoryMetricsChartMapper();
const metricsFormatter = new ShoppingHistoryMetricsFormatter();
const insightsModelAssembler = new ShoppingHistoryInsightsModelAssembler(
	metricsChartMapper,
	metricsFormatter,
);

export default function ShoppingHistoryPage(): React.ReactElement {
	const { data: session, status } = useSession();
	const [activeView, setActiveView] =
		useState<ShoppingHistoryViewMode>("history");
	const {
		filteredEntries,
		groupedEntries,
		supermarketOptions,
		selectedSessionId,
		selectedEntry,
		isLoading,
		errorMessage,
		mobileViewMode,
		searchTerm,
		supermarketFilter,
		openYearKeys,
		openMonthKeys,
		setSearchTerm,
		setSupermarketFilter,
		handleToggleYear,
		handleToggleMonth,
		handleSelectSession,
		setSelectedSessionId,
		setMobileViewMode,
		isDeleteDialogOpen,
		isDeletingSession,
		openDeleteConfirmation,
		closeDeleteConfirmation,
		confirmDeleteSession,
	} = useShoppingHistoryState(status, {
		shoppingSessionGateway,
		entryFilter,
		timelineGrouper,
		accordionStateProjector,
		deleteCoordinator,
	});

	const {
		metrics,
		isLoading: isMetricsLoading,
		errorMessage: metricsErrorMessage,
	} = useShoppingHistoryMetrics(status, activeView === "insights", {
		shoppingSessionGateway,
		modelAssembler: insightsModelAssembler,
	});

	if (status === "loading" || isLoading) {
		return (
			<div className="max-w-7xl mx-auto px-4 py-10">
				<div className="animate-pulse space-y-4">
					<div className="h-8 w-64 bg-slate-200 rounded" />
					<div className="h-24 w-full bg-slate-100 rounded-2xl" />
					<div className="h-80 w-full bg-slate-100 rounded-2xl" />
				</div>
			</div>
		);
	}

	if (!session?.user) {
		return (
			<div className="max-w-2xl mx-auto px-4 py-16">
				<div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
					<History className="mx-auto mb-4 text-slate-500" size={32} />
					<h1 className="text-2xl font-bold text-slate-900 mb-2">
						Historial de compras
					</h1>
					<p className="text-slate-600 mb-6">
						Iniciá sesión para ver tus listas guardadas y su evolución de gasto.
					</p>
					<button
						onClick={() => void signIn("google")}
						className="px-5 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors"
					>
						Iniciar sesión con Google
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
			<div className="flex flex-wrap items-center justify-between gap-4">
				<div className="space-y-3">
					<div>
						<h1 className="text-2xl font-bold text-slate-900">
							Historial de compras
						</h1>
						<p className="text-slate-600 mt-1">
							Revisá tus listas pasadas, totales y distribución por
							supermercado.
						</p>
					</div>
					<ShoppingHistoryViewTabs
						activeView={activeView}
						onViewChange={setActiveView}
					/>
				</div>
				<Link
					href="/"
					className="inline-flex items-center gap-2 px-4 py-2.5 min-h-11 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 font-medium"
				>
					<ShoppingBasket size={18} />
					Volver a productos
				</Link>
			</div>

			{errorMessage && (
				<div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700">
					{errorMessage}
				</div>
			)}

			{activeView === "insights" ? (
				<ShoppingHistoryInsightsPanel
					metrics={metrics}
					isLoading={isMetricsLoading}
					errorMessage={metricsErrorMessage}
				/>
			) : filteredEntries.length === 0 ? (
				<div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-600">
					No encontramos compras para esos filtros.
				</div>
			) : (
				<>
					<div className="hidden md:grid md:grid-cols-[340px_1fr] gap-6">
						<TimelinePanel
							groups={groupedEntries}
							selectedSessionId={selectedSessionId}
							onSelectSession={(sessionId) => setSelectedSessionId(sessionId)}
							searchTerm={searchTerm}
							onSearchTermChange={setSearchTerm}
							supermarketFilter={supermarketFilter}
							onSupermarketFilterChange={setSupermarketFilter}
							supermarketOptions={supermarketOptions}
							openYearKeys={openYearKeys}
							onToggleYear={handleToggleYear}
							openMonthKeys={openMonthKeys}
							onToggleMonth={handleToggleMonth}
							dateFormatter={dateFormatter}
							breakdownCalculator={breakdownCalculator}
						/>
						<TicketDetail
							entry={selectedEntry}
							isMobile={false}
							dateFormatter={dateFormatter}
							breakdownCalculator={breakdownCalculator}
							onDeleteRequest={openDeleteConfirmation}
						/>
					</div>

					<div className="md:hidden">
						{mobileViewMode === "list" ? (
							<div className="animate-in slide-in-from-left-4 fade-in-0 duration-200">
								<TimelinePanel
									groups={groupedEntries}
									selectedSessionId={selectedSessionId}
									onSelectSession={handleSelectSession}
									searchTerm={searchTerm}
									onSearchTermChange={setSearchTerm}
									supermarketFilter={supermarketFilter}
									onSupermarketFilterChange={setSupermarketFilter}
									supermarketOptions={supermarketOptions}
									openYearKeys={openYearKeys}
									onToggleYear={handleToggleYear}
									openMonthKeys={openMonthKeys}
									onToggleMonth={handleToggleMonth}
									dateFormatter={dateFormatter}
									breakdownCalculator={breakdownCalculator}
								/>
							</div>
						) : (
							<div className="animate-in slide-in-from-right-4 fade-in-0 duration-200">
								<TicketDetail
									entry={selectedEntry}
									isMobile
									onBackToList={() => setMobileViewMode("list")}
									dateFormatter={dateFormatter}
									breakdownCalculator={breakdownCalculator}
									onDeleteRequest={openDeleteConfirmation}
								/>
							</div>
						)}
					</div>
				</>
			)}
			<DeleteShoppingSessionConfirmationDialog
				isOpen={isDeleteDialogOpen}
				isDeleting={isDeletingSession}
				onCancel={closeDeleteConfirmation}
				onConfirm={() => {
					void confirmDeleteSession();
				}}
			/>
		</div>
	);
}
