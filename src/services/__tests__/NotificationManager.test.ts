import { describe, it, expect, beforeEach } from 'vitest';
import { NotificationManager } from '../NotificationManager';
import { ExcelReader } from '../ExcelReader';
import { BirthdayChecker } from '../BirthdayChecker';
import { EmailService } from '../EmailService';
import { TemplateEngine } from '../TemplateEngine';
import { ILogger } from '../../models/interfaces/ILogger';
import { BirthdayRecord } from '../../models/BirthdayRecord';
import { EmailTemplate } from '../../models/EmailTemplate';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

// Mock logger implementation
class MockLogger implements ILogger {
  public logs: Array<{ level: string; message: string; metadata?: any; error?: Error }> = [];

  info(message: string, metadata?: any): void {
    this.logs.push({ level: 'info', message, metadata });
  }

  error(message: string, error?: Error, metadata?: any): void {
    this.logs.push({ level: 'error', message, error, metadata });
  }

  warn(message: string, metadata?: any): void {
    this.logs.push({ level: 'warn', message, metadata });
  }

  clear(): void {
    this.logs = [];
  }

  hasLog(level: string, messageSubstring: string): boolean {
    return this.logs.some(log => log.level === level && log.message.includes(messageSubstring));
  }
}

// Mock EmailService for testing
class MockEmailService extends EmailService {
  public sentEmails: Array<{ recipient: BirthdayRecord; template: EmailTemplate }> = [];
  public shouldFail: boolean = false;
  public failureError: Error = new Error('Email send failed');

  constructor(logger: ILogger) {
    super(logger, 0); // No retry delay for tests
  }

  async initialize(): Promise<void> {
    // Mock initialization
  }

  async testConnection(): Promise<boolean> {
    return true;
  }

  async sendBirthdayEmail(recipient: BirthdayRecord, template: EmailTemplate): Promise<void> {
    if (this.shouldFail) {
      throw this.failureError;
    }
    this.sentEmails.push({ recipient, template });
  }

  clear(): void {
    this.sentEmails = [];
    this.shouldFail = false;
  }
}

