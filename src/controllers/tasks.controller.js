const taskRepo = require('../repositories/task.repository');

// ─── GET /tasks (List dengan Pagination, Filter, & RBAC) ───
const listTasks = async (req, res, next) => {
  try {
    const { status, priority, sort, order, limit, offset } = req.query;

    // UPDATE: User biasa hanya melihat task miliknya; Admin bypass melihat semua task
    const userId = req.user.role === 'ADMIN' ? undefined : req.user.userId;
    
    const { data, total } = await taskRepo.findMany({ 
      userId, // Menyaring data sesuai hak akses role
      status, 
      priority, 
      sort, 
      order, 
      limit, 
      offset 
    });

    const numLimit = Number(limit) || 10;
    const numOffset = Number(offset) || 0;

    res.status(200).json({
      data,
      pagination: {
        total,
        limit: numLimit,
        offset: numOffset,
        hasNext: numOffset + numLimit < total,
        hasPrev: numOffset > 0,
        nextOffset: numOffset + numLimit < total ? numOffset + numLimit : null,
        prevOffset: numOffset > 0 ? Math.max(0, numOffset - numLimit) : null,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── POST /tasks (Buat Task Baru - Terkunci JWT) ─────────
const createTask = async (req, res, next) => {
  try {
    // UPDATE: Gunakan userId murni dari token pengaman, abaikan data dari request body!
    const task = await taskRepo.create({ 
      ...req.body, 
      userId: req.user.userId 
    });

    res.status(201)
      .set('Location', `/api/v1/tasks/${task.id}`)
      .json({ data: task });
  } catch (err) {
    next(err);
  }
};

// ─── GET /tasks/:id (Ambil Detail Satu Task) ────────────
const getTask = async (req, res, next) => {
  try {
    const task = await taskRepo.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ 
        error: { 
          code: 'NOT_FOUND', 
          message: `Task ID ${req.params.id} tidak ditemukan.` 
        } 
      });
    }

    res.status(200).json({ data: task });
  } catch (err) {
    next(err);
  }
};

// ─── PATCH /tasks/:id (Update Task) ─────────────────────
const updateTask = async (req, res, next) => {
  try {
    const task = await taskRepo.update(req.params.id, req.body);
    
    if (!task) {
      return res.status(404).json({ 
        error: { 
          code: 'NOT_FOUND', 
          message: `Task ID ${req.params.id} tidak ditemukan.` 
        } 
      });
    }

    res.status(200).json({ data: task });
  } catch (err) {
    next(err);
  }
};

// ─── DELETE /tasks/:id (Hapus Task) ────────────────────
const deleteTask = async (req, res, next) => {
  try {
    const ok = await taskRepo.remove(req.params.id);
    
    if (!ok) {
      return res.status(404).json({ 
        error: { 
          code: 'NOT_FOUND', 
          message: `Task ID ${req.params.id} tidak ditemukan.` 
        } 
      });
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

// ─── GET /users/:userId/tasks (List Task per User) ─────
const getTasksByUser = async (req, res, next) => {
  try {
    const result = await taskRepo.findByUser(req.params.userId);
    
    if (!result) {
      return res.status(404).json({ 
        error: { 
          code: 'NOT_FOUND', 
          message: `User ID ${req.params.userId} tidak ditemukan.` 
        } 
      });
    }

    res.status(200).json({
      data: {
        user: { 
          id: result.id, 
          name: result.name, 
          email: result.email 
        },
        tasks: result.tasks,
        total: result.tasks.length
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { 
  listTasks, 
  createTask, 
  getTask, 
  updateTask, 
  deleteTask, 
  getTasksByUser 
};