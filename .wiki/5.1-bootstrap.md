# Bootstrap

Bootstrap utilities for NestJS applications.

## Constants

### API_DOCS

Swagger UI path constant.

```typescript
export const API_DOCS = "api-docs";
```

### API_DOCS_JSON

Swagger JSON endpoint path constant.

```typescript
export const API_DOCS_JSON = "api-docs-json";
```

### DEFAULT_BODY_LIMIT

Default body limit for request parsing (16777216 bytes / 16MB).

```typescript
export const DEFAULT_BODY_LIMIT = 16777216;
```

### DEFAULT_LOG_LEVELS

Default NestJS log levels array.

```typescript
export const DEFAULT_LOG_LEVELS: Array<LogLevel> = [
  "warn",
  "error",
  "debug",
  "log",
  "verbose",
  "fatal",
];
```

---

## Functions

### getBodyLimit

Parses a body limit value from an environment variable string. Returns the default if the value is null/undefined or cannot be parsed.

```typescript
export const getBodyLimit = (value?: string | null): number;
```

**Parameters:**

- `value` - Environment variable value (optional)

**Returns:** Parsed integer or DEFAULT_BODY_LIMIT

---

### getLogLevel

Parses a comma-separated string of log levels into a NestJS LogLevel array.

```typescript
export const getLogLevel = (value?: string): Array<LogLevel>;
```

**Parameters:**

- `value` - Comma-separated log levels (e.g., "error,warn,log")

**Returns:** Array of LogLevel values, or DEFAULT_LOG_LEVELS if value is falsy

---

### logConfigObject

Logs configuration object keys if printConfig is enabled. Strips the leading underscore from environment variable keys.

```typescript
export function logConfigObject(
  logger: Logger,
  factory: Record<string, unknown>,
  printConfig = false
): void;
```

**Parameters:**

- `logger` - NestJS Logger instance
- `factory` - Object with environment variable keys (e.g., `{ _port: 3000 }`)
- `printConfig` - Whether to actually log the config

---

### logServerPath

Logs the server URL with a "REST API" label.

```typescript
export function logServerPath(logger: Logger, appConfig: AppConfig): void;
```

**Parameters:**

- `logger` - NestJS Logger instance
- `appConfig` - Application configuration object

---

### logSwaggerPath

Logs the Swagger JSON and UI paths if swagger is enabled in appConfig.

```typescript
export function logSwaggerPath(logger: Logger, appConfig: AppConfig): void;
```

**Parameters:**

- `logger` - NestJS Logger instance
- `appConfig` - Application configuration object

---

### findUp

Recursively searches for a file by traversing up the directory tree from the current working directory.

```typescript
export function findUp(
  filename: string,
  startDir: string = process.cwd()
): string | null;
```

**Parameters:**

- `filename` - The name of the file to find (e.g., "README.md", "package.json")
- `startDir` - Optional directory to start searching from (defaults to `process.cwd()`)

**Returns:** The absolute path to the found file, or `null` if the file is not found up to the filesystem root

**Example:**

```typescript
const readmePath = findUp("README.md");
if (readmePath) {
  console.log(`Found README at ${readmePath}`);
}
```

---

### readPackageJsonFromRoot

Reads and parses package.json from the current working directory or specified path.

```typescript
export function readPackageJsonFromRoot(
  filename: string = "package.json",
  startDir: string = process.cwd()
): PackageConfig;
```

**Parameters:**

- `filename` - Optional filename to read (defaults to "package.json")
- `startDir` - Optional directory to start searching from (defaults to `process.cwd()`)

**Returns:** Object containing `name`, `version`, and `description`

**Throws:** Error if the file is not found

---

## Pre-built Instances

### VALIDATION_PIPE

Pre-configured NestJS ValidationPipe with the following options:

```typescript
export const VALIDATION_PIPE = new ValidationPipe({
  whitelist: true,
  transform: true,
  forbidUnknownValues: true,
  forbidNonWhitelisted: true,
});
```

---

### SWAGGER_DOCUMENT

Pre-built Swagger document using values from package.json:

