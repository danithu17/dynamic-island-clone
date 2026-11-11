import React, { useState, useEffect } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  Timer,
  Clock,
  Sparkles,
} from "lucide-react";
import { tasksStorage } from "../../services/tasksStorage";

export default function ClockPanel({
  onStartTimer,
  timerRunning = false,
  timerSecondsLeft = 0,
  onStopTimer,
  onClose,
}) {
  const todayDate = new Date();
  const [viewYear, setViewYear] = useState(todayDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(todayDate.getMonth()); // 0-indexed
  const [selectedDateStr, setSelectedDateStr] = useState(todayDate.toISOString().split("T")[0]);

  const [tasks, setTasks] = useState([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskTime, setNewTaskTime] = useState("10:00 AM");

  useEffect(() => {
    const unsub = tasksStorage.subscribe((list) => {
      setTasks(list || []);
    });
    return unsub;
  }, []);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const dayLabels = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const handleGoToday = () => {
    setViewYear(todayDate.getFullYear());
    setViewMonth(todayDate.getMonth());
    setSelectedDateStr(todayDate.toISOString().split("T")[0]);
  };

  // Calendar matrix calculations
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const calendarDays = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarDays.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push(d);
  }

  const formatPadded = (n) => (n < 10 ? `0${n}` : `${n}`);

  const handleSelectDay = (day) => {
    if (!day) return;
    const dateStr = `${viewYear}-${formatPadded(viewMonth + 1)}-${formatPadded(day)}`;
    setSelectedDateStr(dateStr);
  };

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    tasksStorage.addTask({
      title: newTaskTitle.trim(),
      date: selectedDateStr,
      time: newTaskTime || "All Day",
      tag: "Task",
      color: "#0a84ff",
    });

    setNewTaskTitle("");
  };

  const selectedTasks = tasks.filter((t) => t.date === selectedDateStr);

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, width: 320, padding: "2px" }}>
      {/* Calendar Header with Controls */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 6px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <CalendarIcon size={15} color="#0a84ff" />
          <span style={{ fontSize: 13, fontWeight: 700 }}>
            {monthNames[viewMonth]} {viewYear}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
          <button
            onClick={handleGoToday}
            style={{
              background: "rgba(255, 255, 255, 0.08)",
              border: "none",
              borderRadius: 6,
              padding: "2px 6px",
              color: "#ffffff",
              fontSize: 10,
              fontWeight: 600,
              cursor: "pointer",
              marginRight: 4,
            }}
          >
            Today
          </button>
          <button
            onClick={handlePrevMonth}
            style={{ background: "transparent", border: "none", color: "#ffffff", cursor: "pointer", padding: 2 }}
            title="Previous Month"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={handleNextMonth}
            style={{ background: "transparent", border: "none", color: "#ffffff", cursor: "pointer", padding: 2 }}
            title="Next Month"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      <div style={{ height: 1, background: "rgba(255, 255, 255, 0.08)", margin: "0 2px" }} />

      {/* Calendar Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, textAlign: "center" }}>
        {dayLabels.map((lbl, i) => (
          <span key={i} style={{ fontSize: 10, fontWeight: 700, opacity: 0.5, padding: "2px 0" }}>
            {lbl}
          </span>
        ))}

        {calendarDays.map((day, idx) => {
          if (!day) {
            return <div key={idx} style={{ height: 26 }} />;
          }

          const currentDayStr = `${viewYear}-${formatPadded(viewMonth + 1)}-${formatPadded(day)}`;
          const isToday =
            todayDate.getFullYear() === viewYear &&
            todayDate.getMonth() === viewMonth &&
            todayDate.getDate() === day;
          const isSelected = selectedDateStr === currentDayStr;
          const hasTasks = tasks.some((t) => t.date === currentDayStr);

          return (
            <div
              key={idx}
              onClick={() => handleSelectDay(day)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: 26,
                borderRadius: 7,
                cursor: "pointer",
                background: isToday
                  ? "#0a84ff"
                  : isSelected
                  ? "rgba(255, 255, 255, 0.16)"
                  : "transparent",
                color: isToday ? "#ffffff" : isSelected ? "#ffffff" : "rgba(255, 255, 255, 0.88)",
                fontSize: 11.5,
                fontWeight: isToday || isSelected ? 700 : 500,
                position: "relative",
                transition: "background 0.1s ease",
              }}
              onMouseEnter={(e) => {
                if (!isToday && !isSelected) e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
              }}
              onMouseLeave={(e) => {
                if (!isToday && !isSelected) e.currentTarget.style.background = "transparent";
              }}
            >
              <span>{day}</span>
              {hasTasks && !isToday && (
                <span
                  style={{
                    position: "absolute",
                    bottom: 2,
                    width: 3,
                    height: 3,
                    borderRadius: "50%",
                    background: "#0a84ff",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      <div style={{ height: 1, background: "rgba(255, 255, 255, 0.08)", margin: "0 2px" }} />

      {/* Schedule / Tasks for Selected Date */}
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 4px" }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255, 255, 255, 0.75)" }}>
            Schedule • {selectedDateStr}
          </span>
          <span style={{ fontSize: 10, opacity: 0.5 }}>{selectedTasks.length} items</span>
        </div>

        {/* Task items list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 3, maxHeight: 110, overflowY: "auto", scrollbarWidth: "none" }}>
          {selectedTasks.map((task) => (
            <div
              key={task.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "4px 8px",
                borderRadius: 7,
                background: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(255, 255, 255, 0.06)",
              }}
            >
              <div
                onClick={() => tasksStorage.toggleTask(task.id)}
                style={{ display: "flex", alignItems: "center", gap: 7, cursor: "pointer", flex: 1, overflow: "hidden" }}
              >
                {task.completed ? (
                  <CheckCircle2 size={13} color="#30d158" />
                ) : (
                  <Circle size={13} opacity={0.6} />
                )}
                <span
                  style={{
                    fontSize: 11.5,
                    color: task.completed ? "rgba(255, 255, 255, 0.45)" : "#ffffff",
                    textDecoration: task.completed ? "line-through" : "none",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {task.title}
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 9.5, opacity: 0.55 }}>{task.time}</span>
                <button
                  onClick={() => tasksStorage.deleteTask(task.id)}
                  style={{ background: "transparent", border: "none", color: "rgba(255, 69, 58, 0.6)", cursor: "pointer", padding: 0 }}
                  title="Delete task"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            </div>
          ))}

          {selectedTasks.length === 0 && (
            <div style={{ padding: "8px 4px", fontSize: 10.5, opacity: 0.5, textAlign: "center" }}>
              No tasks scheduled for this day
            </div>
          )}
        </div>

        {/* Quick Add Task Input */}
        <form onSubmit={handleAddTask} style={{ display: "flex", gap: 5, marginTop: 2 }}>
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="+ Add task..."
            style={{
              flex: 1,
              background: "rgba(255, 255, 255, 0.07)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: 6,
              padding: "4px 8px",
              color: "#ffffff",
              fontSize: 11,
              outline: "none",
            }}
          />
          <button
            type="submit"
            style={{
              background: "#0a84ff",
              border: "none",
              borderRadius: 6,
              color: "#ffffff",
              fontSize: 10.5,
              fontWeight: 700,
              padding: "4px 9px",
              cursor: "pointer",
            }}
          >
            Add
          </button>
        </form>
      </div>

      <div style={{ height: 1, background: "rgba(255, 255, 255, 0.08)", margin: "0 2px" }} />

      {/* Focus Timer Presets / Active Countdown */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 4px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <Timer size={12} color="#ff9f0a" />
            <span style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", opacity: 0.6, letterSpacing: "0.5px" }}>
              Focus Timer
            </span>
          </div>
          {timerRunning && (
            <span style={{ fontSize: 11, fontWeight: 700, color: "#ff9f0a" }}>
              {formatTimer(timerSecondsLeft)} left
            </span>
          )}
        </div>

        {timerRunning ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 6px", background: "rgba(255, 159, 10, 0.15)", borderRadius: 7 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: "#ff9f0a" }}>Active Countdown Running</span>
            <button
              onClick={() => onStopTimer?.()}
              style={{
                background: "rgba(255, 69, 58, 0.3)",
                border: "1px solid rgba(255, 69, 58, 0.5)",
                color: "#ff453a",
                borderRadius: 5,
                fontSize: 10,
                fontWeight: 700,
                padding: "2px 8px",
                cursor: "pointer",
              }}
            >
              Stop Timer
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 4 }}>
            {[15, 25, 45, 60].map((mins) => (
              <button
                key={mins}
                onClick={() => {
                  onStartTimer?.(mins);
                  onClose?.();
                }}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 3,
                  padding: "5px 4px",
                  borderRadius: 7,
                  background: "rgba(255, 159, 10, 0.12)",
                  border: "1px solid rgba(255, 159, 10, 0.25)",
                  color: "#ff9f0a",
                  fontSize: 10.5,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 159, 10, 0.28)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255, 159, 10, 0.12)")}
              >
                {mins}m
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
