# Birthday Notification System

An automated system that reads birthday information from an Excel spreadsheet and sends personalized email notifications via Gmail on the appropriate dates.

## Features

- 📅 Automatic daily birthday checks
- 📧 Personalized email notifications via Gmail
- 💬 WhatsApp notifications via Twilio (optional)
- 🔀 Multi-channel support (email, WhatsApp, or both)
- 📊 Excel-based birthday data management
- 🔄 Configurable scheduling with cron expressions
- 📝 Comprehensive logging with rotation
- 🎨 Customizable email and WhatsApp templates
- ⚡ Automatic retry on email and WhatsApp failures
- 🛡️ Secure credential management

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- A Gmail account with app password enabled
- An Excel file (.xlsx) with birthday data
- (Optional) A Twilio account with WhatsApp enabled for WhatsApp notifications

## Installation

1. Clone or download this repository

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory (see Configuration section below)

4. Prepare your Excel file with birthday data (see Excel File Format section)

## Configuration

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Required: Path to your Excel file containing birthday data
EXCEL_FILE_PATH=./birthdays.xlsx

# Required: Your Gmail address
GMAIL_USER=your-email@gmail.com

# Required: Your Gmail app password (NOT your regular password)
GMAIL_PASSWORD=your-app-password-here

# Required: The "From" address that will appear in emails
GMAIL_FROM=Birthday System <your-email@gmail.com>

# Optional: Cron schedule for birthday checks (default: 9 AM daily)
# Format: "minute hour day month dayOfWeek"
CRON_SCHEDULE=0 9 * * *

# Optional: Path to custom email template file
TEMPLATE_FILE_PATH=./email-template.txt

# Optional: Logging level (default: info)
# Options: error, warn, info, debug
LOG_LEVEL=info

# Optional: Directory for log files (default: ./logs)
LOG_DIRECTORY=./logs

