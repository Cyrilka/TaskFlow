import React,{createContext,useState,useEffect} from "react";
import { saveToStorage, loadFromStorage } from "../utils/localStorage.js";
export const TaskContext = createContext();
export const TaskProvider = ({children})=>{
  const [tasks,setTasks]=useState(loadFromStorage("tasks")||[]);
  const [history,setHistory]=useState(loadFromStorage("history")||[]);
  useEffect(()=>saveToStorage("tasks",tasks),[tasks]);
  useEffect(()=>saveToStorage("history",history),[history]);
  const addTask=(task)=>{ setTasks([...tasks,task]); setHistory([...history, `Added task: ${task.title}`]); };
  const updateTask=(id,data)=>{ setTasks(tasks.map(t=>t.id===id?{...t,...data}:t)); setHistory([...history,`Updated task: ${id}`]); };
  const moveTask=(id,status)=>{ setTasks(tasks.map(t=>t.id===id?{...t,status}:t)); setHistory([...history,`Moved task: ${id} to ${status}`]); };
  return <TaskContext.Provider value={{tasks,addTask,updateTask,moveTask,history}}>{children}</TaskContext.Provider>;
};