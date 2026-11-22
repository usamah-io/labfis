(() => {
  const SUPER_ADMIN_EMAIL = 'rafikawahyuni15@gmail.com';
  const STATUS_LABELS = {
    pending: 'Menunggu',
    approved: 'Disetujui',
    delayed: 'Ditunda',
    rejected: 'Ditolak',
  };

  const state = {
    user: null,
    gmailConfigured: false,
    items: [],
    summary: { totalAlatTypes: 0, totalBahanTypes: 0, totalAvailableUnits: 0 },
    loans: [],
    myLoans: [],
    users: [],
    activeTab: 'dashboard',
    loanFilter: 'all',
    preselectItemId: null,
    detailItem: null,
  };

  const els = {
    toast: document.getElementById('portal-toast'),
    toastTitle: document.getElementById('portal-toast-title'),
    toastMessage: document.getElementById('portal-toast-message'),
    toastClose: document.getElementById('portal-toast-close'),
    navTabs: Array.from(document.querySelectorAll('.nav-tab')),
    bottomNavItems: Array.from(document.querySelectorAll('.bottom-nav-item')),
    mobileBottomNav: document.getElementById('mobile-bottom-nav'),
    navPeminjamanBtn: document.getElementById('nav-peminjaman-btn'),
    navUsersBtn: document.getElementById('nav-users-btn'),
    navProfilBtn: document.getElementById('nav-profil-btn'),
    navLoginLink: document.getElementById('nav-login-link'),
    navUserBox: document.getElementById('nav-user-box'),
    navAvatarBtn: document.getElementById('nav-avatar-btn'),
    navUserName: document.getElementById('nav-user-name'),
    navUserRole: document.getElementById('nav-user-role'),
    navLogoutBtn: document.getElementById('nav-logout-btn'),
    views: {
      dashboard: document.getElementById('view-dashboard'),
      alat: document.getElementById('view-alat'),
      bahan: document.getElementById('view-bahan'),
      pinjam: document.getElementById('view-pinjam'),
      peminjaman: document.getElementById('view-peminjaman'),
      profil: document.getElementById('view-profil'),
      users: document.getElementById('view-users'),
    },
    statAlat: document.getElementById('stat-alat-count'),
    statBahan: document.getElementById('stat-bahan-count'),
    statUnits: document.getElementById('stat-unit-count'),
    statRoleLabel: document.getElementById('stat-role-label'),
    statRoleSub: document.getElementById('stat-role-sub'),
    alatPreview: document.getElementById('dashboard-alat-preview'),
    bahanPreview: document.getElementById('dashboard-bahan-preview'),
    searchAlat: document.getElementById('search-alat'),
    searchBahan: document.getElementById('search-bahan'),
    addAlatBtn: document.getElementById('add-alat-btn'),
    addBahanBtn: document.getElementById('add-bahan-btn'),
    alatBody: document.getElementById('alat-table-body'),
    bahanBody: document.getElementById('bahan-table-body'),
    alatMobileGrid: document.getElementById('alat-mobile-grid'),
    bahanMobileGrid: document.getElementById('bahan-mobile-grid'),
    loanForm: document.getElementById('loan-form'),
    loanName: document.getElementById('loan-name'),
    loanEmail: document.getElementById('loan-email'),
    loanPhone: document.getElementById('loan-phone'),
    loanBorrowDate: document.getElementById('loan-borrow-date'),
    loanReturnDate: document.getElementById('loan-return-date'),
    loanItemsContainer: document.getElementById('loan-items-container'),
    addLoanItemBtn: document.getElementById('add-loan-item-btn'),
    loanPurpose: document.getElementById('loan-purpose'),
    submitLoanBtn: document.getElementById('submit-loan-btn'),
    loanSubmitFeedback: document.getElementById('loan-submit-feedback'),
    peminjamanTitle: document.getElementById('peminjaman-title'),
    peminjamanSubtitle: document.getElementById('peminjaman-subtitle'),
    smtpTestBar: document.getElementById('smtp-test-bar'),
    smtpStatusBadge: document.getElementById('smtp-status-badge'),
    smtpTestEmail: document.getElementById('smtp-test-email'),
    smtpTestBtn: document.getElementById('smtp-test-btn'),
    loanStatusFeedback: document.getElementById('loan-status-feedback'),
    loanFilterBar: document.getElementById('loan-filter-bar'),
    loansList: document.getElementById('loans-list'),
    profileAvatar: document.getElementById('profile-avatar'),
    profileName: document.getElementById('profile-name'),
    profileEmail: document.getElementById('profile-email'),
    profileRoleBadge: document.getElementById('profile-role-badge'),
    profileProviderBadge: document.getElementById('profile-provider-badge'),
    profileManageUsersBtn: document.getElementById('profile-manage-users-btn'),
    profileManageLoansBtn: document.getElementById('profile-manage-loans-btn'),
    profileLogoutBtn: document.getElementById('profile-logout-btn'),
    profileNewLoanBtn: document.getElementById('profile-new-loan-btn'),
    profStatTotal: document.getElementById('prof-stat-total'),
    profStatApproved: document.getElementById('prof-stat-approved'),
    profStatPending: document.getElementById('prof-stat-pending'),
    profStatRejected: document.getElementById('prof-stat-rejected'),
    profileLoansList: document.getElementById('profile-loans-list'),
    userSummaryPills: document.getElementById('user-summary-pills'),
    createUserForm: document.getElementById('create-user-form'),
    newUserName: document.getElementById('new-user-name'),
    newUserEmail: document.getElementById('new-user-email'),
    newUserRole: document.getElementById('new-user-role'),
    newUserPassword: document.getElementById('new-user-password'),
    createUserBtn: document.getElementById('create-user-btn'),
    usersBody: document.getElementById('users-table-body'),
    itemDetailModal: document.getElementById('item-detail-modal'),
    detailCode: document.getElementById('detail-code'),
    detailTitle: document.getElementById('detail-modal-title'),
    detailCategory: document.getElementById('detail-category'),
    detailLocation: document.getElementById('detail-location'),
    detailCondition: document.getElementById('detail-condition'),
    detailStock: document.getElementById('detail-stock'),
    detailDescription: document.getElementById('detail-description'),
    detailEditBtn: document.getElementById('detail-edit-btn'),
    detailDeleteBtn: document.getElementById('detail-delete-btn'),
    detailBorrowBtn: document.getElementById('detail-borrow-btn'),
    itemModal: document.getElementById('item-modal'),
    itemModalTitle: document.getElementById('item-modal-title'),
    itemModalForm: document.getElementById('item-modal-form'),
    itemId: document.getElementById('item-id'),
    itemType: document.getElementById('item-type'),
    itemCode: document.getElementById('item-code'),
    itemName: document.getElementById('item-name'),
    itemCategory: document.getElementById('item-category'),
    itemLocation: document.getElementById('item-location'),
    itemCondition: document.getElementById('item-condition'),
    itemUnit: document.getElementById('item-unit'),
    itemTotal: document.getElementById('item-total'),
    itemAvailable: document.getElementById('item-available'),
    itemDesc: document.getElementById('item-desc'),
    itemModalSubmit: document.getElementById('item-modal-submit'),
  };

  let toastTimer = null;
  let lastScrollY = 0;

  function showToast(title, message, variant = 'success') {
    els.toast.classList.remove('is-success', 'is-warning', 'is-error');
    els.toast.classList.add(`is-${variant}`);
    els.toastTitle.textContent = title;
    els.toastMessage.textContent = message;
    els.toast.hidden = false;
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      els.toast.hidden = true;
    }, 8000);
  }

  function showInlineAlert(container, message, variant = 'success') {
    if (!container) return;
    container.className = `inline-alert inline-alert-${variant}`;
    container.textContent = message;
    container.hidden = false;
  }

  function clearInlineAlert(container) {
    if (!container) return;
    container.hidden = true;
    container.textContent = '';
  }

  function isAdminOrSuper() {
    return state.user?.role === 'admin' || state.user?.role === 'super_admin';
  }

  function isSuperAdmin() {
    return state.user?.role === 'super_admin';
  }

  function makeEl(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined && text !== null) el.textContent = String(text);
    return el;
  }

  function getInitials(name, email) {
    const src = (name || email || 'LF').trim();
    const parts = src.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return src.slice(0, 2).toUpperCase();
  }

  function renderAvatarInto(container, user) {
    const initials = getInitials(user?.name, user?.email);
    container.textContent = initials;
    if (typeof user?.picture === 'string' && user.picture.startsWith('https://')) {
      const img = document.createElement('img');
      img.src = user.picture;
      img.alt = user.name || 'Avatar pengguna';
      img.referrerPolicy = 'no-referrer';
      img.addEventListener('error', () => {
        container.textContent = initials;
      });
      container.textContent = '';
      container.appendChild(img);
    }
  }

  function formatDateDisplay(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(`${dateStr}T00:00:00+07:00`);
    if (Number.isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'Asia/Jakarta',
    });
  }

  function formatProviderLabel(provider) {
    if (provider === 'google') return 'Akun Google';
    if (provider === 'both') return 'Google & Email';
    return 'Email LabFis';
  }

  async function apiJson(url, options = {}) {
    const res = await fetch(url, {
      credentials: 'same-origin',
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401 && data?.loginUrl) {
      window.location.assign(data.loginUrl);
      return null;
    }
    if (!res.ok) {
      throw new Error(data?.message || `Permintaan gagal (HTTP ${res.status}).`);
    }
    return data;
  }

  function navigateToBorrow(itemId = null) {
    if (!state.user) {
      const target = itemId
        ? `/pinjam?itemId=${encodeURIComponent(itemId)}`
        : '/pinjam';
      window.location.assign(target);
      return;
    }
    if (itemId) {
      state.preselectItemId = itemId;
    }
    switchTab('pinjam');
  }

  function syncUrlForTab(tab) {
    if (window.history?.replaceState) {
      if (tab === 'profil') {
        window.history.replaceState({}, '', '/profil');
      } else if (tab === 'pinjam') {
        const suffix = state.preselectItemId
          ? `?itemId=${encodeURIComponent(state.preselectItemId)}`
          : '';
        window.history.replaceState({}, '', `/pinjam${suffix}`);
      } else if (window.location.pathname === '/profil' || window.location.pathname === '/pinjam') {
        window.history.replaceState({}, '', '/');
      }
    }
  }

  function switchTab(tab, options = { updateUrl: true }) {
    if (tab === 'pinjam' && !state.user) {
      window.location.assign('/pinjam');
      return;
    }
    if (tab === 'profil' && !state.user) {
      window.location.assign('/profil');
      return;
    }
    if (tab === 'peminjaman' && !state.user) {
      window.location.assign('/login');
      return;
    }
    if (tab === 'users' && !isSuperAdmin()) {
      showToast('Akses Ditolak', 'Halaman Manajemen Pengguna hanya untuk Super Admin.', 'error');
      return;
    }

    state.activeTab = tab;
    for (const btn of els.navTabs) {
      btn.classList.toggle('is-active', btn.dataset.tab === tab);
    }
    for (const btn of els.bottomNavItems) {
      btn.classList.toggle('is-active', btn.dataset.tab === tab);
    }
    for (const [key, view] of Object.entries(els.views)) {
      if (view) view.hidden = key !== tab;
    }

    if (els.mobileBottomNav) {
      els.mobileBottomNav.classList.remove('is-hidden');
    }

    if (options.updateUrl) {
      syncUrlForTab(tab);
    }

    if (tab === 'pinjam') {
      prepareLoanForm();
    } else if (tab === 'peminjaman') {
      loadLoans();
    } else if (tab === 'profil') {
      loadProfile();
    } else if (tab === 'users') {
      loadUsers();
    }
  }

  function renderAuthChrome() {
    const user = state.user;
    if (!user) {
      els.navLoginLink.hidden = false;
      els.navUserBox.hidden = true;
      els.navPeminjamanBtn.hidden = true;
      els.navUsersBtn.hidden = true;
      els.navProfilBtn.hidden = true;
      els.addAlatBtn.hidden = true;
      els.addBahanBtn.hidden = true;
      els.statRoleLabel.textContent = 'Pengunjung Publik';
      els.statRoleSub.textContent = 'Login untuk meminjam barang';
      return;
    }

    els.navLoginLink.hidden = true;
    els.navUserBox.hidden = false;
    renderAvatarInto(els.navAvatarBtn, user);
    els.navUserName.textContent = user.name;
    els.navUserRole.textContent = user.roleLabel || 'User';
    els.navUserRole.className = `role-pill role-${user.role}`;

    els.navPeminjamanBtn.hidden = false;
    els.navPeminjamanBtn.textContent = isAdminOrSuper()
      ? 'Kelola Peminjaman'
      : 'Riwayat Peminjaman';

    els.navProfilBtn.hidden = false;
    els.navUsersBtn.hidden = !isSuperAdmin();
    els.addAlatBtn.hidden = !isAdminOrSuper();
    els.addBahanBtn.hidden = !isAdminOrSuper();

    els.statRoleLabel.textContent = user.roleLabel || 'User';
    if (isSuperAdmin()) {
      els.statRoleSub.textContent = 'Akses penuh + Manajemen Pengguna';
    } else if (isAdminOrSuper()) {
      els.statRoleSub.textContent = 'Kelola inventaris & setujui peminjaman';
    } else {
      els.statRoleSub.textContent = 'Dapat mengajukan peminjaman barang';
    }

    els.peminjamanTitle.textContent = isAdminOrSuper()
      ? 'Kelola Peminjaman Laboratorium'
      : 'Riwayat Peminjaman Saya';
    els.peminjamanSubtitle.textContent = isAdminOrSuper()
      ? 'Setujui, tunda, atau tolak pengajuan peminjaman. Email otomatis terkirim ke peminjam.'
      : 'Daftar seluruh pengajuan peminjaman laboratorium yang pernah Anda kirim.';

    els.smtpTestBar.hidden = !isAdminOrSuper();
    els.loanFilterBar.hidden = !isAdminOrSuper();
    if (isAdminOrSuper()) {
      els.smtpStatusBadge.textContent = state.gmailConfigured
        ? 'SMTP Gmail Siap'
        : 'GMAIL_USER Belum Diisi';
      els.smtpStatusBadge.className = `status-pill ${
        state.gmailConfigured ? 'status-ok' : 'status-warn'
      }`;
      if (!els.smtpTestEmail.value) {
        els.smtpTestEmail.value = user.email || SUPER_ADMIN_EMAIL;
      }
    }
  }

  function renderDashboard() {
    els.statAlat.textContent = String(state.summary.totalAlatTypes ?? 0);
    els.statBahan.textContent = String(state.summary.totalBahanTypes ?? 0);
    els.statUnits.textContent = String(state.summary.totalAvailableUnits ?? 0);

    renderPreviewList(
      els.alatPreview,
      state.items.filter((i) => i.type === 'alat').slice(0, 4)
    );
    renderPreviewList(
      els.bahanPreview,
      state.items.filter((i) => i.type === 'bahan').slice(0, 4)
    );
  }

  function renderPreviewList(container, items) {
    container.replaceChildren();
    if (items.length === 0) {
      container.appendChild(makeEl('div', 'empty-state', 'Belum ada data barang.'));
      return;
    }

    const isMobileLayout = window.innerWidth < 768;
    for (const item of items) {
      if (isMobileLayout) {
        container.appendChild(createMobileItemCard(item));
        continue;
      }

      const row = makeEl('div', 'preview-row');
      const left = makeEl('div');
      left.appendChild(makeEl('div', 'preview-row-title', `${item.code} — ${item.name}`));
      left.appendChild(
        makeEl(
          'div',
          'preview-row-meta',
          `${item.category} • Stok: ${item.availableStock}/${item.totalStock} ${item.unit}`
        )
      );

      const right = makeEl('div', 'preview-row-right');
      const btn = makeEl('button', 'btn-emerald-sm', 'Pinjam Barang');
      btn.type = 'button';
      btn.disabled = item.availableStock < 1;
      btn.addEventListener('click', () => navigateToBorrow(item.id));
      right.appendChild(btn);

      row.append(left, right);
      container.appendChild(row);
    }
  }

  function createMobileItemCard(item) {
    const card = makeEl('button', 'item-mobile-card');
    card.type = 'button';
    card.addEventListener('click', () => openItemDetailModal(item));

    const top = makeEl('div', 'mobile-card-top');
    top.appendChild(makeEl('span', 'code-chip', item.code));
    top.appendChild(makeEl('span', 'mobile-card-cond', item.condition || 'Baik'));

    const mid = makeEl('div', 'mobile-card-mid');
    mid.appendChild(makeEl('div', 'mobile-card-title', item.name));
    mid.appendChild(makeEl('div', 'mobile-card-loc', item.location || item.category));

    const bottom = makeEl('div', 'mobile-card-bottom');
    const stockClass = item.availableStock > 0 ? 'status-approved' : 'status-rejected';
    bottom.appendChild(
      makeEl(
        'span',
        `status-pill ${stockClass}`,
        `Stok: ${item.availableStock}/${item.totalStock} ${item.unit}`
      )
    );

    card.append(top, mid, bottom);
    return card;
  }

  function renderInventoryTable(type) {
    const tbody = type === 'alat' ? els.alatBody : els.bahanBody;
    const mobileGrid = type === 'alat' ? els.alatMobileGrid : els.bahanMobileGrid;
    const searchInput = type === 'alat' ? els.searchAlat : els.searchBahan;
    const q = (searchInput?.value || '').trim().toLowerCase();

    const filtered = state.items.filter((item) => {
      if (item.type !== type) return false;
      if (!q) return true;
      return [item.code, item.name, item.category, item.location, item.description]
        .filter(Boolean)
        .some((v) => v.toLowerCase().includes(q));
    });

    tbody.replaceChildren();
    mobileGrid.replaceChildren();

    if (filtered.length === 0) {
      const tr = makeEl('tr');
      const td = makeEl('td', 'empty-state', 'Tidak ada data yang cocok.');
      td.colSpan = 6;
      tr.appendChild(td);
      tbody.appendChild(tr);

      mobileGrid.appendChild(makeEl('div', 'empty-state', 'Tidak ada data yang cocok.'));
      return;
    }

    for (const item of filtered) {
      mobileGrid.appendChild(createMobileItemCard(item));

      const tr = makeEl('tr');

      const tdCode = makeEl('td');
      tdCode.appendChild(makeEl('span', 'code-chip', item.code));

      const tdName = makeEl('td');
      tdName.appendChild(makeEl('div', 'item-main-name', item.name));
      if (item.description) {
        tdName.appendChild(makeEl('div', 'item-sub-desc', item.description));
      }

      const tdCatLoc = makeEl('td');
      tdCatLoc.appendChild(makeEl('div', 'item-main-name', item.category));
      tdCatLoc.appendChild(makeEl('div', 'item-sub-desc', item.location));

      const tdFourth = makeEl('td', null, type === 'alat' ? item.condition : item.unit);

      const tdStock = makeEl('td');
      const stockClass = item.availableStock > 0 ? 'status-approved' : 'status-rejected';
      tdStock.appendChild(
        makeEl(
          'span',
          `status-pill ${stockClass}`,
          `${item.availableStock} / ${item.totalStock} ${item.unit}`
        )
      );

      const tdAct = makeEl('td', 'text-right');
      const actions = makeEl('div', 'row-actions');

      const detailBtn = makeEl('button', 'btn-glass-sm', 'Detail');
      detailBtn.type = 'button';
      detailBtn.addEventListener('click', () => openItemDetailModal(item));

      const borrowBtn = makeEl('button', 'btn-emerald-sm', 'Pinjam Barang');
      borrowBtn.type = 'button';
      borrowBtn.disabled = item.availableStock < 1;
      borrowBtn.addEventListener('click', () => navigateToBorrow(item.id));
      actions.append(detailBtn, borrowBtn);

      if (isAdminOrSuper()) {
        const editBtn = makeEl('button', 'btn-glass-sm', 'Edit');
        editBtn.type = 'button';
        editBtn.addEventListener('click', () => openItemModal(type, item));

        const delBtn = makeEl('button', 'btn-danger-sm', 'Hapus');
        delBtn.type = 'button';
        delBtn.addEventListener('click', () => handleDeleteItem(item));

        actions.append(editBtn, delBtn);
      }

      tdAct.appendChild(actions);
      tr.append(tdCode, tdName, tdCatLoc, tdFourth, tdStock, tdAct);
      tbody.appendChild(tr);
    }
  }

  /* ===== DETAIL MODAL ===== */

  function openItemDetailModal(item) {
    state.detailItem = item;
    els.detailCode.textContent = item.code;
    els.detailTitle.textContent = item.name;
    els.detailCategory.textContent = `${item.type === 'bahan' ? 'Bahan' : 'Alat'} • ${item.category}`;
    els.detailLocation.textContent = item.location || '-';
    els.detailCondition.textContent = item.condition || 'Baik';
    els.detailStock.textContent = `${item.availableStock} / ${item.totalStock} ${item.unit}`;
    els.detailDescription.textContent =
      item.description || 'Belum ada keterangan tambahan untuk barang ini.';

    els.detailBorrowBtn.disabled = item.availableStock < 1;
    els.detailBorrowBtn.textContent =
      item.availableStock > 0 ? 'Pinjam Barang' : 'Stok Habis';

    const staff = isAdminOrSuper();
    els.detailEditBtn.hidden = !staff;
    els.detailDeleteBtn.hidden = !staff;
    els.itemDetailModal.hidden = false;
  }

  function closeItemDetailModal() {
    els.itemDetailModal.hidden = true;
    state.detailItem = null;
  }

  /* ===== LOAN FORM & STATUS ===== */

  function addLoanItemRow(preselectedId = '', qty = 1) {
    const row = makeEl('div', 'loan-item-row');

    const select = makeEl('select');
    select.required = true;
    const availableItems = state.items.filter((i) => i.availableStock > 0);
    if (availableItems.length === 0) {
      const opt = makeEl('option', null, 'Tidak ada barang tersedia');
      opt.value = '';
      select.appendChild(opt);
    } else {
      for (const item of availableItems) {
        const opt = makeEl(
          'option',
          null,
          `${item.code} — ${item.name} (${item.type === 'alat' ? 'Alat' : 'Bahan'}, stok ${item.availableStock} ${item.unit})`
        );
        opt.value = item.id;
        if (item.id === preselectedId) {
          opt.selected = true;
        }
        select.appendChild(opt);
      }
    }

    const qtyInput = makeEl('input');
    qtyInput.type = 'number';
    qtyInput.min = '1';
    qtyInput.value = String(qty);
    qtyInput.required = true;
    qtyInput.setAttribute('aria-label', 'Jumlah barang');

    const removeBtn = makeEl('button', 'btn-danger-sm', 'Hapus');
    removeBtn.type = 'button';
    removeBtn.addEventListener('click', () => {
      if (els.loanItemsContainer.children.length > 1) {
        row.remove();
      }
    });

    row.append(select, qtyInput, removeBtn);
    els.loanItemsContainer.appendChild(row);
  }

  function prepareLoanForm() {
    if (!state.user) return;
    if (!els.loanName.value) {
      els.loanName.value = state.user.name || '';
    }
    els.loanEmail.value = state.user.email || '';

    const today = new Date();
    const tomorrow = new Date(today.getTime() + 86400000);
    if (!els.loanBorrowDate.value) {
      els.loanBorrowDate.value = today.toISOString().slice(0, 10);
    }
    if (!els.loanReturnDate.value) {
      els.loanReturnDate.value = tomorrow.toISOString().slice(0, 10);
    }

    if (els.loanItemsContainer.children.length === 0 || state.preselectItemId) {
      els.loanItemsContainer.replaceChildren();
      addLoanItemRow(state.preselectItemId || '');
      state.preselectItemId = null;
    }
  }

  async function handleLoanSubmit(event) {
    event.preventDefault();
    clearInlineAlert(els.loanSubmitFeedback);

    const items = [];
    for (const row of els.loanItemsContainer.children) {
      const select = row.querySelector('select');
      const qtyInput = row.querySelector('input[type="number"]');
      if (select?.value) {
        items.push({
          itemId: select.value,
          qty: Number(qtyInput?.value || 1),
        });
      }
    }

    const payload = {
      borrowerName: els.loanName.value.trim(),
      phone: els.loanPhone.value.trim(),
      borrowDate: els.loanBorrowDate.value,
      returnDate: els.loanReturnDate.value,
      purpose: els.loanPurpose.value.trim(),
      items,
    };

    els.submitLoanBtn.disabled = true;
    els.submitLoanBtn.textContent = 'Mengirim Pengajuan...';

    try {
      const data = await apiJson('/api/loans', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (!data) return;

      const emailInfo = data.emailNotification || {};
      const variant = emailInfo.sent ? 'success' : 'warning';
      const fullMsg = `Pengajuan ${data.loan.code} berhasil disimpan! ${emailInfo.statusMessage || ''}`;

      showInlineAlert(els.loanSubmitFeedback, fullMsg, variant);
      showToast(
        emailInfo.sent ? 'Peminjaman & Email Terkirim' : 'Peminjaman Disimpan (Cek Email)',
        fullMsg,
        variant
      );

      els.loanPhone.value = '';
      els.loanPurpose.value = '';
      els.loanItemsContainer.replaceChildren();
      addLoanItemRow();
      await loadInventory();
    } catch (error) {
      showInlineAlert(els.loanSubmitFeedback, error.message, 'error');
      showToast('Gagal Mengajukan', error.message, 'error');
    } finally {
      els.submitLoanBtn.disabled = false;
      els.submitLoanBtn.textContent = 'Ajukan Peminjaman';
    }
  }

  function buildLoanCard(loan, allowAdminActions) {
    const card = makeEl('article', 'loan-card');

    const top = makeEl('div', 'loan-card-top');
    const topLeft = makeEl('div', 'row-actions');
    topLeft.appendChild(makeEl('span', 'code-chip', loan.code));
    topLeft.appendChild(makeEl('strong', null, loan.borrowerName));
    top.appendChild(topLeft);

    top.appendChild(
      makeEl(
        'span',
        `status-pill status-${loan.status}`,
        STATUS_LABELS[loan.status] || loan.status
      )
    );

    const meta = makeEl('div', 'loan-card-meta');
    const m1 = makeEl('div');
    m1.appendChild(makeEl('strong', null, 'Email: '));
    m1.append(loan.borrowerEmail);
    const m2 = makeEl('div');
    m2.appendChild(makeEl('strong', null, 'No. HP: '));
    m2.append(loan.phone);
    const m3 = makeEl('div');
    m3.appendChild(makeEl('strong', null, 'Jadwal: '));
    m3.append(`${formatDateDisplay(loan.borrowDate)} – ${formatDateDisplay(loan.returnDate)}`);
    meta.append(m1, m2, m3);

    const purposeEl = makeEl('div', 'preview-row-meta');
    purposeEl.appendChild(makeEl('strong', null, 'Keperluan: '));
    purposeEl.append(loan.purpose);

    const itemsWrap = makeEl('div', 'loan-card-items');
    for (const item of loan.items || []) {
      itemsWrap.appendChild(
        makeEl('span', 'loan-item-tag', `${item.code} ${item.name} (${item.qty} ${item.unit})`)
      );
    }

    card.append(top, meta, purposeEl, itemsWrap);

    if (loan.reviewedByName || loan.adminNote) {
      const reviewText = [
        loan.reviewedByName ? `Diproses oleh ${loan.reviewedByName} (${loan.reviewedByRole || 'Admin'})` : '',
        loan.adminNote ? `Catatan: ${loan.adminNote}` : '',
      ]
        .filter(Boolean)
        .join(' • ');
      card.appendChild(makeEl('div', 'preview-row-meta', reviewText));
    }

    if (allowAdminActions) {
      const controls = makeEl('div', 'loan-admin-controls');
      const noteInput = makeEl('input', 'loan-note-input');
      noteInput.type = 'text';
      noteInput.placeholder = 'Catatan untuk peminjam (opsional)...';
      noteInput.value = loan.adminNote || '';

      const btnGroup = makeEl('div', 'row-actions');
      const approveBtn = makeEl('button', 'btn-emerald-sm', 'Setujui');
      const delayBtn = makeEl('button', 'btn-amber-sm', 'Tunda');
      const rejectBtn = makeEl('button', 'btn-danger-sm', 'Tolak');

      approveBtn.type = 'button';
      delayBtn.type = 'button';
      rejectBtn.type = 'button';

      approveBtn.addEventListener('click', () =>
        handleLoanStatusChange(loan.id, 'approved', noteInput.value)
      );
      delayBtn.addEventListener('click', () =>
        handleLoanStatusChange(loan.id, 'delayed', noteInput.value)
      );
      rejectBtn.addEventListener('click', () =>
        handleLoanStatusChange(loan.id, 'rejected', noteInput.value)
      );

      btnGroup.append(approveBtn, delayBtn, rejectBtn);
      controls.append(noteInput, btnGroup);
      card.appendChild(controls);
    }

    return card;
  }

  async function loadLoans() {
    if (!state.user) return;
    try {
      const data = await apiJson('/api/loans', { method: 'GET' });
      if (!data) return;
      state.loans = data.loans || [];
      renderLoans();
    } catch (error) {
      showToast('Gagal Memuat Peminjaman', error.message, 'error');
    }
  }

  function renderLoans() {
    els.loansList.replaceChildren();
    const filtered = state.loans.filter(
      (loan) => state.loanFilter === 'all' || loan.status === state.loanFilter
    );

    if (filtered.length === 0) {
      els.loansList.appendChild(
        makeEl('div', 'empty-state', 'Belum ada data peminjaman pada kategori ini.')
      );
      return;
    }

    for (const loan of filtered) {
      els.loansList.appendChild(buildLoanCard(loan, isAdminOrSuper()));
    }
  }

  async function handleLoanStatusChange(loanId, status, adminNote) {
    clearInlineAlert(els.loanStatusFeedback);
    try {
      const data = await apiJson(`/api/loans/${encodeURIComponent(loanId)}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, adminNote }),
      });
      if (!data) return;

      const emailInfo = data.emailNotification || {};
      const variant = emailInfo.sent ? 'success' : 'warning';
      const label = STATUS_LABELS[status] || status;
      const msg = `Status ${data.loan.code} diubah menjadi ${label}. ${emailInfo.statusMessage || ''}`;

      showInlineAlert(els.loanStatusFeedback, msg, variant);
      showToast(
        emailInfo.sent ? `Status ${label} & Email Terkirim` : `Status ${label} (Cek Email)`,
        msg,
        variant
      );

      await Promise.all([loadLoans(), loadInventory()]);
    } catch (error) {
      showInlineAlert(els.loanStatusFeedback, error.message, 'error');
      showToast('Gagal Mengubah Status', error.message, 'error');
    }
  }

  async function handleTestSmtp() {
    clearInlineAlert(els.loanStatusFeedback);
    const to = els.smtpTestEmail.value.trim();
    els.smtpTestBtn.disabled = true;
    els.smtpTestBtn.textContent = 'Mengirim...';

    try {
      const data = await apiJson('/api/email/test', {
        method: 'POST',
        body: JSON.stringify({ to }),
      });
      if (!data) return;
      const info = data.emailNotification || {};
      const variant = info.sent ? 'success' : 'error';
      showInlineAlert(els.loanStatusFeedback, info.statusMessage || 'Selesai.', variant);
      showToast(info.sent ? 'SMTP Gmail Berhasil' : 'SMTP Gmail Gagal', info.statusMessage, variant);
    } catch (error) {
      showInlineAlert(els.loanStatusFeedback, error.message, 'error');
      showToast('Error SMTP', error.message, 'error');
    } finally {
      els.smtpTestBtn.disabled = false;
      els.smtpTestBtn.textContent = 'Tes Kirim Email SMTP';
    }
  }

  /* ===== HALAMAN PROFIL (/profil) ===== */

  async function loadProfile() {
    if (!state.user) return;
    const u = state.user;
    renderAvatarInto(els.profileAvatar, u);
    els.profileName.textContent = u.name;
    els.profileEmail.textContent = u.email;
    els.profileRoleBadge.textContent = u.roleLabel || 'User';
    els.profileRoleBadge.className = `role-pill role-${u.role}`;
    els.profileProviderBadge.textContent = formatProviderLabel(u.provider);

    els.profileManageUsersBtn.hidden = !isSuperAdmin();
    els.profileManageLoansBtn.hidden = !isAdminOrSuper();

    try {
      const data = await apiJson('/api/loans?mine=true', { method: 'GET' });
      if (!data) return;
      state.myLoans = data.loans || [];
      renderProfileLoans();
    } catch (error) {
      showToast('Gagal Memuat Profil', error.message, 'error');
    }
  }

  function renderProfileLoans() {
    const loans = state.myLoans || [];
    els.profStatTotal.textContent = String(loans.length);
    els.profStatApproved.textContent = String(loans.filter((l) => l.status === 'approved').length);
    els.profStatPending.textContent = String(
      loans.filter((l) => l.status === 'pending' || l.status === 'delayed').length
    );
    els.profStatRejected.textContent = String(loans.filter((l) => l.status === 'rejected').length);

    els.profileLoansList.replaceChildren();
    if (loans.length === 0) {
      els.profileLoansList.appendChild(
        makeEl('div', 'empty-state', 'Anda belum pernah mengajukan peminjaman alat atau bahan.')
      );
      return;
    }

    for (const loan of loans) {
      els.profileLoansList.appendChild(buildLoanCard(loan, false));
    }
  }

  /* ===== SUPER ADMIN USER MANAGEMENT ===== */

  async function loadUsers() {
    if (!isSuperAdmin()) return;
    try {
      const data = await apiJson('/api/users', { method: 'GET' });
      if (!data) return;
      state.users = data.users || [];
      renderUsers();
    } catch (error) {
      showToast('Gagal Memuat Pengguna', error.message, 'error');
    }
  }

  function renderUsers() {
    const superCount = state.users.filter((u) => u.role === 'super_admin').length;
    const adminCount = state.users.filter((u) => u.role === 'admin').length;
    const userCount = state.users.filter((u) => u.role === 'user').length;

    els.userSummaryPills.replaceChildren(
      makeEl('span', 'role-pill role-super_admin', `Super Admin: ${superCount}`),
      makeEl('span', 'role-pill role-admin', `Admin: ${adminCount}`),
      makeEl('span', 'role-pill role-user', `User: ${userCount}`)
    );

    els.usersBody.replaceChildren();
    for (const u of state.users) {
      const tr = makeEl('tr');
      const tdName = makeEl('td');
      tdName.appendChild(makeEl('div', 'item-main-name', u.name));

      const tdEmail = makeEl('td', null, u.email);
      const tdRole = makeEl('td');
      tdRole.appendChild(makeEl('span', `role-pill role-${u.role}`, u.roleLabel));

      const tdProvider = makeEl('td', null, u.provider || 'email');
      const tdAct = makeEl('td', 'text-right');

      const protectedUser = u.isPrimarySuperAdmin || u.id === state.user?.id;
      if (protectedUser) {
        tdAct.appendChild(makeEl('span', 'status-pill status-pending', 'Dilindungi'));
      } else {
        const actions = makeEl('div', 'row-actions');
        const nextRole = u.role === 'admin' ? 'user' : 'admin';
        const toggleBtn = makeEl(
          'button',
          'btn-glass-sm',
          u.role === 'admin' ? 'Jadikan User' : 'Jadikan Admin'
        );
        toggleBtn.type = 'button';
        toggleBtn.addEventListener('click', () => handleRoleChange(u.id, nextRole));

        const delBtn = makeEl('button', 'btn-danger-sm', 'Hapus');
        delBtn.type = 'button';
        delBtn.addEventListener('click', () => handleDeleteUser(u));

        actions.append(toggleBtn, delBtn);
        tdAct.appendChild(actions);
      }

      tr.append(tdName, tdEmail, tdRole, tdProvider, tdAct);
      els.usersBody.appendChild(tr);
    }
  }

  async function handleCreateUser(event) {
    event.preventDefault();
    els.createUserBtn.disabled = true;
    try {
      const data = await apiJson('/api/users', {
        method: 'POST',
        body: JSON.stringify({
          name: els.newUserName.value.trim(),
          email: els.newUserEmail.value.trim(),
          role: els.newUserRole.value,
          password: els.newUserPassword.value,
        }),
      });
      if (!data) return;

      showToast('Pengguna Ditambahkan', `${data.user.name} (${data.user.roleLabel}) berhasil dibuat.`);
      els.createUserForm.reset();
      await loadUsers();
    } catch (error) {
      showToast('Gagal Tambah Pengguna', error.message, 'error');
    } finally {
      els.createUserBtn.disabled = false;
    }
  }

  async function handleRoleChange(userId, nextRole) {
    try {
      const data = await apiJson(`/api/users/${encodeURIComponent(userId)}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role: nextRole }),
      });
      if (!data) return;
      showToast('Role Diperbarui', `${data.user.name} sekarang berperan sebagai ${data.user.roleLabel}.`);
      await loadUsers();
    } catch (error) {
      showToast('Gagal Ubah Role', error.message, 'error');
    }
  }

  async function handleDeleteUser(user) {
    try {
      const data = await apiJson(`/api/users/${encodeURIComponent(user.id)}`, {
        method: 'DELETE',
      });
      if (!data) return;
      showToast('Pengguna Dihapus', `Akun ${user.email} berhasil dihapus.`);
      await loadUsers();
    } catch (error) {
      showToast('Gagal Hapus Pengguna', error.message, 'error');
    }
  }

  /* ===== ADMIN / SUPER ADMIN INVENTORY CRUD MODAL ===== */

  function openItemModal(defaultType, item = null) {
    els.itemId.value = item ? item.id : '';
    els.itemType.value = item ? item.type : defaultType;
    els.itemCode.value = item ? item.code : '';
    els.itemName.value = item ? item.name : '';
    els.itemCategory.value = item ? item.category : '';
    els.itemLocation.value = item ? item.location : '';
    els.itemCondition.value = item ? item.condition : 'Baik';
    els.itemUnit.value = item ? item.unit : 'unit';
    els.itemTotal.value = item ? String(item.totalStock) : '1';
    els.itemAvailable.value = item ? String(item.availableStock) : '1';
    els.itemDesc.value = item ? item.description || '' : '';
    els.itemModalTitle.textContent = item
      ? `Edit ${item.code}`
      : `Tambah ${defaultType === 'bahan' ? 'Bahan' : 'Alat'}`;
    els.itemModal.hidden = false;
  }

  function closeItemModal() {
    els.itemModal.hidden = true;
  }

  async function handleItemModalSubmit(event) {
    event.preventDefault();
    const id = els.itemId.value.trim();
    const payload = {
      type: els.itemType.value,
      code: els.itemCode.value.trim(),
      name: els.itemName.value.trim(),
      category: els.itemCategory.value.trim(),
      location: els.itemLocation.value.trim(),
      condition: els.itemCondition.value.trim(),
      unit: els.itemUnit.value.trim(),
      totalStock: Number(els.itemTotal.value),
      availableStock: Number(els.itemAvailable.value),
      description: els.itemDesc.value.trim(),
    };

    els.itemModalSubmit.disabled = true;
    try {
      if (id) {
        await apiJson(`/api/inventory/${encodeURIComponent(id)}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        showToast('Inventaris Diperbarui', `${payload.name} berhasil diperbarui.`);
      } else {
        await apiJson('/api/inventory', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        showToast('Barang Ditambahkan', `${payload.name} berhasil ditambahkan ke inventaris.`);
      }
      closeItemModal();
      await loadInventory();
    } catch (error) {
      showToast('Gagal Simpan Barang', error.message, 'error');
    } finally {
      els.itemModalSubmit.disabled = false;
    }
  }

  async function handleDeleteItem(item) {
    try {
      await apiJson(`/api/inventory/${encodeURIComponent(item.id)}`, { method: 'DELETE' });
      showToast('Barang Dihapus', `${item.code} — ${item.name} berhasil dihapus.`);
      await loadInventory();
    } catch (error) {
      showToast('Gagal Hapus Barang', error.message, 'error');
    }
  }

  async function loadInventory() {
    const data = await apiJson('/api/inventory', { method: 'GET' });
    if (!data) return;
    state.items = data.items || [];
    state.summary = data.summary || state.summary;
    renderDashboard();
    renderInventoryTable('alat');
    renderInventoryTable('bahan');
  }

  async function loadSession() {
    const data = await apiJson('/api/auth/me', { method: 'GET' });
    if (!data) return;
    state.user = data.authenticated ? data.user : null;
    state.gmailConfigured = Boolean(data.gmailConfigured);
    renderAuthChrome();
  }

  async function performLogout() {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
    window.location.assign('/');
  }

  function setupScrollAutoHideBottomNav() {
    lastScrollY = Math.max(0, window.scrollY || 0);
    window.addEventListener(
      'scroll',
      () => {
        if (!els.mobileBottomNav) return;
        const currentY = Math.max(0, window.scrollY || document.documentElement.scrollTop || 0);
        if (currentY <= 24) {
          els.mobileBottomNav.classList.remove('is-hidden');
        } else if (currentY > lastScrollY + 6 && currentY > 40) {
          els.mobileBottomNav.classList.add('is-hidden');
        } else if (currentY < lastScrollY - 4) {
          els.mobileBottomNav.classList.remove('is-hidden');
        }
        lastScrollY = currentY;
      },
      { passive: true }
    );
  }

  function bindEvents() {
    els.toastClose.addEventListener('click', () => {
      els.toast.hidden = true;
    });

    for (const tabBtn of [...els.navTabs, ...els.bottomNavItems]) {
      tabBtn.addEventListener('click', () => {
        if (tabBtn.dataset.tab === 'pinjam') {
          navigateToBorrow();
        } else {
          switchTab(tabBtn.dataset.tab);
        }
      });
    }

    document.querySelector('[data-nav="dashboard"]')?.addEventListener('click', (e) => {
      e.preventDefault();
      switchTab('dashboard');
    });

    els.navAvatarBtn?.addEventListener('click', () => switchTab('profil'));

    document.getElementById('hero-borrow-btn')?.addEventListener('click', () => {
      navigateToBorrow();
    });
    document.getElementById('hero-browse-alat-btn')?.addEventListener('click', () => {
      switchTab('alat');
    });

    for (const jumpBtn of document.querySelectorAll('[data-jump]')) {
      jumpBtn.addEventListener('click', () => switchTab(jumpBtn.dataset.jump));
    }

    els.searchAlat.addEventListener('input', () => renderInventoryTable('alat'));
    els.searchBahan.addEventListener('input', () => renderInventoryTable('bahan'));

    els.addAlatBtn.addEventListener('click', () => openItemModal('alat'));
    els.addBahanBtn.addEventListener('click', () => openItemModal('bahan'));

    document.getElementById('item-modal-close')?.addEventListener('click', closeItemModal);
    document.getElementById('item-modal-cancel')?.addEventListener('click', closeItemModal);
    els.itemModalForm.addEventListener('submit', handleItemModalSubmit);

    document.getElementById('detail-modal-close')?.addEventListener('click', closeItemDetailModal);
    els.itemDetailModal?.addEventListener('click', (e) => {
      if (e.target === els.itemDetailModal) closeItemDetailModal();
    });
    els.detailBorrowBtn?.addEventListener('click', () => {
      const item = state.detailItem;
      closeItemDetailModal();
      if (item) navigateToBorrow(item.id);
    });
    els.detailEditBtn?.addEventListener('click', () => {
      const item = state.detailItem;
      closeItemDetailModal();
      if (item) openItemModal(item.type, item);
    });
    els.detailDeleteBtn?.addEventListener('click', async () => {
      const item = state.detailItem;
      closeItemDetailModal();
      if (item) await handleDeleteItem(item);
    });

    els.addLoanItemBtn.addEventListener('click', () => addLoanItemRow());
    els.loanForm.addEventListener('submit', handleLoanSubmit);

    for (const pill of document.querySelectorAll('[data-loan-filter]')) {
      pill.addEventListener('click', () => {
        state.loanFilter = pill.dataset.loanFilter;
        for (const p of document.querySelectorAll('[data-loan-filter]')) {
          p.classList.toggle('is-active', p === pill);
        }
        renderLoans();
      });
    }

    els.smtpTestBtn.addEventListener('click', handleTestSmtp);
    els.createUserForm.addEventListener('submit', handleCreateUser);

    els.navLogoutBtn?.addEventListener('click', () => {
      els.navLogoutBtn.disabled = true;
      performLogout();
    });
    els.profileLogoutBtn?.addEventListener('click', () => {
      els.profileLogoutBtn.disabled = true;
      performLogout();
    });
    els.profileManageUsersBtn?.addEventListener('click', () => switchTab('users'));
    els.profileManageLoansBtn?.addEventListener('click', () => switchTab('peminjaman'));
    els.profileNewLoanBtn?.addEventListener('click', () => navigateToBorrow());

    window.addEventListener('resize', () => {
      if (state.items.length > 0) renderDashboard();
    });

    setupScrollAutoHideBottomNav();
  }

  async function init() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    bindEvents();
    await Promise.all([loadSession(), loadInventory()]);

    const params = new URLSearchParams(window.location.search);
    const itemIdParam = params.get('itemId');
    if (itemIdParam) {
      state.preselectItemId = itemIdParam;
    }

    if (window.location.pathname === '/pinjam') {
      if (state.user) {
        switchTab('pinjam', { updateUrl: false });
      } else {
        window.location.replace(
          `/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`
        );
      }
      return;
    }

    if (window.location.pathname === '/profil') {
      if (state.user) {
        switchTab('profil', { updateUrl: false });
      } else {
        window.location.replace('/login?next=%2Fprofil');
      }
      return;
    }

    switchTab('dashboard', { updateUrl: false });
  }

  init();
})();
