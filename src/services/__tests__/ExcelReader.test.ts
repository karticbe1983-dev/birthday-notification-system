import { describe, it, expect, beforeEach } from 'vitest';
import { ExcelReader } from '../ExcelReader';
import { ILogger } from '../../models/interfaces/ILogger';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

// Mock logger implementation
class MockLogger implements ILogger {
  public logs: Array<{ level: string; message: string; metadata?: any }> = [];

  info(message: string, metadata?: any): void {
    this.logs.push({ level: 'info', message, metadata });
  }

  error(message: string, _error?: Error, metadata?: any): void {
    this.logs.push({ level: 'error', message, metadata });
  }

  warn(message: string, metadata?: any): void {
    this.logs.push({ level: 'warn', message, metadata });
  }

  clear(): void {
    this.logs = [];
  }
}

describe('ExcelReader', () => {
  let excelReader: ExcelReader;
  let mockLogger: MockLogger;
  const testDir = path.join(__dirname, 'test-files');

  beforeEach(() => {
    mockLogger = new MockLogger();
    excelReader = new ExcelReader(mockLogger);
    
    // Create test directory if it doesn't exist
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });

  describe('validateRecord', () => {
    it('should validate a record with all required fields', () => {
      const record = {
        Name: 'John Doe',
        Email: 'john@gmail.com',
        Birthday: '10/25/1990',
      };

      const result = excelReader.validateRecord(record, 2);

      expect(result).not.toBeNull();
      expect(result?.name).toBe('John Doe');
      expect(result?.email).toBe('john@gmail.com');
      expect(result?.birthday).toBeInstanceOf(Date);
      expect(result?.rowNumber).toBe(2);
    });

    it('should return null for record with missing name', () => {
      const record = {
        Email: 'john@gmail.com',
        Birthday: '10/25/1990',
      };

      const result = excelReader.validateRecord(record, 2);

      expect(result).toBeNull();
      expect(mockLogger.logs.some(log => log.level === 'error' && log.message.includes('Invalid record'))).toBe(true);
    });

    it('should return null for record with missing email', () => {
      const record = {
        Name: 'John Doe',
        Birthday: '10/25/1990',
      };

      const result = excelReader.validateRecord(record, 2);

      expect(result).toBeNull();
    });

    it('should return null for record with missing birthday', () => {
      const record = {
        Name: 'John Doe',
        Email: 'john@gmail.com',
      };

      const result = excelReader.validateRecord(record, 2);

      expect(result).toBeNull();
    });

    it('should validate email format correctly', () => {
      const validRecord = {
        Name: 'John Doe',
        Email: 'valid@gmail.com',
        Birthday: '10/25/1990',
      };

      const invalidRecord = {
        Name: 'Jane Doe',
        Email: 'invalid-email',
        Birthday: '10/25/1990',
      };

      expect(excelReader.validateRecord(validRecord, 2)).not.toBeNull();
      expect(excelReader.validateRecord(invalidRecord, 3)).toBeNull();
    });

    it('should handle case-insensitive column names', () => {
      const record = {
        name: 'John Doe',
        email: 'john@gmail.com',
        birthday: '10/25/1990',
      };

      const result = excelReader.validateRecord(record, 2);

      expect(result).not.toBeNull();
      expect(result?.name).toBe('John Doe');
    });
  });

  describe('date parsing', () => {
    it('should parse MM/DD/YYYY format', () => {
      const record = {
        Name: 'John Doe',
        Email: 'john@gmail.com',
        Birthday: '10/25/1990',
      };

      const result = excelReader.validateRecord(record, 2);

      expect(result).not.toBeNull();
      expect(result?.birthday.getMonth()).toBe(9); // October (0-indexed)
      expect(result?.birthday.getDate()).toBe(25);
      expect(result?.birthday.getFullYear()).toBe(1990);
    });

    it('should parse DD/MM/YYYY format', () => {
      const record = {
        Name: 'John Doe',
        Email: 'john@gmail.com',
        Birthday: '25/10/1990',
      };

      const result = excelReader.validateRecord(record, 2);

      expect(result).not.toBeNull();
      expect(result?.birthday.getMonth()).toBe(9); // October
      expect(result?.birthday.getDate()).toBe(25);
    });

    it('should parse YYYY-MM-DD format', () => {
      const record = {
        Name: 'John Doe',
        Email: 'john@gmail.com',
        Birthday: '1990-10-25',
      };

      const result = excelReader.validateRecord(record, 2);

      expect(result).not.toBeNull();
      expect(result?.birthday.getMonth()).toBe(9); // October
      expect(result?.birthday.getDate()).toBe(25);
      expect(result?.birthday.getFullYear()).toBe(1990);
    });

    it('should handle Excel serial date numbers', () => {
      const record = {
        Name: 'John Doe',
        Email: 'john@gmail.com',
        Birthday: 33211, // Excel serial date for 10/25/1990
      };

      const result = excelReader.validateRecord(record, 2);

      expect(result).not.toBeNull();
      expect(result?.birthday).toBeInstanceOf(Date);
    });

    it('should return null for invalid date format', () => {
      const record = {
        Name: 'John Doe',
        Email: 'john@gmail.com',
        Birthday: 'invalid-date',
      };

      const result = excelReader.validateRecord(record, 2);

      expect(result).toBeNull();
      expect(mockLogger.logs.some(log => log.level === 'error' && log.message.includes('Invalid date format'))).toBe(true);
    });
  });

  describe('readBirthdays', () => {
    it('should throw error for non-existent file', async () => {
      const nonExistentPath = path.join(testDir, 'non-existent.xlsx');

      await expect(excelReader.readBirthdays(nonExistentPath)).rejects.toThrow('Excel file not found');
    });

    it('should read valid Excel file with multiple records', async () => {
      // Create a test Excel file
      const testData = [
        { Name: 'John Doe', Email: 'john@gmail.com', Birthday: '10/25/1990' },
        { Name: 'Jane Smith', Email: 'jane@gmail.com', Birthday: '12/15/1985' },
        { Name: 'Bob Johnson', Email: 'bob@gmail.com', Birthday: '2025-10-25' },
      ];

      const worksheet = XLSX.utils.json_to_sheet(testData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Birthdays');
      
      const testFilePath = path.join(testDir, 'test-birthdays.xlsx');
      XLSX.writeFile(workbook, testFilePath);

      const results = await excelReader.readBirthdays(testFilePath);

      expect(results).toHaveLength(3);
      expect(results[0].name).toBe('John Doe');
      expect(results[1].name).toBe('Jane Smith');
      expect(results[2].name).toBe('Bob Johnson');

      // Clean up
      fs.unlinkSync(testFilePath);
    });

    it('should skip invalid records and continue processing', async () => {
      const testData = [
        { Name: 'John Doe', Email: 'john@gmail.com', Birthday: '10/25/1990' },
        { Name: 'Invalid', Email: 'invalid-email', Birthday: '10/25/1990' }, // Invalid email
        { Name: 'Jane Smith', Email: 'jane@gmail.com', Birthday: '12/15/1985' },
      ];

      const worksheet = XLSX.utils.json_to_sheet(testData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Birthdays');
      
      const testFilePath = path.join(testDir, 'test-invalid.xlsx');
      XLSX.writeFile(workbook, testFilePath);

      const results = await excelReader.readBirthdays(testFilePath);

      expect(results).toHaveLength(2);
      expect(results[0].name).toBe('John Doe');
      expect(results[1].name).toBe('Jane Smith');

      // Clean up
      fs.unlinkSync(testFilePath);
    });

    it('should return empty array for Excel file with no data rows', async () => {
      const worksheet = XLSX.utils.json_to_sheet([]);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Birthdays');
      
      const testFilePath = path.join(testDir, 'test-empty.xlsx');
      XLSX.writeFile(workbook, testFilePath);

      const results = await excelReader.readBirthdays(testFilePath);

      expect(results).toHaveLength(0);
      expect(mockLogger.logs.some(log => log.level === 'warn' && log.message.includes('no data rows'))).toBe(true);

      // Clean up
      fs.unlinkSync(testFilePath);
    });
  });
});
