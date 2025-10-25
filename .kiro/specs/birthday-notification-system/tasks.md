# Implementation Plan

- [x] 1. Set up project structure and dependencies





  - Initialize Node.js project with TypeScript configuration
  - Install required dependencies: xlsx, nodemailer, node-cron, winston, dotenv
  - Install dev dependencies: @types packages, typescript
  - Create directory structure: src/, src/models/, src/services/, src/utils/, logs/
  - Configure tsconfig.json with appropriate compiler options
  - Create .env.example file with required environment variables
  - Add .gitignore for node_modules, .env, logs/, and build output
  - _Requirements: 1.1, 4.1, 4.3_

- [x] 2. Implement data models and interfaces




  - Create TypeScript interfaces for BirthdayRecord, EmailConfig, EmailTemplate, AppConfig
  - Define interface for ExcelReader with readBirthdays and validateRecord methods
  - Define interface for BirthdayChecker with findTodaysBirthdays method
  - Define interface for EmailService with initialize, sendBirthdayEmail, and testConnection methods
  - Define interface for TemplateEngine with loadTemplate and renderEmail methods
  - Define interface for NotificationManager with checkAndNotify method
  - Define interface for Logger with info, error, and warn methods
  - _Requirements: 1.2, 1.3, 3.2, 4.1, 6.1_
-

- [x] 3. Implement configuration management




  - Create ConfigService class to load and validate environment variables
  - Implement method to read .env file using dotenv
  - Implement validation for required environment variables (EXCEL_FILE_PATH, GMAIL_USER, GMAIL_PASSWORD)
  - Implement default values for optional settings (CRON_SCHEDULE, LOG_LEVEL)
  - Implement getConfig method that returns AppConfig object
  - Add error handling for missing required configuration
  - _Requirements: 4.1, 4.3, 4.4, 4.5_

- [x] 4. Implement logger component





  - Create Logger class using winston library
  - Configure console transport with colorized output
  - Configure file transport with rotation (10 MB max size)
  - Implement log retention policy (30 days)
  - Implement info, error, and warn methods with metadata support
  - Add timestamp and log level formatting
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
-

- [x] 5. Implement Excel reader component




  - Create ExcelReader class with readBirthdays method
  - Implement Excel file reading using xlsx library
  - Implement logic to skip header row and read data rows
  - Implement date parsing for multiple formats (MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD)
  - Implement validateRecord method to check for required fields (name, email, birthday)
  - Implement email format validation using regex
  - Add error logging for invalid records with row numbers
  - Handle file not found and invalid file format errors
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 5.1 Write unit tests for Excel reader


  - Create test cases for various date formats
  - Test validation logic for missing fields
  - Test email format validation
  - Test error handling for invalid files
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 6. Implement birthday checker component





  - Create BirthdayChecker class with findTodaysBirthdays method
  - Implement isBirthdayToday method that compares month and day only
  - Handle timezone considerations using local time
  - Filter birthday records to return only today's matches
  - _Requirements: 2.1, 2.2_

- [x] 6.1 Write unit tests for birthday checker


  - Test date matching logic with various dates
  - Test edge cases (leap years, different timezones)
  - Test filtering of birthday records
  - _Requirements: 2.1, 2.2_

- [x] 7. Implement email template engine





  - Create TemplateEngine class with loadTemplate method
  - Implement reading template from file if TEMPLATE_FILE_PATH is provided
  - Implement default template with subject and body
  - Implement renderEmail method with variable substitution for {{name}}
  - Add template syntax validation on load
  - Handle missing template file gracefully by using default
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 7.1 Write unit tests for template engine


  - Test variable substitution with {{name}}
  - Test default template loading
  - Test custom template loading
  - Test template validation
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 8. Implement email service component





  - Create EmailService class with initialize method
  - Configure nodemailer with Gmail SMTP transport (host: smtp.gmail.com, port: 587)
  - Implement authentication using user and password from config
  - Implement testConnection method to validate credentials on startup
  - Implement sendBirthdayEmail method that accepts BirthdayRecord and EmailTemplate
  - Implement retry logic (1 retry after 5 minutes on failure)
  - Add error logging for failed email sends with recipient details
  - Handle SMTP connection errors, authentication failures, and network timeouts
  - _Requirements: 3.1, 3.2, 3.4, 3.5, 4.2, 4.4, 4.5_

- [x] 8.1 Write integration tests for email service


  - Test email sending to test Gmail account
  - Test authentication with valid and invalid credentials
  - Test retry logic on failure
  - Test error handling for network issues
  - _Requirements: 3.1, 3.2, 3.5_

- [x] 9. Implement notification manager component





  - Create NotificationManager class with checkAndNotify method
  - Inject dependencies: ExcelReader, BirthdayChecker, EmailService, TemplateEngine, Logger
  - Implement orchestration logic: read Excel → find birthdays → send emails
  - Implement processRecord method to handle individual birthday records
  - Add error handling to continue processing even if one email fails
  - Log successful email sends with recipient name, email, and timestamp
  - Log errors with affected birthday record details
  - _Requirements: 2.1, 2.2, 3.1, 5.1, 5.2_

- [x] 9.1 Write integration tests for notification manager


  - Test end-to-end flow with sample Excel file
  - Test error handling when Excel file is missing
  - Test error handling when email sending fails
  - Verify logging of successful and failed operations
  - _Requirements: 2.1, 2.2, 3.1, 5.1, 5.2_

- [x] 10. Implement scheduler component





  - Create Scheduler class with start and stop methods
  - Use node-cron to schedule birthday checks
  - Read cron expression from config (default: "0 9 * * *")
  - Implement callback execution on schedule trigger
  - Add validation for cron expression format
  - Handle invalid cron expressions by falling back to default
  - _Requirements: 2.3, 2.4_

- [x] 11. Implement main application entry point





  - Create index.ts as main entry point
  - Initialize ConfigService and load configuration
  - Initialize Logger with configuration
  - Initialize all components (ExcelReader, BirthdayChecker, EmailService, TemplateEngine, NotificationManager, Scheduler)
  - Test email service connection on startup
  - Run immediate birthday check on startup
  - Start scheduler with configured cron expression
  - Add graceful shutdown handling (stop scheduler, close connections)
  - Add top-level error handling and logging
  - _Requirements: 2.3, 4.4, 4.5_

- [x] 12. Create sample files and documentation





  - Create sample birthdays.xlsx file with example data
  - Create sample email-template.txt file with default template
  - Create README.md with setup instructions, configuration guide, and usage examples
  - Document required environment variables in README
  - Add instructions for obtaining Gmail app password
  - Add troubleshooting section for common issues
  - _Requirements: 1.1, 4.1, 6.1_

- [x] 13. Add build and run scripts





  - Add npm scripts for build (tsc), start (node dist/index.js), and dev (ts-node src/index.ts)
  - Add npm script for running with nodemon for development
  - Create package.json scripts section with all necessary commands
  - Test build process and verify output in dist/ directory
  - _Requirements: 2.3, 2.4_

- [x] 14. Create end-to-end test





  - Create test Excel file with today's date for testing
  - Set up test Gmail account for receiving emails
  - Run application and verify email is received
  - Verify logs contain correct information
  - Test error scenarios (missing file, invalid credentials)
  - _Requirements: 1.1, 2.1, 2.2, 3.1, 5.1_
