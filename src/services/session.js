import crypto from 'node:crypto';
import { config } from '../config/env.js';
import { sanitizeRedirectPath } from '../config/roles.js';

const SESSION_COOKIE_NAME = 'labfis_session';
const OAUTH_STATE_COOKIE_NAME = 'labfis_oauth_state';
const SESSION_TTL_SECONDS = 86400;
const OAUTH_STATE_TTL_SECONDS = 600;

const COOKIE_BASE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax',
  path: '/',
};

/**
 * Parse raw Cookie request header into a key-value map.
 */
export function parseCookies(req) {
  const header = req.headers?.cookie;
  if (!header || typeof header !== 'string') {
    return {};
  }

  const cookies = {};
  for (const part of header.split(';')) {
    const eqIndex = part.indexOf('=');
    if (eqIndex <= 0) continue;

    const key = part.slice(0, eqIndex).trim();
    const rawValue = part.slice(eqIndex + 1).trim();
    if (!key) continue;

    try {
      cookies[key] = decodeURIComponent(rawValue);
    } catch {
      cookies[key] = rawValue;
    }
  }
  return cookies;
}

function createHmacSignature(encodedPayload) {
  return crypto
    .createHmac('sha256', config.sessionSecret)
    .update(encodedPayload)
    .digest('base64url');
}

/**
 * Sign a payload into an HMAC-SHA256 base64url token with an expiration timestamp.
 */
export function signToken(payload, ttlSeconds) {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const body = {
    ...payload,
    iat: nowSeconds,
    exp: nowSeconds + ttlSeconds,
  };
  const encodedPayload = Buffer.from(JSON.stringify(body), 'utf8').toString('base64url');
  const signature = createHmacSignature(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

/**
 * Verify an HMAC-SHA256 signed token and return its payload, or null if invalid/expired.
 */
export function verifyToken(token) {
  if (!token || typeof token !== 'string') {
    return null;
  }

  const dotIndex = token.indexOf('.');
  if (dotIndex <= 0 || dotIndex === token.length - 1) {
    return null;
  }

  const encodedPayload = token.slice(0, dotIndex);
  const providedSig = token.slice(dotIndex + 1);
  const expectedSig = createHmacSignature(encodedPayload);

  const providedBuf = Buffer.from(providedSig, 'utf8');
  const expectedBuf = Buffer.from(expectedSig, 'utf8');
  if (providedBuf.length !== expectedBuf.length) {
    return null;
  }
  if (!crypto.timingSafeEqual(providedBuf, expectedBuf)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
    if (!payload || typeof payload.exp !== 'number') {
      return null;
    }
    if (Math.floor(Date.now() / 1000) >= payload.exp) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

/**
 * Issue a signed HttpOnly session cookie for the authenticated user.
 */
export function setSessionCookie(res, user) {
  const token = signToken({ user }, SESSION_TTL_SECONDS);
  res.cookie(SESSION_COOKIE_NAME, token, {
    ...COOKIE_BASE_OPTIONS,
    maxAge: SESSION_TTL_SECONDS * 1000,
  });
}

/**
 * Read and verify the authenticated user from the request session cookie.
 */
export function getSessionUser(req) {
  const cookies = parseCookies(req);
  const payload = verifyToken(cookies[SESSION_COOKIE_NAME]);
  return payload?.user ?? null;
}

/**
 * Clear the active session cookie.
 */
export function clearSessionCookie(res) {
  res.clearCookie(SESSION_COOKIE_NAME, COOKIE_BASE_OPTIONS);
}

/**
 * Store a signed OAuth CSRF state cookie along with the sanitized post-login redirect path.
 */
export function setOAuthStateCookie(res, state, nextPath = '/') {
  const token = signToken(
    {
      state,
      next: sanitizeRedirectPath(nextPath),
    },
    OAUTH_STATE_TTL_SECONDS
  );
  res.cookie(OAUTH_STATE_COOKIE_NAME, token, {
    ...COOKIE_BASE_OPTIONS,
    maxAge: OAUTH_STATE_TTL_SECONDS * 1000,
  });
}

/**
 * Read, verify, and immediately clear the OAuth state cookie.
 */
export function consumeOAuthStateCookie(req, res) {
  const cookies = parseCookies(req);
  const token = cookies[OAUTH_STATE_COOKIE_NAME];
  res.clearCookie(OAUTH_STATE_COOKIE_NAME, COOKIE_BASE_OPTIONS);

  const payload = verifyToken(token);
  if (typeof payload?.state !== 'string') {
    return null;
  }

  return {
    state: payload.state,
    next: sanitizeRedirectPath(payload.next),
  };
}
