# End-to-End Test Documentation

## Overview

The end-to-end test suite (`e2e.test.ts`) validates the complete Birthday Notification System workflow from Excel file reading to email sending and logging.

## Test Coverage

The test suite covers the following requirements:

- **Requirement 1.1**: Excel file reading and data extraction
- **Requirement 2.1**: Birthday matching logic
- **Requirement 2.2**: Daily birthday checking
- **Requirement 3.1**: Email sending via Gmail
- **Requirement 5.1**: Logging of operations

## Running the Tests

### Run All E2E Tests

```bash
npm test -- src/__tests__/e2e.test.ts
```

### Run Specific Test

```bash
npm test -- src/__tests__/e2e.test.ts -t "should create test Excel file"
```

### Run Tests in Watch Mode

```bash
npm run test:watch -- src/__tests__/e2e.test.ts
```

## Test Scenarios

### 1. Create Test Excel File with Today's Date

**Purpose**: Validates that test data can be created dynamically with today's date for testing birthday matching logic.

**What it tests**:
- Excel file creation with XLSX library
- Dynamic date generation
- File system operations

### 2. Read Excel File and Identify Today's Birthdays

**Purpose**: Tests the complete flow of reading birthday data and finding matches for today.

**What it tests**:
- Excel file reading
- Data parsing and validation
- Birthday matching logic (month and day comparison)
- Correct identification of multiple birthdays on the same day

### 3. Verify Logs Contain Correct Information

**Purpose**: Ensures that all operations are properly logged for auditing and debugging.

**What it tests**:
- Log file creation
- Log content accuracy
- Proper logging of file paths and operations

### 4. Handle Missing Excel File Gracefully

**Purpose**: Validates error handling when the Excel file doesn't exist.

**What it tests**:
- File not found error handling
- Proper error logging
- Application doesn't crash on missing file

### 5. Handle Invalid Email Credentials

**Purpose**: Tests the system's behavior when Gmail credentials are invalid.

**What it tests**:
- SMTP connection testing
- Authentication failure handling
- Proper error reporting for invalid credentials
- System continues to run (doesn't crash)

**Note**: This test will attempt to connect to Gmail's SMTP server with invalid credentials, which is expected to fail. The test verifies that the failure is handled gracefully.

### 6. Load and Render Custom Email Template

**Purpose**: Validates template loading and variable substitution.

**What it tests**:
- Custom template file reading
- Template parsing
- Variable substitution ({{name}})
- Subject and body rendering

### 7. Complete Full Notification Flow

**Purpose**: Tests the entire system integration without actually sending emails.

**What it tests**:
- Component integration
- Orchestration logic
- Error handling when email service is not initialized
- System continues processing even when individual emails fail

### 8. Validate Configuration on Startup

**Purpose**: Ensures configuration is properly loaded from environment variables.

**What it tests**:
- Environment variable reading
- Configuration validation
- Default value handling

### 9. Handle Invalid Excel Data Gracefully

**Purpose**: Tests data validation and error handling for malformed records.

**What it tests**:
- Missing name validation
- Missing email validation
- Invalid date format handling
- System skips invalid records and continues processing valid ones

## Test Data

The tests create temporary test data in a `test-data/` directory that is automatically cleaned up after tests complete.

### Test Excel Structure

```
| Name          | Email              | Birthday   |
|---------------|--------------------|------------|
| Test User 1   | test1@gmail.com    | [TODAY]    |
| Test User 2   | test2@gmail.com    | 12/25/1990 |
| Test User 3   | test3@gmail.com    | [TODAY]    |
```

### Invalid Data Test Structure

```
| Name          | Email              | Birthday    |
|---------------|--------------------|-------------|
| Valid User    | valid@gmail.com    | 01/15/1990  |
| (empty)       | noemail@gmail.com  | 02/20/1985  |
| No Email      | (empty)            | 03/25/1992  |
| Invalid Date  | invalid@gmail.com  | not-a-date  |
```

## Setting Up Test Gmail Account (Optional)

If you want to test actual email sending, you can set up a test Gmail account:

### Step 1: Create Test Gmail Account

1. Go to https://accounts.google.com/signup
2. Create a new Gmail account specifically for testing
3. Complete the account setup

### Step 2: Enable 2-Step Verification

1. Go to https://myaccount.google.com/security
2. Enable 2-Step Verification
3. Follow the setup process

### Step 3: Generate App Password

1. Go to https://myaccount.google.com/apppasswords
2. Select "Mail" as the app
3. Select "Other" as the device and name it "Birthday System Test"
4. Copy the generated 16-character password

### Step 4: Update Test Configuration

Create a `.env.test` file:

```env
EXCEL_FILE_PATH=./test-data/test-birthdays.xlsx
GMAIL_USER=your-test-email@gmail.com
GMAIL_PASSWORD=your-app-password
GMAIL_FROM=Test System <your-test-email@gmail.com>
LOG_LEVEL=debug
LOG_DIRECTORY=./test-data/logs
```

### Step 5: Modify Test to Use Real Credentials

Update the "should handle invalid email credentials" test to use real credentials from `.env.test` if you want to test actual email sending.

**Warning**: Be careful not to commit real credentials to version control!

## Troubleshooting

### Tests Fail Due to Network Issues

If the "should handle invalid email credentials" test times out:
- Check your internet connection
- Verify that port 587 is not blocked by your firewall
- The test may take longer on slow connections (up to 30 seconds)

### Log File Not Found

If the log verification test fails:
- Ensure the test has write permissions to create the `test-data/` directory
- Check that winston logger is properly configured
- Increase the wait time in the test (currently 100ms)

### Excel File Creation Fails

If Excel file creation fails:
- Verify that the `xlsx` library is properly installed
- Check file system permissions
- Ensure sufficient disk space

### Date Matching Issues

If birthday matching tests fail:
- Verify system date and time are correct
- Check timezone settings
- Ensure the test is creating dates with today's month and day

## Continuous Integration

These tests are designed to run in CI/CD environments without requiring real Gmail credentials. The tests that require network access (SMTP connection) are designed to handle failures gracefully.

### CI Configuration Example

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm test
```

## Performance

Expected test execution time:
- Full suite: ~2-5 seconds
- Individual tests: 10-200ms (except SMTP test which may take up to 2 seconds)

## Maintenance

When updating the system:
1. Update tests to reflect new functionality
2. Ensure all requirements are still covered
3. Add new test cases for new features
4. Keep test data minimal and focused
5. Clean up test artifacts properly

## Related Documentation

- [Main README](../../README.md) - System setup and usage
- [Requirements](../../.kiro/specs/birthday-notification-system/requirements.md) - System requirements
- [Design](../../.kiro/specs/birthday-notification-system/design.md) - System design
- [Tasks](../../.kiro/specs/birthday-notification-system/tasks.md) - Implementation tasks
