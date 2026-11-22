import { config } from '../config/env.js';

const GOOGLE_AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_ENDPOINT = 'https://openidconnect.googleapis.com/v1/userinfo';

/**
 * Build the Google OAuth 2.0 authorization URL with CSRF state parameter.
 */
export function buildGoogleAuthUrl(state) {
  const params = new URLSearchParams({
    client_id: config.googleClientId,
    redirect_uri: config.googleRedirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    prompt: 'select_account',
  });

  return `${GOOGLE_AUTH_ENDPOINT}?${params.toString()}`;
}

/**
 * Exchange an authorization code for Google OAuth tokens.
 */
export async function exchangeCodeForTokens(code) {
  const body = new URLSearchParams({
    code,
    client_id: config.googleClientId,
    client_secret: config.googleClientSecret,
    redirect_uri: config.googleRedirectUri,
    grant_type: 'authorization_code',
  });

  const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.access_token) {
    const detail = data?.error_description || data?.error || `HTTP ${response.status}`;
    throw new Error(`Google token exchange failed: ${detail}`);
  }

  return data;
}

/**
 * Fetch the authenticated Google user's OpenID Connect profile.
 */
export async function fetchGoogleUserProfile(accessToken) {
  const response = await fetch(GOOGLE_USERINFO_ENDPOINT, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const profile = await response.json().catch(() => null);
  if (!response.ok || !profile?.email) {
    throw new Error(`Failed to fetch Google user profile: HTTP ${response.status}`);
  }

  return {
    email: profile.email,
    name: profile.name || profile.email,
    picture: profile.picture || null,
    emailVerified: Boolean(profile.email_verified),
  };
}
