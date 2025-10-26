import { ConfigService } from './services/ConfigService';
import { Logger } from './utils/Logger';
import { ExcelReader } from './services/ExcelReader';
import { BirthdayChecker } from './services/BirthdayChecker';
import { EmailService } from './services/EmailService';
import { WhatsAppService } from './services/WhatsAppService';
import { TemplateEngine } from './services/TemplateEngine';
import { NotificationManager } from './services/NotificationManager';
import { Scheduler } from './services/Scheduler';

/**
 * Main application entry point for Birthday Notification System
 * Initializes all components, tests connections, and starts the scheduler
 */
async function main(): Promise<void> {
  let logger: Logger | null = null;
  let scheduler: Scheduler | null = null;

  try {
    // Step 1: Initialize ConfigService and load configuration
    console.log('Loading configuration...');
    const configService = new ConfigService();
    configService.loadConfig();
    const config = configService.getConfig();
    console.log('Configuration loaded successfully');

    // Step 2: Initialize Logger with configuration
    logger = new Logger(config.logging.directory, config.logging.level);
    logger.info('Birthday Notification System starting up', {
      version: '1.0.0',
      nodeVersion: process.version,
    });

    // Step 3: Initialize all components
    logger.info('Initializing components...');
    
    const excelReader = new ExcelReader(logger);
    const birthdayChecker = new BirthdayChecker();
    const emailService = new EmailService(logger);
    const whatsappService = new WhatsAppService(logger);
    const templateEngine = new TemplateEngine(logger);
    
    const notificationManager = new NotificationManager(
      excelReader,
      birthdayChecker,
      emailService,
      whatsappService,
      templateEngine,
      logger,
      config.excel.filePath,
      config.whatsapp.enabled,
      config.template.filePath
    );
    
    scheduler = new Scheduler(logger);
    
    logger.info('All components initialized successfully');

    // Step 4: Initialize and test email service connection
    logger.info('Initializing email service...');
    await emailService.initialize({
      user: config.email.user,
      password: config.email.password,
      from: config.email.from,
    });

    logger.info('Testing email service connection...');
    const connectionSuccess = await emailService.testConnection();
    
    if (!connectionSuccess) {
      throw new Error('Email service connection test failed. Please check your credentials.');
    }
    
    logger.info('Email service connection test passed');

    // Step 4b: Initialize and test WhatsApp service if enabled
    if (config.whatsapp.enabled) {
      logger.info('WhatsApp service is enabled', {
        accountSid: config.whatsapp.accountSid.substring(0, 8) + '***',
        fromNumber: config.whatsapp.fromNumber,
      });

      logger.info('Initializing WhatsApp service...');
      await whatsappService.initialize({
        accountSid: config.whatsapp.accountSid,
        authToken: config.whatsapp.authToken,
        fromNumber: config.whatsapp.fromNumber,
        enabled: config.whatsapp.enabled,
      });

      logger.info('Testing WhatsApp service connection...');
      const whatsappConnectionSuccess = await whatsappService.testConnection();
      
      if (!whatsappConnectionSuccess) {
        logger.warn('WhatsApp service connection test failed. WhatsApp notifications will be disabled.');
        config.whatsapp.enabled = false;
      } else {
        logger.info('WhatsApp service connection test passed', {
          fromNumber: config.whatsapp.fromNumber,
        });
      }
    } else {
      logger.info('WhatsApp service is disabled (missing Twilio credentials)');
    }

    // Step 5: Run immediate birthday check on startup
    logger.info('Running immediate birthday check on startup...');
    await notificationManager.checkAndNotify();

    // Step 6: Start scheduler with configured cron expression
    logger.info('Starting scheduler...', {
      cronExpression: config.scheduler.cronExpression,
    });
    
    scheduler.start(config.scheduler.cronExpression, async () => {
      await notificationManager.checkAndNotify();
    });

    logger.info('Birthday Notification System started successfully', {
      cronSchedule: config.scheduler.cronExpression,
    });

    // Step 7: Setup graceful shutdown handling
    setupGracefulShutdown(scheduler, logger);

  } catch (error) {
    // Top-level error handling
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    if (logger) {
      logger.error('Fatal error during application startup', error as Error);
    } else {
      console.error('Fatal error during application startup:', errorMessage);
      if (error instanceof Error && error.stack) {
        console.error(error.stack);
      }
    }
    
    // Exit with error code
    process.exit(1);
  }
}

/**
 * Sets up graceful shutdown handlers for SIGINT and SIGTERM signals
 * Ensures scheduler is stopped and connections are closed properly
 * @param scheduler - Scheduler instance to stop
 * @param logger - Logger instance for logging shutdown events
 */
function setupGracefulShutdown(scheduler: Scheduler, logger: Logger): void {
  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal} signal, shutting down gracefully...`);
    
    try {
      // Stop the scheduler
      if (scheduler && scheduler.isRunning()) {
        logger.info('Stopping scheduler...');
        scheduler.stop();
      }
      
      logger.info('Shutdown completed successfully');
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown', error as Error);
      process.exit(1);
    }
  };

  // Handle SIGINT (Ctrl+C)
  process.on('SIGINT', () => shutdown('SIGINT'));
  
  // Handle SIGTERM (kill command)
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  
  // Handle uncaught exceptions
  process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught exception', error);
    process.exit(1);
  });
  
  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason: any) => {
    logger.error('Unhandled promise rejection', reason instanceof Error ? reason : new Error(String(reason)));
    process.exit(1);
  });
}

// Start the application
main();
