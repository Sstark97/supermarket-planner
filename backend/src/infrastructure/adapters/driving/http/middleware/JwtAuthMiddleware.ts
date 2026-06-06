import { jwtVerify } from "jose";
import type { Request, Response, NextFunction } from "express";
import type { LoggerPort } from "@application/ports/outgoing/LoggerPort";

export class JwtAuthMiddleware {
	constructor(
		private readonly authSecret: string,
		private readonly logger: LoggerPort,
	) {}

	authenticate = async (
		request: Request,
		response: Response,
		next: NextFunction,
	): Promise<void> => {
		const authorizationHeader = request.headers.authorization;
		const isBearerFormat =
			authorizationHeader?.startsWith("Bearer ") === true;

		if (!authorizationHeader || !isBearerFormat) {
			response.status(401).json({ error: "Missing or malformed Authorization header." });
			return;
		}

		const token = authorizationHeader.slice("Bearer ".length);

		try {
			const secret = new TextEncoder().encode(this.authSecret);
			const { payload } = await jwtVerify(token, secret);

			const userId = payload.sub;
			if (!userId) {
				response.status(401).json({ error: "Token payload is missing sub claim." });
				return;
			}

			response.locals.userId = userId;
			next();
		} catch (error) {
			this.logger.error(`[JwtAuthMiddleware] verification failed: ${String(error)}`);
			response.status(401).json({ error: "Invalid or expired token." });
		}
	};
}
