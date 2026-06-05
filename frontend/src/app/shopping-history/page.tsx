"use client";

import { useEffect, useState } from "react";
import { useSession, signIn } from "next-auth/react";
import Link from "next/link";
import {
	ChevronDown,
	ChevronLeft,
	History,
	Search,
	ShoppingBasket,
	Store,
} from "lucide-react";
import { ClientContainerDI } from "@/lib/di/ClientContainerDI";
import { getAuthToken } from "@/lib/auth/getAuthToken";
import type { ShoppingSessionHistoryEntry } from "@/lib/http/ShoppingSessionGateway";

const shoppingSessionGateway =
	new ClientContainerDI().resolveShoppingSessionGateway();

type ViewMode = "list" | "detail";

interface MonthGroup {
	monthKey: string;
	monthLabel: string;
	entries: ShoppingSessionHistoryEntry[];
}

interface YearGroup {
	yearKey: string;
	yearLabel: string;
	months: MonthGroup[];
}

function formatDate(iso: string): string {
	return new Date(iso).toLocaleDateString("es-ES", {
		year: "numeric",
		month: "long",
		day: "numeric",
	});
}

function formatDateTime(iso: string): string {
	return new Date(iso).toLocaleString("es-ES", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
	});
}

function sumSessionItems(entry: ShoppingSessionHistoryEntry): number {
	return entry.items.reduce((acc, item) => acc + item.quantity, 0);
}

function buildYearMonthGroups(
	entries: ShoppingSessionHistoryEntry[],
): YearGroup[] {
	const grouped: Record<
		string,
		Record<string, ShoppingSessionHistoryEntry[]>
	> = {};

	for (const entry of entries) {
		const date = new Date(entry.shoppedAt);
		const yearKey = String(date.getFullYear());
		const monthNumber = String(date.getMonth() + 1).padStart(2, "0");
		const monthKey = `${yearKey}-${monthNumber}`;

		if (!grouped[yearKey]) {
			grouped[yearKey] = {};
		}
		if (!grouped[yearKey][monthKey]) {
			grouped[yearKey][monthKey] = [];
		}
		grouped[yearKey][monthKey].push(entry);
	}

	return Object.keys(grouped)
		.sort((a, b) => Number(b) - Number(a))
		.map((yearKey) => {
			const months = Object.keys(grouped[yearKey])
				.sort((a, b) => b.localeCompare(a))
				.map((monthKey) => {
					const [year, month] = monthKey.split("-");
					const monthLabel = new Date(Number(year), Number(month) - 1, 1)
						.toLocaleDateString("es-ES", {
							month: "long",
							year: "numeric",
						})
						.replace(/^./, (char) => char.toUpperCase());

					return {
						monthKey,
						monthLabel,
						entries: grouped[yearKey][monthKey],
					};
				});

			return {
				yearKey,
				yearLabel: yearKey,
				months,
			};
		});
}

function buildSupermarketBreakdown(
	entry: ShoppingSessionHistoryEntry,
): Record<string, { total: number; items: number }> {
	return entry.items.reduce<Record<string, { total: number; items: number }>>(
		(acc, item) => {
			if (!acc[item.supermarket]) {
				acc[item.supermarket] = { total: 0, items: 0 };
			}
			acc[item.supermarket].total += item.price * item.quantity;
			acc[item.supermarket].items += item.quantity;
			return acc;
		},
		{},
	);
}

function haveSameKeys(a: string[], b: string[]): boolean {
	if (a.length !== b.length) {
		return false;
	}

	return a.every((key, index) => key === b[index]);
}

interface TimelinePanelProps {
	groups: YearGroup[];
	selectedSessionId: string | null;
	onSelectSession: (sessionId: string) => void;
	searchTerm: string;
	onSearchTermChange: (value: string) => void;
	supermarketFilter: string;
	onSupermarketFilterChange: (value: string) => void;
	supermarketOptions: string[];
	openYearKeys: string[];
	onToggleYear: (yearKey: string) => void;
	openMonthKeys: string[];
	onToggleMonth: (monthKey: string) => void;
}

