# WhatsApp Notifications - Design Document

## Overview

This feature extends the Birthday Notification System to support WhatsApp notifications alongside email notifications. Users can specify their preferred notification channel (email, WhatsApp, or both) in the Excel spreadsheet. The system uses Twilio's WhatsApp Business API to deliver messages, maintaining the same reliability and error handling standards as the existing email service.

### Technology Stack

- **WhatsApp API**: Twilio WhatsApp Business API
- **HTTP Client**: Built-in Node.js https module (Twilio SDK)
- **Phone Validation**: libphonenumber-js for E.164 format validation
- **Existing Stack**: Node.js, TypeScript, xlsx, winston (unchanged)

## Architecture

### Updated High-Level Architecture

```
┌─────────────────────────────────────────┐
│  Excel File (birthdays.xlsx)            │
│  Columns: Name, Email, Phone,           │
│           Birthday, NotificationChannel │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────┐
│     Birthday Notification System                     │
│                                                      │
│  ┌──────────────┐    ┌──────────────┐              │
│  │ Excel Reader │───▶│ Birthday     │              │
│  │ (Enhanced)   │    │ Checker      │              │
│  └──────────────┘    └──────┬───────┘              │
│                             │                       │
│                             ▼                       │
│  ┌──────────────┐    ┌──────────────┐              │
│  │ Email        │◀───│ Notification │              │
│  │ Service      │    │ Manager      │              │
│  └──────────────┘    │ (Enhanced)   │              │
│                      └──────┬───────┘              │
│  ┌──────────────┐           │                       │
│  │ WhatsApp     │◀──────────┘                       │
│  │ Service      │                                   │
│  │ (NEW)        │                                   │
│  └──────┬───────┘                                   │
│         │                                           │
│         │      ┌──────────────┐                     │
│         │      │ Logger       │                     │
│         │      └──────────────┘                     │
└─────────┼──────────────────────────────────────────┘
          │
          ▼
┌─────────────────┐
│  Twilio API     │
│  (WhatsApp)     │
└─────────────────┘
```

### Component Interaction Flow

1. **Excel Reader** loads birthday data including phone numbers and notification preferences
2. **Birthday Checker** identifies today's birthdays
3. **Notification Manager** routes notifications based on channel preference:
   - "email" → Email Service only
   - "whatsapp" → WhatsApp Service only
   - "both" → Both services in parallel
4. **WhatsApp Service** sends messages via Twilio API
5. **Logger** records all operations

## Components and Interfaces

### 1. Enhanced Birthday Record Model

**Updated Interface**:
```typescript
interface BirthdayRecord {
  name: string;
  email: string;
  phone?: string;                    // NEW: E.164 format phone number
  birthday: Date;
  notificationChannel: NotificationChannel;  // NEW: Preferred channel
  rowNumber: number;
}

type NotificationChannel = 'email' | 'whatsapp' | 'both';
```

**Changes**:
- Added optional `phone` field for WhatsApp contact
- Added `notificationChannel` field with default value 'email'

### 2. Enhanced Excel Reader Component

**Updated Responsibilities**:
- Read phone numbers from Phone column
- Read notification preferences from NotificationChannel column
- Validate phone number format (E.164)
- Apply defaults for missing/invalid channel values

**Implementation Details**:
- Expected columns: Name, Email, Phone, Birthday, NotificationChannel
- Phone format: E.164 (e.g., +14155552671, +919876543210)
- Use `libphonenumber-js` for validation
- Default to 'email' if NotificationChannel is empty or invalid
- Log warning if phone is missing but channel includes 'whatsapp'
- Fall back to email-only if phone validation fails

**Validation Logic**:
```typescript
function validateRecord(row: any): BirthdayRecord | null {
  // Existing validations for name, email, birthday...
  
  const channel = normalizeChannel(row.NotificationChannel);
  const phone = row.Phone?.trim();
  
  // If WhatsApp is requested, validate phone
  if ((channel === 'whatsapp' || channel === 'both') && !isValidPhone(phone)) {
    logger.warn('Invalid or missing phone for WhatsApp channel, falling back to email', {
      name: row.Name,
      rowNumber: row.rowNumber
    });
    return { ...record, notificationChannel: 'email' };
  }
  
  return {
    ...record,
    phone: phone || undefined,
    notificationChannel: channel
  };
}
```

