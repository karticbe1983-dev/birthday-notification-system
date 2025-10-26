# Implementation Plan

- [x] 1. Install dependencies and update TypeScript types





  - Install `twilio` and `libphonenumber-js` npm packages
  - Update `package.json` with new dependencies
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. Update data models for multi-channel support




  - [x] 2.1 Update BirthdayRecord interface


    - Add optional `phone` field (string)
    - Add `notificationChannel` field with type 'email' | 'whatsapp' | 'both'
    - Update existing code references to handle new fields
    - _Requirements: 2.1, 2.2_
  
  - [x] 2.2 Create WhatsAppConfig model


    - Create `src/models/WhatsAppConfig.ts` with accountSid, authToken, fromNumber fields
    - Export from `src/models/index.ts`
    - _Requirements: 1.1, 1.2, 1.3_
  

  - [x] 2.3 Update AppConfig model

    - Add `whatsapp` configuration section with WhatsAppConfig type
    - Add `enabled` boolean flag to whatsapp config
    - Add `whatsappFilePath` to template configuration
    - _Requirements: 1.1, 1.4, 5.1_

- [x] 3. Create WhatsApp service interface and implementation




  - [x] 3.1 Create IWhatsAppService interface


    - Define interface in `src/models/interfaces/IWhatsAppService.ts`
    - Include methods: initialize, sendBirthdayMessage, testConnection
    - Export from `src/models/interfaces/index.ts`
    - _Requirements: 3.1, 3.2, 6.1_
  
  - [x] 3.2 Implement WhatsAppService class


    - Create `src/services/WhatsAppService.ts`
    - Initialize Twilio client with credentials
    - Implement sendBirthdayMessage with retry logic (3 attempts, exponential backoff)
    - Implement testConnection to validate Twilio credentials
    - Handle Twilio-specific error codes (21211, 21408, 21610, 63007)
    - Add comprehensive logging for all operations
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5, 8.1, 8.2, 8.3, 8.4_
  
  - [x] 3.3 Export WhatsAppService


    - Add export to `src/services/index.ts`
    - _Requirements: 3.1_

- [x] 4. Enhance Excel Reader for phone numbers and channels




  - [x] 4.1 Update ExcelReader to parse new columns

    - Read Phone column from Excel
    - Read NotificationChannel column from Excel
    - Parse and trim phone numbers
    - Normalize channel values to lowercase
    - _Requirements: 2.1, 2.2_
  


  - [x] 4.2 Add phone number validation

    - Use `libphonenumber-js` to validate E.164 format
    - Create validation helper function
    - _Requirements: 2.3, 2.4_
  

  - [x] 4.3 Implement channel fallback logic

    - Default to 'email' if NotificationChannel is empty or invalid
    - Fall back to 'email' if phone is missing/invalid but channel includes 'whatsapp'
    - Log warnings for fallback scenarios
    - _Requirements: 2.3, 2.5_
  


  - [x] 4.4 Update validateRecord method


    - Integrate phone validation
    - Integrate channel validation and fallback
    - Return enhanced BirthdayRecord with phone and notificationChannel
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 5. Enhance Template Engine for WhatsApp templates





  - [x] 5.1 Add loadWhatsAppTemplate method


    - Load WhatsApp template from configured file path
    - Fall back to email template body if WhatsApp template not found
    - Use default WhatsApp template if no custom template configured
    - _Requirements: 5.1, 5.2, 5.3_
  

  - [x] 5.2 Add renderWhatsApp method

    - Replace {{name}} placeholder with recipient name
    - Return plain text string (no HTML)
    - Truncate to 1600 characters if needed (Twilio limit)
    - _Requirements: 5.4, 5.5_
  

  - [x] 5.3 Update ITemplateEngine interface

    - Add loadWhatsAppTemplate method signature
    - Add renderWhatsApp method signature
    - _Requirements: 5.1, 5.4_

- [x] 6. Update Configuration Service for Twilio credentials






  - [x] 6.1 Add Twilio environment variables

    - Read TWILIO_ACCOUNT_SID from environment
    - Read TWILIO_AUTH_TOKEN from environment
    - Read TWILIO_WHATSAPP_NUMBER from environment
    - Read WHATSAPP_TEMPLATE_FILE_PATH from environment (optional)
    - _Requirements: 1.1, 1.2, 1.3, 5.1_
  

  - [x] 6.2 Implement WhatsApp configuration validation

    - Check if all required Twilio credentials are present
    - Set whatsapp.enabled to false if any credential is missing
    - Log warning if WhatsApp is disabled due to missing credentials
    - _Requirements: 1.4, 1.5_
  

  - [x] 6.3 Update .env.example file

    - Add Twilio configuration variables with examples
    - Add WhatsApp template file path variable
    - Include comments explaining each variable
    - _Requirements: 1.1, 1.2, 1.3, 5.1_