function TimelinePanel({
	groups,
	selectedSessionId,
	onSelectSession,
	searchTerm,
	onSearchTermChange,
	supermarketFilter,
	onSupermarketFilterChange,
	supermarketOptions,
	openYearKeys,
	onToggleYear,
	openMonthKeys,
	onToggleMonth,
}: TimelinePanelProps): React.ReactElement {
	return (
		<aside className="bg-white border border-slate-200 rounded-2xl p-4 h-fit space-y-4">
			<div>
				<h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
					Timeline de compras
				</h2>
				<div className="space-y-3">
					<div className="relative">
						<Search
							size={16}
							className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
						/>
						<input
							type="text"
							value={searchTerm}
							onChange={(event) => onSearchTermChange(event.target.value)}
							placeholder="Buscar producto..."
							className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
						/>
					</div>

					<div className="flex flex-wrap items-center gap-1.5 md:gap-2">
						<button
							onClick={() => onSupermarketFilterChange("all")}
							className={`px-2.5 py-1 md:px-3 md:py-1.5 rounded-full text-[11px] md:text-xs font-semibold whitespace-nowrap border transition-colors ${
								supermarketFilter === "all"
									? "bg-slate-900 text-white border-slate-900"
									: "bg-white text-slate-700 border-slate-200 hover:border-slate-400"
							}`}
						>
							Todos
						</button>
						{supermarketOptions.map((supermarket) => {
							const isActive = supermarketFilter === supermarket;
							return (
								<button
									key={supermarket}
									onClick={() => onSupermarketFilterChange(supermarket)}
									className={`px-2.5 py-1 md:px-3 md:py-1.5 rounded-full text-[11px] md:text-xs font-semibold whitespace-nowrap border transition-colors capitalize ${
										isActive
											? "bg-slate-900 text-white border-slate-900"
											: "bg-white text-slate-700 border-slate-200 hover:border-slate-400"
									}`}
								>
									<Store size={11} className="inline mr-0.5 md:mr-1" />
									{supermarket}
								</button>
							);
						})}
					</div>
				</div>
			</div>

			<div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
				{groups.map((yearGroup) => {
					const isYearOpen = openYearKeys.includes(yearGroup.yearKey);
					const yearCount = yearGroup.months.reduce(
						(acc, monthGroup) => acc + monthGroup.entries.length,
						0,
					);

					return (
						<div
							key={yearGroup.yearKey}
							className="border border-slate-200 rounded-xl"
						>
							<button
								onClick={() => onToggleYear(yearGroup.yearKey)}
								className="w-full px-3 py-2.5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
							>
								<span className="font-semibold text-slate-800">
									{yearGroup.yearLabel} ({yearCount})
								</span>
								<ChevronDown
									size={16}
									className={`text-slate-500 transition-transform ${isYearOpen ? "rotate-180" : ""}`}
								/>
							</button>

							{isYearOpen && (
								<div className="px-2 pb-2 space-y-2">
									{yearGroup.months.map((monthGroup) => {
										const isMonthOpen = openMonthKeys.includes(
											monthGroup.monthKey,
										);
										return (
											<div
												key={monthGroup.monthKey}
												className="border border-slate-100 rounded-lg"
											>
												<button
													onClick={() => onToggleMonth(monthGroup.monthKey)}
													className="w-full px-2.5 py-2 text-left flex items-center justify-between hover:bg-slate-50 transition-colors"
												>
													<span className="text-sm font-medium text-slate-700">
														{monthGroup.monthLabel} ({monthGroup.entries.length}
														)
													</span>
													<ChevronDown
														size={14}
														className={`text-slate-400 transition-transform ${isMonthOpen ? "rotate-180" : ""}`}
													/>
												</button>

												{isMonthOpen && (
													<ul className="px-2 pb-2 space-y-1.5">
														{monthGroup.entries.map((entry) => {
															const isSelected =
																selectedSessionId === entry.sessionId;
															return (
																<li key={entry.sessionId}>
																	<button
																		onClick={() =>
																			onSelectSession(entry.sessionId)
																		}
																		className={`w-full text-left p-2.5 rounded-lg border transition-colors ${
																			isSelected
																				? "border-slate-900 bg-slate-900 text-white"
																				: "border-slate-200 hover:border-slate-300"
																		}`}
																	>
																		<p className="text-sm font-semibold">
																			{entry.totalPrice.toFixed(2)}€
																		</p>
																		<p
																			className={`text-xs ${isSelected ? "text-white/80" : "text-slate-500"}`}
																		>
																			{formatDate(entry.shoppedAt)} ·{" "}
																			{sumSessionItems(entry)} uds
																		</p>
																	</button>
																</li>
															);
														})}
													</ul>
												)}
											</div>
										);
									})}
								</div>
							)}
						</div>
					);
				})}
			</div>
		</aside>
	);
}

