/**
 * Application configuration
 */
export interface AppConfig {
  /** Excel file configuration */
  excel: {
    /** Path to the Excel file containing birthday data */
    filePath: string;
  };
  
  /** Email service configuration */
  email: {
    /** Gmail account username/email */
    user: string;
    
    /** Gmail app password or OAuth2 token */
    password: string;
    
    /** From address for sent emails */
    from: string;
  };
  
  /** Scheduler configuration */
  scheduler: {
    /** Cron expression for scheduling birthday checks */
    cronExpression: string;
  };
  
  /** Template configuration */
  template: {
    /** Optional path to custom email template file */
    filePath?: string;
  };
  
  /** Logging configuration */
  logging: {
    /** Log level (info, warn, error, debug) */
    level: string;
    
    /** Directory for log files */
    directory: string;
  };
}
