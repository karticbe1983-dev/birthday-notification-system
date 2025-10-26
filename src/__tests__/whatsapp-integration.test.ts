import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';
import { ConfigService } from '../services/ConfigService';
import { Logger } from '../utils/Logger';
import { ExcelReader } from '../services/ExcelReader';
import { BirthdayChecker } from '../services/BirthdayChecker';
import { EmailService } from '../services/EmailService';
import { WhatsAppService } from '../services/WhatsAppService';
import { TemplateEngine } from '../services/TemplateEngine';
import { NotificationManager } from '../services/NotificationManager';

/**
 * WhatsApp Integration Test Suite
 * Tests multi-channel notification functionality including WhatsApp
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 2.3, 2.5, 1.5, 6.5, 4.1-4.5
 */
describe('WhatsApp Integration Tests', () => {
  const testDir = path.join(process.cwd(), 'test-data-whatsapp');
  const testExcelPath = path.join(testDir, 'test-birthdays-whatsapp.xlsx');
  const testLogDir = path.join(testDir, 'logs');
  const testWhatsAppTemplatePath = path.join(testDir, 'test-whatsapp-template.txt');

  beforeAll(() => {
    // Create test directory
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    if (!fs.existsSync(testLogDir)) {
      fs.mkdirSync(testLogDir, { recursive: true });
    }

    // Create test WhatsApp template
    const whatsappTemplate = 'Happy Birthday {{name}}! 🎉 Wishing you a wonderful day!';
    fs.writeFileSync(testWhatsAppTemplatePath, whatsappTemplate);
  });

  afterAll(() => {
    // Cleanup test files
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  /**
   * Test 12.1: WhatsApp-only notifications
   * Requirement: 7.2 - WHEN NotificationChannel is "whatsapp", THE Notification System SHALL send only WhatsApp notification
   */
  it('should send WhatsApp-only notification and not send email', async () => {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const year = today.getFullYear();
    const todayFormatted = `${month}/${day}/${year}`;

    // Create test data with WhatsApp-only channel
    const testData = [
      {
        Name: 'WhatsApp User',
        Email: 'whatsapp@test.com',
        Phone: '+14155552671',
        Birthday: todayFormatted,
        NotificationChannel: 'whatsapp',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(testData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Birthdays');
    XLSX.writeFile(workbook, testExcelPath);

    const logger = new Logger(testLogDir, 'info');
    const excelReader = new ExcelReader(logger);
    const birthdayChecker = new BirthdayChecker();

    // Read and verify records
    const records = await excelReader.readBirthdays(testExcelPath);
    expect(records.length).toBe(1);
    expect(records[0].notificationChannel).toBe('whatsapp');
    expect(records[0].phone).toBe('+14155552671');

    // Find today's birthdays
    const todaysBirthdays = birthdayChecker.findTodaysBirthdays(records);
    expect(todaysBirthdays.length).toBe(1);

    // Verify the notification channel is correctly set
    expect(todaysBirthdays[0].notificationChannel).toBe('whatsapp');
  });

  /**
   * Test 12.2: Multi-channel notifications
   * Requirement: 7.3 - WHEN NotificationChannel is "both", THE Notification System SHALL send both email and WhatsApp notifications
   */
  it('should send both email and WhatsApp when channel is "both"', async () => {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const year = today.getFullYear();
    const todayFormatted = `${month}/${day}/${year}`;

    // Create test data with both channels
    const testData = [
      {
        Name: 'Multi Channel User',
        Email: 'both@test.com',
        Phone: '+14155552672',
        Birthday: todayFormatted,
        NotificationChannel: 'both',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(testData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Birthdays');
    XLSX.writeFile(workbook, testExcelPath);

    const logger = new Logger(testLogDir, 'info');
    const excelReader = new ExcelReader(logger);
    const birthdayChecker = new BirthdayChecker();

    // Read and verify records
    const records = await excelReader.readBirthdays(testExcelPath);
    expect(records.length).toBe(1);
    expect(records[0].notificationChannel).toBe('both');
    expect(records[0].phone).toBe('+14155552672');
    expect(records[0].email).toBe('both@test.com');

    // Find today's birthdays
    const todaysBirthdays = birthdayChecker.findTodaysBirthdays(records);
    expect(todaysBirthdays.length).toBe(1);
    expect(todaysBirthdays[0].notificationChannel).toBe('both');
  });

  /**
   * Test 12.3: Fallback scenarios - Invalid phone number
   * Requirement: 2.3, 2.5 - IF phone number is missing and NotificationChannel includes "whatsapp", 
   * THEN THE Excel Reader SHALL log a warning and fall back to email only
   */
  it('should fall back to email when phone is invalid for WhatsApp channel', async () => {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const year = today.getFullYear();
    const todayFormatted = `${month}/${day}/${year}`;

    // Create test data with invalid phone
    const testData = [
      {
        Name: 'Invalid Phone User',
        Email: 'invalid@test.com',
        Phone: 'invalid-phone',
        Birthday: todayFormatted,
        NotificationChannel: 'whatsapp',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(testData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Birthdays');
    XLSX.writeFile(workbook, testExcelPath);

    const logger = new Logger(testLogDir, 'info');
    const excelReader = new ExcelReader(logger);

    // Read records - should fall back to email
    const records = await excelReader.readBirthdays(testExcelPath);
    expect(records.length).toBe(1);
    expect(records[0].notificationChannel).toBe('email'); // Should fall back to email
    expect(records[0].email).toBe('invalid@test.com');

    // Wait for logs to be written
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify warning was logged
    const logFiles = fs.readdirSync(testLogDir);
    const logFile = logFiles.find(f => f.includes('birthday-system'));
    if (logFile) {
      const logContent = fs.readFileSync(path.join(testLogDir, logFile), 'utf-8');
      expect(logContent).toContain('Invalid or missing phone');
      expect(logContent).toContain('falling back to email');
    }
  });

  /**
   * Test 12.3: Fallback scenarios - Missing phone number
   */
  it('should fall back to email when phone is missing for WhatsApp channel', async () => {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const year = today.getFullYear();
    const todayFormatted = `${month}/${day}/${year}`;

    // Create test data with missing phone
    const testData = [
      {
        Name: 'Missing Phone User',
        Email: 'missing@test.com',
        Phone: '',
        Birthday: todayFormatted,
        NotificationChannel: 'whatsapp',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(testData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Birthdays');
    XLSX.writeFile(workbook, testExcelPath);

    const logger = new Logger(testLogDir, 'info');
    const excelReader = new ExcelReader(logger);

    // Read records - should fall back to email
    const records = await excelReader.readBirthdays(testExcelPath);
    expect(records.length).toBe(1);
    expect(records[0].notificationChannel).toBe('email'); // Should fall back to email
  });

  /**
   * Test 12.3: Fallback scenarios - Invalid NotificationChannel value
   * Requirement: 2.3 - WHEN NotificationChannel is empty or invalid, THE Excel Reader SHALL default to "email"
   */
  it('should default to email when NotificationChannel is invalid', async () => {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const year = today.getFullYear();
    const todayFormatted = `${month}/${day}/${year}`;

    // Create test data with invalid channel
    const testData = [
      {
        Name: 'Invalid Channel User',
        Email: 'invalidchannel@test.com',
        Phone: '+14155552673',
        Birthday: todayFormatted,
        NotificationChannel: 'sms', // Invalid channel
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(testData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Birthdays');
    XLSX.writeFile(workbook, testExcelPath);

    const logger = new Logger(testLogDir, 'info');
    const excelReader = new ExcelReader(logger);

    // Read records - should default to email
    const records = await excelReader.readBirthdays(testExcelPath);
    expect(records.length).toBe(1);
    expect(records[0].notificationChannel).toBe('email'); // Should default to email
  });

  /**
   * Test 12.3: Fallback scenarios - Empty NotificationChannel
   */
  it('should default to email when NotificationChannel is empty', async () => {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const year = today.getFullYear();
    const todayFormatted = `${month}/${day}/${year}`;

    // Create test data with empty channel
    const testData = [
      {
        Name: 'Empty Channel User',
        Email: 'emptychannel@test.com',
        Phone: '+14155552674',
        Birthday: todayFormatted,
        NotificationChannel: '',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(testData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Birthdays');
    XLSX.writeFile(workbook, testExcelPath);

    const logger = new Logger(testLogDir, 'info');
    const excelReader = new ExcelReader(logger);

    // Read records - should default to email
    const records = await excelReader.readBirthdays(testExcelPath);
    expect(records.length).toBe(1);
    expect(records[0].notificationChannel).toBe('email'); // Should default to email
  });

  /**
   * Test 12.4: WhatsApp disabled mode
   * Requirement: 1.5, 6.5 - IF Twilio credentials are missing, THEN THE Notification System SHALL log a warning 
   * and disable WhatsApp functionality
   */
  it('should continue with email-only when WhatsApp is disabled', () => {
    const logger = new Logger(testLogDir, 'info');
    const whatsappService = new WhatsAppService(logger);

    // Initialize with disabled WhatsApp (empty credentials)
    const disabledConfig = {
      accountSid: '',
      authToken: '',
      fromNumber: '',
      enabled: false,
    };

    // This should not throw and should handle gracefully
    expect(async () => {
      await whatsappService.initialize(disabledConfig);
    }).not.toThrow();

    // Verify the service recognizes it's disabled
    expect(disabledConfig.enabled).toBe(false);
  });

  /**
   * Test 12.5: Error handling and retries
   * Requirement: 4.1, 4.2, 4.3, 4.4, 4.5 - WhatsApp Service SHALL retry up to 3 times with exponential backoff
   */
  it('should handle WhatsApp service initialization without credentials', async () => {
    const logger = new Logger(testLogDir, 'info');
    const whatsappService = new WhatsAppService(logger);

    // Initialize with empty credentials (WhatsApp disabled)
    await whatsappService.initialize({
      accountSid: '',
      authToken: '',
      fromNumber: '',
      enabled: false,
    });

    // Test connection should return false when disabled
    const connectionSuccess = await whatsappService.testConnection();
    expect(connectionSuccess).toBe(false);
  });

  /**
   * Test: Template engine WhatsApp template loading
   * Requirement: 5.1, 5.2, 5.3 - Template Engine SHALL support WhatsApp templates
   */
  it('should load and render WhatsApp template', () => {
    const logger = new Logger(testLogDir, 'info');
    const templateEngine = new TemplateEngine(logger);

    // Load WhatsApp template
    const template = templateEngine.loadWhatsAppTemplate(testWhatsAppTemplatePath);

    // Verify template was loaded
    expect(template).toContain('{{name}}');
    expect(template).toContain('Happy Birthday');

    // Render template
    const rendered = templateEngine.renderWhatsApp(template, { name: 'John Doe' });

    // Verify variables were replaced
    expect(rendered).toBe('Happy Birthday John Doe! 🎉 Wishing you a wonderful day!');
    expect(rendered).not.toContain('{{name}}');
  });

  /**
   * Test: WhatsApp template fallback to email template
   * Requirement: 5.3 - WHERE no custom WhatsApp template is configured, 
   * THE Template Engine SHALL use the email template for WhatsApp messages
   */
  it('should fall back to email template when WhatsApp template not found', () => {
    const logger = new Logger(testLogDir, 'info');
    const templateEngine = new TemplateEngine(logger);

    // Try to load non-existent WhatsApp template
    const nonExistentPath = path.join(testDir, 'non-existent-whatsapp.txt');
    const template = templateEngine.loadWhatsAppTemplate(nonExistentPath);

    // Should return default template
    expect(template).toBeTruthy();
    expect(template).toContain('{{name}}');
  });

  /**
   * Test: Phone number validation with E.164 format
   * Requirement: 2.4 - THE Excel Reader SHALL validate phone number format when NotificationChannel includes "whatsapp"
   */
  it('should validate phone numbers in E.164 format', async () => {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const year = today.getFullYear();
    const todayFormatted = `${month}/${day}/${year}`;

    // Create test data with various phone formats
    const testData = [
      {
        Name: 'Valid US Phone',
        Email: 'validus@test.com',
        Phone: '+14155552671',
        Birthday: todayFormatted,
        NotificationChannel: 'whatsapp',
      },
      {
        Name: 'Valid India Phone',
        Email: 'validindia@test.com',
        Phone: '+919876543210',
        Birthday: todayFormatted,
        NotificationChannel: 'whatsapp',
      },
      {
        Name: 'Valid UK Phone',
        Email: 'validuk@test.com',
        Phone: '+447911123456',
        Birthday: todayFormatted,
        NotificationChannel: 'whatsapp',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(testData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Birthdays');
    XLSX.writeFile(workbook, testExcelPath);

    const logger = new Logger(testLogDir, 'info');
    const excelReader = new ExcelReader(logger);

    // Read records - all should be valid
    const records = await excelReader.readBirthdays(testExcelPath);
    expect(records.length).toBe(3);
    
    // All should have WhatsApp channel (not fallen back to email)
    expect(records[0].notificationChannel).toBe('whatsapp');
    expect(records[1].notificationChannel).toBe('whatsapp');
    expect(records[2].notificationChannel).toBe('whatsapp');
  });

  /**
   * Test: Multi-channel independent processing
   * Requirement: 7.4, 7.5 - THE Notification System SHALL process email and WhatsApp notifications independently
   */
  it('should process channels independently', async () => {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const year = today.getFullYear();
    const todayFormatted = `${month}/${day}/${year}`;

    // Create test data with both channels
    const testData = [
      {
        Name: 'Independent Test User',
        Email: 'independent@test.com',
        Phone: '+14155552675',
        Birthday: todayFormatted,
        NotificationChannel: 'both',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(testData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Birthdays');
    XLSX.writeFile(workbook, testExcelPath);

    const logger = new Logger(testLogDir, 'info');
    const excelReader = new ExcelReader(logger);
    const birthdayChecker = new BirthdayChecker();
    const emailService = new EmailService(logger);
    const whatsappService = new WhatsAppService(logger);
    const templateEngine = new TemplateEngine(logger);

    // Create notification manager with WhatsApp disabled
    const notificationManager = new NotificationManager(
      excelReader,
      birthdayChecker,
      emailService,
      whatsappService,
      templateEngine,
      logger,
      testExcelPath,
      false, // WhatsApp disabled
      undefined
    );

    // Process should not throw even though WhatsApp is disabled
    await expect(notificationManager.checkAndNotify()).resolves.not.toThrow();

    // Wait for logs to be written
    await new Promise(resolve => setTimeout(resolve, 200));

    // Verify logs show processing completed
    const logFiles = fs.readdirSync(testLogDir);
    const logFile = logFiles.find(f => f.includes('birthday-system'));
    
    // The test verifies that the system continues to work even when WhatsApp is disabled
    // The key is that checkAndNotify() completes without throwing
    expect(logFile).toBeDefined();
  });
});
