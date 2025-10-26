/**
 * Notification channel type for birthday messages
 */
export type NotificationChannel = 'email' | 'whatsapp' | 'both';

/**
 * Represents a single birthday record from the Excel sheet
 */
export interface BirthdayRecord {
  /** Full name of the person */
  name: string;
  
  /** Gmail address for sending birthday notification */
  email: string;
  
  /** Phone number in E.164 format for WhatsApp notifications (optional) */
  phone?: string;
  
  /** Birthday date */
  birthday: Date;
  
  /** Preferred notification channel (default: 'email') */
  notificationChannel: NotificationChannel;
  
  /** Excel row number for error reporting */
  rowNumber: number;
}
