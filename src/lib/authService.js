// Service Autentikasi Admin MBG Magelang
// Sandi bawaan: admin123 (tersimpan di LocalStorage dan dapat diganti oleh admin)

const AUTH_KEYS = {
  SESSION: 'mbg_admin_session',
  PASSWORD: 'mbg_admin_password',
  USERNAME: 'mbg_admin_username'
};

const DEFAULT_PASSWORD = 'admin123';
const DEFAULT_USERNAME = 'admin';

// Inisialisasi awal password jika belum ada
export function initAuth() {
  if (!localStorage.getItem(AUTH_KEYS.PASSWORD)) {
    localStorage.setItem(AUTH_KEYS.PASSWORD, DEFAULT_PASSWORD);
  }
  if (!localStorage.getItem(AUTH_KEYS.USERNAME)) {
    localStorage.setItem(AUTH_KEYS.USERNAME, DEFAULT_USERNAME);
  }
}

// Cek apakah admin sedang login
export function checkIsLoggedIn() {
  try {
    const session = localStorage.getItem(AUTH_KEYS.SESSION);
    if (!session) return false;
    const parsed = JSON.parse(session);
    return Boolean(parsed && parsed.isLoggedIn);
  } catch (e) {
    return false;
  }
}

// Ambil info session admin
export function getAdminSession() {
  try {
    const session = localStorage.getItem(AUTH_KEYS.SESSION);
    if (!session) return null;
    return JSON.parse(session);
  } catch (e) {
    return null;
  }
}

// Login admin
export function loginAdmin(username, password) {
  initAuth();
  const currentPass = localStorage.getItem(AUTH_KEYS.PASSWORD) || DEFAULT_PASSWORD;
  const currentUsername = localStorage.getItem(AUTH_KEYS.USERNAME) || DEFAULT_USERNAME;

  const trimmedUser = (username || '').trim().toLowerCase();
  const trimmedPass = (password || '').trim();

  // Izinkan username 'admin' atau kosong jika hanya mengisi password
  const isUserValid = trimmedUser === currentUsername.toLowerCase() || trimmedUser === '' || trimmedUser === 'admin';

  if (!isUserValid) {
    return { success: false, error: 'Username admin tidak sesuai.' };
  }

  if (trimmedPass !== currentPass) {
    return { success: false, error: 'Kata sandi salah. Gunakan sandi bawaan admin123 atau yang telah Anda atur.' };
  }

  const sessionData = {
    isLoggedIn: true,
    username: currentUsername,
    name: 'Administrator MBG',
    loginTime: new Date().toISOString()
  };

  localStorage.setItem(AUTH_KEYS.SESSION, JSON.stringify(sessionData));
  return { success: true, session: sessionData };
}

// Logout admin
export function logoutAdmin() {
  localStorage.removeItem(AUTH_KEYS.SESSION);
}

// Ganti kata sandi admin
export function changeAdminPassword(currentPasswordInput, newPasswordInput, confirmPasswordInput) {
  initAuth();
  const currentPass = localStorage.getItem(AUTH_KEYS.PASSWORD) || DEFAULT_PASSWORD;

  const trimmedOld = (currentPasswordInput || '').trim();
  const trimmedNew = (newPasswordInput || '').trim();
  const trimmedConfirm = (confirmPasswordInput || '').trim();

  if (!trimmedOld) {
    return { success: false, error: 'Mohon masukkan kata sandi lama Anda.' };
  }

  if (trimmedOld !== currentPass) {
    return { success: false, error: 'Kata sandi lama salah.' };
  }

  if (!trimmedNew || trimmedNew.length < 4) {
    return { success: false, error: 'Kata sandi baru minimal harus 4 karakter.' };
  }

  if (trimmedNew !== trimmedConfirm) {
    return { success: false, error: 'Konfirmasi kata sandi baru tidak cocok.' };
  }

  localStorage.setItem(AUTH_KEYS.PASSWORD, trimmedNew);
  return { success: true, message: 'Kata sandi berhasil diperbarui!' };
}
