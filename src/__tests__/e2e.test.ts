import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';
import { ConfigService } from '../services/ConfigService';
import { Logger } from '../utils/Logger';
import { ExcelReader } from '../services/ExcelReader';
import { BirthdayChecker } from '../services/BirthdayChecker';
import { EmailService } from '../services/EmailService';
import { TemplateEngine } from '../services/TemplateEngine';
import { NotificationManager } from '../services/NotificationManager';

/**
 * End-to-End Test Suite for Birthday Notification System
 * Tests the complete flow from Excel reading to email sending
 * Requirements: 1.1, 2.1, 2.2, 3.1, 5.1
 */
describe('Birthday Notification System - End-to-End Tests', () => {
  const testDir = path.join(process.cwd(), 'test-data');
  const testExcelPath = path.join(testDir, 'test-birthdays.xlsx');
  const testLogDir = path.join(testDir, 'logs');
  const testTemplatePath = path.join(testDir, 'test-template.txt');

  beforeAll(() => {
    // Create test directory
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    if (!fs.existsSync(testLogDir)) {
      fs.mkdirSync(testLogDir, { recursive: true });
    }
  });

  afterAll(() => {
    // Cleanup test files
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  /**
   * Test: Create test Excel file with today's date
   * Requirement: 1.1 - Excel file reading
   */
  it('should create test Excel file with today\'s date for testing', () => {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const year = today.getFullYear();
    const todayFormatted = `${month}/${day}/${year}`;

    // Create test data with today's date
    const testData = [
      { Name: 'Test User 1', Email: 'test1@gmail.com', Birthday: todayFormatted },
      { Name: 'Test User 2', Email: 'test2@gmail.com', Birthday: '12/25/1990' },
      { Name: 'Test User 3', Email: 'test3@gmail.com', Birthday: todayFormatted },
    ];

    // Create Excel workbook
    const worksheet = XLSX.utils.json_to_sheet(testData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Birthdays');

    // Write to file
    XLSX.writeFile(workbook, testExcelPath);

    // Verify file was created
    expect(fs.existsSync(testExcelPath)).toBe(true);
  });

  /**
   * Test: Read Excel file and find today's birthdays
   * Requirements: 1.1, 2.1, 2.2 - Excel reading and birthday matching
   */
  it('should read Excel file and identify today\'s birthdays', async () => {
    const logger = new Logger(testLogDir, 'info');
    const excelReader = new ExcelReader(logger);
    const birthdayChecker = new BirthdayChecker();

    // Read birthdays from test file
    const records = await excelReader.readBirthdays(testExcelPath);

    // Verify records were read
    expect(records.length).toBeGreaterThan(0);
    expect(records[0]).toHaveProperty('name');
    expect(records[0]).toHaveProperty('email');
    expect(records[0]).toHaveProperty('birthday');

    // Find today's birthdays
    const todaysBirthdays = birthdayChecker.findTodaysBirthdays(records);

    // Verify we found the expected birthdays (should be 2 from our test data)
    expect(todaysBirthdays.length).toBe(2);
    expect(todaysBirthdays[0].name).toBe('Test User 1');
    expect(todaysBirthdays[1].name).toBe('Test User 3');
  });

  /**
   * Test: Verify logs contain correct information
   * Requirement: 5.1 - Logging of operations
   */
  it('should log operations correctly', async () => {
    const logger = new Logger(testLogDir, 'info');
    const excelReader = new ExcelReader(logger);

    // Perform an operation that generates logs
    await excelReader.readBirthdays(testExcelPath);

    // Wait a bit for logs to be written
    await new Promise(resolve => setTimeout(resolve, 100));

    // Check that log file was created
    const logFiles = fs.readdirSync(testLogDir);
    expect(logFiles.length).toBeGreaterThan(0);

    // Read log file content
    const logFile = logFiles.find(f => f.includes('birthday-system'));
    if (logFile) {
      const logContent = fs.readFileSync(path.join(testLogDir, logFile), 'utf-8');
      
      // Verify log contains expected information
      expect(logContent).toContain('Successfully read');
      expect(logContent).toContain('birthday records from Excel');
    }
  });

  /**
   * Test: Error scenario - missing file
   * Requirement: 1.1 - Error handling for missing files
   */
  it('should handle missing Excel file gracefully', async () => {
    const logger = new Logger(testLogDir, 'info');
    const excelReader = new ExcelReader(logger);
    const nonExistentPath = path.join(testDir, 'non-existent.xlsx');

    // Attempt to read non-existent file
    await expect(excelReader.readBirthdays(nonExistentPath)).rejects.toThrow();
  });

  /**
   * Test: Error scenario - invalid credentials
   * Requirement: 3.1 - Email service error handling
   */
  it('should handle invalid email credentials', async () => {
    const logger = new Logger(testLogDir, 'info');
    const emailService = new EmailService(logger);

    // Initialize with invalid credentials
    await emailService.initialize({
      user: 'invalid@gmail.com',
      password: 'invalid-password',
      from: 'Invalid <invalid@gmail.com>',
    });

    // Test connection should fail
    const connectionSuccess = await emailService.testConnection();
    expect(connectionSuccess).toBe(false);
  });

  /**
   * Test: Template engine with custom template
   * Requirement: 6.1 - Template loading and rendering
   */
  it('should load and render custom email template', () => {
    const logger = new Logger(testLogDir, 'info');
    const templateEngine = new TemplateEngine(logger);

    // Create custom template file
    const customTemplate = 'Subject: Test Birthday {{name}}\n\nHappy Birthday {{name}}!';
    fs.writeFileSync(testTemplatePath, customTemplate);

    // Load template
    const template = templateEngine.loadTemplate(testTemplatePath);

    // Verify template was loaded
    expect(template.subject).toContain('{{name}}');
    expect(template.body).toContain('{{name}}');

    // Render template
    const rendered = templateEngine.renderEmail(template, { name: 'John Doe' });

    // Verify variables were replaced
    expect(rendered.subject).toBe('Test Birthday John Doe');
    expect(rendered.body).toBe('Happy Birthday John Doe!');
  });

  /**
   * Test: Complete notification flow (without actual email sending)
   * Requirements: 2.1, 2.2, 3.1, 5.1 - Full system integration
   */
  it('should complete full notification flow', async () => {
    const logger = new Logger(testLogDir, 'info');
    const excelReader = new ExcelReader(logger);
    const birthdayChecker = new BirthdayChecker();
    const emailService = new EmailService(logger);
    const templateEngine = new TemplateEngine(logger);

    const notificationManager = new NotificationManager(
      excelReader,
      birthdayChecker,
      emailService,
      templateEngine,
      logger,
      testExcelPath,
      undefined
    );

    // Note: We don't initialize email service with real credentials
    // This test verifies the flow without actually sending emails

    // The checkAndNotify will attempt to process but fail at email sending
    // This is expected behavior for testing without real credentials
    await expect(notificationManager.checkAndNotify()).resolves.not.toThrow();

    // Verify logs were created
    await new Promise(resolve => setTimeout(resolve, 100));
    const logFiles = fs.readdirSync(testLogDir);
    expect(logFiles.length).toBeGreaterThan(0);
  });

  /**
   * Test: Configuration validation
   * Requirement: 4.1 - Configuration management
   */
  it('should validate configuration on startup', () => {
    // Save current env
    const originalEnv = { ...process.env };

    try {
      // Set test environment variables
      process.env.EXCEL_FILE_PATH = testExcelPath;
      process.env.GMAIL_USER = 'test@gmail.com';
      process.env.GMAIL_PASSWORD = 'test-password';
      process.env.GMAIL_FROM = 'Test <test@gmail.com>';

      const configService = new ConfigService();
      configService.loadConfig();
      const config = configService.getConfig();

      // Verify configuration was loaded correctly
      expect(config.excel.filePath).toBe(testExcelPath);
      expect(config.email.user).toBe('test@gmail.com');
      expect(config.email.password).toBe('test-password');
      expect(config.email.from).toBe('Test <test@gmail.com>');
    } finally {
      // Restore original env
      process.env = originalEnv;
    }
  });

  /**
   * Test: Invalid Excel data handling
   * Requirement: 1.1 - Data validation
   */
  it('should handle invalid Excel data gracefully', async () => {
    const logger = new Logger(testLogDir, 'info');
    const excelReader = new ExcelReader(logger);

    // Create Excel file with invalid data
    const invalidExcelPath = path.join(testDir, 'invalid-birthdays.xlsx');
    const invalidData = [
      { Name: 'Valid User', Email: 'valid@gmail.com', Birthday: '01/15/1990' },
      { Name: '', Email: 'noemail@gmail.com', Birthday: '02/20/1985' }, // Missing name
      { Name: 'No Email', Email: '', Birthday: '03/25/1992' }, // Missing email
      { Name: 'Invalid Date', Email: 'invalid@gmail.com', Birthday: 'not-a-date' }, // Invalid date
    ];

    const worksheet = XLSX.utils.json_to_sheet(invalidData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Birthdays');
    XLSX.writeFile(workbook, invalidExcelPath);

    // Read file - should skip invalid records
    const records = await excelReader.readBirthdays(invalidExcelPath);

    // Should only have the valid record
    expect(records.length).toBe(1);
    expect(records[0].name).toBe('Valid User');
  });
});
