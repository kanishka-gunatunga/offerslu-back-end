'use strict';

const { createLogger, format, transports } = require('winston');
const path = require('path');
const fs = require('fs');
const os = require('os');
const env = require('./env');

/**
 * Lambda/Vercel and similar use a read-only deploy dir (e.g. /var/task).
 * Prefer ./logs, then OS temp (writable on Lambda), else file logging is skipped.
 */
const resolveLogDir = () => {
  const candidates = [path.resolve(process.cwd(), 'logs'), path.join(os.tmpdir(), 'offerslu-logs')];
  for (const dir of candidates) {
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      return dir;
    } catch {
      // try next candidate
    }
  }
  return null;
};

const logDir = resolveLogDir();

const logFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.errors({ stack: true }),
  format.splat(),
  format.printf(({ timestamp, level, message, stack }) => {
    const base = `${timestamp} [${level.toUpperCase()}] ${message}`;
    return stack ? `${base}\n${stack}` : base;
  })
);

const loggerTransports = [];

if (logDir) {
  loggerTransports.push(
    new transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5 * 1024 * 1024,
      maxFiles: 5,
    }),
    new transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 5 * 1024 * 1024,
      maxFiles: 5,
    })
  );
}

loggerTransports.push(
  new transports.Console({
    format: env.isProd ? logFormat : format.combine(format.colorize(), logFormat),
  })
);

const logger = createLogger({
  level: env.logLevel,
  format: logFormat,
  transports: loggerTransports,
  exitOnError: false,
});

logger.stream = {
  write: (message) => (logger.http ? logger.http(message.trim()) : logger.info(message.trim())),
};

module.exports = logger;
