import 'dotenv/config';
import crypto from 'node:crypto';

const port = Number(process.env.PORT) || 3000;
const appUrl = (process.env.APP_URL || `http://localhost:${port}`).trim().replace(/\/+$/, '');
const gmailUser = (process.env.GMAIL_USER || '').trim();
const gmailAppPassword = (process.env.GMAIL_APP_PASSWORD || '').trim();

/**
 * Centralized application configuration loaded from environment variables.
 */
export const config = {
  port,
  appUrl,
  sessionSecret: (process.env.SESSION_SECRET || '').trim() || crypto.randomBytes(32).toString('hex'),
  googleClientId: (process.env.GOOGLE_CLIENT_ID || '').trim(),
  googleClientSecret: (process.env.GOOGLE_CLIENT_SECRET || '').trim(),
  googleRedirectUri: (process.env.GOOGLE_REDIRECT_URI || `${appUrl}/auth/callback/google`).trim(),
  gmailUser,
  gmailAppPassword,
  gmailAppPasswordNormalized: gmailAppPassword.replace(/\s+/g, ''),
};
