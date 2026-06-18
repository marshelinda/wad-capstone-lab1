const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const userRepo = require('../repositories/user.repository');
const refreshTokenRepo = require('../repositories/refreshToken.repository');
const prisma = require('../config/prisma');

// ─── Konfigurasi argon2id ────────────────────────────────
const ARGON2_OPTIONS = {
  memoryCost: 65536, 
  timeCost: 3,       
  parallelism: 4,    
};

// ─── Helper: Buat Access Token ───────────────────────────
function signAccessToken(payload) {
  return jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiresIn,
    jwtid: uuidv4(), 
  });
}

// ─── Helper: Buat Refresh Token ──────────────────────────
function signRefreshToken(payload) {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
    jwtid: uuidv4(),
  });
}

// ─── Helper: Hitung tanggal expired refresh token ────────
function getRefreshTokenExpiry() {
  const days = parseInt(config.jwt.refreshExpiresIn, 10) || 7;
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

const authService = {
  // ─── REGISTER ──────────────────────────────────────────
  async register({ name, email, password }) {
    const existing = await userRepo.findByEmail(email);
    if (existing) {
      const err = new Error('Email sudah terdaftar.');
      err.statusCode = 409;
      err.code = 'DUPLICATE_EMAIL';
      throw err;
    }

    const hashedPassword = await argon2.hash(password, ARGON2_OPTIONS);

    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword },
      select: { id: true, name: true, email: true, role: true, createdAt: true }, // ← Sertakan role di sini
    });

    return user;
  },

  // ─── LOGIN ─────────────────────────────────────────────
  async login({ email, password }) {
    const user = await userRepo.findByEmail(email);

    if (!user) {
      const err = new Error('Email atau password salah.');
      err.statusCode = 401;
      err.code = 'INVALID_CREDENTIALS';
      throw err;
    }

    const isValid = await argon2.verify(user.password, password);
    if (!isValid) {
      const err = new Error('Email atau password salah.');
      err.statusCode = 401;
      err.code = 'INVALID_CREDENTIALS';
      throw err;
    }

    // UPDATE: Menambahkan role ke dalam payload Access Token sesuai instruksi Handbook
    const accessToken = signAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role, // ← Tambahan dari Handbook
    });

    // Menambahkan role juga ke refresh token agar saat perpanjangan (refresh) datanya terjaga
    const refreshToken = signRefreshToken({ 
      userId: user.id,
      email: user.email,
      role: user.role 
    });

    await refreshTokenRepo.create({
      token: refreshToken,
      userId: user.id,
      expiresAt: getRefreshTokenExpiry(),
    });

    return {
      user: { id: user.id, name: user.name, email: user.email, role: user.role }, // ← Sertakan di respon profil
      accessToken,
      refreshToken,
    };
  },

  // ─── REFRESH TOKEN ─────────────────────────────────────
  async refresh(tokenString) {
    let payload;
    try {
      payload = jwt.verify(tokenString, config.jwt.refreshSecret);
    } catch (e) {
      const err = new Error('Refresh token tidak valid atau sudah expired.');
      err.statusCode = 401; 
      err.code = 'INVALID_REFRESH_TOKEN';
      throw err;
    }

    const storedToken = await refreshTokenRepo.findByToken(tokenString);

    // REUSE DETECTION
    if (storedToken && storedToken.isRevoked) {
      await refreshTokenRepo.revokeAllByUser(storedToken.userId);
      
      const err = new Error('Token mencurigakan terdeteksi. Silakan login ulang.');
      err.statusCode = 401; 
      err.code = 'TOKEN_REUSE_DETECTED';
      throw err;
    }

    if (!storedToken) {
      const err = new Error('Refresh token tidak ditemukan.');
      err.statusCode = 401; 
      err.code = 'INVALID_REFRESH_TOKEN';
      throw err;
    }

    await refreshTokenRepo.revoke(tokenString);

    // UPDATE: Membawa kembali payload.role saat generate token baru
    const newAccessToken = signAccessToken({ 
      userId: payload.userId,
      email: payload.email,
      role: payload.role // ← Agar role tetap terbawa di token baru
    });
    
    const newRefreshToken = signRefreshToken({ 
      userId: payload.userId,
      email: payload.email,
      role: payload.role
    });

    await refreshTokenRepo.create({
      token: newRefreshToken,
      userId: storedToken.userId,
      expiresAt: getRefreshTokenExpiry(),
    });

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  },

  // ─── LOGOUT ────────────────────────────────────────────
  async logout(tokenString) {
    if (!tokenString) return;

    const storedToken = await refreshTokenRepo.findByToken(tokenString);
    if (!storedToken) {
      const err = new Error('Refresh token tidak ditemukan atau sudah logout.');
      err.statusCode = 401;
      err.code = 'INVALID_REFRESH_TOKEN';
      throw err;
    }

    await refreshTokenRepo.revoke(tokenString);
  },
};

module.exports = authService;