# Product Overview

Birthday Notification System - An automated service that reads birthday data from Excel spreadsheets and sends personalized email notifications via Gmail on the appropriate dates.

## Core Features

- Automated daily birthday checks using cron scheduling
- Excel-based birthday data management (.xlsx format)
- Personalized email notifications via Gmail SMTP
- Customizable email templates with variable substitution
- Comprehensive logging with Winston (rotation, retention)
- Automatic retry on email failures
- Secure credential management via environment variables

## Key Use Cases

- Reads Excel file with columns: Name, Email, Birthday
- Checks daily for matching birthdays (configurable schedule)
- Sends personalized emails using customizable templates
- Logs all operations for monitoring and troubleshooting

## Security Considerations

- Uses Gmail app passwords (not regular passwords)
- Never commit `.env` files or real birthday data
- Protect Excel files containing personal information
- Monitor logs for suspicious activity
