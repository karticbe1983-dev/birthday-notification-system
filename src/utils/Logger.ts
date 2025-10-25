import winston from 'winston';
import path from 'path';
import { ILogger } from '../models/interfaces/ILogger';

/**
 * Logger implementation using Winston library
 * Provides logging to console and file with rotation and retention policies
 */
export class Logger implements ILogger {
  private logger: winston.Logger;

  constructor(logDirectory: string = './logs', logLevel: string = 'info') {
    // Define log format with timestamp and level
    const logFormat = winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.errors({ stack: true }),
      winston.format.printf(({ timestamp, level, message, ...metadata }) => {
        let msg = `${timestamp} [${level.toUpperCase()}]: ${message}`;
        
        // Add metadata if present
        if (Object.keys(metadata).length > 0) {
          msg += ` ${JSON.stringify(metadata)}`;
        }
        
        return msg;
      })
    );

    // Configure transports
    const transports: winston.transport[] = [
      // Console transport with colorized output
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
          winston.format.printf(({ timestamp, level, message, ...metadata }) => {
            let msg = `${timestamp} [${level}]: ${message}`;
            
            // Add metadata if present
            if (Object.keys(metadata).length > 0) {
              msg += ` ${JSON.stringify(metadata)}`;
            }
            
            return msg;
          })
        ),
      }),
      
      // File transport with rotation (10 MB max size) and retention (30 days)
      new winston.transports.File({
        filename: path.join(logDirectory, 'birthday-system.log'),
        maxsize: 10 * 1024 * 1024, // 10 MB
        maxFiles: 30, // Keep 30 days of logs
        tailable: true,
        format: logFormat,
      }),
    ];

    // Create winston logger instance
    this.logger = winston.createLogger({
      level: logLevel,
      transports,
    });
  }

  /**
   * Logs an informational message
   * @param message - Log message
   * @param metadata - Optional additional data to log
   */
  info(message: string, metadata?: any): void {
    this.logger.info(message, metadata);
  }

  /**
   * Logs an error message
   * @param message - Error message
   * @param error - Optional error object
   * @param metadata - Optional additional data to log
   */
  error(message: string, error?: Error, metadata?: any): void {
    const errorMetadata = {
      ...metadata,
      ...(error && {
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name,
        },
      }),
    };
    
    this.logger.error(message, errorMetadata);
  }

  /**
   * Logs a warning message
   * @param message - Warning message
   * @param metadata - Optional additional data to log
   */
  warn(message: string, metadata?: any): void {
    this.logger.warn(message, metadata);
  }
}
