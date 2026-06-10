const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/auth.controller');
const validate = require('../middleware/validate');
const authenticate = require('../middleware/authenticate');
const { registerSchema, loginSchema, refreshSchema } = require('../validators/auth.validator');

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
router.post('/register', validate(registerSchema), ctrl.register);

/**
 * @swagger
 * /auth/login:
 * post:
 * summary: Login dan dapatkan token
 * tags: [Auth]
 */
router.post('/login', validate(loginSchema), ctrl.login);

router.post('/refresh', validate(refreshSchema), ctrl.refresh);

router.post('/logout', ctrl.logout);

// Route yang dilindungi — butuh access token
router.get('/me', authenticate, ctrl.me);

module.exports = router;