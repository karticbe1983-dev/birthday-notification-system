import * as XLSX from 'xlsx';
import * as fs from 'fs';
import { IExcelReader } from '../models/interfaces/IExcelReader';
import { BirthdayRecord } from '../models/BirthdayRecord';
import { ILogger } from '../models/interfaces/ILogger';

/**
 * Service for reading and validating birthday records from Excel files
 */
export class ExcelReader implements IExcelReader {
  private logger: ILogger;

  constructor(logger: ILogger) {
    this.logger = logger;
  }

  /**
   * Reads birthday records from an Excel file
   * @param filePath - Path to the Excel file
   * @returns Promise resolving to array of validated birthday records
   */
  public async readBirthdays(filePath: string): Promise<BirthdayRecord[]> {
    try {
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        const error = new Error(`Excel file not found: ${filePath}`);
        this.logger.error('Excel file not found', error, { filePath });
        throw error;
      }

      // Read the Excel file
      const workbook = XLSX.readFile(filePath);
      
      // Get the first sheet
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        const error = new Error('Excel file contains no sheets');
        this.logger.error('Invalid Excel file format', error, { filePath });
        throw error;
      }

      const worksheet = workbook.Sheets[sheetName];
      
      // Convert sheet to JSON (skip header row)
      const rawData = XLSX.utils.sheet_to_json(worksheet, { defval: null });

      if (rawData.length === 0) {
        this.logger.warn('Excel file contains no data rows', { filePath });
        return [];
      }

      // Validate and transform records
      const validRecords: BirthdayRecord[] = [];
      
      for (let i = 0; i < rawData.length; i++) {
        // Row number is i + 2 (1 for 0-index, 1 for header row)
        const rowNumber = i + 2;
        const validatedRecord = this.validateRecord(rawData[i], rowNumber);
        
        if (validatedRecord) {
          validRecords.push(validatedRecord);
        }
      }

      this.logger.info(`Successfully read ${validRecords.length} valid birthday records from Excel`, {
        filePath,
        totalRows: rawData.length,
        validRows: validRecords.length,
      });

      return validRecords;
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw error;
      }
      
      const wrappedError = new Error(`Failed to read Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`);
      this.logger.error('Error reading Excel file', wrappedError, { filePath });
      throw wrappedError;
    }
  }

  /**
   * Validates a single record from the Excel sheet
   * @param record - Raw record data from Excel
   * @param rowNumber - Row number in Excel for error reporting
   * @returns Validated BirthdayRecord or null if invalid
   */
  public validateRecord(record: any, rowNumber: number): BirthdayRecord | null {
    const errors: string[] = [];

    // Check for required fields
    const name = record.Name || record.name;
    const email = record.Email || record.email;
    const birthdayRaw = record.Birthday || record.birthday;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      errors.push('missing or invalid name');
    }

    if (!email || typeof email !== 'string' || email.trim() === '') {
      errors.push('missing or invalid email');
    } else if (!this.isValidEmail(email.trim())) {
      errors.push('invalid email format');
    }

    if (!birthdayRaw) {
      errors.push('missing birthday');
    }

    // If there are validation errors, log and return null
    if (errors.length > 0) {
      this.logger.error(`Invalid record at row ${rowNumber}`, undefined, {
        rowNumber,
        errors: errors.join(', '),
        record: { name, email, birthday: birthdayRaw },
      });
      return null;
    }

    // Parse the birthday date
    const birthday = this.parseDate(birthdayRaw);
    
    if (!birthday) {
      this.logger.error(`Invalid date format at row ${rowNumber}`, undefined, {
        rowNumber,
        birthday: birthdayRaw,
        supportedFormats: 'MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD',
      });
      return null;
    }

    return {
      name: name.trim(),
      email: email.trim(),
      birthday,
      rowNumber,
    };
  }

  /**
   * Validates email format using regex
   * @param email - Email address to validate
   * @returns True if email format is valid
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Parses date from various formats
   * Supports: MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD, and Excel serial dates
   * @param dateValue - Date value from Excel
   * @returns Parsed Date object or null if invalid
   */
  private parseDate(dateValue: any): Date | null {
    // Handle Excel serial date numbers
    if (typeof dateValue === 'number') {
      const date = XLSX.SSF.parse_date_code(dateValue);
      if (date) {
        return new Date(date.y, date.m - 1, date.d);
      }
    }

    // Handle string dates
    if (typeof dateValue === 'string') {
      const trimmed = dateValue.trim();
      
      // Try YYYY-MM-DD format
      const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
      if (isoMatch) {
        const year = parseInt(isoMatch[1], 10);
        const month = parseInt(isoMatch[2], 10);
        const day = parseInt(isoMatch[3], 10);
        const date = new Date(year, month - 1, day);
        if (this.isValidDate(date, year, month, day)) {
          return date;
        }
      }

      // Try MM/DD/YYYY or DD/MM/YYYY format
      const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (slashMatch) {
        const part1 = parseInt(slashMatch[1], 10);
        const part2 = parseInt(slashMatch[2], 10);
        const year = parseInt(slashMatch[3], 10);

        // Try MM/DD/YYYY first
        let date = new Date(year, part1 - 1, part2);
        if (this.isValidDate(date, year, part1, part2)) {
          return date;
        }

        // Try DD/MM/YYYY
        date = new Date(year, part2 - 1, part1);
        if (this.isValidDate(date, year, part2, part1)) {
          return date;
        }
      }
    }

    // Handle Date objects
    if (dateValue instanceof Date && !isNaN(dateValue.getTime())) {
      return dateValue;
    }

    return null;
  }

  /**
   * Validates that a date object matches the expected values
   * @param date - Date object to validate
   * @param year - Expected year
   * @param month - Expected month (1-12)
   * @param day - Expected day
   * @returns True if date is valid and matches expected values
   */
  private isValidDate(date: Date, year: number, month: number, day: number): boolean {
    return (
      !isNaN(date.getTime()) &&
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    );
  }
}
