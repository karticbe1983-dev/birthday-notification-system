# Birthday Notification System - Design Document

## Overview

The Birthday Notification System is a Node.js application that automates birthday email notifications by reading contact information from Excel spreadsheets and sending personalized emails via Gmail. The system runs as a scheduled service that checks daily for matching birthdays and sends notifications automatically.

### Technology Stack

- **Runtime**: Node.js (v18+)
- **Language**: TypeScript
- **Excel Processing**: xlsx library
- **Email Service**: nodemailer with Gmail transport
- **Scheduling**: node-cron
- **Configuration**: dotenv for environment variables
- **Logging**: winston

## Architecture

### High-Level Architecture

```
┌─────────────────┐
│  Excel File     │
│  (birthdays.xlsx)│
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│     Birthday Notification System        │
│                                         │
│  ┌──────────────┐    ┌──────────────┐  │
│  │ Excel Reader │───▶│ Birthday     │  │
│  │              │    │ Checker      │  │
│  └──────────────┘    └──────┬───────┘  │
│                             │          │
│                             ▼          │
│  ┌──────────────┐    ┌──────────────┐  │
│  │ Email        │◀───│ Notification │  │
│  │ Service      │    │ Manager      │  │
│  └──────┬───────┘    └──────────────┘  │
│         │                              │
│         │      ┌──────────────┐        │
│         │      │ Logger       │        │
│         │      └──────────────┘        │
└─────────┼──────────────────────────────┘
          │
          ▼
┌─────────────────┐
│  Gmail Service  │
└─────────────────┘
```

### Component Interaction Flow

1. **Scheduler** triggers the birthday check at configured time
2. **Excel Reader** loads and parses the birthday data
3. **Birthday Checker** compares dates and identifies matches
4. **Notification Manager** coordinates email sending
5. **Email Service** sends emails via Gmail
6. **Logger** records all operations and errors

## Components and Interfaces

### 1. Excel Reader Component

**Responsibility**: Read and parse Excel files containing birthday data

**Interface**:
```typescript
interface BirthdayRecord {
  name: string;
  email: string;
  birthday: Date;
  rowNumber: number;
}

interface ExcelReader {
  readBirthdays(filePath: string): Promise<BirthdayRecord[]>;
  validateRecord(record: any, rowNumber: number): BirthdayRecord | null;
}
```

**Implementation Details**:
- Uses `xlsx` library to read .xlsx files
- Expects columns: Name, Email, Birthday
- Supports multiple date formats (MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD)
- Validates email format using regex
- Skips header row
- Returns array of validated records with row numbers for error reporting

### 2. Birthday Checker Component

**Responsibility**: Compare current date with birthday records to find matches

**Interface**:
```typescript
interface BirthdayChecker {
  findTodaysBirthdays(records: BirthdayRecord[]): BirthdayRecord[];
  isBirthdayToday(birthday: Date, today: Date): boolean;
}
```

**Implementation Details**:
- Compares month and day only (ignores year)
- Handles timezone considerations using local time
- Returns filtered list of matching birthdays

### 3. Email Service Component

**Responsibility**: Send emails via Gmail SMTP

**Interface**:
```typescript
interface EmailConfig {
  user: string;
  password: string;
  from: string;
}

interface EmailService {
  initialize(config: EmailConfig): Promise<void>;
  sendBirthdayEmail(recipient: BirthdayRecord, template: EmailTemplate): Promise<void>;
  testConnection(): Promise<boolean>;
}
```

**Implementation Details**:
- Uses `nodemailer` with Gmail SMTP transport
- Supports Gmail app passwords and OAuth2
- SMTP settings: host=smtp.gmail.com, port=587, secure=false, TLS required
- Implements retry logic (1 retry after 5 minutes on failure)
- Validates connection on initialization

### 4. Email Template Component

**Responsibility**: Generate personalized email content

**Interface**:
```typescript
interface EmailTemplate {
  subject: string;
  body: string;
}

interface TemplateEngine {
  loadTemplate(filePath?: string): EmailTemplate;
  renderEmail(template: EmailTemplate, data: { name: string }): { subject: string; body: string };
}
```

**Implementation Details**:
- Supports variable substitution: {{name}}
- Default template provided if custom template not found
- Validates template syntax on load
- Returns rendered subject and body

**Default Template**:
```
Subject: Happy Birthday {{name}}! 🎉
Body: 
Dear {{name}},

Wishing you a very Happy Birthday! 🎂

May your day be filled with joy, laughter, and wonderful memories.

Best wishes,
Birthday Notification System
```

### 5. Notification Manager Component

**Responsibility**: Orchestrate the birthday checking and notification process

**Interface**:
```typescript
interface NotificationManager {
  checkAndNotify(): Promise<void>;
  processRecord(record: BirthdayRecord): Promise<void>;
}
```

**Implementation Details**:
- Coordinates Excel Reader, Birthday Checker, and Email Service
- Processes each birthday match sequentially
- Handles errors gracefully without stopping the entire process
- Logs all operations

### 6. Scheduler Component

**Responsibility**: Trigger birthday checks at configured intervals

**Interface**:
```typescript
interface Scheduler {
  start(cronExpression: string, callback: () => Promise<void>): void;
  stop(): void;
}
```

