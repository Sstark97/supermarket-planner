import fs from "fs";
import path from "path";
import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import { config } from "@infrastructure/config";

const logsDir = path.resolve(process.cwd(), "logs");

fs.mkdirSync(logsDir, {
	recursive: true,
	mode: 0o750,
});

const consoleFormat = winston.format.combine(
	winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
	winston.format.colorize(),
	winston.format.printf(({ timestamp, level, message, stack }) => {
		const details = stack ?? message;
		return `${timestamp} [${level}] ${details}`;
	}),
);

const fileFormat = winston.format.combine(
	winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
	winston.format.errors({ stack: true }),
	winston.format.splat(),
	winston.format.json(),
);

export const logger = winston.createLogger({
	level: config.logLevel,
	transports: [
		new winston.transports.Console({
			format: consoleFormat,
		}),
		new DailyRotateFile({
			dirname: logsDir,
			filename: "error-%DATE%.log",
			datePattern: "YYYY-MM-DD",
			maxFiles: "14d",
			level: "error",
			createSymlink: true,
			symlinkName: "error.log",
			options: { flags: "a", mode: 0o640 },
			format: fileFormat,
		}),
		new DailyRotateFile({
			dirname: logsDir,
			filename: "combined-%DATE%.log",
			datePattern: "YYYY-MM-DD",
			maxFiles: "14d",
			level: "info",
			createSymlink: true,
			symlinkName: "combined.log",
			options: { flags: "a", mode: 0o640 },
			format: fileFormat,
		}),
	],
});
