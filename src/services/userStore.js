import crypto from 'node:crypto';

const SCRYPT_KEYLEN = 64;

function hashPassword(plainPassword) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(plainPassword, salt, SCRYPT_KEYLEN).toString('hex');
  return { salt, hash: derivedKey };
}

function verifyPassword(plainPassword, salt, storedHashHex) {
  const derivedKey = crypto.scryptSync(plainPassword, salt, SCRYPT_KEYLEN);
  const storedBuffer = Buffer.from(storedHashHex, 'hex');
  if (derivedKey.length !== storedBuffer.length) {
    return false;
  }
  return crypto.timingSafeEqual(derivedKey, storedBuffer);
}

const SEED_ACCOUNTS = [
  {
    email: 'admin@labfis.ac.id',
    name: 'Dr. Ardiansyah Pratama',
    role: 'Kepala Laboratorium',
    credentials: hashPassword('LabFis2026!'),
  },
  {
    email: 'asisten@labfis.ac.id',
    name: 'Nadia Kusuma',
    role: 'Asisten Laboratorium',
    credentials: hashPassword('Asisten123!'),
  },
];

const USER_MAP = new Map(SEED_ACCOUNTS.map((account) => [account.email.toLowerCase(), account]));

/**
 * Authenticate a manual LabFis account with email and password.
 * Returns sanitized profile fields or null on failure.
 */
export function authenticateUser(email, password) {
  if (typeof email !== 'string' || typeof password !== 'string') {
    return null;
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !password) {
    return null;
  }

  const account = USER_MAP.get(normalizedEmail);
  if (!account) {
    return null;
  }

  const isValid = verifyPassword(password, account.credentials.salt, account.credentials.hash);
  if (!isValid) {
    return null;
  }

  return {
    email: account.email,
    name: account.name,
    role: account.role,
  };
}
