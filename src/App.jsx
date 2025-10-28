import React, { useState, useEffect, useMemo } from 'react';

const STATUS_COLORS = {
  new: 'bg-blue-200 text-blue-800',
  inprogress: 'bg-orange-200 text-orange-800',
  done: 'bg-green-200 text-green-800',
};

const ASSIGNEES = ['Alice', 'Bob', 'Charlie', 'David'];

export default function App() {
  const STORAGE_KEY = 'taskflow_v3';
  const HISTORY_KEY = 'taskflow_history_v3';

  const [dark, setDark] = useState(() => JSON.parse(localStorage.getItem('taskflow_theme') || 'false'));
  const [tasks, setTasks] = useState(() => JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'));
  const [history, setHistory] = useState(() => JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'));
  const [filter, setFilter] = useState({ status: 'all', assignee: 'all' });
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const [showHistory, setShowHistory] = useState(false);

  // Theme
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('taskflow_theme', JSON.stringify(dark));
  }, [dark]);

  // Save tasks
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  // Save history
  useEffect(() => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }, [history]);

  // Utility to log history
  const log = (action, task) => {
    const entry = { id: Date.now().toString(), action, taskTitle: task.title, date: new Date().toISOString() };
    setHistory(prev => [entry, ...prev]);
  };

  // CRUD
  const addTask = (task) => {
    const newTask = { id: Date.now().toString(), status: 'new', subtasks: [], createdAt: new Date().toISOString(), ...task };
    setTasks(prev => [newTask, ...prev]);
    log('Created', newTask);
  };

  const updateTask = (id, updated) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updated } : t));
    const task = tasks.find(t => t.id === id);
    log('Edited', task);
  };

  const removeTask = (id) => {
    const task = tasks.find(t => t.id === id);
    setTasks(prev => prev.filter(t => t.id !== id));
    log('Deleted', task);
  };

  const toggleSubtask = (taskId, subIndex) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      const newSubtasks = t.subtasks.map((s, idx) => idx === subIndex ? { ...s, completed: !s.completed } : s);
      return { ...t, subtasks: newSubtasks };
    }));
  };

  const moveTask = (id, newStatus) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
  };

  // Filters + search
  const filteredTasks = useMemo(() => {
    return tasks
      .filter(t => (filter.status === 'all' || t.status === filter.status))
      .filter(t => (filter.assignee === 'all' || t.assignee === filter.assignee))
      .filter(t => t.title.toLowerCase().includes(search.toLowerCase()) || (t.description || '').toLowerCase().includes(search.toLowerCase()))
      .sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [tasks, filter, search]);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors">
      <div className="max-w-5xl mx-auto p-6">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h1 className="text-3xl font-bold">TaskFlow Pro SPA</h1>
          <div className="flex gap-2">
            <button onClick={() => setDark(!dark)} className="px-3 py-1 border rounded">{dark ? 'Light' : 'Dark'}</button>
            <button onClick={() => setShowHistory(!showHistory)} className="px-3 py-1 border rounded">History</button>
          </div>
        </header>

        {/* Filters */}
        <Filters filter={filter} setFilter={setFilter} search={search} setSearch={setSearch} />

        {/* Task Form */}
        <TaskForm onSave={addTask} editing={editing} onUpdate={updateTask} onCancel={() => setEditing(null)} />

        {/* Tasks */}
        <div className="divide-y divide-gray-200 dark:divide-gray-700 mt-4">
          {filteredTasks.length === 0 && <div className="p-6 text-center text-gray-500">No tasks found</div>}
          {filteredTasks.map(task => (
            <TaskItem
              key={task.id}
              task={task}
              onEdit={() => setEditing(task)}
              onDelete={() => removeTask(task.id)}
              onToggleSubtask={toggleSubtask}
              onMove={moveTask}
            />
          ))}
        </div>

        {/* History Panel */}
        {showHistory && <HistoryPanel history={history} />}

        <footer className="mt-8 text-center text-sm text-gray-500">
          Developed by Kirill Korostyliev • TaskFlow 2021 → 2025 Modernization
        </footer>
      </div>
    </div>
  );
}

// ------------------- Components -------------------

function Filters({ filter, setFilter, search, setSearch }) {
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
    </div>
  );
}