describe('NotificationManager Integration Tests', () => {
  let notificationManager: NotificationManager;
  let mockLogger: MockLogger;
  let mockEmailService: MockEmailService;
  let excelReader: ExcelReader;
  let birthdayChecker: BirthdayChecker;
  let templateEngine: TemplateEngine;
  const testDir = path.join(__dirname, 'test-files');

  beforeEach(() => {
    mockLogger = new MockLogger();
    mockEmailService = new MockEmailService(mockLogger);
    excelReader = new ExcelReader(mockLogger);
    birthdayChecker = new BirthdayChecker();
    templateEngine = new TemplateEngine(mockLogger);

    // Create test directory if it doesn't exist
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }

    mockLogger.clear();
    mockEmailService.clear();
  });

  describe('End-to-end flow with sample Excel file', () => {
    it('should successfully process birthdays matching today\'s date', async () => {
      // Create test Excel file with today's date
      const today = new Date();
      const todayStr = `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`;
      
      const testData = [
        { Name: 'John Doe', Email: 'john@gmail.com', Birthday: todayStr },
        { Name: 'Jane Smith', Email: 'jane@gmail.com', Birthday: '12/15/1985' },
        { Name: 'Bob Johnson', Email: 'bob@gmail.com', Birthday: todayStr },
      ];

      const worksheet = XLSX.utils.json_to_sheet(testData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Birthdays');
      
      const testFilePath = path.join(testDir, 'test-today-birthdays.xlsx');
      XLSX.writeFile(workbook, testFilePath);

      // Create NotificationManager
      notificationManager = new NotificationManager(
        excelReader,
        birthdayChecker,
        mockEmailService,
        templateEngine,
        mockLogger,
        testFilePath
      );

      // Execute
      await notificationManager.checkAndNotify();

      // Verify emails were sent to the two people with birthdays today
      expect(mockEmailService.sentEmails).toHaveLength(2);
      expect(mockEmailService.sentEmails[0].recipient.name).toBe('John Doe');
      expect(mockEmailService.sentEmails[1].recipient.name).toBe('Bob Johnson');

      // Verify logging
      expect(mockLogger.hasLog('info', 'Starting birthday check')).toBe(true);
      expect(mockLogger.hasLog('info', 'Found 2 birthday(s) for today')).toBe(true);
      expect(mockLogger.hasLog('info', 'Successfully sent birthday email')).toBe(true);
      expect(mockLogger.hasLog('info', 'completed')).toBe(true);

      // Clean up
      fs.unlinkSync(testFilePath);
    });

    it('should handle case when no birthdays match today', async () => {
      const testData = [
        { Name: 'John Doe', Email: 'john@gmail.com', Birthday: '01/01/1990' },
        { Name: 'Jane Smith', Email: 'jane@gmail.com', Birthday: '12/31/1985' },
      ];

      const worksheet = XLSX.utils.json_to_sheet(testData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Birthdays');
      
      const testFilePath = path.join(testDir, 'test-no-birthdays.xlsx');
      XLSX.writeFile(workbook, testFilePath);

      notificationManager = new NotificationManager(
        excelReader,
        birthdayChecker,
        mockEmailService,
        templateEngine,
        mockLogger,
        testFilePath
      );

      await notificationManager.checkAndNotify();

      // Verify no emails were sent
      expect(mockEmailService.sentEmails).toHaveLength(0);

      // Verify logging
      expect(mockLogger.hasLog('info', 'No birthdays found for today')).toBe(true);

      // Clean up
      fs.unlinkSync(testFilePath);
    });

    it('should handle empty Excel file gracefully', async () => {
      const worksheet = XLSX.utils.json_to_sheet([]);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Birthdays');
      
      const testFilePath = path.join(testDir, 'test-empty-file.xlsx');
      XLSX.writeFile(workbook, testFilePath);

      notificationManager = new NotificationManager(
        excelReader,
        birthdayChecker,
        mockEmailService,
        templateEngine,
        mockLogger,
        testFilePath
      );

      await notificationManager.checkAndNotify();

      // Verify no emails were sent
      expect(mockEmailService.sentEmails).toHaveLength(0);

      // Verify logging
      expect(mockLogger.hasLog('warn', 'No valid birthday records found')).toBe(true);

      // Clean up
      fs.unlinkSync(testFilePath);
    });
  });

  describe('Error handling when Excel file is missing', () => {
    it('should throw error and log when Excel file does not exist', async () => {
      const nonExistentPath = path.join(testDir, 'non-existent-file.xlsx');

      notificationManager = new NotificationManager(
        excelReader,
        birthdayChecker,
        mockEmailService,
        templateEngine,
        mockLogger,
        nonExistentPath
      );

      await expect(notificationManager.checkAndNotify()).rejects.toThrow('Excel file not found');

      // Verify error was logged
      expect(mockLogger.hasLog('error', 'Excel file not found')).toBe(true);
    });
  });

  describe('Error handling when email sending fails', () => {
    it('should continue processing other records when one email fails', async () => {
      const today = new Date();
      const todayStr = `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`;
      
      const testData = [
        { Name: 'John Doe', Email: 'john@gmail.com', Birthday: todayStr },
        { Name: 'Jane Smith', Email: 'jane@gmail.com', Birthday: todayStr },
        { Name: 'Bob Johnson', Email: 'bob@gmail.com', Birthday: todayStr },
      ];

      const worksheet = XLSX.utils.json_to_sheet(testData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Birthdays');
      
      const testFilePath = path.join(testDir, 'test-email-failure.xlsx');
      XLSX.writeFile(workbook, testFilePath);

      notificationManager = new NotificationManager(
        excelReader,
        birthdayChecker,
        mockEmailService,
        templateEngine,
        mockLogger,
        testFilePath
      );

      // Make email service fail on first call only
      let callCount = 0;
      const originalSend = mockEmailService.sendBirthdayEmail.bind(mockEmailService);
      mockEmailService.sendBirthdayEmail = async (recipient: BirthdayRecord, template: EmailTemplate) => {
        callCount++;
        if (callCount === 1) {
          throw new Error('SMTP connection failed');
        }
        return originalSend(recipient, template);
      };

      await notificationManager.checkAndNotify();

      // Verify that 2 emails were sent (first one failed, other 2 succeeded)
      expect(mockEmailService.sentEmails).toHaveLength(2);
      expect(mockEmailService.sentEmails[0].recipient.name).toBe('Jane Smith');
      expect(mockEmailService.sentEmails[1].recipient.name).toBe('Bob Johnson');

      // Verify error was logged for the failed email
      expect(mockLogger.hasLog('error', 'Failed to send birthday email')).toBe(true);
      
      // Verify successful emails were logged
      const successLogs = mockLogger.logs.filter(log => 
        log.level === 'info' && log.message.includes('Successfully sent birthday email')
      );
      expect(successLogs).toHaveLength(2);

      // Clean up
      fs.unlinkSync(testFilePath);
    });
  });

  describe('Logging verification', () => {
    it('should log successful operations with correct details', async () => {
      const today = new Date();
      const todayStr = `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`;
      
      const testData = [
        { Name: 'John Doe', Email: 'john@gmail.com', Birthday: todayStr },
      ];

      const worksheet = XLSX.utils.json_to_sheet(testData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Birthdays');
      
      const testFilePath = path.join(testDir, 'test-logging.xlsx');
      XLSX.writeFile(workbook, testFilePath);

      notificationManager = new NotificationManager(
        excelReader,
        birthdayChecker,
        mockEmailService,
        templateEngine,
        mockLogger,
        testFilePath
      );

      await notificationManager.checkAndNotify();

      // Verify detailed logging
      const successLog = mockLogger.logs.find(log => 
        log.level === 'info' && 
        log.message.includes('Successfully sent birthday email')
      );
      
      expect(successLog).toBeDefined();
      expect(successLog?.metadata?.recipient).toBe('John Doe');
      expect(successLog?.metadata?.email).toBe('john@gmail.com');
      expect(successLog?.metadata?.timestamp).toBeDefined();

      // Clean up
      fs.unlinkSync(testFilePath);
    });

    it('should log errors with affected birthday record details', async () => {
      const today = new Date();
      const todayStr = `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`;
      
      const testData = [
        { Name: 'John Doe', Email: 'john@gmail.com', Birthday: todayStr },
      ];

      const worksheet = XLSX.utils.json_to_sheet(testData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Birthdays');
      
      const testFilePath = path.join(testDir, 'test-error-logging.xlsx');
      XLSX.writeFile(workbook, testFilePath);

      notificationManager = new NotificationManager(
        excelReader,
        birthdayChecker,
        mockEmailService,
        templateEngine,
        mockLogger,
        testFilePath
      );

      // Make email service always fail
      mockEmailService.shouldFail = true;
      mockEmailService.failureError = new Error('Network timeout');

      await notificationManager.checkAndNotify();

      // Verify error logging with details
      const errorLog = mockLogger.logs.find(log => 
        log.level === 'error' && 
        log.message.includes('Failed to send birthday email')
      );
      
      expect(errorLog).toBeDefined();
      expect(errorLog?.metadata?.recipient).toBe('John Doe');
      expect(errorLog?.metadata?.email).toBe('john@gmail.com');
      expect(errorLog?.metadata?.rowNumber).toBe(2);

      // Clean up
      fs.unlinkSync(testFilePath);
    });
  });
});
