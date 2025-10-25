/**
 * Represents a single birthday record from the Excel sheet
 */
export interface BirthdayRecord {
  /** Full name of the person */
  name: string;
  
  /** Gmail address for sending birthday notification */
  email: string;
  
  /** Birthday date */
  birthday: Date;
  
  /** Excel row number for error reporting */
  rowNumber: number;
}
