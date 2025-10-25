/**
 * Configuration for email service
 */
export interface EmailConfig {
  /** Gmail account username/email */
  user: string;
  
  /** Gmail app password or OAuth2 token */
  password: string;
  
  /** From address for sent emails */
  from: string;
}
