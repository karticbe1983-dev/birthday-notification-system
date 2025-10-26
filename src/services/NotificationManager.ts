import { INotificationManager } from '../models/interfaces/INotificationManager';
import { IExcelReader } from '../models/interfaces/IExcelReader';
import { IBirthdayChecker } from '../models/interfaces/IBirthdayChecker';
import { IEmailService } from '../models/interfaces/IEmailService';
import { IWhatsAppService } from '../models/interfaces/IWhatsAppService';
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
  private whatsappService: IWhatsAppService;
  private templateEngine: ITemplateEngine;
  private logger: ILogger;
  private excelFilePath: string;
  private templateFilePath?: string;
  private whatsappEnabled: boolean;

  constructor(
    excelReader: IExcelReader,
    birthdayChecker: IBirthdayChecker,
    emailService: IEmailService,
    whatsappService: IWhatsAppService,
    templateEngine: ITemplateEngine,
    logger: ILogger,
    excelFilePath: string,
    whatsappEnabled: boolean,
    templateFilePath?: string
  ) {
    this.excelReader = excelReader;
    this.birthdayChecker = birthdayChecker;
    this.emailService = emailService;
    this.whatsappService = whatsappService;
    this.templateEngine = templateEngine;
    this.logger = logger;
    this.excelFilePath = excelFilePath;
    this.whatsappEnabled = whatsappEnabled;
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

      // Step 3: Load templates
      const emailTemplate = this.templateEngine.loadTemplate(this.templateFilePath);
      const whatsappTemplate = this.templateEngine.loadWhatsAppTemplate(this.templateFilePath);

      // Step 4: Send notifications to each birthday person
      const statistics = {
        totalProcessed: 0,
        emailSent: 0,
        whatsappSent: 0,
        emailFailed: 0,
        whatsappFailed: 0,
      };

      for (const record of todaysBirthdays) {
        const result = await this.processRecord(record, emailTemplate, whatsappTemplate);
        statistics.totalProcessed++;
        if (result.email) statistics.emailSent++;
        if (result.whatsapp) statistics.whatsappSent++;
        if (result.emailAttempted && !result.email) statistics.emailFailed++;
        if (result.whatsappAttempted && !result.whatsapp) statistics.whatsappFailed++;
      }

      this.logger.info('Birthday check and notification process completed', {
        totalRecords: allRecords.length,
        birthdaysToday: todaysBirthdays.length,
        emailsSent: statistics.emailSent,
        emailsFailed: statistics.emailFailed,
        whatsappSent: statistics.whatsappSent,
        whatsappFailed: statistics.whatsappFailed,
        whatsappEnabled: this.whatsappEnabled,
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
   * Processes a single birthday record by sending notifications through appropriate channels
   * Handles errors gracefully to allow other notifications to be sent
   * @param record - Birthday record to process
   * @param emailTemplate - Email template to use
   * @param whatsappTemplate - WhatsApp template to use
   * @returns Object indicating success/failure for each channel
   */
  private async processRecord(
    record: BirthdayRecord,
    emailTemplate: any,
    whatsappTemplate: string
  ): Promise<{
    email: boolean;
    whatsapp: boolean;
    emailAttempted: boolean;
    whatsappAttempted: boolean;
  }> {
    const results = {
      email: false,
      whatsapp: false,
      emailAttempted: false,
      whatsappAttempted: false,
    };

    this.logger.info('Processing birthday notification', {
      name: record.name,
      email: record.email,
      phone: record.phone,
      channel: record.notificationChannel,
    });

    // Send email if channel is 'email' or 'both'
    if (record.notificationChannel === 'email' || record.notificationChannel === 'both') {
      results.emailAttempted = true;
      try {
        this.logger.info('Sending email notification', {
          recipient: record.name,
          email: record.email,
        });

        const renderedEmail = this.templateEngine.renderEmail(emailTemplate, { name: record.name });
        await this.emailService.sendBirthdayEmail(record, renderedEmail);
        results.email = true;

        this.logger.info('Successfully sent birthday email', {
          recipient: record.name,
          email: record.email,
        });
      } catch (error) {
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

    // Send WhatsApp if channel is 'whatsapp' or 'both' and WhatsApp is enabled
    if (
      (record.notificationChannel === 'whatsapp' || record.notificationChannel === 'both') &&
      this.whatsappEnabled
    ) {
      results.whatsappAttempted = true;
      try {
        this.logger.info('Sending WhatsApp notification', {
          recipient: record.name,
          phone: record.phone,
        });

        const renderedWhatsApp = this.templateEngine.renderWhatsApp(whatsappTemplate, {
          name: record.name,
        });
        await this.whatsappService.sendBirthdayMessage(record, renderedWhatsApp);
        results.whatsapp = true;

        this.logger.info('Successfully sent birthday WhatsApp message', {
          recipient: record.name,
          phone: record.phone,
        });
      } catch (error) {
        this.logger.error(
          'Failed to send birthday WhatsApp message',
          error instanceof Error ? error : new Error(String(error)),
          {
            recipient: record.name,
            phone: record.phone,
            rowNumber: record.rowNumber,
          }
        );
      }
    }

    // Log summary for this record
    this.logger.info('Notification processing complete for record', {
      recipient: record.name,
      channel: record.notificationChannel,
      emailSent: results.email,
      whatsappSent: results.whatsapp,
      emailAttempted: results.emailAttempted,
      whatsappAttempted: results.whatsappAttempted,
      timestamp: new Date().toISOString(),
    });

    return results;
  }
}
