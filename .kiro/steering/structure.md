# Project Structure

## Directory Organization

```
src/
├── models/              # TypeScript interfaces and data models
│   ├── interfaces/      # Service interfaces (dependency injection)
│   ├── AppConfig.ts     # Application configuration model
│   ├── BirthdayRecord.ts # Birthday data model
│   ├── EmailConfig.ts   # Email configuration model
│   ├── EmailTemplate.ts # Email template model
│   └── index.ts         # Barrel export
├── services/            # Core business logic implementations
│   ├── BirthdayChecker.ts      # Birthday matching logic
│   ├── ConfigService.ts        # Environment config loader
│   ├── EmailService.ts         # Gmail SMTP integration
│   ├── ExcelReader.ts          # Excel file parsing
│   ├── NotificationManager.ts  # Orchestrates birthday checks
│   ├── Scheduler.ts            # Cron job management
│   ├── TemplateEngine.ts       # Email template processing
│   └── index.ts                # Barrel export
├── utils/               # Utility functions and helpers
│   ├── Logger.ts        # Winston logging wrapper
│   └── index.ts         # Barrel export
├── __tests__/           # Test files
│   ├── e2e.test.ts      # End-to-end tests
│   └── README.md        # Test documentation
└── index.ts             # Application entry point
```

## Architecture Patterns

### Dependency Injection
- Services depend on interfaces (in `models/interfaces/`)
- Enables testability and loose coupling
- Constructor injection pattern used throughout

### Service Layer Pattern
- Business logic isolated in service classes
- Each service has single responsibility
- Services orchestrated in `NotificationManager`

### Barrel Exports
- Each directory exports via `index.ts`
- Simplifies imports: `from './services'` instead of `from './services/EmailService'`

## Code Organization Rules

1. **Models**: Define data structures and interfaces only, no logic
2. **Services**: Implement business logic, depend on interfaces
3. **Utils**: Shared utilities (logging, helpers) with no business logic
4. **Entry Point**: `index.ts` orchestrates initialization and startup

## Configuration Management

- Environment variables loaded via `ConfigService`
- Configuration validated on startup
- Sensitive data (passwords) never hardcoded
- `.env` file required (see `.env.example`)

## Logging Strategy

- Winston logger initialized with config
- Passed to services via constructor
- Structured logging with metadata
- Log rotation and retention configured
- Logs stored in `logs/` directory (gitignored)

## Build Output

- Compiled JavaScript in `dist/` directory (gitignored)
- Source maps and declarations generated
- Production runs from `dist/index.js`