### 3. WhatsApp Service Component (NEW)

**Responsibility**: Send WhatsApp messages via Twilio API

**Interface**:
```typescript
interface WhatsAppConfig {
  accountSid: string;
  authToken: string;
  fromNumber: string;  // Twilio WhatsApp number (e.g., whatsapp:+14155238886)
}

interface WhatsAppService {
  initialize(config: WhatsAppConfig): Promise<void>;
  sendBirthdayMessage(recipient: BirthdayRecord, template: string): Promise<void>;
  testConnection(): Promise<boolean>;
}
```

**Implementation Details**:
- Uses Twilio Node.js SDK (`twilio` npm package)
- Formats recipient number as `whatsapp:+[E.164 number]`
- Implements retry logic: 3 attempts with exponential backoff (1s, 2s, 4s)
- Validates connection on initialization by checking account status
- Handles Twilio-specific error codes:
  - 21211: Invalid 'To' phone number
  - 21408: Permission denied (WhatsApp not enabled)
  - 21610: Message undeliverable
  - 63007: Recipient not on WhatsApp

**Error Handling**:
```typescript
async sendBirthdayMessage(recipient: BirthdayRecord, template: string): Promise<void> {
  const maxRetries = 3;
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await this.sendMessage(recipient.phone!, template);
      this.logger.info('WhatsApp message sent successfully', {
        recipient: recipient.name,
        phone: recipient.phone,
        attempt
      });
      return;
    } catch (error) {
      lastError = error as Error;
      this.logger.warn('WhatsApp send attempt failed', {
        recipient: recipient.name,
        phone: recipient.phone,
        attempt,
        error: lastError.message
      });
      
      if (attempt < maxRetries) {
        await this.delay(Math.pow(2, attempt - 1) * 1000);
      }
    }
  }
  
  this.logger.error('Failed to send WhatsApp message after all retries', lastError, {
    recipient: recipient.name,
    phone: recipient.phone,
    totalAttempts: maxRetries
  });
  
  throw lastError;
}
```

**Twilio API Integration**:
```typescript
private async sendMessage(toPhone: string, body: string): Promise<void> {
  const message = await this.twilioClient.messages.create({
    from: this.config.fromNumber,  // e.g., 'whatsapp:+14155238886'
    to: `whatsapp:${toPhone}`,     // e.g., 'whatsapp:+919876543210'
    body: body
  });
  
  this.logger.info('Twilio API response', {
    messageSid: message.sid,
    status: message.status
  });
}
```

### 4. Enhanced Template Engine Component

**Updated Responsibilities**:
- Support separate WhatsApp template file
- Fall back to email template if WhatsApp template not configured
- Generate plain text messages for WhatsApp (no HTML)

**Interface**:
```typescript
interface TemplateEngine {
  loadEmailTemplate(filePath?: string): EmailTemplate;
  loadWhatsAppTemplate(filePath?: string): string;  // NEW
  renderEmail(template: EmailTemplate, data: { name: string }): { subject: string; body: string };
  renderWhatsApp(template: string, data: { name: string }): string;  // NEW
}
```

**Implementation Details**:
- WhatsApp template is plain text only
- If `WHATSAPP_TEMPLATE_FILE_PATH` is not set, use email template body
- Variable substitution: `{{name}}` → recipient's name
- WhatsApp messages limited to 1600 characters (Twilio limit)

**Default WhatsApp Template**:
```
Happy Birthday {{name}}! 🎉🎂

Wishing you a wonderful day filled with joy and happiness!

Best wishes,
Birthday Notification System
```

### 5. Enhanced Notification Manager Component

