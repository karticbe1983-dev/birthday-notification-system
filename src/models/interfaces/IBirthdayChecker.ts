import { BirthdayRecord } from '../BirthdayRecord';

/**
 * Interface for checking if birthdays match the current date
 */
export interface IBirthdayChecker {
  /**
   * Finds all birthday records that match today's date
   * @param records - Array of birthday records to check
   * @returns Array of records with birthdays matching today
   */
  findTodaysBirthdays(records: BirthdayRecord[]): BirthdayRecord[];
}