# Optional: Twilio WhatsApp Configuration
# If not provided, WhatsApp notifications will be disabled
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# Optional: Path to custom WhatsApp template file
WHATSAPP_TEMPLATE_FILE_PATH=./whatsapp-template.txt
```

### Obtaining a Gmail App Password

For security reasons, you should use a Gmail App Password instead of your regular password:

1. **Enable 2-Step Verification** on your Google Account:
   - Go to https://myaccount.google.com/security
   - Click on "2-Step Verification" and follow the setup process

2. **Generate an App Password**:
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" as the app
   - Select "Other" as the device and give it a name (e.g., "Birthday System")
   - Click "Generate"
   - Copy the 16-character password (remove spaces)
   - Use this password in your `.env` file as `GMAIL_PASSWORD`

**Important**: Never share your app password or commit it to version control!

### Setting Up Twilio for WhatsApp (Optional)

WhatsApp notifications are optional. If you don't configure Twilio credentials, the system will work with email-only notifications.

#### Step 1: Create a Twilio Account

1. Go to https://www.twilio.com/try-twilio
2. Sign up for a free account
3. Verify your email and phone number

#### Step 2: Enable WhatsApp

**For Testing (Twilio Sandbox)**:
1. In the Twilio Console, go to **Messaging** > **Try it out** > **Send a WhatsApp message**
2. Follow the instructions to join the Twilio Sandbox by sending a WhatsApp message to the provided number
3. Use the sandbox number as your `TWILIO_WHATSAPP_NUMBER` (e.g., `whatsapp:+14155238886`)

**For Production**:
1. Request a WhatsApp-enabled phone number from Twilio
2. Complete the WhatsApp Business Profile setup
3. Wait for approval (can take several days)
4. Use your approved number as `TWILIO_WHATSAPP_NUMBER`

#### Step 3: Get Your Twilio Credentials

1. In the Twilio Console, go to your **Dashboard**
2. Find your **Account SID** and **Auth Token**
3. Copy these values to your `.env` file:
   - `TWILIO_ACCOUNT_SID`: Your Account SID (starts with "AC")
   - `TWILIO_AUTH_TOKEN`: Your Auth Token (keep this secret!)
   - `TWILIO_WHATSAPP_NUMBER`: Your WhatsApp-enabled number in format `whatsapp:+1234567890`

**Important**: 
- Never share your Auth Token or commit it to version control!
- For the sandbox, recipients must first join by sending a message to the sandbox number
- Production WhatsApp numbers require business verification and approval

### Excel File Format

Your Excel file should have the following structure:

| Name          | Email                | Phone          | Birthday   | NotificationChannel |
|---------------|----------------------|----------------|------------|---------------------|
| John Doe      | john.doe@gmail.com   | +14155552671   | 10/25/1990 | both                |
| Jane Smith    | jane.smith@gmail.com |                | 12/15/1985 | email               |
| Bob Johnson   | bob.johnson@gmail.com| +919876543210  | 01/08/1992 | whatsapp            |

**Requirements**:
- First row must be headers: `Name`, `Email`, `Phone`, `Birthday`, `NotificationChannel`
- **Name**: Full name of the person (required)
- **Email**: Valid email address (required)
- **Phone**: Phone number in E.164 format (optional, required for WhatsApp)
  - Must start with `+` followed by country code and number
  - Examples: `+14155552671` (US), `+919876543210` (India), `+447911123456` (UK)
  - No spaces, dashes, or parentheses
- **Birthday**: Date in one of these formats (required):
  - MM/DD/YYYY (e.g., 10/25/1990)
  - DD/MM/YYYY (e.g., 25/10/1990)
  - YYYY-MM-DD (e.g., 1990-10-25)
- **NotificationChannel**: Preferred notification method (optional, defaults to "email")
  - `email`: Send email notification only
  - `whatsapp`: Send WhatsApp notification only (requires valid phone number)
  - `both`: Send both email and WhatsApp notifications

**Notes**:
- If `Phone` is missing or invalid and `NotificationChannel` is set to `whatsapp` or `both`, the system will automatically fall back to email-only
- If `NotificationChannel` is empty or invalid, it defaults to `email`
- The `Phone` and `NotificationChannel` columns are optional for backward compatibility

A sample `birthdays.xlsx` file is included in this repository.

### Email Template Customization

You can customize the email template by creating a text file (default: `email-template.txt`):

```
Subject: Happy Birthday {{name}}! 🎉

Dear {{name}},

Wishing you a very Happy Birthday! 🎂

May your day be filled with joy, laughter, and wonderful memories.

Best wishes,
Birthday Notification System
```

**Template Variables**:
- `{{name}}`: Will be replaced with the recipient's name from the Excel file

If no custom template is provided, the system will use the default template shown above.

### WhatsApp Template Customization

You can customize the WhatsApp template by creating a text file (default: `whatsapp-template.txt`):

```
Happy Birthday {{name}}! 🎉🎂

Wishing you a wonderful day filled with joy and happiness!