**Updated Responsibilities**:
- Route notifications based on channel preference
- Handle multi-channel delivery (email + WhatsApp)
- Process channels independently (failure in one doesn't block the other)

**Implementation Details**:
```typescript
async processRecord(record: BirthdayRecord): Promise<void> {
  const emailTemplate = this.templateEngine.loadEmailTemplate();
  const whatsappTemplate = this.templateEngine.loadWhatsAppTemplate();
  
  const results = {
    email: false,
    whatsapp: false
  };
  
  // Send email if requested
  if (record.notificationChannel === 'email' || record.notificationChannel === 'both') {
    try {
      await this.emailService.sendBirthdayEmail(record, emailTemplate);
      results.email = true;
    } catch (error) {
      this.logger.error('Email notification failed', error as Error, {
        recipient: record.name
      });
    }
  }
  
  // Send WhatsApp if requested
  if (record.notificationChannel === 'whatsapp' || record.notificationChannel === 'both') {
    try {
      await this.whatsappService.sendBirthdayMessage(record, whatsappTemplate);
      results.whatsapp = true;
    } catch (error) {
      this.logger.error('WhatsApp notification failed', error as Error, {
        recipient: record.name
      });
    }
  }
  
  // Log summary
  this.logger.info('Notification processing complete', {
    recipient: record.name,
    channel: record.notificationChannel,
    emailSent: results.email,
    whatsappSent: results.whatsapp
  });
}
```

### 6. Enhanced Configuration Service

**Updated Configuration Model**:
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
  whatsapp: {                    // NEW
    accountSid: string;
    authToken: string;
    fromNumber: string;
    enabled: boolean;            // Auto-disabled if credentials missing
  };
  scheduler: {
    cronExpression: string;
  };
  template: {
    emailFilePath?: string;
    whatsappFilePath?: string;   // NEW
  };
  logging: {
    level: string;
    directory: string;
  };
}
```

**New Environment Variables**:
```
# WhatsApp Configuration (Optional)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
WHATSAPP_TEMPLATE_FILE_PATH=./whatsapp-template.txt
```

**Configuration Validation**:
- If any Twilio variable is missing, set `whatsapp.enabled = false`
- Log warning about WhatsApp being disabled
- System continues with email-only mode

## Data Models

### Updated Excel File Structure

```
| Name          | Email              | Phone          | Birthday   | NotificationChannel |
|---------------|--------------------|----------------|------------|---------------------|
| John Doe      | john@gmail.com     | +14155552671   | 10/25/1990 | both                |
| Jane Smith    | jane@gmail.com     |                | 12/15/1985 | email               |
| Bob Johnson   | bob@gmail.com      | +919876543210  | 2025-10-25 | whatsapp            |
| Alice Williams| alice@gmail.com    | +14155552672   | 10/25/1992 | both                |
```

**Column Specifications**:
- **Phone**: Optional, E.164 format (e.g., +14155552671)
- **NotificationChannel**: Optional, values: "email", "whatsapp", "both" (default: "email")

### Phone Number Format

**E.164 Format Requirements**:
- Starts with `+`
- Country code (1-3 digits)
- National number (up to 15 digits total)
- No spaces, dashes, or parentheses
- Examples:
  - US: +14155552671
  - India: +919876543210
  - UK: +447911123456

## Error Handling

### WhatsApp-Specific Errors

1. **Configuration Errors**
   - Missing Twilio credentials
   - Action: Disable WhatsApp, log warning, continue with email-only

2. **Phone Validation Errors**
   - Invalid phone format
   - Missing phone when WhatsApp requested
   - Action: Log warning, fall back to email, continue processing

3. **Twilio API Errors**
   - Authentication failure (invalid credentials)
   - Invalid phone number
   - Recipient not on WhatsApp
   - Rate limiting
   - Action: Log error with Twilio error code, retry with backoff, continue to next record

4. **Network Errors**
   - Connection timeout
   - DNS resolution failure
   - Action: Retry with exponential backoff (3 attempts), log final failure

### Error Logging Format

```typescript
{
  timestamp: "2025-10-25T09:00:00.000Z",
  level: "error",
  message: "Failed to send WhatsApp message after all retries",
  metadata: {
    recipient: "John Doe",
    phone: "+14155552671",
    totalAttempts: 3,
    twilioErrorCode: "21211",
    twilioErrorMessage: "Invalid 'To' Phone Number",
    error: "TwilioRestException: Invalid 'To' Phone Number"
  }
}
```

## Testing Strategy

### Unit Tests

- **Excel Reader**: Test phone parsing, channel validation, fallback logic
- **WhatsApp Service**: Test message formatting, retry logic, error handling
- **Template Engine**: Test WhatsApp template loading and rendering
- **Notification Manager**: Test channel routing logic

### Integration Tests

- **Twilio Integration**: Test actual message sending to test WhatsApp number
- **Multi-Channel Flow**: Test sending both email and WhatsApp
- **Fallback Scenarios**: Test email fallback when WhatsApp fails
- **Error Scenarios**: Test handling of invalid phones, missing credentials

### Manual Testing

1. Create test Excel with various channel combinations
2. Configure Twilio sandbox number for testing
3. Run application and verify messages received
4. Test with invalid phone numbers
5. Test with WhatsApp disabled (missing credentials)
6. Check logs for proper error handling

### Test Data

```
| Name       | Email           | Phone          | Birthday   | NotificationChannel |
|------------|-----------------|----------------|------------|---------------------|
| Test Email | test@gmail.com  |                | 10/25/1990 | email               |
| Test WA    | test@gmail.com  | +14155552671   | 10/25/1990 | whatsapp            |
| Test Both  | test@gmail.com  | +14155552671   | 10/25/1990 | both                |
| Test Invalid| test@gmail.com | invalid-phone  | 10/25/1990 | whatsapp            |
```

## Security Considerations

1. **Twilio Credentials**
   - Store in environment variables only
   - Never commit to version control
   - Use Twilio API keys (not main account credentials) for production
   - Rotate credentials regularly

2. **Phone Number Privacy**
   - Sanitize phone numbers in logs (mask middle digits)
   - Comply with data protection regulations (GDPR, etc.)
   - Secure Excel files containing phone numbers

3. **Rate Limiting**
   - Respect Twilio rate limits (varies by account type)
   - Implement backoff strategy
   - Monitor usage to avoid unexpected charges

4. **Message Content**
   - Avoid sending sensitive information via WhatsApp
   - Keep messages brief and professional
   - Comply with WhatsApp Business Policy

## Deployment Considerations

### Twilio Account Setup

1. Create Twilio account
2. Enable WhatsApp in Twilio Console
3. Get WhatsApp-enabled phone number or use sandbox for testing
4. Generate API credentials (Account SID and Auth Token)
5. Configure environment variables

### Cost Considerations

- Twilio WhatsApp pricing: ~$0.005 per message (varies by country)
- Monitor usage in Twilio Console
- Set up billing alerts
- Consider message volume when budgeting

### Monitoring

- Track WhatsApp delivery success rate
- Monitor Twilio error codes
- Set up alerts for repeated failures
- Review logs for phone validation issues

## Dependencies

### New NPM Packages

```json
{
  "dependencies": {
    "twilio": "^5.3.4",
    "libphonenumber-js": "^1.11.14"
  }
}
```

### Installation

```bash
npm install twilio libphonenumber-js
```

## Migration Path

### For Existing Users

1. **No Breaking Changes**: Existing Excel files without Phone/NotificationChannel columns continue to work
2. **Gradual Adoption**: Users can add columns incrementally
3. **Backward Compatibility**: Default channel is 'email' if not specified
4. **Optional Feature**: WhatsApp disabled if Twilio credentials not configured

### Migration Steps

1. Update Excel file with new columns (optional)
2. Add Twilio credentials to .env (optional)
3. Restart application
4. System auto-detects WhatsApp availability
5. Logs indicate whether WhatsApp is enabled

## Future Enhancements

- Support for WhatsApp media messages (images, videos)
- WhatsApp message templates with buttons
- Two-way WhatsApp conversations
- WhatsApp group notifications
- Alternative WhatsApp providers (MessageBird, Vonage)
- SMS fallback if WhatsApp unavailable
- Delivery status tracking and webhooks
