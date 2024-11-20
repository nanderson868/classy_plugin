import { Notice } from "obsidian";

enum LogLevel {
	DEBUG = "DEBUG",
	INFO = "INFO",
	WARN = "WARN",
	ERROR = "ERROR",
}

type LogMethod = (...args: unknown[]) => void;

class Logger {
	static globalLevel: LogLevel = LogLevel.INFO;
	private level: LogLevel;
	private isTest = false;
	private isInit = false;
	private _name: string | null = null;
	private _alias: string | null = null;
	private _context: object | null = null;
	private _testFunc: (() => Promise<void> | void) | null = null;

	constructor(level?: LogLevel) {
		this.level = level ?? Logger.globalLevel;
	}

	private get name() {
		return this._name || "N/A";
	}

	private set name(name: string) {
		if (!this._name) this._name = name;
		else if (!this._alias && name !== this._name) this._alias = name;
	}

	private get alias() {
		return this._alias || "";
	}

	private set context(context: object) {
		if (!this._context) this._context = context;
		if (this.testFunc) this.testFunc.bind(this.context);
	}

	private set testFunc(func: () => Promise<void> | void) {
		if (!this._testFunc) this._testFunc = func;
		if (this.context) this.testFunc.bind(this.context);
	}

	public setContext(...args: unknown[]) {
		if (this.isInit) this.warn("Logger already initialized");
		this.isInit = true;
		for (const arg of args) {
			if (!arg) continue;
			switch (typeof arg) {
				case "string":
					this.name = arg;
					break;
				case "function":
					this.name = arg.name;
					if (arg instanceof Function && arg.length === 0)
						this.testFunc = arg as () => void | Promise<void>;
					break;
				case "object":
					this.name = arg.constructor.name;
					this.context = arg;
					break;
				default:
					throw new Error("Invalid context type");
			}
		}
		return this;
	}

	public get test() {
		return this.testFunc;
	}

	private shouldLog(level: LogLevel): boolean {
		return (
			Object.values(LogLevel).indexOf(level) >=
			Object.values(LogLevel).indexOf(this.level)
		);
	}

	private shouldShow(level: LogLevel): boolean {
		return (
			Object.values(LogLevel).indexOf(level) >
			Object.values(LogLevel).indexOf(Logger.globalLevel)
		);
	}

	private format(level: LogLevel, ...args: unknown[]): string {
		const logPrefix = this.isTest ? "TEST" : "";
		const logLevel = this.shouldShow(level) ? `${level}|` : "";
		const logName = `[${this.name}]`;
		const logAlias = this.alias ? `(${this.alias})` : "";
		const logMessage = args.join(" ");
		return [logPrefix, logLevel, logName, logAlias, logMessage]
			.filter(Boolean)
			.join(" ");
	}

	private log(level: LogLevel, ...args: unknown[]): void {
		if (this.shouldLog(level)) {
			switch (level) {
				case LogLevel.DEBUG:
				case LogLevel.INFO:
					console.log(this.format(level, ...args));
					break;
				case LogLevel.WARN:
					console.warn(this.format(level, ...args));
					break;
				case LogLevel.ERROR:
					console.error(this.format(level, ...args));
					new Notice(this.format(level, ...args));
					break;
			}
		}
	}

	debug: LogMethod = (...args: unknown[]) =>
		this.log(LogLevel.DEBUG, ...args);
	info: LogMethod = (...args: unknown[]) => this.log(LogLevel.INFO, ...args);
	warn: LogMethod = (...args: unknown[]) => this.log(LogLevel.WARN, ...args);
	error: LogMethod = (...args: unknown[]) =>
		this.log(LogLevel.ERROR, ...args);

	async runTest(testFunction: () => Promise<void> | void): Promise<void> {
		this.isTest = true;
		try {
			await testFunction();
		} finally {
			this.isTest = false;
		}
	}
}

// function Loggable(level?: LogLevel) {
// 	// eslint-disable-next-line @typescript-eslint/no-explicit-any
// 	return function <T extends { new (...args: any[]): object }>(
// 		constructor: T
// 	) {
// 		return class extends constructor {
// 			logger = new Logger(constructor.name, level);
// 		};
// 	};
// }

export { Logger, LogLevel };
