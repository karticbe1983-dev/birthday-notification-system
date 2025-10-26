// Test the application with actual birthdays.xlsx file
import * as dotenv from 'dotenv';
import { ConfigService } from './src/services/ConfigService';
import { Logger } from './src/utils/Logger';
import { ExcelReader } from './src/services/ExcelReader';
import { BirthdayChecker } from './src/services/BirthdayChecker';
import { EmailService } from './src/services/EmailService';
import { WhatsAppService } from './src/services/WhatsAppService';
import { TemplateEngine } from './src/services/TemplateEngine';
import { NotificationManager } from './src/services/NotificationManager';

async function testApplication() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     Birthday Notification System - Live Test              ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  try {
    // Load environment variables
    dotenv.config();
    
    console.log('📋 Step 1: Loading configuration...');
    const configService = new ConfigService();
    configService.loadConfig();
    const config = configService.getConfig();
    console.log('✓ Configuration loaded\n');
    
    console.log('📊 Configuration Summary:');
    console.log(`   Excel File: ${config.excel.filePath}`);
    console.log(`   Email: ${config.email.user}`);
    console.log(`   WhatsApp: ${config.whatsapp.enabled ? 'Enabled' : 'Disabled'}`);
    if (config.whatsapp.enabled) {
      console.log(`   WhatsApp Number: ${config.whatsapp.fromNumber}`);
    }
    console.log('');
    
    // Initialize services
    console.log('🔧 Step 2: Initializing services...');
    const logger = new Logger(config.logging.directory, config.logging.level);
    const excelReader = new ExcelReader(logger);
    const birthdayChecker = new BirthdayChecker();
    const emailService = new EmailService(logger);
    const whatsappService = new WhatsAppService(logger);
    const templateEngine = new TemplateEngine(logger);
    console.log('✓ Services initialized\n');
    
    // Initialize email service
    console.log('📧 Step 3: Testing email connection...');
    await emailService.initialize({
      user: config.email.user,
      password: config.email.password,
      from: config.email.from,
    });
    
    const emailConnected = await emailService.testConnection();
    if (emailConnected) {
      console.log('✓ Email connection successful\n');
    } else {
      console.log('✗ Email connection failed\n');
      throw new Error('Email service connection failed');
    }
    
    // Initialize WhatsApp service if enabled
    if (config.whatsapp.enabled) {
      console.log('📱 Step 4: Testing WhatsApp connection...');
      await whatsappService.initialize({
        accountSid: config.whatsapp.accountSid,
        authToken: config.whatsapp.authToken,
        fromNumber: config.whatsapp.fromNumber,
        enabled: config.whatsapp.enabled,
      });
      
      const whatsappConnected = await whatsappService.testConnection();
      if (whatsappConnected) {
        console.log('✓ WhatsApp connection successful\n');
      } else {
        console.log('⚠ WhatsApp connection failed (will continue with email only)\n');
      }
    } else {
      console.log('📱 Step 4: WhatsApp disabled (email-only mode)\n');
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
    console.log('🎂 Step 5: Checking for birthdays and sending notifications...\n');
    console.log('═'.repeat(60));
    
    await notificationManager.checkAndNotify();
    
    console.log('═'.repeat(60));
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                    Test Complete! ✓                        ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    
    console.log('📬 Next Steps:');
    console.log('   1. Check your email inbox for birthday notifications');
    if (config.whatsapp.enabled) {
      console.log('   2. Check WhatsApp for birthday messages');
    }
    console.log('   3. Review logs in ./logs directory for details\n');
    
  } catch (error) {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                    Test Failed! ✗                          ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    console.error('Error:', (error as Error).message);
    console.error('\nFull error details:');
    console.error((error as Error).stack);
    process.exit(1);
  }
}

testApplication();
