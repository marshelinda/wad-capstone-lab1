const authService = require('../services/auth.service');

// ─── POST /auth/register ──────────────────────────────────
const register = async (req, res, next) => {
  try {
    const user = await authService.register(req.body);
    
    res.status(201).json({
      message: 'Registrasi berhasil.',
      data: user,
    });
  } catch (err) { 
    next(err); 
  }
};

// ─── POST /auth/login ─────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    
    res.status(200).json({
      message: 'Login berhasil.',
      data: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  } catch (err) { 
    next(err); 
  }
};

// ─── POST /auth/refresh ───────────────────────────────────
const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const tokens = await authService.refresh(refreshToken);
    
    res.status(200).json({
      message: 'Token berhasil diperbarui.',
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch (err) { 
    next(err); 
  }
};

// ─── POST /auth/logout ────────────────────────────────────
const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    await authService.logout(refreshToken);
    
    res.status(200).json({ 
      message: 'Logout berhasil.' 
    });
  } catch (err) { 
    next(err); 
  }
};

// ─── GET /auth/me — Informasi user yang sedang login ──────
const me = (req, res) => {
  // req.user diisi oleh authenticate middleware
  res.status(200).json({ 
    data: req.user 
  });
};

module.exports = { register, login, refresh, logout, me };