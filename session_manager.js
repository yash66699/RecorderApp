class SessionManager {
  constructor() {
    this.isRunning = false;
    this.isPaused = false;
    this.totalRecordings = 0;
    this.completedRecordings = 0;
  }

  start() {
    this.isRunning = true;
    this.isPaused = false;
    this.completedRecordings = 0;
    console.log('✅ Session started');
  }

  pause() {
    this.isPaused = true;
    console.log('⏸️ Session paused');
  }

  resume() {
    this.isPaused = false;
    console.log('▶️ Session resumed');
  }

  stop() {
    this.isRunning = false;
    this.isPaused = false;
    console.log('⏹️ Session stopped');
  }

  recordingCompleted() {
    this.completedRecordings++;
  }

  getProgress() {
    return {
      total: this.totalRecordings,
      completed: this.completedRecordings,
      percentage: this.totalRecordings > 0 ? (this.completedRecordings / this.totalRecordings) * 100 : 0
    };
  }
}
