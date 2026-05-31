import { describe, it, expect, vi, beforeEach } from "vitest";
import { SignJWT } from "jose";
import { JwtAuthMiddleware } from "./JwtAuthMiddleware";
import type { Request, Response, NextFunction } from "express";
import type { LoggerPort } from "@application/ports/outgoing/LoggerPort";

const TEST_SECRET = "test-auth-secret-for-unit-tests-32bytes";

async function createValidTestToken(userId: string): Promise<string> {
	const secret = new TextEncoder().encode(TEST_SECRET);
	return new SignJWT({ sub: userId })
		.setProtectedHeader({ alg: "HS256" })
		.setIssuedAt()
		.setExpirationTime("1h")
		.sign(secret);
}

function makeMockResponse(): Response {
	const res = {
		status: vi.fn().mockReturnThis(),
		json: vi.fn().mockReturnThis(),
		locals: {} as Record<string, unknown>,
	} as unknown as Response;
	return res;
}

function makeMockRequest(authorizationHeader?: string): Request {
	return {
		headers: {
			...(authorizationHeader ? { authorization: authorizationHeader } : {}),
		},
	} as unknown as Request;
}

describe("JwtAuthMiddleware", () => {
	let middleware: JwtAuthMiddleware;
	let next: NextFunction;
	let logger: LoggerPort;

	beforeEach(() => {
		logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() };
		middleware = new JwtAuthMiddleware(TEST_SECRET, logger);
		next = vi.fn();
	});

	it("should return 401 when the Authorization header is missing", async () => {
		const req = makeMockRequest();
		const res = makeMockResponse();

		await middleware.authenticate(req, res, next);

		expect(res.status).toHaveBeenCalledWith(401);
		expect(res.json).toHaveBeenCalledWith({
			error: "Missing or malformed Authorization header.",
		});
		expect(next).not.toHaveBeenCalled();
	});

	it("should return 401 when the header is not in Bearer format", async () => {
		const req = makeMockRequest("Basic somebase64token");
		const res = makeMockResponse();

		await middleware.authenticate(req, res, next);

		expect(res.status).toHaveBeenCalledWith(401);
		expect(res.json).toHaveBeenCalledWith({
			error: "Missing or malformed Authorization header.",
		});
		expect(next).not.toHaveBeenCalled();
	});

	it("should return 401 when the token is invalid or tampered", async () => {
		const req = makeMockRequest("Bearer this.is.not.a.valid.jwe.token");
		const res = makeMockResponse();

		await middleware.authenticate(req, res, next);

		expect(res.status).toHaveBeenCalledWith(401);
		expect(res.json).toHaveBeenCalledWith({ error: "Invalid or expired token." });
		expect(next).not.toHaveBeenCalled();
	});

	it("should return 401 when the token was signed with a different secret", async () => {
		const wrongSecretMiddleware = new JwtAuthMiddleware("wrong-secret-value-here", logger);
		const token = await createValidTestToken("user-123");
		const req = makeMockRequest(`Bearer ${token}`);
		const res = makeMockResponse();

		await wrongSecretMiddleware.authenticate(req, res, next);

		expect(res.status).toHaveBeenCalledWith(401);
		expect(next).not.toHaveBeenCalled();
	});

	it("should extract userId from a valid token and set res.locals.userId", async () => {
		const token = await createValidTestToken("google-user-456");
		const req = makeMockRequest(`Bearer ${token}`);
		const res = makeMockResponse();

		await middleware.authenticate(req, res, next);

		expect(next).toHaveBeenCalledOnce();
		expect(res.locals.userId).toBe("google-user-456");
		expect(res.status).not.toHaveBeenCalled();
	});
});
