// Simulasi database menggunakan array in-memory
let tasks = [
  { 
    id: 1, 
    title: 'Setup project', 
    status: 'done', 
    priority: 'high', 
    createdAt: new Date('2024-01-10').toISOString(), 
    updatedAt: new Date('2024-01-10').toISOString() 
  },
  { 
    id: 2, 
    title: 'Belajar Express', 
    status: 'in_progress', 
    priority: 'high', 
    createdAt: new Date('2024-01-11').toISOString(), 
    updatedAt: new Date('2024-01-11').toISOString() 
  },
  { 
    id: 3, 
    title: 'Desain REST API', 
    status: 'todo', 
    priority: 'medium', 
    createdAt: new Date('2024-01-12').toISOString(), 
    updatedAt: new Date('2024-01-12').toISOString() 
  },
  { 
    id: 4, 
    title: 'Setup PostgreSQL', 
    status: 'todo', 
    priority: 'medium', 
    createdAt: new Date('2024-01-13').toISOString(), 
    updatedAt: new Date('2024-01-13').toISOString() 
  },
  { 
    id: 5, 
    title: 'Belajar GraphQL', 
    status: 'todo', 
    priority: 'low', 
    createdAt: new Date('2024-01-14').toISOString(), 
    updatedAt: new Date('2024-01-14').toISOString() 
  },
];

let nextId = 6; // Auto-increment sederhana

const store = {
  // Ambil semua task (dengan filter opsional)
  findAll({ status, priority, sort = "createdAt", order = "desc", limit = 10, offset = 0 } = {}) {
    let result = [...tasks];

    // Filtering
    if (status) result = result.filter(t => t.status === status);
    if (priority) result = result.filter(t => t.priority === priority);

    // Sorting
    result.sort((a, b) => {
      const valA = a[sort] || '';
      const valB = b[sort] || '';
      const cmp = valA < valB ? -1 : valA > valB ? 1 : 0;
      return order === 'asc' ? cmp : -cmp;
    });

    const total = result.length;
    const data = result.slice(Number(offset), Number(offset) + Number(limit));
    
    return { data, total };
  },

  // Cari satu task by ID
  findById(id) {
    return tasks.find(t => t.id === Number(id)) || null;
  },

  // Buat task baru
  create(payload) {
    const now = new Date().toISOString();
    const task = { id: nextId++, ...payload, createdAt: now, updatedAt: now };
    tasks.push(task);
    return task;
  },

  // Ganti seluruh task (PUT)
  replace(id, payload) {
    const idx = tasks.findIndex(t => t.id === Number(id));
    if (idx === -1) return null;
    
    const now = new Date().toISOString();
    tasks[idx] = { 
      id: Number(id), 
      ...payload, 
      createdAt: tasks[idx].createdAt, 
      updatedAt: now 
    };
    return tasks[idx];
  },

  // Perbarui sebagian field (PATCH)
  update(id, payload) {
    const idx = tasks.findIndex(t => t.id === Number(id));
    if (idx === -1) return null;
    
    tasks[idx] = { 
      ...tasks[idx], 
      ...payload, 
      updatedAt: new Date().toISOString() 
    };
    return tasks[idx];
  },

  // Hapus task
  remove(id) {
    const idx = tasks.findIndex(t => t.id === Number(id));
    if (idx === -1) return false;
    
    tasks.splice(idx, 1);
    return true;
  },
};

module.exports = store;