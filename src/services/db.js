import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {
  LOAN_STATUS,
  ROLE_LABELS,
  ROLES,
  SUPER_ADMIN_EMAIL,
} from '../config/roles.js';

const IS_VERCEL = Boolean(process.env.VERCEL);
const SEED_DATA_DIR = path.join(process.cwd(), 'data');
const RUNTIME_DATA_DIR = IS_VERCEL ? path.join('/tmp', 'labfis-data') : SEED_DATA_DIR;

const SEED_DB_PATH = path.join(SEED_DATA_DIR, 'db.json');
const SEED_EQUIPMENT_PATH = path.join(SEED_DATA_DIR, 'equipment.json');
const DB_PATH = path.join(RUNTIME_DATA_DIR, 'db.json');
const EQUIPMENT_PATH = path.join(RUNTIME_DATA_DIR, 'equipment.json');

export const DEFAULT_EQUIPMENT_IMAGE = '/images/alat/placeholder.svg';

const SCRYPT_KEYLEN = 64;

function createHttpError(statusCode, message) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

function hashPassword(plainPassword) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(plainPassword, salt, SCRYPT_KEYLEN).toString('hex');
  return { salt, hash };
}

function verifyPassword(plainPassword, salt, storedHashHex) {
  if (!salt || !storedHashHex) {
    return false;
  }
  const derivedKey = crypto.scryptSync(plainPassword, salt, SCRYPT_KEYLEN);
  const storedBuffer = Buffer.from(storedHashHex, 'hex');
  if (derivedKey.length !== storedBuffer.length) {
    return false;
  }
  return crypto.timingSafeEqual(derivedKey, storedBuffer);
}

export function sanitizeImageUrl(url) {
  if (typeof url !== 'string') {
    return DEFAULT_EQUIPMENT_IMAGE;
  }
  const trimmed = url.trim();
  if (!trimmed || trimmed.includes('..') || trimmed.includes('\\')) {
    return DEFAULT_EQUIPMENT_IMAGE;
  }
  if (
    trimmed.startsWith('/images/') ||
    trimmed.startsWith('/api/uploads/') ||
    trimmed.startsWith('https://')
  ) {
    return trimmed;
  }
  return DEFAULT_EQUIPMENT_IMAGE;
}

function createInitialDbData() {
  const now = new Date().toISOString();
  return {
    users: [
      {
        id: 'usr-super-admin',
        name: 'Rafika Wahyuni',
        email: SUPER_ADMIN_EMAIL,
        role: ROLES.SUPER_ADMIN,
        provider: 'both',
        picture: null,
        credentials: hashPassword('SuperAdmin2026!'),
        createdAt: now,
      },
    ],
    loans: [],
  };
}

function createInitialEquipmentData() {
  return {
    items: [],
  };
}

let dbCache = null;
let equipmentCache = null;

