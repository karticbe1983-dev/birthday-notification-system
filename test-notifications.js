// Test script to manually trigger birthday notifications
require('dotenv').config();
const { ConfigService } = require('./dist/services/ConfigService');
const { Logger } = require('./dist/utils/Logger');
const { ExcelReader } = require('./dist/services/ExcelReader');
const { BirthdayChecker } = require('./dist/services/BirthdayChecker');
const { EmailService } = require('./dist/services/EmailService');
const { WhatsAppService } = require('./dist/services/WhatsAppService');
const { TemplateEngine } = require('./dist/services/TemplateEngine');
const { NotificationManager } = require('./dist/services/NotificationManager');

async function testNotifications() {
  console.log('=== Birthday Notification Test ===\n');
  
  try {
    // Override Excel file path to use test file
    process.env.EXCEL_FILE_PATH = './test-birthdays-today.xlsx';
    
    // Initialize services
    const configService = new ConfigService();
    configService.loadConfig();
    const config = configService.getConfig();
    
    const logger = new Logger(config.logging.directory, config.logging.level);
    logger.info('Test notification system starting');
    
    const excelReader = new ExcelReader(logger);
    const birthdayChecker = new BirthdayChecker();
    const emailService = new EmailService(logger);
    const whatsappService = new WhatsAppService(logger);
    const templateEngine = new TemplateEngine(logger);
    
    // Initialize email service
    console.log('Initializing email service...');
    await emailService.initialize({
      user: config.email.user,
      password: config.email.password,
      from: config.email.from,
    });
    
    console.log('Testing email connection...');
    const emailConnected = await emailService.testConnection();
    console.log(`Email connection: ${emailConnected ? 'SUCCESS' : 'FAILED'}\n`);
    
    // Initialize WhatsApp service if enabled
    if (config.whatsapp.enabled) {
      console.log('Initializing WhatsApp service...');
      await whatsappService.initialize({
        accountSid: config.whatsapp.accountSid,
        authToken: config.whatsapp.authToken,
        fromNumber: config.whatsapp.fromNumber,
        enabled: config.whatsapp.enabled,
      });
      
      console.log('Testing WhatsApp connection...');
      const whatsappConnected = await whatsappService.testConnection();
      console.log(`WhatsApp connection: ${whatsappConnected ? 'SUCCESS' : 'FAILED'}\n`);
    } else {
      console.log('WhatsApp service is disabled\n');
    }
    
    // Create notification manager
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
    
    // Run birthday check and send notifications
    console.log('Checking for birthdays and sending notifications...\n');
    await notificationManager.checkAndNotify();
    
    console.log('\n=== Test Complete ===');
    console.log('Check your email and WhatsApp for birthday notifications!');
    
  } catch (error) {
    console.error('Error during test:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testNotifications();
