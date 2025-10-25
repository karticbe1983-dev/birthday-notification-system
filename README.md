# Birthday Notification System

An automated system that reads birthday information from an Excel spreadsheet and sends personalized email notifications via Gmail on the appropriate dates.

## Features

- 📅 Automatic daily birthday checks
- 📧 Personalized email notifications via Gmail
- 📊 Excel-based birthday data management
- 🔄 Configurable scheduling with cron expressions
- 📝 Comprehensive logging with rotation
- 🎨 Customizable email templates
- ⚡ Automatic retry on email failures
- 🛡️ Secure credential management

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- A Gmail account with app password enabled
- An Excel file (.xlsx) with birthday data

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

### Excel File Format

Your Excel file should have the following structure:

| Name          | Email                | Birthday   |
|---------------|----------------------|------------|
| John Doe      | john.doe@gmail.com   | 10/25/1990 |
| Jane Smith    | jane.smith@gmail.com | 12/15/1985 |
| Bob Johnson   | bob.johnson@gmail.com| 01/08/1992 |

**Requirements**:
- First row must be headers: `Name`, `Email`, `Birthday`
- **Name**: Full name of the person
- **Email**: Valid Gmail address
- **Birthday**: Date in one of these formats:
  - MM/DD/YYYY (e.g., 10/25/1990)
  - DD/MM/YYYY (e.g., 25/10/1990)
  - YYYY-MM-DD (e.g., 1990-10-25)

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
1. Validate your configuration and Gmail credentials
2. Perform an immediate birthday check
3. Send emails to anyone with a birthday today
4. Schedule daily checks according to your cron schedule
5. Continue running in the background

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
   - Never share your app password
   - Don't commit Excel files with real email addresses

2. **Use app passwords**:
   - Always use Gmail app passwords, never your account password
   - Rotate app passwords periodically

3. **Limit file permissions**:
   - Ensure `.env` file is readable only by the application user
   - Protect Excel files containing personal information

4. **Monitor logs**:
   - Regularly review logs for suspicious activity
   - Set up alerts for repeated failures

## Support and Contributing

For issues, questions, or contributions, please refer to the project repository.

## License

This project is provided as-is for personal and educational use.