- [x] 7. Enhance Notification Manager for multi-channel routing





  - [x] 7.1 Update constructor to accept WhatsAppService


    - Add whatsappService parameter to constructor
    - Store as instance variable
    - Update dependency injection in main application
    - _Requirements: 7.1, 7.2, 7.3_
  
  - [x] 7.2 Implement channel routing logic in processRecord


    - Load both email and WhatsApp templates
    - Check notificationChannel value
    - Send email if channel is 'email' or 'both'
    - Send WhatsApp if channel is 'whatsapp' or 'both'
    - Process channels independently (failure in one doesn't block the other)
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
  
  - [x] 7.3 Add comprehensive logging for multi-channel operations


    - Log channel routing decisions
    - Log success/failure for each channel
    - Log summary after processing each record
    - Include WhatsApp statistics in daily summary
    - _Requirements: 8.1, 8.5_

- [x] 8. Update main application initialization







  - [x] 8.1 Initialize WhatsApp Service

    - Create WhatsAppService instance with logger
    - Initialize with Twilio configuration
    - Test connection on startup if WhatsApp enabled
    - Handle initialization errors gracefully
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  
  - [x] 8.2 Wire WhatsApp Service into Notification Manager

    - Pass WhatsAppService to NotificationManager constructor
    - Update dependency injection setup
    - _Requirements: 7.1_
  

  - [x] 8.3 Add startup logging for WhatsApp status

    - Log whether WhatsApp is enabled or disabled
    - Log Twilio account information (masked)
    - Log WhatsApp phone number
    - _Requirements: 6.3, 8.1_

- [x] 9. Create default WhatsApp template file





  - Create `whatsapp-template.txt` in project root
  - Include default birthday message with {{name}} placeholder
  - Keep message concise and WhatsApp-friendly
  - _Requirements: 5.2, 5.3_

- [x] 10. Update sample Excel file





  - Add Phone column to `birthdays.xlsx`
  - Add NotificationChannel column to `birthdays.xlsx`
  - Include sample data with various channel combinations
  - Add comments/documentation about new columns
  - _Requirements: 2.1, 2.2_

- [x] 11. Update documentation






  - [x] 11.1 Update README.md

    - Document WhatsApp feature
    - Explain Twilio setup process
    - Document new Excel columns (Phone, NotificationChannel)
    - Add troubleshooting section for WhatsApp issues
    - _Requirements: 1.1, 2.1, 2.2_
  
  - [x] 11.2 Update steering files


    - Update `tech.md` with new dependencies (twilio, libphonenumber-js)
    - Update `structure.md` with new WhatsApp service component
    - Update `product.md` with WhatsApp feature description
    - _Requirements: 1.1, 3.1_

- [x] 12. Integration testing and validation






  - [x] 12.1 Test WhatsApp-only notifications

    - Create test record with channel='whatsapp'
    - Run application and verify WhatsApp message received
    - Verify email not sent
    - _Requirements: 7.2_
  

  - [ ] 12.2 Test multi-channel notifications
    - Create test record with channel='both'
    - Run application and verify both email and WhatsApp received
    - Test failure scenario (one channel fails, other succeeds)
    - _Requirements: 7.3, 7.4, 7.5_

  
  - [ ] 12.3 Test fallback scenarios
    - Test invalid phone number with WhatsApp channel (should fall back to email)
    - Test missing phone with WhatsApp channel (should fall back to email)
    - Test invalid NotificationChannel value (should default to email)
    - Verify appropriate warnings logged

    - _Requirements: 2.3, 2.5_
  
  - [ ] 12.4 Test WhatsApp disabled mode
    - Remove Twilio credentials from .env
    - Run application and verify it continues with email-only

    - Verify warning logged about WhatsApp being disabled
    - _Requirements: 1.5, 6.5_
  
  - [ ] 12.5 Test error handling and retries
    - Simulate Twilio API errors
    - Verify retry logic with exponential backoff
    - Verify appropriate error logging
    - Verify system continues processing after failures
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