function atomicWriteJson(filePath, payload) {
  try {
    fs.mkdirSync(RUNTIME_DATA_DIR, { recursive: true });
    const tempPath = `${filePath}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(payload, null, 2), 'utf8');
    fs.renameSync(tempPath, filePath);
  } catch (error) {
    console.error('[LabFis DB] Gagal menulis ke filesystem:', error?.message || error);
  }
}

function copySeedIfNeeded(seedPath, runtimePath) {
  try {
    if (!fs.existsSync(runtimePath) && fs.existsSync(seedPath)) {
      fs.mkdirSync(path.dirname(runtimePath), { recursive: true });
      fs.copyFileSync(seedPath, runtimePath);
    }
  } catch (error) {
    console.warn('[LabFis DB] Gagal menyalin seed ke /tmp:', error?.message || error);
  }
}

function persistDb(state) {
  atomicWriteJson(DB_PATH, state);
}

function persistEquipment(state) {
  atomicWriteJson(EQUIPMENT_PATH, state);
}

function ensureSuperAdminInvariant(state) {
  let changed = false;
  const targetEmail = SUPER_ADMIN_EMAIL.toLowerCase();
  const existing = state.users.find((u) => u.email.toLowerCase() === targetEmail);

  if (!existing) {
    state.users.unshift({
      id: 'usr-super-admin',
      name: 'Rafika Wahyuni',
      email: SUPER_ADMIN_EMAIL,
      role: ROLES.SUPER_ADMIN,
      provider: 'both',
      picture: null,
      credentials: hashPassword('SuperAdmin2026!'),
      createdAt: new Date().toISOString(),
    });
    changed = true;
  } else if (existing.role !== ROLES.SUPER_ADMIN) {
    existing.role = ROLES.SUPER_ADMIN;
    changed = true;
  }

  return changed;
}

function normalizeEquipmentItem(raw) {
  if (!raw || typeof raw !== 'object') return null;
  return {
    ...raw,
    imageUrl: sanitizeImageUrl(raw.imageUrl),
  };
}

/**
 * Initialize and load users/loans (db.json) and equipment catalog (equipment.json).
 */
export function initDb() {
  try {
    fs.mkdirSync(RUNTIME_DATA_DIR, { recursive: true });
  } catch (error) {
    console.warn('[LabFis DB] Tidak dapat membuat direktori data:', error?.message || error);
  }

  if (IS_VERCEL) {
    copySeedIfNeeded(SEED_DB_PATH, DB_PATH);
    copySeedIfNeeded(SEED_EQUIPMENT_PATH, EQUIPMENT_PATH);
  }

  if (!dbCache) {
    const readPath = fs.existsSync(DB_PATH)
      ? DB_PATH
      : fs.existsSync(SEED_DB_PATH)
        ? SEED_DB_PATH
        : null;

    if (!readPath) {
      dbCache = createInitialDbData();
      persistDb(dbCache);
    } else {
      try {
        const raw = fs.readFileSync(readPath, 'utf8');
        const parsed = JSON.parse(raw);
        dbCache = {
          users: Array.isArray(parsed?.users) ? parsed.users : [],
          loans: Array.isArray(parsed?.loans) ? parsed.loans : [],
        };
        if (ensureSuperAdminInvariant(dbCache)) {
          persistDb(dbCache);
        }
      } catch (error) {
        console.warn('[LabFis DB] Gagal membaca db.json, membuat ulang seed bersih:', error?.message);
        dbCache = createInitialDbData();
        persistDb(dbCache);
      }
    }
  }

  if (!equipmentCache) {
    const readEqPath = fs.existsSync(EQUIPMENT_PATH)
      ? EQUIPMENT_PATH
      : fs.existsSync(SEED_EQUIPMENT_PATH)
        ? SEED_EQUIPMENT_PATH
        : null;

    if (!readEqPath) {
      equipmentCache = createInitialEquipmentData();
      persistEquipment(equipmentCache);
    } else {
      try {
        const rawEq = fs.readFileSync(readEqPath, 'utf8');
        const parsedEq = JSON.parse(rawEq);
        equipmentCache = {
          items: Array.isArray(parsedEq?.items)
            ? parsedEq.items.map(normalizeEquipmentItem).filter(Boolean)
            : [],
        };
      } catch (error) {
        console.warn('[LabFis DB] Gagal membaca equipment.json, membuat ulang kosong:', error?.message);
        equipmentCache = createInitialEquipmentData();
        persistEquipment(equipmentCache);
      }
    }
  }

  return { db: dbCache, equipment: equipmentCache };
}

function getDb() {
  if (!dbCache) initDb();
  return dbCache;
}

function getEquipment() {
  if (!equipmentCache) initDb();
  return equipmentCache;
}

export function sanitizeUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    roleLabel: ROLE_LABELS[user.role] || 'User',
    provider: user.provider || 'email',
    picture: user.picture || null,
    createdAt: user.createdAt,
    isPrimarySuperAdmin: user.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase(),
  };
}

/* ==================== USER REPOSITORY ==================== */

export function listUsers() {
  const db = getDb();
  const rank = { [ROLES.SUPER_ADMIN]: 0, [ROLES.ADMIN]: 1, [ROLES.USER]: 2 };
  return [...db.users]
    .sort((a, b) => (rank[a.role] ?? 9) - (rank[b.role] ?? 9) || a.name.localeCompare(b.name))
    .map(sanitizeUser);
}

export function findUserById(id) {
  const db = getDb();
  return sanitizeUser(db.users.find((u) => u.id === id));
}

export function findUserByEmail(email) {
  if (typeof email !== 'string') return null;
  const normalized = email.trim().toLowerCase();
  const db = getDb();
  return sanitizeUser(db.users.find((u) => u.email.toLowerCase() === normalized));
}

export function authenticateUser(email, password) {
  if (typeof email !== 'string' || typeof password !== 'string') {
    return null;
  }
  const normalized = email.trim().toLowerCase();
  if (!normalized || !password) {
    return null;
  }

  const db = getDb();
  const user = db.users.find((u) => u.email.toLowerCase() === normalized);
  if (!user || !user.credentials) {
    return null;
  }

  const ok = verifyPassword(password, user.credentials.salt, user.credentials.hash);
  return ok ? sanitizeUser(user) : null;
}

/**
 * Create or update a Google OAuth user.
 * rafikawahyuni15@gmail.com is ALWAYS assigned Super Admin; new users default to User.
 */
export function upsertGoogleUser({ email, name, picture }) {
  const normalized = String(email || '').trim().toLowerCase();
  if (!normalized) {
    throw createHttpError(400, 'Email Google tidak valid.');
  }

  const db = getDb();
  const isSuperAdmin = normalized === SUPER_ADMIN_EMAIL.toLowerCase();
  const existing = db.users.find((u) => u.email.toLowerCase() === normalized);

  if (existing) {
    if (name && (!existing.name || existing.provider === 'google')) {
      existing.name = name.trim();
    }
    if (picture) {
      existing.picture = picture;
    }
    if (existing.provider === 'email') {
      existing.provider = 'both';
    }
    if (isSuperAdmin) {
      existing.role = ROLES.SUPER_ADMIN;
    }
    persistDb(db);
    return sanitizeUser(existing);
  }

  const newUser = {
    id: `usr-${crypto.randomUUID().slice(0, 8)}`,
    name: (name || normalized.split('@')[0]).trim(),
    email: normalized,
    role: isSuperAdmin ? ROLES.SUPER_ADMIN : ROLES.USER,
    provider: 'google',
    picture: picture || null,
    credentials: null,
    createdAt: new Date().toISOString(),
  };

  db.users.push(newUser);
  persistDb(db);
  return sanitizeUser(newUser);
}

export function createUser({ name, email, role, password }) {
  const cleanName = typeof name === 'string' ? name.trim() : '';
  const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

  if (!cleanName || !cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    throw createHttpError(400, 'Nama dan format email valid wajib diisi.');
  }

  if (role !== ROLES.ADMIN && role !== ROLES.USER) {
    throw createHttpError(400, 'Role hanya dapat dipilih sebagai Admin atau User.');
  }

  const db = getDb();
  if (db.users.some((u) => u.email.toLowerCase() === cleanEmail)) {
    throw createHttpError(409, 'Email tersebut sudah terdaftar.');
  }

  const cleanPassword = typeof password === 'string' ? password : '';
  if (cleanPassword && cleanPassword.length < 6) {
    throw createHttpError(400, 'Password minimal 6 karakter (atau kosongkan untuk akun Google).');
  }

  const finalRole = cleanEmail === SUPER_ADMIN_EMAIL.toLowerCase() ? ROLES.SUPER_ADMIN : role;
  const newUser = {
    id: `usr-${crypto.randomUUID().slice(0, 8)}`,
    name: cleanName,
    email: cleanEmail,
    role: finalRole,
    provider: cleanPassword ? 'email' : 'google',
    picture: null,
    credentials: cleanPassword ? hashPassword(cleanPassword) : null,
    createdAt: new Date().toISOString(),
  };

  db.users.push(newUser);
  persistDb(db);
  return sanitizeUser(newUser);
}

export function updateUserRole(id, newRole, actorId) {
  if (newRole !== ROLES.ADMIN && newRole !== ROLES.USER) {
    throw createHttpError(400, 'Role hanya dapat diubah menjadi Admin atau User.');
  }

  const db = getDb();
  const target = db.users.find((u) => u.id === id);
  if (!target) {
    throw createHttpError(404, 'Pengguna tidak ditemukan.');
  }

  if (target.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
    throw createHttpError(403, 'Role Super Admin utama tidak dapat diubah.');
  }

  if (target.id === actorId) {
    throw createHttpError(400, 'Anda tidak dapat mengubah role akun Anda sendiri.');
  }

  target.role = newRole;
  persistDb(db);
  return sanitizeUser(target);
}

export function deleteUser(id, actorId) {
  const db = getDb();
  const index = db.users.findIndex((u) => u.id === id);
  if (index === -1) {
    throw createHttpError(404, 'Pengguna tidak ditemukan.');
  }

  const target = db.users[index];
  if (target.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
    throw createHttpError(403, 'Akun Super Admin utama tidak dapat dihapus.');
  }

  if (target.id === actorId) {
    throw createHttpError(400, 'Anda tidak dapat menghapus akun Anda sendiri.');
  }

  db.users.splice(index, 1);
  persistDb(db);
  return sanitizeUser(target);
}

export function getAdminAndSuperAdminEmails() {
  const db = getDb();
  const emails = new Set([SUPER_ADMIN_EMAIL.toLowerCase()]);
  for (const user of db.users) {
    if (user.role === ROLES.SUPER_ADMIN || user.role === ROLES.ADMIN) {
      emails.add(user.email.toLowerCase());
    }
  }
  return Array.from(emails);
}

/* ==================== INVENTORY REPOSITORY (data/equipment.json) ==================== */

export function listInventory({ type, category, q } = {}) {
  const equipment = getEquipment();
  let items = [...equipment.items];

  if (type === 'alat' || type === 'bahan') {
    items = items.filter((item) => item.type === type);
  }

  if (typeof category === 'string' && category.trim() && category !== 'all') {
    const cat = category.trim().toLowerCase();
    items = items.filter((item) => String(item.category || '').toLowerCase() === cat);
  }

  if (typeof q === 'string' && q.trim()) {
    const keyword = q.trim().toLowerCase();
    items = items.filter((item) =>
      [item.code, item.name, item.category, item.location, item.description]
        .filter(Boolean)
        .some((val) => val.toLowerCase().includes(keyword))
    );
  }

  const alatItems = equipment.items.filter((i) => i.type === 'alat');
  const bahanItems = equipment.items.filter((i) => i.type === 'bahan');

  return {
    items,
    summary: {
      totalAlatTypes: alatItems.length,
      totalBahanTypes: bahanItems.length,
      totalAvailableUnits: equipment.items.reduce((sum, i) => sum + Number(i.availableStock || 0), 0),
      totalUnits: equipment.items.reduce((sum, i) => sum + Number(i.totalStock || 0), 0),
    },
  };
}

export function findInventoryById(id) {
  const equipment = getEquipment();
  return equipment.items.find((item) => item.id === id) || null;
}

export function createInventoryItem(data) {
  const type = data?.type === 'bahan' ? 'bahan' : data?.type === 'alat' ? 'alat' : null;
  const name = typeof data?.name === 'string' ? data.name.trim() : '';
  const category = typeof data?.category === 'string' ? data.category.trim() : 'Umum';
  const location = typeof data?.location === 'string' ? data.location.trim() : 'Lab Fisika';
  const condition = typeof data?.condition === 'string' && data.condition.trim() ? data.condition.trim() : 'Baik';
  const unit = typeof data?.unit === 'string' && data.unit.trim() ? data.unit.trim() : 'unit';
  const description = typeof data?.description === 'string' ? data.description.trim() : '';
  const imageUrl = sanitizeImageUrl(data?.imageUrl);
  const totalStock = Number(data?.totalStock);
  const availableStock =
    data?.availableStock === undefined || data?.availableStock === ''
      ? totalStock
      : Number(data.availableStock);

  if (!type || !name) {
    throw createHttpError(400, 'Tipe (alat/bahan) dan nama barang wajib diisi.');
  }
  if (!Number.isInteger(totalStock) || totalStock < 0) {
    throw createHttpError(400, 'Total stok harus berupa bilangan bulat >= 0.');
  }
  if (!Number.isInteger(availableStock) || availableStock < 0 || availableStock > totalStock) {
    throw createHttpError(400, 'Stok tersedia harus di antara 0 dan total stok.');
  }

  const equipment = getEquipment();
  const prefix = type === 'alat' ? 'ALT' : 'BHN';
  let code = typeof data?.code === 'string' ? data.code.trim().toUpperCase() : '';
  if (!code) {
    const count = equipment.items.filter((i) => i.type === type).length + 1;
    code = `${prefix}-${String(count).padStart(3, '0')}`;
    while (equipment.items.some((i) => i.code.toUpperCase() === code)) {
      code = `${prefix}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    }
  } else if (equipment.items.some((i) => i.code.toUpperCase() === code)) {
    throw createHttpError(409, `Kode barang ${code} sudah digunakan.`);
  }

  const now = new Date().toISOString();
  const item = {
    id: `${type === 'alat' ? 'alt' : 'bhn'}-${crypto.randomUUID().slice(0, 8)}`,
    code,
    name,
    type,
    category: category || 'Umum',
    location: location || 'Lab Fisika',
    condition,
    unit,
    totalStock,
    availableStock,
    description,
    imageUrl,
    updatedAt: now,
  };

  equipment.items.push(item);
  persistEquipment(equipment);
  return item;
}

