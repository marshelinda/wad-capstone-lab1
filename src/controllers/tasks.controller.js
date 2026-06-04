const taskRepo = require('../repositories/task.repository');

// ─── GET /tasks (List dengan Pagination & Filter) ──────
const listTasks = async (req, res, next) => {
  try {
    const { status, priority, sort, order, limit, offset } = req.query;
    
    const { data, total } = await taskRepo.findMany({ 
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

// ─── POST /tasks (Buat Task Baru) ──────────────────────
const createTask = async (req, res, next) => {
  try {
    // Memastikan userId dikonversi ke Number agar dikenali database dengan benar
    const userIdInput = req.body.userId ? Number(req.body.userId) : undefined;

    // Kirim data murni tanpa fallback '|| 1' agar jika ID 999 dimasukkan, DB melempar FK Error (500)
    const task = await taskRepo.create({ 
      ...req.body, 
      userId: userIdInput
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

// ─── PATCH/PUT /tasks/:id (Update Task) ─────────────────
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