const { createLogger, format, transports } = require('winston');
require('winston-daily-rotate-file');
const Moment = require('moment');

const logFormat = format.printf(({ level, message, httpCode, timestamp }) => {
  return `${timestamp} [${httpCode}] ${level}: ${message}`;
});

const logTransport = new (transports.DailyRotateFile)({
  filename: 'qty-sync-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  utc: true,
  zippedArchive: false,
  dirname: 'logs',
  maxSize: '20m',
  maxFiles: '14d'
});

const logger = createLogger({
  format: format.combine(
    format.timestamp(),
    logFormat
  ),
  transports: [
    logTransport
  ]
});

const initLoggingMethods = (function() {
  const logError = (message, httpCode) => {
    logger.log({
      level: 'error',
      message: message,
      httpCode: httpCode,
    })
  }

  const logInfo = (message, httpCode) => {
    logger.log({
      level: 'info',
      message: message,
      httpCode: httpCode,
    })
  }

  const logWarning = (message, httpCode) => {
    logger.log({
      level: 'warn',
      message: message,
      httpCode: httpCode,
    })
  }

  const logSummary = (startDate, endDate, totalSkus, totalSkusUpdated, totalSkusNotOnHobisports) => {
    const momentStart = Moment(startDate);
    const momentEnd = Moment(endDate);
    const minutes = momentEnd.diff(momentStart, 'minutes');
    logger.log({
      level: 'info',
      message: `START: ${startDate} | END: ${endDate} | TIME: ${minutes} minutes | TOTAL SKUS UPDATED: [${totalSkusUpdated}] | TOTAL SKUS NOT ON HOBISPORTS: [${totalSkusNotOnHobisports}]`,
      httpCode: '-',
    })
  }

  return {
    logError,
    logInfo,
    logWarning,
    logSummary,
  }
}());

module.exports = initLoggingMethods;