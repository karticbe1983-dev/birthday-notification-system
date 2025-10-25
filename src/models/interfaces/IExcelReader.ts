import { BirthdayRecord } from '../BirthdayRecord';

/**
 * Interface for reading and validating birthday records from Excel files
 */
export interface IExcelReader {
  /**
   * Reads birthday records from an Excel file
   * @param filePath - Path to the Excel file
   * @returns Promise resolving to array of validated birthday records
   */
  readBirthdays(filePath: string): Promise<BirthdayRecord[]>;
  
  /**
   * Validates a single record from the Excel sheet
   * @param record - Raw record data from Excel
   * @param rowNumber - Row number in Excel for error reporting
   * @returns Validated BirthdayRecord or null if invalid
   */
  validateRecord(record: any, rowNumber: number): BirthdayRecord | null;
}
