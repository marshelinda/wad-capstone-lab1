const Joi = require('joi');

// ─── Skema Validasi Registrasi ────────────────────────────
const registerSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required()
    .messages({ 
      'any.required': 'Nama wajib diisi.' 
    }),

  email: Joi.string()
    .trim()
    .email()
    .lowercase()
    .required()
    .messages({
      'string.email': 'Format email tidak valid.',
      'any.required': 'Email wajib diisi.',
    }),

  password: Joi.string()
    .min(8)
    .max(128)
    .required()
    .messages({
      'string.min': 'Password minimal 8 karakter.',
      'any.required': 'Password wajib diisi.',
    }),
});

// ─── Skema Validasi Login ─────────────────────────────────
const loginSchema = Joi.object({
  email: Joi.string()
    .trim()
    .email()
    .lowercase()
    .required()
    .messages({ 
      'any.required': 'Email wajib diisi.' 
    }),

  password: Joi.string()
    .required()
    .messages({ 
      'any.required': 'Password wajib diisi.' 
    }),
});

// ─── Skema Validasi Refresh Token ─────────────────────────
const refreshSchema = Joi.object({
  refreshToken: Joi.string()
    .required()
    .messages({ 
      'any.required': 'refreshToken wajib disertakan.' 
    }),
});

module.exports = { registerSchema, loginSchema, refreshSchema };