export class ShoppingHistoryDateFormatter {
	formatCalendarDate(isoDate: string): string {
		return new Date(isoDate).toLocaleDateString("es-ES", {
			year: "numeric",
			month: "long",
			day: "numeric",
		});
	}

	formatCalendarDateTime(isoDate: string): string {
		return new Date(isoDate).toLocaleString("es-ES", {
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
		});
	}

	formatMonthLabel(year: number, monthIndex: number): string {
		return new Date(year, monthIndex, 1)
			.toLocaleDateString("es-ES", {
				month: "long",
				year: "numeric",
			})
			.replace(/^./, (character) => character.toUpperCase());
	}
}
