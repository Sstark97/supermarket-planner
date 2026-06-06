import { Request, Response, NextFunction } from 'express';
import { logger } from '@infrastructure/logging/logger';

export function errorHandler(
    error: Error,
    _request: Request,
    response: Response,
    _nextMiddleware: NextFunction,
): void {
    logger.error(`Unhandled error: ${error.message}\n${error.stack}`);
    response.status(500).json({
        error: 'Internal Server Error',
        message: error.message,
    });
}
