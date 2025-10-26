// Test script using the main birthdays.xlsx file with today's date added
import * as dotenv from 'dotenv';
import * as XLSX from 'xlsx';
import * as path from 'path';
import { ConfigService } from './src/services/ConfigService';
import { Logger } from './src/utils/Logger';
import { ExcelReader } from './src/services/ExcelReader';
import { BirthdayChecker } from './src/services/BirthdayChecker';
import { EmailService } from './src/services/EmailService';
import { WhatsAppService } from './src/services/WhatsAppService';
import { TemplateEngine } from './src/services/TemplateEngine';
import { NotificationManager } from './src/services/NotificationManager';

async function testWithMainFile() {
  console.log('=== Testing Birthday Notifications with Main File ===\n');
  
  try {
    // Get today's date
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const year = today.getFullYear();
    const todayFormatted = `${month}/${day}/${year}`;
    
    console.log(`Today's date: ${todayFormatted}\n`);
    
    // Create a temporary test file with today's birthday
    const testFilePath = './birthdays-test-temp.xlsx';
    
    const testData = [
      {
        Name: 'Test Birthday User',
        Email: 'karticbe1983@gmail.com',
        Phone: '+919342943148',
        Birthday: todayFormatted,
        NotificationChannel: 'email' // Using email only since WhatsApp number not registered
      },
      {
        Name: 'Another Test User',
        Email: 'karticbe1983@gmail.com',
        Phone: '',
        Birthday: todayFormatted,
        NotificationChannel: 'email'
      }
    ];
    
    console.log('Creating test birthday records:');
    testData.forEach((record, index) => {
      console.log(`  ${index + 1}. ${record.Name} - ${record.Email} [${record.NotificationChannel}]`);
    });
    console.log('');
    
    // Create test Excel file
    const worksheet = XLSX.utils.json_to_sheet(testData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Birthdays');
    XLSX.writeFile(workbook, testFilePath);
    
    // Load environment variables
    dotenv.config();
    
    // Override Excel file path
    process.env.EXCEL_FILE_PATH = testFilePath;
    
    // Initialize services
    const configService = new ConfigService();
    configService.loadConfig();
    const config = configService.getConfig();
    
    const logger = new Logger(config.logging.directory, config.logging.level);
    
    const excelReader = new ExcelReader(logger);
    const birthdayChecker = new BirthdayChecker();
    const emailService = new EmailService(logger);
    const whatsappService = new WhatsAppService(logger);
    const templateEngine = new TemplateEngine(logger);
    
    // Initialize email service
    console.log('Initializing services...');
    await emailService.initialize({
      user: config.email.user,
      password: config.email.password,
      from: config.email.from,
    });
    
    const emailConnected = await emailService.testConnection();
    console.log(`✓ Email service: ${emailConnected ? 'Connected' : 'Failed'}`);
    
    // Initialize WhatsApp service if enabled
    if (config.whatsapp.enabled) {
      await whatsappService.initialize({
        accountSid: config.whatsapp.accountSid,
        authToken: config.whatsapp.authToken,
        fromNumber: config.whatsapp.fromNumber,
        enabled: config.whatsapp.enabled,
      });
      
      const whatsappConnected = await whatsappService.testConnection();
      console.log(`✓ WhatsApp service: ${whatsappConnected ? 'Connected' : 'Failed'}`);
    }
    
    console.log('');
    
    // Create notification manager
    const notificationManager = new NotificationManager(
      excelReader,
      birthdayChecker,
      emailService,
      whatsappService,
      templateEngine,
      logger,
      testFilePath,
      config.whatsapp.enabled,
      config.template.filePath
    );
    
    // Run birthday check and send notifications
    console.log('═'.repeat(70));
    console.log('CHECKING FOR BIRTHDAYS AND SENDING NOTIFICATIONS');
    console.log('═'.repeat(70));
    console.log('');
    
    await notificationManager.checkAndNotify();
    
    console.log('');
    console.log('═'.repeat(70));
    console.log('TEST COMPLETE');
    console.log('═'.repeat(70));
    console.log('');
    console.log('✓ Birthday check completed successfully!');
    console.log('✓ Check your email at: karticbe1983@gmail.com');
    console.log('');
    console.log('Expected results:');
    console.log('  - 2 birthday notifications found');
    console.log('  - 2 emails sent');
    console.log('  - Check your inbox for birthday messages');
    
  } catch (error) {
    console.error('\n✗ Error during test:', (error as Error).message);
    console.error((error as Error).stack);
    process.exit(1);
  }
}

testWithMainFile();
