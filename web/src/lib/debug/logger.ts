import fs from 'fs';
import path from 'path';

const LOG_DIR = path.join(process.cwd(), 'logs');
const LOG_FILE = path.join(LOG_DIR, 'debug.log');

// Ensure logs directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Rotate log file if it gets too large (5MB)
const MAX_LOG_SIZE = 5 * 1024 * 1024; // 5MB
if (fs.existsSync(LOG_FILE) && fs.statSync(LOG_FILE).size > MAX_LOG_SIZE) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  fs.renameSync(LOG_FILE, path.join(LOG_DIR, `debug-${timestamp}.log`));
}

const logStream = fs.createWriteStream(LOG_FILE, { flags: 'a' });

interface LogEntry {
  timestamp: string;
  type: 'input' | 'output' | 'error' | 'info';
  source: string;
  data: any;
}

export const logger = {
  log: (type: LogEntry['type'], source: string, data: any) => {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      type,
      source,
      data: data instanceof Error ? { message: data.message, stack: data.stack } : data
    };
    
    const logLine = JSON.stringify(entry) + '\n';
    
    // Write to file
    logStream.write(logLine);
    
    // Also log to console in development
    if (process.env.NODE_ENV !== 'production') {
      const logMethod = type === 'error' ? console.error : console.log;
      logMethod(`[${entry.timestamp}] [${type.toUpperCase()}] [${source}]`, data);
    }
  },
  
  input: (source: string, data: any) => logger.log('input', source, data),
  output: (source: string, data: any) => logger.log('output', source, data),
  error: (source: string, error: Error | string) => logger.log('error', source, error),
  info: (source: string, message: string) => logger.log('info', source, message)
};

// Handle process exit
export const cleanup = () => {
  logStream.end();
};

process.on('beforeExit', cleanup);
process.on('SIGINT', () => {
  cleanup();
  process.exit(0);
});

// Log uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('uncaughtException', error);
  cleanup();
  process.exit(1);
});

// Log unhandled promise rejections
process.on('unhandledRejection', (reason) => {
  logger.error('unhandledRejection', reason instanceof Error ? reason : new Error(String(reason)));
});
