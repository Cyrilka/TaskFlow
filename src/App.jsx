import React, { useState, useEffect, useMemo } from 'react';

const STATUS_COLORS = {
  new: 'bg-blue-200 text-blue-800',
  inprogress: 'bg-orange-200 text-orange-800',
  done: 'bg-green-200 text-green-800',
};

const ASSIGNEES = ['Alice', 'Bob', 'Charlie', 'David'];

export default function App() {
  const STORAGE_KEY = 'taskflow_full_v1';
  const [dark, setDark] = useState(() => JSON.parse(localStorage.getItem('taskflow_theme') || 'false'));
  const [tasks, setTasks] = useState(() => JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'));
  const [filter, setFilter] = useState({ status: 'all', assignee: 'all' });
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('createdAt'); // createdAt, dueDate, status
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('taskflow_theme', JSON.stringify(dark));
  }, [dark]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  const addTask = (task) => {
    setTasks(prev => [
      { id: Date.now().toString(), createdAt: new Date().toISOString(), status: 'new', ...task },
      ...prev
    ]);
  };

  const updateTask = (id, task) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...task } : t));
  };

  const removeTask = (id) => setTasks(prev => prev.filter(t => t.id !== id));

  const toggleStatus = (id) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t;
      const order = ['new', 'inprogress', 'done'];
      const idx = order.indexOf(t.status);
      return { ...t, status: order[(idx + 1) % order.length] };
    }));
  };

  const filteredTasks = useMemo(() => {
    return tasks
      .filter(t => (filter.status === 'all' || t.status === filter.status))
      .filter(t => (filter.assignee === 'all' || t.assignee === filter.assignee))
      .filter(t => t.title.toLowerCase().includes(search.toLowerCase()) || (t.description || '').toLowerCase().includes(search.toLowerCase()))
      .sort((a,b) => {
        if(sort === 'createdAt') return new Date(b.createdAt) - new Date(a.createdAt);
        if(sort === 'dueDate') return new Date(a.dueDate || 0) - new Date(b.dueDate || 0);
        if(sort === 'status') return a.status.localeCompare(b.status);
        return 0;
      });
  }, [tasks, filter, search, sort]);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors">
      <div className="max-w-5xl mx-auto p-6">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h1 className="text-3xl font-bold">TaskFlow Super SPA</h1>
          <button onClick={() => setDark(!dark)} className="px-3 py-1 border rounded">{dark ? 'Light' : 'Dark'}</button>
        </header>

        <Filters
          filter={filter}
          setFilter={setFilter}
          search={search}
          setSearch={setSearch}
          sort={sort}
          setSort={setSort}
        />

        <TaskForm onSave={addTask} editing={editing} onUpdate={updateTask} onCancel={() => setEditing(null)} />

        <div className="divide-y divide-gray-200 dark:divide-gray-700 mt-4">
          {filteredTasks.length === 0 && <div className="p-6 text-center text-gray-500">No tasks found</div>}
          {filteredTasks.map(task => (
            <TaskItem
              key={task.id}
              task={task}
              onEdit={() => setEditing(task)}
              onDelete={() => removeTask(task.id)}
              onToggle={() => toggleStatus(task.id)}
            />
          ))}
        </div>

        <footer className="mt-8 text-center text-sm text-gray-500">
          Developed by Kirill Korostyliev • TaskFlow 2021 → 2025 Modernization
        </footer>
      </div>
    </div>
  );
}

function Filters({ filter, setFilter, search, setSearch, sort, setSort }) {
  return (
    <div className="flex flex-wrap gap-3 mb-4 items-center">
      <select value={filter.status} onChange={e => setFilter(f => ({...f, status: e.target.value}))} className="px-2 py-1 border rounded">
        <option value="all">All Status</option>
        <option value="new">New</option>
        <option value="inprogress">In Progress</option>
        <option value="done">Done</option>
      </select>
      <select value={filter.assignee} onChange={e => setFilter(f => ({...f, assignee: e.target.value}))} className="px-2 py-1 border rounded">
        <option value="all">All Assignees</option>
        {ASSIGNEES.map(a => <option key={a} value={a}>{a}</option>)}
      </select>
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="px-2 py-1 border rounded flex-1"/>
      <select value={sort} onChange={e => setSort(e.target.value)} className="px-2 py-1 border rounded">
        <option value="createdAt">Sort by Created</option>
        <option value="dueDate">Sort by Due Date</option>
        <option value="status">Sort by Status</option>
      </select>
    </div>
  );
}

function TaskForm({ onSave, editing, onUpdate, onCancel }) {
  const [title, setTitle] = useState(editing?.title || '');
  const [description, setDescription] = useState(editing?.description || '');
  const [assignee, setAssignee] = useState(editing?.assignee || ASSIGNEES[0]);
  const [dueDate, setDueDate] = useState(editing?.dueDate || '');

  useEffect(() => {
    if(editing){
      setTitle(editing.title);
      setDescription(editing.description || '');
      setAssignee(editing.assignee || ASSIGNEES[0]);
      setDueDate(editing.dueDate || '');
    }
  }, [editing]);

  const submit = e => {
    e.preventDefault();
    if(!title.trim()) return;
    const payload = { title, description, assignee, dueDate };
    if(editing) onUpdate(editing.id, payload); else onSave(payload);
    setTitle(''); setDescription(''); setAssignee(ASSIGNEES[0]); setDueDate('');
    if(editing) onCancel();
  };

  return (
    <form onSubmit={submit} className="flex flex-col md:flex-row gap-2 mb-2">
      <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Task title" className="px-2 py-1 border rounded flex-1"/>
      <input value={description} onChange={e=>setDescription(e.target.value)} placeholder="Description" className="px-2 py-1 border rounded flex-1"/>
      <select value={assignee} onChange={e=>setAssignee(e.target.value)} className="px-2 py-1 border rounded">
        {ASSIGNEES.map(a => <option key={a}>{a}</option>)}
      </select>
      <input type="date" value={dueDate} onChange={e=>setDueDate(e.target.value)} className="px-2 py-1 border rounded"/>
      <button type="submit" className="px-3 py-1 border rounded">{editing ? 'Update' : 'Add'}</button>
      {editing && <button type="button" onClick={onCancel} className="px-3 py-1 border rounded">Cancel</button>}
    </form>
  );
}

function TaskItem({ task, onEdit, onDelete, onToggle }) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-3 gap-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded">
      <div className="flex flex-col md:flex-row gap-2 items-start md:items-center">
        <span onClick={onToggle} className={`cursor-pointer font-semibold px-2 py-1 rounded ${STATUS_COLORS[task.status]}`}>{task.title}</span>
        {task.description && <span className="text-sm text-gray-500 dark:text-gray-400">{task.description}</span>}
        <span className="text-xs text-gray-400">{task.assignee}</span>
        {task.dueDate && <span className="text-xs text-gray-400">Due: {task.dueDate}</span>}
      </div>
      <div
