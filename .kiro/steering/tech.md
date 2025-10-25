# Technology Stack

## Runtime & Language

- **Node.js**: v18+ required
- **TypeScript**: v5.9.3 with strict mode enabled
- **Target**: ES2020, CommonJS modules

## Core Dependencies

- **dotenv**: Environment variable management
- **node-cron**: Cron-based scheduling
- **nodemailer**: Gmail SMTP email sending
- **winston**: Structured logging with rotation
- **xlsx**: Excel file reading and parsing

## Development Tools

- **ts-node**: TypeScript execution for development
- **nodemon**: Auto-reload during development
- **vitest**: Testing framework with UI support
- **TypeScript**: Strict type checking with comprehensive compiler options

## Build System

TypeScript compiler (tsc) compiles `src/` to `dist/` directory.

### Common Commands

```bash
# Build
npm run build              # Compile TypeScript to JavaScript

# Run
npm start                  # Run compiled application (requires build first)
npm run dev                # Run with ts-node (development)
npm run dev:watch          # Run with auto-reload (development)

# Test
npm test                   # Run tests once (vitest --run)
npm run test:watch         # Run tests in watch mode
```

## TypeScript Configuration

- Strict mode enabled with comprehensive checks
- Source maps and declarations generated
- No unused locals/parameters allowed
- Implicit returns not allowed
- Fallthrough cases in switch not allowed

## Email Service

- **Protocol**: SMTP via Gmail (smtp.gmail.com:587)
- **Authentication**: Requires Gmail app password (not regular password)
- **TLS**: Required for secure connection
