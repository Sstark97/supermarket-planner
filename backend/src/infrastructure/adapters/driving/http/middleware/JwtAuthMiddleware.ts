import { jwtVerify } from "jose";
import type { Request, Response, NextFunction } from "express";
import type { LoggerPort } from "@application/ports/outgoing/LoggerPort";

export class JwtAuthMiddleware {
	constructor(
		private readonly authSecret: string,
		private readonly logger: LoggerPort,
	) {}

	authenticate = async (
		req: Request,
		res: Response,
		next: NextFunction,
	): Promise<void> => {
		const authorizationHeader = req.headers.authorization;
		const isBearerFormat =
			authorizationHeader?.startsWith("Bearer ") === true;

		if (!authorizationHeader || !isBearerFormat) {
			res.status(401).json({ error: "Missing or malformed Authorization header." });
			return;
		}

		const token = authorizationHeader.slice("Bearer ".length);

		try {
			const secret = new TextEncoder().encode(this.authSecret);
			const { payload } = await jwtVerify(token, secret);

			const userId = payload.sub;
			if (!userId) {
				res.status(401).json({ error: "Token payload is missing sub claim." });
				return;
			}

			res.locals.userId = userId;
			next();
		} catch (err) {
			this.logger.error(`[JwtAuthMiddleware] verification failed: ${String(err)}`);
			res.status(401).json({ error: "Invalid or expired token." });
		}
	};
}
