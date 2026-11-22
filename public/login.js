(() => {
  const loginForm = document.getElementById('login-form');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const togglePasswordBtn = document.getElementById('toggle-password');
  const iconEye = document.getElementById('icon-eye');
  const iconEyeOff = document.getElementById('icon-eye-off');
  const googleLoginBtn = document.getElementById('google-login-btn');
  const googleBtnText = document.getElementById('google-btn-text');
  const submitBtn = document.getElementById('submit-btn');
  const toastEl = document.getElementById('toast');
  const toastMessageEl = document.getElementById('toast-message');

  function getSafeNextPath() {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get('next');
    if (
      typeof raw === 'string' &&
      raw.startsWith('/') &&
      !raw.startsWith('//') &&
      !raw.startsWith('/login') &&
      !raw.includes('\\')
    ) {
      return raw;
    }
    return '/';
  }

  const safeNextPath = getSafeNextPath();
  let toastTimer = null;

  function showToast(message) {
    if (!toastEl || !toastMessageEl) return;
    toastMessageEl.textContent = message;
    toastEl.hidden = false;
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      toastEl.hidden = true;
    }, 5000);
  }

  function hideToast() {
    if (!toastEl) return;
    window.clearTimeout(toastTimer);
    toastEl.hidden = true;
  }

  if (togglePasswordBtn && passwordInput && iconEye && iconEyeOff) {
    togglePasswordBtn.addEventListener('click', () => {
      const reveal = passwordInput.type === 'password';
      passwordInput.type = reveal ? 'text' : 'password';
      iconEye.hidden = reveal;
      iconEyeOff.hidden = !reveal;
      togglePasswordBtn.setAttribute('aria-pressed', String(reveal));
      togglePasswordBtn.setAttribute(
        'aria-label',
        reveal ? 'Sembunyikan password' : 'Tampilkan password'
      );
    });
  }

  if (googleLoginBtn) {
    googleLoginBtn.addEventListener('click', () => {
      hideToast();
      googleLoginBtn.disabled = true;
      if (googleBtnText) {
        googleBtnText.textContent = 'Menghubungkan ke Google...';
      }
      const target =
        safeNextPath !== '/'
          ? `/auth/google?next=${encodeURIComponent(safeNextPath)}`
          : '/auth/google';
      window.location.assign(target);
    });
  }

  if (loginForm && emailInput && passwordInput && submitBtn) {
    loginForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      hideToast();

      const email = emailInput.value.trim();
      const password = passwordInput.value;

      if (!email || !password) {
        showToast('Masukkan email dan password Anda.');
        if (!email) {
          emailInput.focus();
        } else {
          passwordInput.focus();
        }
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        showToast('Masukkan alamat email yang valid.');
        emailInput.focus();
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Memproses...';

      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'same-origin',
          body: JSON.stringify({
            email,
            password,
            next: safeNextPath,
          }),
        });

        const data = await response.json().catch(() => null);
        if (!response.ok || !data?.ok) {
          showToast(data?.message || 'Email atau password tidak valid.');
          submitBtn.disabled = false;
          submitBtn.textContent = 'Masuk';
          return;
        }

        window.location.assign(data.redirect || safeNextPath || '/');
      } catch {
        showToast('Terjadi gangguan koneksi ke server LabFis.');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Masuk';
      }
    });
  }

  const queryParams = new URLSearchParams(window.location.search);
  const errorCode = queryParams.get('error');
  if (errorCode) {
    const errorMessages = {
      google_cancelled: 'Login dengan Google dibatalkan.',
      invalid_state: 'Sesi otorisasi tidak valid atau kedaluwarsa. Silakan coba lagi.',
      google_failed: 'Gagal masuk dengan akun Google. Silakan coba lagi.',
    };
    showToast(errorMessages[errorCode] || 'Autentikasi gagal. Silakan coba lagi.');
    queryParams.delete('error');
    const qs = queryParams.toString();
    const cleaned = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
    window.history.replaceState({}, document.title, cleaned);
  }

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }
})();