export function updateInventoryItem(id, data) {
  const equipment = getEquipment();
  const item = equipment.items.find((i) => i.id === id);
  if (!item) {
    throw createHttpError(404, 'Item inventaris tidak ditemukan.');
  }

  if (typeof data?.code === 'string' && data.code.trim()) {
    const nextCode = data.code.trim().toUpperCase();
    if (equipment.items.some((i) => i.id !== id && i.code.toUpperCase() === nextCode)) {
      throw createHttpError(409, `Kode barang ${nextCode} sudah digunakan.`);
    }
    item.code = nextCode;
  }

  if (typeof data?.name === 'string' && data.name.trim()) {
    item.name = data.name.trim();
  }
  if (data?.type === 'alat' || data?.type === 'bahan') {
    item.type = data.type;
  }
  if (typeof data?.category === 'string') {
    item.category = data.category.trim() || item.category;
  }
  if (typeof data?.location === 'string') {
    item.location = data.location.trim() || item.location;
  }
  if (typeof data?.condition === 'string') {
    item.condition = data.condition.trim() || item.condition;
  }
  if (typeof data?.unit === 'string') {
    item.unit = data.unit.trim() || item.unit;
  }
  if (typeof data?.description === 'string') {
    item.description = data.description.trim();
  }
  if (data?.imageUrl !== undefined) {
    item.imageUrl = sanitizeImageUrl(data.imageUrl);
  }

  const nextTotal =
    data?.totalStock !== undefined && data?.totalStock !== ''
      ? Number(data.totalStock)
      : item.totalStock;
  const nextAvailable =
    data?.availableStock !== undefined && data?.availableStock !== ''
      ? Number(data.availableStock)
      : Math.min(item.availableStock, nextTotal);

  if (!Number.isInteger(nextTotal) || nextTotal < 0) {
    throw createHttpError(400, 'Total stok harus berupa bilangan bulat >= 0.');
  }
  if (!Number.isInteger(nextAvailable) || nextAvailable < 0 || nextAvailable > nextTotal) {
    throw createHttpError(400, 'Stok tersedia harus di antara 0 dan total stok.');
  }

  item.totalStock = nextTotal;
  item.availableStock = nextAvailable;
  item.updatedAt = new Date().toISOString();
  persistEquipment(equipment);
  return item;
}