```typescript
export const SWAGGER_DOCUMENT = new DocumentBuilder()
  .setTitle(PACKAGE_JSON.name.toUpperCase())
  .setDescription(PACKAGE_JSON.description)
  .setVersion(PACKAGE_JSON.version)
  .build();
```

---

## Types

### AppConfig

```typescript
interface AppConfig {
  /** Port number for the server (1-65535) */
  port: number;
  /** Environment: development, production, test, or local */
  nodeEnv: string;
  /** IP address to bind to (IPv4 or IPv6) */
  address: string;
  /** Whether to log the config object at startup */
  printConfig: boolean;
  /** Request body size limit in bytes (min: 1) */
  bodyLimit: number;
  /** Whether to enable Swagger UI at /api-docs */
  enableSwagger: boolean;
  /** NestJS log levels for output (defaults to all levels if not set) */
  logLevel?: Array<LogLevel>;
  cors?: {
    /** Allowed origin for CORS (string, wildcard "*", or RegExp) */
    origin?: string;
    /** Allowed HTTP methods (e.g., "GET,POST,PUT,DELETE") */
    methods?: string;
    /** Whether to pass CORS preflight to next handler instead of handling it */
    preflightContinue?: boolean;
    /** HTTP status code for successful OPTIONS responses (default: 204) */
    optionsSuccessStatus?: number;
    /** Whether to allow credentials (cookies, authorization headers) */
    credentials?: boolean;
    /** Custom headers to expose via Access-Control-Expose-Headers (null clears defaults) */
    allowedHeaders?: string;
  };
  health?: {
    /** Maximum heap memory threshold before health check fails (use getByteSizeEnv to parse env like "256MB") */
    memoryHeap?: number;
    /** Maximum RSS (Resident Set Size) memory threshold before health check fails */
    memoryRSS?: number;
    /** Disk path to check available space (defaults to root "/") */
    diskPath?: string;
    /** Disk usage threshold (0.8 = 80% used / 20% available). Fails if usage exceeds this threshold */
    diskThresholdPercent?: number;
  };
}
```

---

### AppConfigSchema

Joi validation schema for AppConfig with the following rules:

| Field                     | Validation                                                                                      |
| ------------------------- | ----------------------------------------------------------------------------------------------- |
| `printConfig`             | Required boolean - whether to log config at startup                                            |
| `enableSwagger`           | Required boolean - whether to enable Swagger UI                                               |
| `bodyLimit`               | Required number >= 1 - max request body size in bytes                                          |
| `address`                 | Required valid IPv4 or IPv6 address                                                             |
| `port`                    | Required integer 1-65535 - server port                                                          |
| `nodeEnv`                 | Required string: development, production, test, or local                                       |
| `logLevel`                | Optional array of log levels: warn, error, debug, log, verbose, fatal (defaults to all)         |
| `cors`                    | Optional CORS configuration object                                                              |
| `cors.origin`             | Optional string - allowed origin for CORS (string, wildcard, or RegExp)                        |
| `cors.methods`            | Optional string - allowed HTTP methods (e.g., "GET,POST,PUT,DELETE")                            |
| `cors.preflightContinue`  | Optional boolean - whether to pass preflight to next handler                                    |
| `cors.optionsSuccessStatus`| Optional number - HTTP status for successful OPTIONS (default: 204)                            |
| `cors.credentials`        | Optional boolean - whether to allow credentials                                                |
| `cors.allowedHeaders`     | Optional string - custom headers to expose (null clears defaults)                               |
| `health`                  | Optional health check configuration object                                                    |
| `health.memoryHeap`       | Optional number >= 0 - max heap memory in bytes (use getByteSizeEnv to parse "256MB")          |
| `health.memoryRSS`        | Optional number >= 0 - max RSS memory in bytes (use getByteSizeEnv to parse "512MB")          |
| `health.diskPath`         | Optional string - path to check disk space (defaults to "/")                                    |
| `health.diskThresholdPercent` | Optional number >= 0 - disk usage threshold (0.8 = 80% used, fails if exceeded)           |
