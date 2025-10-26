# Product Overview

Birthday Notification System - An automated service that reads birthday data from Excel spreadsheets and sends personalized notifications via email and/or WhatsApp on the appropriate dates.

## Core Features

- Automated daily birthday checks using cron scheduling
- Excel-based birthday data management (.xlsx format)
- Multi-channel notifications: email, WhatsApp, or both
- Personalized email notifications via Gmail SMTP
- Personalized WhatsApp notifications via Twilio (optional)
- Customizable email and WhatsApp templates with variable substitution
- Comprehensive logging with Winston (rotation, retention)
- Automatic retry on email and WhatsApp failures
- Secure credential management via environment variables
- Phone number validation (E.164 format)
- Automatic fallback to email if WhatsApp unavailable

## Key Use Cases

- Reads Excel file with columns: Name, Email, Phone, Birthday, NotificationChannel
- Checks daily for matching birthdays (configurable schedule)
- Sends personalized notifications via preferred channel(s):
  - Email only
  - WhatsApp only
  - Both email and WhatsApp
- Uses customizable templates for both email and WhatsApp
- Validates phone numbers and falls back to email if invalid
- Logs all operations for monitoring and troubleshooting

## Security Considerations

- Uses Gmail app passwords (not regular passwords)
- Uses Twilio Auth Tokens (kept secret, never committed)
- Never commit `.env` files or real birthday data
- Protect Excel files containing personal information (emails and phone numbers)
- Monitor logs for suspicious activity
- Comply with WhatsApp Business Policy and data protection regulations
- Phone numbers stored in E.164 format for consistency
