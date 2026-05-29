/**
 * Driven port for application-level logging.
 *
 * The application layer depends only on this abstraction; concrete logging
 * frameworks (e.g. winston) live in infrastructure and are injected at the
 * composition root. This keeps the core free of framework dependencies.
 */
export interface LoggerPort {
	info(message: string): void;
	warn(message: string): void;
	error(message: string): void;
	debug(message: string): void;
}
