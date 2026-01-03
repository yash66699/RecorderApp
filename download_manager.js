class DownloadManager {
  downloadSingleRecording(recording, filename) {
    const blob = recording.blob || new Blob([recording.buffer], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || 'recording.wav';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }

  async downloadAllRecordings(recordings, progressCallback) {
    for (let i = 0; i < recordings.length; i++) {
      const rec = recordings[i];
      this.downloadSingleRecording(rec, rec.filename);
      
      if (progressCallback) {
        progressCallback(i + 1, recordings.length, rec.filename);
      }

      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
}
