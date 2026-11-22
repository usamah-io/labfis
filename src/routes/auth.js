import crypto from 'node:crypto';
import { Router } from 'express';
import { config } from '../config/env.js';
import {
  buildGoogleAuthUrl,
  exchangeCodeForTokens,
  fetchGoogleUserProfile,
} from '../services/googleAuth.js';
import { isGmailConfigured, sendLoginNotification } from '../services/mailer.js';
import {
  clearSessionCookie,
  consumeOAuthStateCookie,
  getSessionUser,
  setOAuthStateCookie,
  setSessionCookie,
} from '../services/session.js';
import { authenticateUser } from '../services/userStore.js';

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
    return res.redirect('/?error=google_failed');
  }

  const state = crypto.randomBytes(24).toString('hex');
  setOAuthStateCookie(res, state);
  return res.redirect(buildGoogleAuthUrl(state));
});

router.get('/auth/google/callback', async (req, res) => {
  const expectedState = consumeOAuthStateCookie(req, res);

  if (req.query.error) {
    return res.redirect('/?error=google_cancelled');
  }

  const code = typeof req.query.code === 'string' ? req.query.code : '';
  const state = typeof req.query.state === 'string' ? req.query.state : '';

  if (!code || !statesMatch(state, expectedState)) {
    return res.redirect('/?error=invalid_state');
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    const profile = await fetchGoogleUserProfile(tokens.access_token);

    const sessionUser = {
      email: profile.email,
      name: profile.name,
      picture: profile.picture,
      role: 'Pengguna Google',
      provider: 'google',
      loginAt: new Date().toISOString(),
    };

    setSessionCookie(res, sessionUser);

    sendLoginNotification({
      to: sessionUser.email,
      name: sessionUser.name,
      provider: sessionUser.provider,
      loginAt: sessionUser.loginAt,
    }).catch((err) => {
      console.error('[LabFis Mailer] Error tak terduga:', err?.message || err);
    });

    return res.redirect('/dashboard');
  } catch (error) {
    console.error('[LabFis Auth] Google OAuth callback error:', error?.message || error);
    return res.redirect('/?error=google_failed');
  }
});

router.post('/api/auth/login', (req, res) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';

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
    ...user,
    provider: 'email',
    loginAt: new Date().toISOString(),
  };

  setSessionCookie(res, sessionUser);

  sendLoginNotification({
    to: sessionUser.email,
    name: sessionUser.name,
    provider: sessionUser.provider,
    loginAt: sessionUser.loginAt,
  }).catch((err) => {
    console.error('[LabFis Mailer] Error tak terduga:', err?.message || err);
  });

  return res.status(200).json({
    ok: true,
    redirect: '/dashboard',
    user: sessionUser,
    gmailConfigured: isGmailConfigured(),
  });
});

router.get('/api/auth/me', (req, res) => {
  const user = getSessionUser(req);
  if (!user) {
    return res.status(401).json({ authenticated: false });
  }

  return res.status(200).json({
    authenticated: true,
    user,
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
  });
});

export default router;
