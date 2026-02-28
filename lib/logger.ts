type LogLevel = "info" | "error";

interface LogMetadata {
  requestId?: string;
  provider?: string;
  latencyMs?: number;
  [key: string]: unknown;
}

function log(level: LogLevel, message: string, metadata?: LogMetadata) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...metadata,
  };
  
  console.log(JSON.stringify(entry));
}

export function logInfo(message: string, metadata?: LogMetadata) {
  log("info", message, metadata);
}

export function logError(message: string, metadata?: LogMetadata) {
  log("error", message, metadata);
}
