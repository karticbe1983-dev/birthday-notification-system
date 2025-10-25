import { describe, it, expect, beforeEach } from 'vitest';
import { BirthdayChecker } from '../BirthdayChecker';
import { BirthdayRecord } from '../../models/BirthdayRecord';

describe('BirthdayChecker', () => {
  let birthdayChecker: BirthdayChecker;

  beforeEach(() => {
    birthdayChecker = new BirthdayChecker();
  });

  describe('isBirthdayToday', () => {
    it('should return true when birthday matches today', () => {
      const today = new Date(2025, 9, 25); // October 25, 2025
      const birthday = new Date(1990, 9, 25); // October 25, 1990

      const result = birthdayChecker.isBirthdayToday(birthday, today);

      expect(result).toBe(true);
    });

    it('should return false when birthday does not match today', () => {
      const today = new Date(2025, 9, 25); // October 25, 2025
      const birthday = new Date(1990, 9, 26); // October 26, 1990

      const result = birthdayChecker.isBirthdayToday(birthday, today);

      expect(result).toBe(false);
    });

    it('should return false when month matches but day does not', () => {
      const today = new Date(2025, 9, 25); // October 25, 2025
      const birthday = new Date(1990, 9, 15); // October 15, 1990

      const result = birthdayChecker.isBirthdayToday(birthday, today);

      expect(result).toBe(false);
    });

    it('should return false when day matches but month does not', () => {
      const today = new Date(2025, 9, 25); // October 25, 2025
      const birthday = new Date(1990, 10, 25); // November 25, 1990

      const result = birthdayChecker.isBirthdayToday(birthday, today);

      expect(result).toBe(false);
    });

    it('should handle leap year birthdays on February 29', () => {
      const today = new Date(2024, 1, 29); // February 29, 2024 (leap year)
      const birthday = new Date(2000, 1, 29); // February 29, 2000 (leap year)

      const result = birthdayChecker.isBirthdayToday(birthday, today);

      expect(result).toBe(true);
    });

    it('should handle different years correctly', () => {
      const today = new Date(2025, 11, 15); // December 15, 2025
      const birthday = new Date(1985, 11, 15); // December 15, 1985

      const result = birthdayChecker.isBirthdayToday(birthday, today);

      expect(result).toBe(true);
    });
  });

  describe('findTodaysBirthdays', () => {
    it('should return empty array when no birthdays match', () => {
      const today = new Date(2025, 9, 25); // October 25, 2025
      const records: BirthdayRecord[] = [
        { name: 'John Doe', email: 'john@gmail.com', birthday: new Date(1990, 9, 26), rowNumber: 2 },
        { name: 'Jane Smith', email: 'jane@gmail.com', birthday: new Date(1985, 10, 15), rowNumber: 3 },
      ];

      // Mock the current date
      birthdayChecker.findTodaysBirthdays = function(records: BirthdayRecord[]): BirthdayRecord[] {
        return records.filter(record => birthdayChecker.isBirthdayToday(record.birthday, today));
      };

      const result = birthdayChecker.findTodaysBirthdays(records);

      expect(result).toHaveLength(0);
    });

    it('should return matching birthdays', () => {
      const today = new Date(2025, 9, 25); // October 25, 2025
      const records: BirthdayRecord[] = [
        { name: 'John Doe', email: 'john@gmail.com', birthday: new Date(1990, 9, 25), rowNumber: 2 },
        { name: 'Jane Smith', email: 'jane@gmail.com', birthday: new Date(1985, 10, 15), rowNumber: 3 },
        { name: 'Bob Johnson', email: 'bob@gmail.com', birthday: new Date(2000, 9, 25), rowNumber: 4 },
      ];

      // Mock the current date
      birthdayChecker.findTodaysBirthdays = function(records: BirthdayRecord[]): BirthdayRecord[] {
        return records.filter(record => birthdayChecker.isBirthdayToday(record.birthday, today));
      };

      const result = birthdayChecker.findTodaysBirthdays(records);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('John Doe');
      expect(result[1].name).toBe('Bob Johnson');
    });

    it('should return all records when all birthdays match', () => {
      const today = new Date(2025, 9, 25); // October 25, 2025
      const records: BirthdayRecord[] = [
        { name: 'John Doe', email: 'john@gmail.com', birthday: new Date(1990, 9, 25), rowNumber: 2 },
        { name: 'Jane Smith', email: 'jane@gmail.com', birthday: new Date(1985, 9, 25), rowNumber: 3 },
      ];

      birthdayChecker.findTodaysBirthdays = function(records: BirthdayRecord[]): BirthdayRecord[] {
        return records.filter(record => birthdayChecker.isBirthdayToday(record.birthday, today));
      };

      const result = birthdayChecker.findTodaysBirthdays(records);

      expect(result).toHaveLength(2);
    });

    it('should handle empty array', () => {
      const records: BirthdayRecord[] = [];

      const result = birthdayChecker.findTodaysBirthdays(records);

      expect(result).toHaveLength(0);
    });
  });
});
