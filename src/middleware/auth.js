import { findUserByEmail } from '../services/db.js';
import { clearSessionCookie, getSessionUser } from '../services/session.js';

/**
 * Attach live user data (including latest role from DB) to req.user when session cookie is valid.
 */
export function attachCurrentUser(req, res, next) {
  const sessionUser = getSessionUser(req);
  if (!sessionUser?.email) {
    req.user = null;
    return next();
  }

  const liveUser = findUserByEmail(sessionUser.email);
  if (!liveUser) {
    clearSessionCookie(res);
    req.user = null;
    return next();
  }

  req.user = {
    ...liveUser,
    provider: sessionUser.provider || liveUser.provider,
    loginAt: sessionUser.loginAt || null,
  };
  return next();
}

/**
 * Redirect unauthenticated browser requests to /login?next=<originalUrl>.
 */
export function requireAuthPage(req, res, next) {
  if (!req.user) {
    const nextUrl = encodeURIComponent(req.originalUrl || '/pinjam');
    return res.redirect(`/login?next=${nextUrl}`);
  }
  return next();
}

/**
 * Reject unauthenticated API calls with 401 and login redirect metadata.
 */
export function requireAuthApi(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      ok: false,
      requireLogin: true,
      loginUrl: '/login?next=%2Fpinjam',
      message: 'Silakan login terlebih dahulu.',
    });
  }
  return next();
}

/**
 * Enforce role-based authorization on API endpoints.
 */
export function requireRoles(allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        ok: false,
        message: 'Anda tidak memiliki hak akses untuk tindakan ini.',
      });
    }
    return next();
  };
}