**Implementation Details**:
- Uses `node-cron` for scheduling
- Default schedule: "0 9 * * *" (9 AM daily)
- Configurable via environment variable
- Runs immediate check on startup

### 7. Logger Component

**Responsibility**: Record system operations and errors

**Interface**:
```typescript
interface Logger {
  info(message: string, metadata?: any): void;
  error(message: string, error?: Error, metadata?: any): void;
  warn(message: string, metadata?: any): void;
}
```

**Implementation Details**:
- Uses `winston` logger
- Outputs to console and file
- Log file location: `./logs/birthday-system.log`
- Rotation: 10 MB max file size
- Retention: 30 days
- Log format: timestamp, level, message, metadata

## Data Models

### Configuration Model

```typescript
interface AppConfig {
  excel: {
    filePath: string;
  };
  email: {
    user: string;
    password: string;
    from: string;
  };
  scheduler: {
    cronExpression: string;
  };
  template: {
    filePath?: string;
  };
  logging: {
    level: string;
    directory: string;
  };
}
```

**Configuration Sources**:
- Environment variables (.env file)
- Default values for optional settings

**Required Environment Variables**:
```
EXCEL_FILE_PATH=./birthdays.xlsx
GMAIL_USER=your-email@gmail.com
GMAIL_PASSWORD=your-app-password
GMAIL_FROM=Birthday System <your-email@gmail.com>
CRON_SCHEDULE=0 9 * * *
TEMPLATE_FILE_PATH=./email-template.txt
LOG_LEVEL=info
LOG_DIRECTORY=./logs
```

### Birthday Record Model

```typescript
interface BirthdayRecord {
  name: string;          // Full name of the person
  email: string;         // Gmail address
  birthday: Date;        // Birthday date
  rowNumber: number;     // Excel row number for error reporting
}
```

### Email Template Model

```typescript
interface EmailTemplate {
  subject: string;       // Email subject with {{name}} placeholder
  body: string;          // Email body with {{name}} placeholder
}
```

## Error Handling

### Error Categories

1. **Configuration Errors**
   - Missing required environment variables
   - Invalid email credentials
   - Missing Excel file
   - Action: Log error, exit application with code 1

2. **Excel Reading Errors**
   - File not found
   - Invalid file format
   - Missing required columns
   - Action: Log error, skip current run, retry next scheduled time

3. **Data Validation Errors**
   - Invalid email format
   - Invalid date format
   - Missing required fields
   - Action: Log warning with row number, skip record, continue processing

4. **Email Sending Errors**
   - SMTP connection failure
   - Authentication failure
   - Network timeout
   - Action: Log error, retry once after 5 minutes, continue to next record

5. **Scheduling Errors**
   - Invalid cron expression
   - Action: Log error, use default schedule

### Error Logging Format

```typescript
{
  timestamp: "2025-10-25T09:00:00.000Z",
  level: "error",
  message: "Failed to send birthday email",
  metadata: {
    recipient: "john@gmail.com",
    name: "John Doe",
    error: "SMTP connection timeout",
    retryAttempt: 1
  }
}
```

## Testing Strategy

### Unit Tests

- **Excel Reader**: Test parsing various date formats, validation logic, error handling
- **Birthday Checker**: Test date matching logic, edge cases (leap years, timezone)
- **Email Service**: Test email formatting, template rendering
- **Template Engine**: Test variable substitution, default template loading

### Integration Tests

- **End-to-End Flow**: Test complete flow from Excel reading to email sending using test data
- **Gmail Integration**: Test actual email sending to test account
- **Error Scenarios**: Test handling of missing files, invalid data, network failures

### Manual Testing

- Create sample Excel file with various date formats
- Configure test Gmail account
- Run application and verify emails received
- Check logs for proper recording

### Test Data

Sample Excel structure:
```
| Name          | Email                | Birthday   |
|---------------|----------------------|------------|
| John Doe      | john@gmail.com       | 10/25/1990 |
| Jane Smith    | jane@gmail.com       | 12/15/1985 |
| Bob Johnson   | bob@gmail.com        | 2025-10-25 |
```

## Security Considerations

1. **Credential Storage**
   - Use environment variables for sensitive data
   - Never commit .env file to version control
   - Support Gmail app-specific passwords (recommended over account password)
   - Consider OAuth2 for production deployments

2. **Email Validation**
   - Validate email format before sending
   - Prevent email injection attacks

3. **File Access**
   - Validate Excel file path to prevent directory traversal
   - Use read-only access for Excel files

4. **Logging**
   - Avoid logging sensitive credentials
   - Sanitize email addresses in logs if required by privacy policy

## Deployment Considerations

### Running as a Service

- Use PM2 or systemd to run as background service
- Auto-restart on failure
- Log management and rotation

### Docker Deployment (Optional)

- Containerize application for consistent deployment
- Mount Excel file and logs as volumes
- Pass environment variables securely

### Monitoring

- Monitor log files for errors
- Set up alerts for repeated failures
- Track email delivery success rate

## Future Enhancements

- Support for multiple Excel files
- Web interface for managing birthdays
- SMS notifications in addition to email
- Customizable notification timing per person
- Support for other email providers beyond Gmail
- Database storage instead of Excel
- Birthday reminder (e.g., 1 day before)