interface TicketDetailProps {
	entry: ShoppingSessionHistoryEntry | null;
	onBackToList?: () => void;
	isMobile: boolean;
}

function TicketDetail({
	entry,
	onBackToList,
	isMobile,
}: TicketDetailProps): React.ReactElement {
	if (!entry) {
		return (
			<section className="bg-white border border-slate-200 rounded-2xl p-5">
				<p className="text-slate-600">
					Seleccioná una compra para ver el detalle.
				</p>
			</section>
		);
	}

	const supermarketBreakdown = buildSupermarketBreakdown(entry);

	return (
		<section className="bg-white border border-slate-200 rounded-2xl p-5 space-y-6">
			{isMobile && onBackToList && (
				<div className="sticky top-16 z-20 -mx-5 -mt-5 mb-1 px-4 py-3 border-b border-slate-100 bg-white/95 backdrop-blur">
					<button
						onClick={onBackToList}
						className="w-full min-h-11 inline-flex items-center gap-2 px-3 py-2 text-base font-semibold text-slate-800 rounded-xl border border-slate-200 hover:bg-slate-50"
					>
						<ChevronLeft size={20} />
						Volver al listado
					</button>
				</div>
			)}

			<div className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<h2 className="text-xl font-bold text-slate-900">
						Detalle de compra
					</h2>
					<p className="text-sm text-slate-600">
						Fecha compra: {formatDateTime(entry.shoppedAt)}
					</p>
					<p className="text-sm text-slate-600">
						Guardado: {formatDateTime(entry.createdAt)}
					</p>
				</div>
				<div className="text-right">
					<p className="text-xs uppercase tracking-wide text-slate-500">
						Total
					</p>
					<p className="text-3xl font-bold text-slate-900">
						{entry.totalPrice.toFixed(2)}€
					</p>
				</div>
			</div>

			<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
				{Object.entries(supermarketBreakdown).map(([name, data]) => (
					<div key={name} className="border border-slate-200 rounded-xl p-3">
						<p className="text-sm font-semibold text-slate-800 capitalize">
							{name}
						</p>
						<p className="text-sm text-slate-600">{data.items} uds</p>
						<p className="text-lg font-bold text-slate-900">
							{data.total.toFixed(2)}€
						</p>
					</div>
				))}
			</div>

			<div className="overflow-x-auto border border-slate-200 rounded-xl">
				<table className="min-w-full text-sm">
					<thead className="bg-slate-50 text-slate-600">
						<tr>
							<th className="text-left px-3 py-2 font-semibold">Producto</th>
							<th className="text-left px-3 py-2 font-semibold">
								Supermercado
							</th>
							<th className="text-right px-3 py-2 font-semibold">Cantidad</th>
							<th className="text-right px-3 py-2 font-semibold">Precio</th>
							<th className="text-right px-3 py-2 font-semibold">Subtotal</th>
						</tr>
					</thead>
					<tbody>
						{entry.items.map((item, index) => (
							<tr
								key={`${item.productName}-${item.supermarket}-${index}`}
								className="border-t border-slate-100"
							>
								<td className="px-3 py-2 text-slate-800">{item.productName}</td>
								<td className="px-3 py-2 text-slate-600 capitalize">
									{item.supermarket}
								</td>
								<td className="px-3 py-2 text-right text-slate-700">
									{item.quantity}
								</td>
								<td className="px-3 py-2 text-right text-slate-700">
									{item.price.toFixed(2)}€
								</td>
								<td className="px-3 py-2 text-right font-semibold text-slate-900">
									{(item.price * item.quantity).toFixed(2)}€
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</section>
	);
}

export default function ShoppingHistoryPage(): React.ReactElement {
	const { data: session, status } = useSession();
	const [entries, setEntries] = useState<ShoppingSessionHistoryEntry[]>([]);
	const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
		null,
	);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [mobileViewMode, setMobileViewMode] = useState<ViewMode>("list");
	const [searchTerm, setSearchTerm] = useState<string>("");
	const [supermarketFilter, setSupermarketFilter] = useState<string>("all");
	const [openYearKeys, setOpenYearKeys] = useState<string[]>([]);
	const [openMonthKeys, setOpenMonthKeys] = useState<string[]>([]);
	const [hasInitializedAccordions, setHasInitializedAccordions] =
		useState<boolean>(false);

	useEffect(() => {
		if (status !== "authenticated") {
			setIsLoading(false);
			return;
		}

		let isCancelled = false;

		const load = async (): Promise<void> => {
			setIsLoading(true);
			setErrorMessage(null);
			try {
				const token = await getAuthToken();
				const response = await shoppingSessionGateway.list(token);
				if (isCancelled) return;

				setEntries(response.sessions);
				setSelectedSessionId(
					response.sessions.length > 0 ? response.sessions[0].sessionId : null,
				);
			} catch {
				if (!isCancelled) {
					setErrorMessage("No se pudo cargar el historial de compras.");
				}
			} finally {
				if (!isCancelled) {
					setIsLoading(false);
				}
			}
		};

		void load();

		return () => {
			isCancelled = true;
		};
	}, [status]);

	const normalizedSearch = searchTerm.trim().toLowerCase();
	const filteredEntries = entries.filter((entry) => {
		const matchesSupermarket =
			supermarketFilter === "all" ||
			entry.items.some((item) => item.supermarket === supermarketFilter);
		if (!matchesSupermarket) {
			return false;
		}

		if (normalizedSearch.length === 0) {
			return true;
		}

		return entry.items.some((item) =>
			item.productName.toLowerCase().includes(normalizedSearch),
		);
	});

	const groupedEntries = buildYearMonthGroups(filteredEntries);
	const supermarketOptions = Array.from(
		new Set(
			entries.flatMap((entry) => entry.items.map((item) => item.supermarket)),
		),
	).sort((a, b) => a.localeCompare(b));

	const selectedEntry =
		filteredEntries.find((entry) => entry.sessionId === selectedSessionId) ??
		null;

	useEffect(() => {
		if (filteredEntries.length === 0) {
			setSelectedSessionId(null);
			setMobileViewMode("list");
			return;
		}

		const exists = filteredEntries.some(
			(entry) => entry.sessionId === selectedSessionId,
		);

		if (!exists) {
			setSelectedSessionId(filteredEntries[0].sessionId);
		}
	}, [filteredEntries, selectedSessionId]);

	useEffect(() => {
		const availableYearKeys = groupedEntries.map((group) => group.yearKey);
		const availableMonthKeys = groupedEntries.flatMap((group) =>
			group.months.map((month) => month.monthKey),
		);

		setOpenYearKeys((prev) => {
			const pruned = prev.filter((key) => availableYearKeys.includes(key));
			return haveSameKeys(prev, pruned) ? prev : pruned;
		});
		setOpenMonthKeys((prev) => {
			const pruned = prev.filter((key) => availableMonthKeys.includes(key));
			return haveSameKeys(prev, pruned) ? prev : pruned;
		});
	}, [entries, searchTerm, supermarketFilter]);

	useEffect(() => {
		if (hasInitializedAccordions || groupedEntries.length === 0) {
			return;
		}

		setOpenYearKeys([groupedEntries[0].yearKey]);
		setOpenMonthKeys(groupedEntries[0].months.map((month) => month.monthKey));
		setHasInitializedAccordions(true);
	}, [entries, searchTerm, supermarketFilter, hasInitializedAccordions]);

	function handleToggleYear(yearKey: string): void {
		setHasInitializedAccordions(true);
		setOpenYearKeys((prev) =>
			prev.includes(yearKey)
				? prev.filter((key) => key !== yearKey)
				: [...prev, yearKey],
		);
	}

	function handleToggleMonth(monthKey: string): void {
		setHasInitializedAccordions(true);
		setOpenMonthKeys((prev) =>
			prev.includes(monthKey)
				? prev.filter((key) => key !== monthKey)
				: [...prev, monthKey],
		);
	}

	function handleSelectSession(sessionId: string): void {
		setSelectedSessionId(sessionId);
		setMobileViewMode("detail");
	}

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
				<div>
					<h1 className="text-2xl font-bold text-slate-900">
						Historial de compras
					</h1>
					<p className="text-slate-600 mt-1">
						Revisá tus listas pasadas, totales y distribución por supermercado.
					</p>
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

			{filteredEntries.length === 0 ? (
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
						/>
						<TicketDetail entry={selectedEntry} isMobile={false} />
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
								/>
							</div>
						) : (
							<div className="animate-in slide-in-from-right-4 fade-in-0 duration-200">
								<TicketDetail
									entry={selectedEntry}
									isMobile
									onBackToList={() => setMobileViewMode("list")}
								/>
							</div>
						)}
					</div>
				</>
			)}
		</div>
	);
}
