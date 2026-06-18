const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/auth.controller');
const validate = require('../middleware/validate');
const authenticate = require('../middleware/authenticate');
const { registerSchema, loginSchema, refreshSchema } = require('../validators/auth.validator');

// BARU: Import rate limiter yang sudah kamu buat di config
const { authLimiter, sensitiveLimiter } = require('../config/rateLimiter');

/**
 * @swagger
 * tags:
 * name: Auth
 * description: Endpoint autentikasi
 */

/**
 * @swagger
 * /auth/register:
 * post:
 * summary: Registrasi user baru
 * tags: [Auth]
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required: [name, email, password]
 * properties:
 * name: { type: string, example: 'Budi Santoso' }
 * email: { type: string, example: 'budi@example.com' }
 * password: { type: string, minLength: 8, example: 'P@ssw0rd!' }
 * responses:
 * 201:
 * description: Registrasi berhasil
 * 409:
 * description: Email sudah terdaftar
 */
// Tambahkan sensitiveLimiter untuk membatasi spam registrasi akun baru
router.post('/register', sensitiveLimiter, validate(registerSchema), ctrl.register);

/**
 * @swagger
 * /auth/login:
 * post:
 * summary: Login dan dapatkan token
 * tags: [Auth]
 */
// Tambahkan authLimiter di sini untuk mencegah Brute-Force Login (Langkah 11 & 12)
router.post('/login', authLimiter, validate(loginSchema), ctrl.login);

// Tambahkan sensitiveLimiter untuk endpoint krusial pembaruan token
router.post('/refresh', sensitiveLimiter, validate(refreshSchema), ctrl.refresh);

router.post('/logout', ctrl.logout);

// Route yang dilindungi — butuh access token
router.get('/me', authenticate, ctrl.me);

module.exports = router;