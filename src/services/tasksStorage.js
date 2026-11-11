// Calendar & Tasks Storage Service for Aura Island
// Manages upcoming calendar events, tasks, and reminders. Persisted in localStorage.

const STORAGE_KEY = "aura_calendar_tasks";

const DEFAULT_SAMPLE_TASKS = [
  {
    id: "task_sample_1",
    title: "Project Review & Milestones",
    date: new Date().toISOString().split("T")[0],
    time: "10:00 AM",
    tag: "Work",
    color: "#0a84ff",
    completed: false,
  },
  {
    id: "task_sample_2",
    title: "Team Standup Meeting",
    date: new Date().toISOString().split("T")[0],
    time: "02:30 PM",
    tag: "Meeting",
    color: "#bf5af2",
    completed: true,
  },
  {
    id: "task_sample_3",
    title: "Deep Focus Session",
    date: new Date().toISOString().split("T")[0],
    time: "04:00 PM",
    tag: "Focus",
    color: "#ff9f0a",
    completed: false,
  },
];

export class TasksStorage {
  constructor() {
    this.listeners = new Set();
    this.tasks = this.load();
  }

  load() {
    try {
      if (typeof localStorage !== "undefined") {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      }
    } catch (_) {}
    return [...DEFAULT_SAMPLE_TASKS];
  }

  save() {
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.tasks));
      }
    } catch (_) {}
    this.notify();
  }

  getTasks() {
    return [...this.tasks];
  }

  getTasksForDate(dateStr) {
    return this.tasks.filter((t) => t.date === dateStr);
  }

  addTask({ title, date, time = "All Day", tag = "Task", color = "#0a84ff" }) {
    if (!title || !title.trim()) return null;

    const newTask = {
      id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      title: title.trim(),
      date: date || new Date().toISOString().split("T")[0],
      time: time || "All Day",
      tag,
      color,
      completed: false,
      createdAt: Date.now(),
    };

    this.tasks.push(newTask);
    this.save();
    return newTask;
  }

  toggleTask(id) {
    const task = this.tasks.find((t) => t.id === id);
    if (task) {
      task.completed = !task.completed;
      this.save();
    }
  }

  deleteTask(id) {
    this.tasks = this.tasks.filter((t) => t.id !== id);
    this.save();
  }

  subscribe(callback) {
    this.listeners.add(callback);
    callback(this.getTasks());
    return () => this.listeners.delete(callback);
  }

  notify() {
    const list = this.getTasks();
    for (const listener of this.listeners) {
      try {
        listener(list);
      } catch (_) {}
    }
  }
}

export const tasksStorage = new TasksStorage();

if (typeof module !== "undefined" && module.exports) {
  module.exports = { TasksStorage, tasksStorage };
}