export function deleteInventoryItem(id) {
  const equipment = getEquipment();
  const index = equipment.items.findIndex((i) => i.id === id);
  if (index === -1) {
    throw createHttpError(404, 'Item inventaris tidak ditemukan.');
  }

  const [removed] = equipment.items.splice(index, 1);
  persistEquipment(equipment);
  return removed;
}

/* ==================== LOAN REPOSITORY ==================== */

export function listLoans({ email } = {}) {
  const db = getDb();
  let loans = [...db.loans];
  if (typeof email === 'string' && email.trim()) {
    const normalized = email.trim().toLowerCase();
    loans = loans.filter((l) => l.borrowerEmail.toLowerCase() === normalized);
  }
  return loans.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function findLoanById(id) {
  const db = getDb();
  return db.loans.find((l) => l.id === id) || null;
}

export function createLoan({
  borrower,
  borrowerName,
  phone,
  items,
  borrowDate,
  returnDate,
  purpose,
}) {
  const cleanName = typeof borrowerName === 'string' && borrowerName.trim()
    ? borrowerName.trim()
    : borrower?.name;
  const cleanPhone = typeof phone === 'string' ? phone.trim() : '';
  const cleanPurpose = typeof purpose === 'string' ? purpose.trim() : '';
  const cleanBorrowDate = typeof borrowDate === 'string' ? borrowDate.trim() : '';
  const cleanReturnDate = typeof returnDate === 'string' ? returnDate.trim() : '';

  if (!cleanName || !cleanPhone || !cleanBorrowDate || !cleanReturnDate || !cleanPurpose) {
    throw createHttpError(400, 'Nama peminjam, No. HP, jadwal pinjam/kembali, dan keperluan wajib diisi.');
  }

  if (cleanReturnDate < cleanBorrowDate) {
    throw createHttpError(400, 'Tanggal kembali tidak boleh lebih awal dari tanggal pinjam.');
  }

  if (!Array.isArray(items) || items.length === 0) {
    throw createHttpError(400, 'Pilih minimal 1 alat atau bahan yang akan dipinjam.');
  }

  const db = getDb();
  const equipment = getEquipment();
  const merged = new Map();
  for (const entry of items) {
    const itemId = typeof entry?.itemId === 'string' ? entry.itemId.trim() : '';
    const qty = Number(entry?.qty);
    if (!itemId || !Number.isInteger(qty) || qty < 1) {
      throw createHttpError(400, 'Setiap barang harus memiliki jumlah minimal 1.');
    }
    merged.set(itemId, (merged.get(itemId) || 0) + qty);
  }

  const resolvedItems = [];
  for (const [itemId, qty] of merged.entries()) {
    const inv = equipment.items.find((i) => i.id === itemId);
    if (!inv) {
      throw createHttpError(404, 'Salah satu barang yang dipilih tidak ditemukan.');
    }
    if (qty > inv.availableStock) {
      throw createHttpError(
        400,
        `Jumlah "${inv.name}" melebihi stok tersedia (${inv.availableStock} ${inv.unit}).`
      );
    }
    resolvedItems.push({
      itemId: inv.id,
      code: inv.code,
      name: inv.name,
      type: inv.type,
      unit: inv.unit,
      qty,
    });
  }

  const loan = {
    id: `loan-${crypto.randomUUID().slice(0, 8)}`,
    code: `PJM-${String(db.loans.length + 1).padStart(3, '0')}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`,
    borrowerId: borrower.id,
    borrowerName: cleanName,
    borrowerEmail: borrower.email,
    phone: cleanPhone,
    items: resolvedItems,
    borrowDate: cleanBorrowDate,
    returnDate: cleanReturnDate,
    purpose: cleanPurpose,
    status: LOAN_STATUS.PENDING,
    adminNote: '',
    reviewedByName: null,
    reviewedByEmail: null,
    reviewedByRole: null,
    reviewedAt: null,
    createdAt: new Date().toISOString(),
  };

  db.loans.unshift(loan);
  persistDb(db);
  return loan;
}

export function updateLoanStatus(id, { status, adminNote, reviewer }) {
  const validStatuses = [LOAN_STATUS.APPROVED, LOAN_STATUS.DELAYED, LOAN_STATUS.REJECTED];
  if (!validStatuses.includes(status)) {
    throw createHttpError(400, 'Status peminjaman harus Setujui, Tunda, atau Tolak.');
  }

  const db = getDb();
  const equipment = getEquipment();
  const loan = db.loans.find((l) => l.id === id);
  if (!loan) {
    throw createHttpError(404, 'Data peminjaman tidak ditemukan.');
  }

  const prevStatus = loan.status;
  let stockChanged = false;

  if (prevStatus !== LOAN_STATUS.APPROVED && status === LOAN_STATUS.APPROVED) {
    for (const entry of loan.items) {
      const inv = equipment.items.find((i) => i.id === entry.itemId);
      if (!inv) {
        throw createHttpError(404, `Barang ${entry.name} tidak lagi tersedia di inventaris.`);
      }
      if (inv.availableStock < entry.qty) {
        throw createHttpError(
          400,
          `Stok "${inv.name}" tidak mencukupi untuk disetujui (tersedia ${inv.availableStock} ${inv.unit}, diminta ${entry.qty}).`
        );
      }
    }
    for (const entry of loan.items) {
      const inv = equipment.items.find((i) => i.id === entry.itemId);
      inv.availableStock -= entry.qty;
    }
    stockChanged = true;
  } else if (prevStatus === LOAN_STATUS.APPROVED && status !== LOAN_STATUS.APPROVED) {
    for (const entry of loan.items) {
      const inv = equipment.items.find((i) => i.id === entry.itemId);
      if (inv) {
        inv.availableStock = Math.min(inv.totalStock, inv.availableStock + entry.qty);
        stockChanged = true;
      }
    }
  }

  loan.status = status;
  loan.adminNote = typeof adminNote === 'string' ? adminNote.trim() : '';
  loan.reviewedByName = reviewer.name;
  loan.reviewedByEmail = reviewer.email;
  loan.reviewedByRole = ROLE_LABELS[reviewer.role] || reviewer.role;
  loan.reviewedAt = new Date().toISOString();

  if (stockChanged) {
    persistEquipment(equipment);
  }
  persistDb(db);
  return loan;
}
