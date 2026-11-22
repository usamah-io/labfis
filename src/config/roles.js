export const SUPER_ADMIN_EMAIL = 'rafikawahyuni15@gmail.com';

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  USER: 'user',
};

export const ROLE_LABELS = {
  [ROLES.SUPER_ADMIN]: 'Super Admin',
  [ROLES.ADMIN]: 'Admin',
  [ROLES.USER]: 'User',
};

export const LOAN_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  DELAYED: 'delayed',
  REJECTED: 'rejected',
};

export const LOAN_STATUS_LABELS = {
  [LOAN_STATUS.PENDING]: 'Menunggu',
  [LOAN_STATUS.APPROVED]: 'Disetujui',
  [LOAN_STATUS.DELAYED]: 'Ditunda',
  [LOAN_STATUS.REJECTED]: 'Ditolak',
};

/**
 * Validate internal redirect paths to prevent open-redirect vulnerabilities.
 */
export function sanitizeRedirectPath(nextPath) {
  if (typeof nextPath !== 'string') {
    return '/';
  }

  const trimmed = nextPath.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.includes('\\')) {
    return '/';
  }

  try {
    const parsed = new URL(trimmed, 'http://localhost');
    if (parsed.origin !== 'http://localhost') {
      return '/';
    }
    if (parsed.pathname === '/login') {
      return '/';
    }
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return '/';
  }
}
