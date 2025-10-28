import React, { useState, useEffect, useMemo } from 'react';

export default function App() {
  const STORAGE_KEY = 'taskflow_tasks_v1';
  const [dark, setDark] = useState(() => JSON.parse(localStorage.getItem('taskflow_theme') || 'false'));
  const [tasks, setTasks] = useState(() => JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'));
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState(null);

  useEffect(() => { document.documentElement.classList.toggle('dark', dark); localStorage.setItem('taskflow_theme', JSON.stringify(dark)); }, [dark]);
  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)); }, [tasks]);

  const visible = useMemo(() => {
    let list = tasks;
    if (filter !== 'all') list = list.filter(t => t.status === filter);
    if (query.trim()) list = list.filter(t => t.title.toLowerCase().includes(query.toLowerCase()));
    return list;
  }, [tasks, filter, query]);

  const addTask = (payload) => setTasks(prev => [{ id: Date.now().toString(), createdAt: new Date().toISOString(), status: 'new', ...payload }, ...prev]);
  const updateTask = (id, payload) => setTasks(prev => prev.map(t => t.id === id ? { ...t, ...payload } : t));
  const removeTask = (id) => setTasks(prev => prev.filter(t => t.id !== id));
  const toggleStatus = (id) => setTasks(prev => prev.map(t => {
    if (t.id !== id) return t;
    const order = ['new','inprogress','done'];
    const idx = order.indexOf(t.status);
    return { ...t, status: order[(idx+1)%order.length] };
  }));

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors">
      <div className="max-w-4xl mx-auto p-6">
        <header className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">TaskFlow</h1>
          <button onClick={() => setDark(!dark)} className="px-3 py-1 border rounded">{dark ? 'Light' : 'Dark'}</button>
        </header>

        <div className="flex gap-4 mb-4">
          <button onClick={() => setFilter('all')} className="px-2 py-1 border rounded">All</button>
          <button onClick={() => setFilter('new')} className="px-2 py-1 border rounded">New</button>
          <button onClick={() => setFilter('inprogress')} className="px-2 py-1 border rounded">In Progress</button>
          <button onClick={() => setFilter('done')} className="px-2 py-1 border rounded">Done</button>
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search..." className="px-2 py-1 border rounded flex-1"/>
        </div>

        <TaskForm onSave={addTask} editing={editing} onUpdate={updateTask} onCancel={() => setEditing(null)} />

        <div className="divide-y divide-gray-200 dark:divide-gray-700 mt-4">
          {visible.length === 0 && <div className="p-6 text-center text-gray-500">No tasks yet!</div>}
          {visible.map(task => <TaskItem key={task.id} task={task} onEdit={() => setEditing(task)} onDelete={() => removeTask(task.id)} onToggle={() => toggleStatus(task.id)} />)}
        </div>

        <footer className="mt-8 text-center text-sm text-gray-500">
          Developed by Kirill Korostyliev • TaskFlow 2021 → 2025 Modernization
        </footer>
      </div>
    </div>
  );
}

function TaskForm({ onSave, editing, onUpdate, onCancel }) {
  const [title, setTitle] = useState(editing ? editing.title : '');
  useEffect(() => { if(editing) setTitle(editing.title); }, [editing]);

  const submit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    if(editing) onUpdate(editing.id, { title }); else onSave({ title });
    setTitle('');
    if(editing) onCancel();
  };

  return (
    <form onSubmit={submit} className="flex gap-2 mb-2">
      <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Task title" className="flex-1 px-2 py-1 border rounded"/>
      <button type="submit" className="px-3 py-1 border rounded">{editing ? 'Update' : 'Add'}</button>
      {editing && <button type="button" onClick={onCancel} className="px-3 py-1 border rounded">Cancel</button>}
    </form>
  );
}

function TaskItem({ task, onEdit, onDelete, onToggle }) {
  return (
    <div className="flex justify-between items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-800">
      <div className="flex gap-2 items-center">
        <span className="cursor-pointer font-medium" onClick={onToggle}>{task.title}</span>
        <span className="text-xs text-gray-400">{task.status}</span>
      </div>
      <div className="flex gap-1">
        <button onClick={onEdit} className="px-2 py-1 border rounded text-xs">Edit</button>
        <button onClick={onDelete} className="px-2 py-1 border rounded text-xs">Delete</button>
      </div>
    </div>
  );
}