function TaskForm({ onSave, editing, onUpdate, onCancel }) {
  const [title, setTitle] = useState(editing?.title || '');
  const [description, setDescription] = useState(editing?.description || '');
  const [assignee, setAssignee] = useState(editing?.assignee || ASSIGNEES[0]);
  const [dueDate, setDueDate] = useState(editing?.dueDate || '');
  const [subtasks, setSubtasks] = useState(editing?.subtasks || []);

  useEffect(() => {
    if(editing){
      setTitle(editing.title);
      setDescription(editing.description || '');
      setAssignee(editing.assignee || ASSIGNEES[0]);
      setDueDate(editing.dueDate || '');
      setSubtasks(editing.subtasks || []);
    }
  }, [editing]);

  const submit = e => {
    e.preventDefault();
    if(!title.trim()) return;
    const payload = { title, description, assignee, dueDate, subtasks };
    if(editing) onUpdate(editing.id, payload); else onSave(payload);
    setTitle(''); setDescription(''); setAssignee(ASSIGNEES[0]); setDueDate(''); setSubtasks([]);
    if(editing) onCancel();
  };

  const addSubtask = () => setSubtasks(prev => [...prev, { title: '', completed: false }]);
  const updateSubtask = (idx, title) => setSubtasks(prev => prev.map((s,i) => i===idx?{...s,title}:s));

  return (
    <form onSubmit={submit} className="flex flex-col gap-2 mb-2 border p-2 rounded bg-white dark:bg-gray-800">
      <div className="flex gap-2 flex-wrap">
        <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Task title" className="px-2 py-1 border rounded flex-1"/>
        <input value={description} onChange={e=>setDescription(e.target.value)} placeholder="Description" className="px-2 py-1 border rounded flex-1"/>
        <select value={assignee} onChange={e=>setAssignee(e.target.value)} className="px-2 py-1 border rounded">
          {ASSIGNEES.map(a => <option key={a}>{a}</option>)}
        </select>
        <input type="date" value={dueDate} onChange={e=>setDueDate(e.target.value)} className="px-2 py-1 border rounded"/>
      </div>

      {/* Subtasks */}
      <div className="flex flex-col gap-1">
        {subtasks.map((s, idx) => (
          <input key={idx} value={s.title} onChange={e=>updateSubtask(idx,e.target.value)} placeholder="Subtask" className="px-2 py-1 border rounded"/>
        ))}
        <button type="button" onClick={addSubtask} className="px-2 py-1 border rounded text-sm mt-1">Add Subtask</button>
      </div>

      <div className="flex gap-2 mt-2">
        <button type="submit" className="px-3 py-1 border rounded">{editing ? 'Update' : 'Add'}</button>
        {editing && <button type="button" onClick={onCancel} className="px-3 py-1 border rounded">Cancel</button>}
      </div>
    </form>
  );
}

function TaskItem({ task, onEdit, onDelete, onToggleSubtask, onMove }) {
  const statuses = ['new','inprogress','done'];

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-3 gap-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded">
      <div className="flex flex-col gap-1">
        <div className="flex gap-2 items-center">
          <span className={`font-semibold px-2 py-1 rounded cursor-pointer ${STATUS_COLORS[task.status]}`} draggable onDragStart={e=>e.dataTransfer.setData('text/plain', task.id)}>
            {task.title}
          </span>
          <span className="text-xs text-gray-400">{task.assignee}</span>
          {task.dueDate && <span className="text-xs text-gray-400">Due: {task.dueDate}</span>}
        </div>
        {task.description && <div className="text-sm text-gray-500 dark:text-gray-400">{task.description}</div>}
        {task.subtasks.length > 0 && (
          <div className="flex flex-col gap-1 ml-4">
            {task.subtasks.map((s, idx) => (
              <label key={idx} className="flex items-center gap-1 text-sm">
                <input type="checkbox" checked={s.completed} onChange={()=>onToggleSubtask(task.id, idx)}/>
                {s.title || 'Unnamed subtask'}
              </label>
            ))}
          </div>
        )}
        {/* Drag & Drop targets */}
        <div className="flex gap-1 mt-1">
          {statuses.map(s => (
            <button key={s} onClick={()=>onMove(task.id,s)} className="px-2 py-0.5 border rounded text-xs">{s}</button>
          ))}
        </div>
      </div>

      <div className="flex gap-1 mt-1 md:mt-0">
        <button onClick={onEdit} className="px-2 py-1 border rounded text-xs">Edit</button>
        <button onClick={onDelete} className="px-2 py-1 border rounded text-xs">Delete</button>
      </div>
    </div>
  );
}

function HistoryPanel({ history }) {
  return (
    <div className="mt-4 border rounded p-2 bg-gray-50 dark:bg-gray-800 max-h-64 overflow-y-auto">
      <h2 className="font-semibold mb-2">History</h2>
      {history.length === 0 && <div className="text-gray-500 text-sm">No actions yet</div>}
      {history.map(h => (
        <div key={h.id} className="text-sm text-gray-700 dark:text-gray-300 mb-1">
          [{new Date(h.date).toLocaleTimeString()}] {h.action}: {h.taskTitle}
        </div>
      ))}
    </div>
  );
}
