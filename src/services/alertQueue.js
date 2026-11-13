// Central Smart Alerts Engine for Aura Island
export class AlertQueue {
  constructor() {
    this.activeAlert = null;
    this.queue = [];
    this.subscribers = new Set();
    this.timer = null;
    this.timerStart = 0;
    this.remainingDuration = 0;
    this.isHovered = false;

    // Load alert preferences
    this.preferences = {
      battery: true,
      download: true,
      timer: true,
      network: true,
      volume: true,
      mail: true,
      durationSec: 4,
    };

    try {
      const saved = localStorage.getItem("aura_alert_preferences");
      if (saved) {
        this.preferences = { ...this.preferences, ...JSON.parse(saved) };
      }
    } catch (_) {}
  }

  savePreferences(prefs) {
    this.preferences = { ...this.preferences, ...prefs };
    try {
      localStorage.setItem("aura_alert_preferences", JSON.stringify(this.preferences));
    } catch (_) {}
  }

  getPreferences() {
    return { ...this.preferences };
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    callback(this.activeAlert);
    return () => this.subscribers.delete(callback);
  }

  notify() {
    for (const sub of this.subscribers) {
      try {
        sub(this.activeAlert);
      } catch (_) {}
    }
  }

  showAlert(alert) {
    if (!alert || !alert.type) return;

    // Check if user disabled this category
    if (this.preferences[alert.type] === false) {
      return;
    }

    const priority = alert.priority || 1;

    // Obey Do Not Disturb: non-critical alerts (priority < 8) are silenced during DND
    try {
      if (typeof localStorage !== "undefined" && localStorage.getItem("aura_dnd") === "true") {
        if (priority < 8) return;
      }
    } catch (_) {}

    const duration = (alert.duration || this.preferences.durationSec * 1000);
    const alertId = alert.id || `${alert.type}-${Date.now()}`;

    // Defend against extremely long alert text
    let title = alert.title || "";
    if (typeof title === "string" && title.length > 60) {
      title = `${title.slice(0, 57)}...`;
    }
    let subtitle = alert.subtitle;
    if (typeof subtitle === "string" && subtitle.length > 80) {
      subtitle = `${subtitle.slice(0, 77)}...`;
    }

    const newAlert = {
      ...alert,
      title,
      subtitle,
      id: alertId,
      duration,
      priority,
    };

    // Duplicate merging: if active alert is same type (e.g. volume or battery updating)
    if (this.activeAlert && this.activeAlert.type === newAlert.type) {
      this.activeAlert = {
        ...this.activeAlert,
        ...newAlert,
        duration,
      };
      this.resetTimer(duration);
      this.notify();
      return;
    }

    // Check if identical type is already queued: update the queued one instead of adding duplicates
    const existingIndex = this.queue.findIndex((a) => a.type === newAlert.type);
    if (existingIndex !== -1) {
      this.queue[existingIndex] = { ...this.queue[existingIndex], ...newAlert };
      return;
    }

    // If currently displaying an alert
    if (this.activeAlert) {
      // If new alert has higher priority, preempt current alert
      if (newAlert.priority > this.activeAlert.priority) {
        this.clearTimer();
        this.queue.unshift(this.activeAlert); // Push old one back
        this.displayAlert(newAlert);
      } else {
        // Enqueue sorted by priority descending
        this.queue.push(newAlert);
        this.queue.sort((a, b) => (b.priority || 0) - (a.priority || 0));
      }
    } else {
      this.displayAlert(newAlert);
    }
  }

  displayAlert(alert) {
    this.activeAlert = alert;
    this.notify();

    // Persistent alerts (e.g. live countdown) don't auto-dismiss until stopped
    if (!alert.persistent) {
      this.resetTimer(alert.duration);
    }
  }

  resetTimer(duration) {
    this.clearTimer();
    this.remainingDuration = duration;
    this.timerStart = Date.now();

    if (!this.isHovered) {
      this.timer = setTimeout(() => {
        this.dismissCurrent();
      }, duration);
    }
  }

  clearTimer() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  pauseTimer() {
    this.isHovered = true;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
      const elapsed = Date.now() - this.timerStart;
      this.remainingDuration = Math.max(800, this.remainingDuration - elapsed);
    }
  }

  resumeTimer() {
    this.isHovered = false;
    if (this.activeAlert && !this.activeAlert.persistent && !this.timer) {
      this.timerStart = Date.now();
      this.timer = setTimeout(() => {
        this.dismissCurrent();
      }, this.remainingDuration);
    }
  }

  dismissCurrent() {
    this.clearTimer();
    this.activeAlert = null;

    if (this.queue.length > 0) {
      const next = this.queue.shift();
      this.displayAlert(next);
    } else {
      this.notify();
    }
  }

  dismissByType(type) {
    if (this.activeAlert && this.activeAlert.type === type) {
      this.dismissCurrent();
    } else {
      this.queue = this.queue.filter((a) => a.type !== type);
    }
  }
}

export const alertQueue = new AlertQueue();
