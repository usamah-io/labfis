import crypto from 'node:crypto';
import { Router } from 'express';
import { config } from '../config/env.js';
import { sanitizeRedirectPath, SUPER_ADMIN_EMAIL } from '../config/roles.js';
import {
  buildGoogleAuthUrl,
  exchangeCodeForTokens,
  fetchGoogleUserProfile,
} from '../services/googleAuth.js';
import { isGmailConfigured } from '../services/mailer.js';
import {
  clearSessionCookie,
  consumeOAuthStateCookie,
  setOAuthStateCookie,
  setSessionCookie,
} from '../services/session.js';
import { authenticateUser, upsertGoogleUser } from '../services/userStore.js';

const router = Router();

function statesMatch(receivedState, expectedState) {
  if (typeof receivedState !== 'string' || typeof expectedState !== 'string') {
    return false;
  }
  const receivedBuf = Buffer.from(receivedState, 'utf8');
  const expectedBuf = Buffer.from(expectedState, 'utf8');
  if (receivedBuf.length === 0 || receivedBuf.length !== expectedBuf.length) {
    return false;
  }
  return crypto.timingSafeEqual(receivedBuf, expectedBuf);
}

router.get('/auth/google', (req, res) => {
  if (!config.googleClientId || !config.googleClientSecret) {
    return res.redirect('/login?error=google_failed');
  }

  const nextPath = sanitizeRedirectPath(req.query.next);
  const state = crypto.randomBytes(24).toString('hex');
  setOAuthStateCookie(res, state, nextPath);
  return res.redirect(buildGoogleAuthUrl(state));
});

async function handleGoogleCallback(req, res) {
  const consumed = consumeOAuthStateCookie(req, res);

  if (req.query.error) {
    return res.redirect('/login?error=google_cancelled');
  }

  const code = typeof req.query.code === 'string' ? req.query.code : '';
  const state = typeof req.query.state === 'string' ? req.query.state : '';

  if (!code || !consumed || !statesMatch(state, consumed.state)) {
    return res.redirect('/login?error=invalid_state');
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    const profile = await fetchGoogleUserProfile(tokens.access_token);
    const dbUser = upsertGoogleUser(profile);

    const sessionUser = {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      role: dbUser.role,
      roleLabel: dbUser.roleLabel,
      picture: dbUser.picture,
      provider: 'google',
      loginAt: new Date().toISOString(),
    };

    setSessionCookie(res, sessionUser);
    return res.redirect(consumed.next || '/');
  } catch (error) {
    console.error('[LabFis Auth] Google OAuth callback error:', error?.message || error);
    return res.redirect('/login?error=google_failed');
  }
}

router.get('/auth/callback/google', handleGoogleCallback);
router.get('/auth/google/callback', handleGoogleCallback);

router.post('/api/auth/login', (req, res) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  const nextPath = sanitizeRedirectPath(req.body?.next);

  if (!email || !password) {
    return res.status(400).json({
      ok: false,
      message: 'Email dan password wajib diisi.',
    });
  }

  const user = authenticateUser(email, password);
  if (!user) {
    return res.status(401).json({
      ok: false,
      message: 'Email atau password tidak valid.',
    });
  }

  const sessionUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    roleLabel: user.roleLabel,
    picture: user.picture,
    provider: 'email',
    loginAt: new Date().toISOString(),
  };

  setSessionCookie(res, sessionUser);

  return res.status(200).json({
    ok: true,
    redirect: nextPath,
    user: sessionUser,
    gmailConfigured: isGmailConfigured(),
  });
});

router.get('/api/auth/me', (req, res) => {
  return res.status(200).json({
    authenticated: Boolean(req.user),
    user: req.user || null,
    gmailConfigured: isGmailConfigured(),
  });
});

router.post('/api/auth/logout', (req, res) => {
  clearSessionCookie(res);
  return res.status(200).json({ ok: true });
});

router.get('/api/health', (req, res) => {
  return res.status(200).json({
    ok: true,
    googleOAuthConfigured: Boolean(config.googleClientId && config.googleClientSecret),
    gmailConfigured: isGmailConfigured(),
    superAdminEmail: SUPER_ADMIN_EMAIL,
  });
});

export default router;
