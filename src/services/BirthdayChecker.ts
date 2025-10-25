import { IBirthdayChecker } from '../models/interfaces/IBirthdayChecker';
import { BirthdayRecord } from '../models/BirthdayRecord';

/**
 * Service for checking if birthdays match the current date
 */
export class BirthdayChecker implements IBirthdayChecker {
  /**
   * Finds all birthday records that match today's date
   * @param records - Array of birthday records to check
   * @returns Array of records with birthdays matching today
   */
  public findTodaysBirthdays(records: BirthdayRecord[]): BirthdayRecord[] {
    const today = new Date();
    return records.filter(record => this.isBirthdayToday(record.birthday, today));
  }

  /**
   * Checks if a birthday matches today's date (month and day only)
   * Uses local time to handle timezone considerations
   * @param birthday - The birthday date to check
   * @param today - The current date (defaults to now)
   * @returns True if the birthday matches today's month and day
   */
  public isBirthdayToday(birthday: Date, today: Date = new Date()): boolean {
    // Compare month and day only, ignoring year
    return (
      birthday.getMonth() === today.getMonth() &&
      birthday.getDate() === today.getDate()
    );
  }
}
