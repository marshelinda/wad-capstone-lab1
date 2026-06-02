const store = require('../data/tasks.store');
// ─── GET /api/v1/tasks ──────────────────────────────────────
const listTasks = (req, res) => {
const { status, priority, sort, order, limit, offset } = req.query;
const { data, total } = store.findAll({ status, priority, sort, order, limit,
offset });
const numLimit = Number(limit);
const numOffset = Number(offset);
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
};
// ─── POST /api/v1/tasks ─────────────────────────────────────
const createTask = (req, res) => {
const task = store.create(req.body);
// 201 Created + Location header menunjuk ke resource baru
res.status(201)
.set('Location', `/api/v1/tasks/${task.id}`)
.json({ data: task });
};
// ─── GET /api/v1/tasks/:id ──────────────────────────────────
const getTask = (req, res) => {
const task = store.findById(req.params.id);
if (!task) {
return res.status(404).json({
error: {
code: 'NOT_FOUND',
message: `Task dengan ID ${req.params.id} tidak ditemukan.`,
},
});
}
res.status(200).json({ data: task });
};
// ─── PUT /api/v1/tasks/:id (Full Replace) ───────────────────
const replaceTask = (req, res) => {
const task = store.replace(req.params.id, req.body);
if (!task) {
return res.status(404).json({
error: { code: 'NOT_FOUND', message: `Task dengan ID ${req.params.id}
tidak ditemukan.` },
});
}
res.status(200).json({ data: task });
};
// ─── PATCH /api/v1/tasks/:id (Partial Update) ───────────────
const updateTask = (req, res) => {
const task = store.update(req.params.id, req.body);
if (!task) {
return res.status(404).json({
error: { code: 'NOT_FOUND', message: `Task dengan ID ${req.params.id}
tidak ditemukan.` },
});
}
res.status(200).json({ data: task });
};
// ─── DELETE /api/v1/tasks/:id ───────────────────────────────
const deleteTask = (req, res) => {
const deleted = store.remove(req.params.id);
if (!deleted) {
return res.status(404).json({
error: { code: 'NOT_FOUND', message: `Task dengan ID ${req.params.id}
tidak ditemukan.` },
});
}
// 204 No Content — sukses hapus, tidak ada body
res.status(204).send();
};
module.exports = { listTasks, createTask, getTask, replaceTask, updateTask,
deleteTask };