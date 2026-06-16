const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const config = require('../config');

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: config.appName,
      version: config.version,
      description: 'REST API untuk capstone project Web Advanced Development (UTS Edition).',
    },
    servers: [
      { 
        url: `http://localhost:${config.port}`, 
        description: 'Base URL (Auth & Utils)' 
      },
      { 
        url: `http://localhost:${config.port}/api/v1`, 
        description: 'V1 API (Terproteksi JWT)' 
      }
    ],
    // ─── DAFTAR SEMUA ENDPOINT (BIAR MUNCUL BERJEJER) ───────────────────
    paths: {
      // --- AUTHENTICATION ---
      '/auth/register': {
        post: {
          summary: 'Mendaftarkan user baru',
          tags: ['Authentication'],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string' }, email: { type: 'string' }, password: { type: 'string' } } } } }
          },
          responses: { 201: { description: 'User berhasil didaftarkan' } }
        }
      },
      '/auth/login': {
        post: {
          summary: 'Login user dan menghasilkan token',
          tags: ['Authentication'],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object', properties: { email: { type: 'string' }, password: { type: 'string' } } } } }
          },
          responses: { 200: { description: 'Login sukses' } }
        }
      },

      // --- TASKS (CRUD) ---
      '/api/v1/tasks': {
        get: {
          summary: 'Ambil daftar task dengan pagination, filtering, dan sorting',
          tags: ['Tasks'],
          security: [{ bearerAuth: [] }],
          parameters: [
            { in: 'query', name: 'status', schema: { type: 'string', enum: ['todo', 'in_progress', 'done'] }, description: 'Filter berdasarkan status' },
            { in: 'query', name: 'limit', schema: { type: 'integer', default: 10 }, description: 'Jumlah data per halaman' },
            { in: 'query', name: 'offset', schema: { type: 'integer', default: 0 }, description: 'Jumlah data yang dilewati' }
          ],
          responses: { 200: { description: 'Berhasil mengambil daftar task' } }
        },
        post: {
          summary: 'Buat task baru',
          tags: ['Tasks'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateTask' } } }
          },
          responses: { 201: { description: 'Task berhasil dibuat' } }
        }
      },

      // --- USERS ---
      '/api/v1/users': {
        get: {
          summary: 'Menampilkan profil user yang sedang login',
          tags: ['Users'],
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Berhasil mengambil data profil' } }
        }
      },

      // --- REMINDERS (FITUR MANDIRI UTS) ---
      '/api/v1/reminders/upcoming': {
        get: {
          summary: 'Mengambil semua pengingat mendatang (Fitur Mandiri UTS)',
          tags: ['Reminders'],
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'Berhasil mengambil daftar pengingat mendatang' },
            401: { description: 'Token tidak valid atau tidak dikirim' }
          }
        }
      }
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      // ─── MODEL DATABASE (Sesuai Permintaan Dosen) ──────────────────────
      schemas: {
        CreateTask: {
          type: 'object',
          required: ['title'],
          properties: {
            title: { type: 'string', example: 'Belajar Joi Validation' },
            description: { type: 'string', example: 'Mempelajari cara validasi input dengan Joi' },
            status: { type: 'string', enum: ['todo', 'in_progress', 'done'], default: 'todo' },
            priority: { type: 'string', enum: ['low', 'medium', 'high'], default: 'medium' },
            dueDate: { type: 'string', format: 'date-time', example: '2026-12-31T00:00:00Z' },
          },
        },
        Task: {
          allOf: [
            { '$ref': '#/components/schemas/CreateTask' },
            { 
              type: 'object', 
              properties: {
                id: { type: 'integer', example: 1 },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' },
              }
            },
          ],
        },
        // --- MODEL TAMBAHAN UTS ---
        Category: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'Kuliah' }
          }
        },
        Reminder: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            taskId: { type: 'integer', example: 3 },
            userId: { type: 'integer', example: 1 },
            remindAt: { type: 'string', format: 'date-time', example: '2026-06-20T09:00:00Z' },
            isSent: { type: 'boolean', example: false }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                code: { type: 'string', example: 'VALIDATION_ERROR' },
                message: { type: 'string', example: 'Data yang dikirim tidak valid.' },
              },
            },
          },
        },
      },
    },
    tags: [
      { name: 'Authentication', description: 'Operasi Registrasi dan Login Sesi' },
      { name: 'Tasks', description: 'Operasi CRUD untuk resource Task' },
      { name: 'Users', description: 'Manajemen data profil Pengguna' },
      { name: 'Reminders', description: 'Fitur Khusus Pengingat Masa Depan' }
    ],
  },
  apis: [], 
};

const swaggerSpec = swaggerJsdoc(options);

const setupSwagger = (app) => {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customSiteTitle: `${config.appName} - API Docs`,
  }));

  app.get('/api/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  console.log(` Docs: http://localhost:${config.port}/api/docs`);
};

module.exports = setupSwagger;