Best wishes,
Birthday Notification System
```

**Template Variables**:
- `{{name}}`: Will be replaced with the recipient's name from the Excel file

**Important Notes**:
- WhatsApp templates should be plain text (no HTML)
- Keep messages concise (recommended under 1600 characters)
- If no custom WhatsApp template is provided, the system will use the email template body

## Usage

### Build the Application

```bash
npm run build
```

### Run the Application

```bash
npm start
```

The application will:
1. Validate your configuration and credentials (Gmail and optionally Twilio)
2. Test WhatsApp connectivity if Twilio credentials are provided
3. Perform an immediate birthday check
4. Send notifications (email and/or WhatsApp) to anyone with a birthday today
5. Schedule daily checks according to your cron schedule
6. Continue running in the background

### Development Mode

For development with auto-reload:

```bash
npm run dev
```

### Stopping the Application

Press `Ctrl+C` to gracefully shut down the application.

## Scheduling

The system uses cron expressions to schedule birthday checks. The default schedule is `0 9 * * *` (9:00 AM daily).

### Common Cron Schedules

- `0 9 * * *` - Every day at 9:00 AM
- `0 8 * * 1-5` - Weekdays at 8:00 AM
- `30 10 * * *` - Every day at 10:30 AM
- `0 0 * * *` - Every day at midnight

### Cron Format

```
┌───────────── minute (0 - 59)
│ ┌───────────── hour (0 - 23)
│ │ ┌───────────── day of month (1 - 31)
│ │ │ ┌───────────── month (1 - 12)
│ │ │ │ ┌───────────── day of week (0 - 6) (Sunday = 0)
│ │ │ │ │
* * * * *
```

## Logging

The system maintains detailed logs of all operations:

- **Location**: `./logs/birthday-system.log` (configurable)
- **Console Output**: Real-time logs displayed in the terminal
- **Log Rotation**: Automatically rotates when files exceed 10 MB
- **Retention**: Logs are kept for 30 days

### Log Levels

- **info**: Successful operations (emails sent, birthdays found)
- **warn**: Non-critical issues (invalid records skipped)
- **error**: Failures (email sending failed, file not found)

### Example Log Entries

```
2025-10-25T09:00:00.000Z [info]: Birthday check started
2025-10-25T09:00:01.234Z [info]: Found 2 birthdays today
2025-10-25T09:00:02.456Z [info]: Email sent successfully {"name":"John Doe","email":"john.doe@gmail.com"}
2025-10-25T09:00:03.789Z [error]: Failed to send email {"name":"Jane Smith","email":"jane.smith@gmail.com","error":"SMTP timeout"}
```

## Troubleshooting

### Issue: "Authentication failed" or "Invalid credentials"

**Possible Causes**:
- Using your regular Gmail password instead of an app password
- App password is incorrect or has spaces
- 2-Step Verification is not enabled

**Solutions**:
1. Verify 2-Step Verification is enabled on your Google Account
2. Generate a new app password following the instructions above
3. Ensure there are no spaces in the app password in your `.env` file
4. Double-check the `GMAIL_USER` matches the account that generated the app password

### Issue: "Excel file not found" or "Cannot read file"

**Possible Causes**:
- Incorrect file path in `EXCEL_FILE_PATH`
- File doesn't exist or has been moved
- Insufficient file permissions

**Solutions**:
1. Verify the file path in your `.env` file is correct
2. Use absolute path if relative path doesn't work: `C:/path/to/birthdays.xlsx`
3. Ensure the file exists and is accessible
4. Check file permissions (should be readable)

### Issue: "Invalid date format" warnings in logs

**Possible Causes**:
- Birthday dates in Excel are not in a supported format
- Empty or malformed date cells

**Solutions**:
1. Use one of the supported formats: MM/DD/YYYY, DD/MM/YYYY, or YYYY-MM-DD
2. Check for empty cells in the Birthday column
3. Ensure dates are formatted as text or date in Excel, not formulas

### Issue: Emails not being sent

**Possible Causes**:
- No birthdays match today's date
- Email addresses are invalid
- Network connectivity issues
- Gmail SMTP is blocked by firewall

**Solutions**:
1. Check logs for specific error messages
2. Verify email addresses in Excel are valid Gmail addresses
3. Test your network connection
4. Ensure port 587 is not blocked by your firewall
5. Try running the application with a test birthday matching today's date

### Issue: "SMTP timeout" or "Connection refused"

**Possible Causes**:
- Network connectivity issues
- Firewall blocking SMTP port 587
- Gmail SMTP temporarily unavailable

**Solutions**:
1. Check your internet connection
2. Verify firewall settings allow outbound connections on port 587
3. Wait a few minutes and try again (the system will retry automatically)
4. Check Gmail service status at https://www.google.com/appsstatus

### Issue: Application crashes or stops unexpectedly

**Possible Causes**:
- Unhandled errors in the code
- System resource issues
- Invalid configuration

**Solutions**:
1. Check the log files for error messages
2. Verify all required environment variables are set correctly
3. Ensure you have sufficient disk space for logs
4. Try running in development mode to see detailed error output: `npm run dev`

### Issue: Cron schedule not working

**Possible Causes**:
- Invalid cron expression format
- System time is incorrect

**Solutions**:
1. Verify your cron expression is valid using an online cron validator
2. Check your system time and timezone settings
3. Use the default schedule by removing `CRON_SCHEDULE` from `.env`
4. Check logs to see if the scheduler started successfully

### Issue: Template variables not being replaced

**Possible Causes**:
- Incorrect template syntax
- Template file not found

**Solutions**:
1. Ensure you're using `{{name}}` (double curly braces) in your template
2. Verify the template file path in `TEMPLATE_FILE_PATH` is correct
3. Check logs for template loading errors
4. Remove `TEMPLATE_FILE_PATH` from `.env` to use the default template

### Issue: WhatsApp notifications not being sent

**Possible Causes**:
- Twilio credentials are missing or incorrect
- WhatsApp is disabled due to configuration issues
- Invalid phone number format
- Recipient hasn't joined Twilio Sandbox (for testing)
- Recipient is not on WhatsApp

**Solutions**:
1. Check logs for WhatsApp-related errors and warnings
2. Verify all three Twilio environment variables are set correctly:
   - `TWILIO_ACCOUNT_SID` (starts with "AC")
   - `TWILIO_AUTH_TOKEN`
   - `TWILIO_WHATSAPP_NUMBER` (format: `whatsapp:+1234567890`)
3. Ensure phone numbers in Excel are in E.164 format (e.g., `+14155552671`)
4. For Twilio Sandbox testing, ensure recipients have joined the sandbox by sending the join code
5. Check Twilio Console logs for detailed error messages
6. Verify your Twilio account has WhatsApp enabled

### Issue: "WhatsApp is disabled" warning in logs

**Possible Causes**:
- One or more Twilio credentials are missing from `.env`
- Twilio connection test failed on startup

**Solutions**:
1. This is expected behavior if you haven't configured Twilio (system will use email-only)
2. If you want WhatsApp enabled, ensure all three Twilio variables are set in `.env`
3. Check logs for specific connection test errors
4. Verify your Twilio credentials are correct in the Twilio Console
5. Test your credentials manually using Twilio's API Explorer

### Issue: "Invalid phone number" errors

**Possible Causes**:
- Phone numbers not in E.164 format
- Phone numbers contain spaces, dashes, or parentheses
- Missing country code

**Solutions**:
1. Ensure all phone numbers start with `+` followed by country code
2. Remove all spaces, dashes, parentheses, and other formatting
3. Examples of correct format:
   - US: `+14155552671` (not `+1 (415) 555-2671`)
   - India: `+919876543210` (not `+91 98765 43210`)
   - UK: `+447911123456` (not `+44 7911 123456`)
4. Use an online E.164 validator to check your phone numbers
5. Check logs for which specific records have invalid phone numbers

### Issue: WhatsApp messages not received by recipient

**Possible Causes**:
- Recipient hasn't joined Twilio Sandbox (for testing)
- Recipient's phone number is not on WhatsApp
- Message blocked by WhatsApp policies
- Twilio account has insufficient balance

**Solutions**:
1. **For Sandbox Testing**: Ensure recipient has sent the join code to the sandbox number
2. Verify the recipient's phone number is registered on WhatsApp
3. Check Twilio Console for message delivery status
4. Review Twilio error codes in logs:
   - `21211`: Invalid phone number
   - `21408`: Permission denied (WhatsApp not enabled on account)
   - `21610`: Message undeliverable
   - `63007`: Recipient not on WhatsApp
5. Ensure your Twilio account has sufficient balance
6. Check that message content complies with WhatsApp Business Policy

### Issue: "Twilio API error" or "Authentication failed"

**Possible Causes**:
- Incorrect Account SID or Auth Token
- Twilio account suspended or restricted
- Network connectivity issues

**Solutions**:
1. Verify your `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN` are correct
2. Ensure there are no extra spaces in the credentials in `.env`
3. Check your Twilio account status in the Console
4. Verify your network allows outbound HTTPS connections to Twilio API
5. Try regenerating your Auth Token in Twilio Console
6. Check Twilio service status at https://status.twilio.com

### Issue: Some notifications sent via email instead of WhatsApp

**Possible Causes**:
- Phone number missing or invalid for specific records
- System automatically falling back to email

**Solutions**:
1. This is expected behavior when phone validation fails
2. Check logs for "falling back to email" warnings
3. Review the specific records mentioned in warnings
4. Correct phone numbers in Excel file
5. Ensure `NotificationChannel` is set correctly for each record

### Issue: WhatsApp retry attempts failing

**Possible Causes**:
- Persistent Twilio API issues
- Rate limiting
- Network instability

**Solutions**:
1. Check logs for specific error messages during retry attempts
2. The system automatically retries 3 times with exponential backoff
3. If all retries fail, check Twilio Console for account issues
4. Verify you haven't exceeded Twilio rate limits
5. Check your network connection stability
6. Wait a few minutes and the system will try again on the next scheduled run

## Running as a Background Service

### Using PM2 (Recommended for Production)

1. Install PM2 globally:
```bash
npm install -g pm2
```

2. Start the application:
```bash
pm2 start dist/index.js --name birthday-system
```

3. Configure PM2 to start on system boot:
```bash
pm2 startup
pm2 save
```

4. Monitor the application:
```bash
pm2 status
pm2 logs birthday-system
```

### Using Windows Task Scheduler

1. Build the application: `npm run build`
2. Open Task Scheduler
3. Create a new task that runs on system startup
4. Set the action to run: `node C:\path\to\project\dist\index.js`
5. Configure the task to run whether user is logged in or not

## Project Structure

```
birthday-notification-system/
├── src/
│   ├── models/           # TypeScript interfaces and types
│   ├── services/         # Core service implementations
│   ├── utils/            # Utility functions and helpers
│   └── index.ts          # Application entry point
├── logs/                 # Log files (auto-generated)
├── dist/                 # Compiled JavaScript (auto-generated)
├── birthdays.xlsx        # Sample Excel file
├── email-template.txt    # Sample email template
├── .env                  # Environment configuration (create this)
├── .env.example          # Example environment configuration
├── package.json          # Project dependencies
├── tsconfig.json         # TypeScript configuration
└── README.md             # This file
```

## Security Best Practices

1. **Never commit sensitive data**:
   - Add `.env` to `.gitignore`
   - Never share your Gmail app password or Twilio Auth Token
   - Don't commit Excel files with real email addresses or phone numbers

2. **Use app passwords and tokens**:
   - Always use Gmail app passwords, never your account password
   - Keep Twilio Auth Token secret and secure
   - Rotate credentials periodically

3. **Limit file permissions**:
   - Ensure `.env` file is readable only by the application user
   - Protect Excel files containing personal information (emails and phone numbers)

4. **Monitor logs**:
   - Regularly review logs for suspicious activity
   - Set up alerts for repeated failures
   - Monitor Twilio Console for unusual usage patterns

5. **WhatsApp-specific security**:
   - Comply with WhatsApp Business Policy
   - Don't send spam or unsolicited messages
   - Respect user privacy and data protection regulations (GDPR, etc.)
   - Use Twilio API keys (not main account credentials) for production
   - Monitor Twilio usage to avoid unexpected charges

## Support and Contributing

For issues, questions, or contributions, please refer to the project repository.

## License

This project is provided as-is for personal and educational use.
