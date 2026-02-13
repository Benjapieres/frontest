const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const config = require('../../config/default');

const logsDir = config.logging.outputDirectory;

const transports = [
  // Console transport
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple(),
      winston.format.printf(info => {
        return `[${info.level.toUpperCase()}] ${info.message}`;
      })
    ),
    level: config.logging.level
  }),

  // All logs file (daily rotation)
  new DailyRotateFile({
    filename: path.join(logsDir, 'all-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
    level: 'debug'
  }),

  // Error logs only (daily rotation)
  new DailyRotateFile({
    filename: path.join(logsDir, 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
    level: 'error'
  })
];

const logger = winston.createLogger({
  transports,
  exceptionHandlers: [
    new winston.transports.File({ filename: path.join(logsDir, 'exceptions.log') })
  ]
});

module.exports = logger;
