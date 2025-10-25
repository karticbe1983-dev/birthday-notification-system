import { INotificationManager } from '../models/interfaces/INotificationManager';
import { IExcelReader } from '../models/interfaces/IExcelReader';
import { IBirthdayChecker } from '../models/interfaces/IBirthdayChecker';
import { IEmailService } from '../models/interfaces/IEmailService';
import { ITemplateEngine } from '../models/interfaces/ITemplateEngine';
import { ILogger } from '../models/interfaces/ILogger';
import { BirthdayRecord } from '../models/BirthdayRecord';

/**
 * Orchestrates the birthday checking and notification process
 * Coordinates Excel reading, birthday checking, and email sending
 */
export class NotificationManager implements INotificationManager {
  private excelReader: IExcelReader;
  private birthdayChecker: IBirthdayChecker;
  private emailService: IEmailService;
  private templateEngine: ITemplateEngine;
  private logger: ILogger;
  private excelFilePath: string;
  private templateFilePath?: string;

  constructor(
    excelReader: IExcelReader,
    birthdayChecker: IBirthdayChecker,
    emailService: IEmailService,
    templateEngine: ITemplateEngine,
    logger: ILogger,
    excelFilePath: string,
    templateFilePath?: string
  ) {
    this.excelReader = excelReader;
    this.birthdayChecker = birthdayChecker;
    this.emailService = emailService;
    this.templateEngine = templateEngine;
    this.logger = logger;
    this.excelFilePath = excelFilePath;
    this.templateFilePath = templateFilePath;
  }

  /**
   * Checks for today's birthdays and sends notification emails
   * Orchestrates: read Excel → find birthdays → send emails
   */
  async checkAndNotify(): Promise<void> {
    this.logger.info('Starting birthday check and notification process');

    try {
      // Step 1: Read birthday records from Excel
      this.logger.info('Reading birthday records from Excel', { filePath: this.excelFilePath });
      const allRecords = await this.excelReader.readBirthdays(this.excelFilePath);

      if (allRecords.length === 0) {
        this.logger.warn('No valid birthday records found in Excel file');
        return;
      }

      // Step 2: Find today's birthdays
      this.logger.info('Checking for today\'s birthdays', { totalRecords: allRecords.length });
      const todaysBirthdays = this.birthdayChecker.findTodaysBirthdays(allRecords);

      if (todaysBirthdays.length === 0) {
        this.logger.info('No birthdays found for today');
        return;
      }

      this.logger.info(`Found ${todaysBirthdays.length} birthday(s) for today`);

      // Step 3: Load email template
      const template = this.templateEngine.loadTemplate(this.templateFilePath);

      // Step 4: Send emails to each birthday person
      for (const record of todaysBirthdays) {
        await this.processRecord(record, template);
      }

      this.logger.info('Birthday check and notification process completed', {
        totalRecords: allRecords.length,
        birthdaysToday: todaysBirthdays.length,
      });
    } catch (error) {
      this.logger.error(
        'Failed to complete birthday check and notification process',
        error instanceof Error ? error : new Error(String(error))
      );
      throw error;
    }
  }

  /**
   * Processes a single birthday record by sending an email
   * Handles errors gracefully to allow other emails to be sent
   * @param record - Birthday record to process
   * @param template - Email template to use
   */
  private async processRecord(record: BirthdayRecord, template: any): Promise<void> {
    try {
      this.logger.info('Processing birthday notification', {
        name: record.name,
        email: record.email,
      });

      // Render the email with the person's name
      const renderedEmail = this.templateEngine.renderEmail(template, { name: record.name });

      // Send the birthday email
      await this.emailService.sendBirthdayEmail(record, renderedEmail);

      this.logger.info('Successfully sent birthday email', {
        recipient: record.name,
        email: record.email,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      // Log error but don't throw - continue processing other records
      this.logger.error(
        'Failed to send birthday email',
        error instanceof Error ? error : new Error(String(error)),
        {
          recipient: record.name,
          email: record.email,
          rowNumber: record.rowNumber,
        }
      );
    }
  }
}
