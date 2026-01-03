/**
 * Sound Localization Dataset Recorder
 * MOBILE-OPTIMIZED SPATIAL AUDIO
 * Captures best audio using device's spatial features
 */

class AudioRecorder {
  constructor() {
    console.log('🚀 Constructor: Creating AudioRecorder (Mobile-Optimized)');
    
    // Audio Recording
    this.mediaRecorder = null;
    this.audioContext = null;
    this.stream = null;
    this.recordings = [];
    this.isRecording = false;
    this.countdownInterval = null;

    // Stereo Processing
    this.splitter = null;
    this.scriptProcessor = null;
    this.leftChannel = [];
    this.rightChannel = [];
    this.gainNode = null;

    // Device Info
    this.deviceInfo = {
      isMobile: this.detectMobile(),
      dualMic: false,
      sampleRate: 48000,
      channelCount: 2,
      bufferSize: 8192,
      hasLowLatency: false,
    };

    // Modules
    this.buzzer = null;
    this.downloadManager = null;
    this.sessionManager = null;

    // IndexedDB
    this.dbPromise = idb.openDB('recordings-db', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('recordings-metadata')) {
          db.createObjectStore('recordings-metadata', { keyPath: 'id' });
          db.createObjectStore('recordings-blobs', { keyPath: 'recordingId' });
        }
      }
    });
  }

  detectMobile() {
    const ua = navigator.userAgent || navigator.vendor || window.opera;
    return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua.toLowerCase());
  }

  async initialize() {
    try {
      console.log('🚀 initialize(): Starting (Mobile-Optimized)');
      console.log('📱 Device Type:', this.deviceInfo.isMobile ? 'MOBILE' : 'DESKTOP');
      
      console.log('📄 Step 1/7: UI elements');
      this.initializeUIElements();
      console.log('✅ Step 1/7: Done');
      
      console.log('🔧 Step 2/7: Audio context (High Quality)');
      this.initializeAudioContext();
      console.log('✅ Step 2/7: Done');
      
      console.log('📦 Step 3/7: Modules');
      await this.initializeModules();
      console.log('✅ Step 3/7: Done');
      
      console.log('🎧 Step 4/7: Event listeners');
      this.bindEventListeners();
      console.log('✅ Step 4/7: Done');
      
      console.log('💾 Step 5/7: Load recordings');
      await this.loadPersistedRecordings();
      console.log('✅ Step 5/7: Done');
      
      console.log('📍 Step 6/7: Microphone (Spatial)');
      await this.requestMicrophoneAccess();
      console.log('✅ Step 6/7: Done');
      
      console.log('📊 Step 7/7: Statistics');
      this.updateStatistics();
      console.log('✅ Step 7/7: Done');
      
      console.log('✅✅✅ INITIALIZATION COMPLETE ✅✅✅');
    } catch (error) {
      console.error('❌ INIT ERROR:', error.message);
      this.updateMicrophoneStatus('error', '❌ Initialization failed');
    }
  }

  initializeUIElements() {
    this.directionSelect = document.getElementById('direction-select');
    this.durationSelect = document.getElementById('duration-select');
    this.distanceSelect = document.getElementById('distance-select');
    this.recordButton = document.getElementById('record-button');
    this.recordButtonText = document.getElementById('record-button-text');
    this.stopButton = document.getElementById('stop-button');
    this.statusMessage = document.getElementById('status-message');
    this.countdownTimer = document.getElementById('countdown-timer');
    this.micStatus = document.getElementById('mic-status-text');
    this.micIndicator = document.querySelector('.mic-indicator');
    this.buzzerEnabled = document.getElementById('buzzer-enabled');
    this.recordingsList = document.getElementById('recordings-list');
    this.fileCount = document.getElementById('file-count');
    this.downloadAllButton = document.getElementById('download-all-button');
    this.clearAllButton = document.getElementById('clear-all-button');
    this.playbackAudio = document.getElementById('playback-audio');
    this.statTotal = document.getElementById('stat-total');
    this.statSize = document.getElementById('stat-size');
    this.statStatus = document.getElementById('stat-status');
  }

  async initializeModules() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      this.audioContext = new AudioContext();
    }

    if (typeof BuzzerGenerator !== 'undefined') {
      this.buzzer = new BuzzerGenerator(this.audioContext);
    }

    if (typeof DownloadManager !== 'undefined') {
      this.downloadManager = new DownloadManager();
    }

    if (typeof SessionManager !== 'undefined') {
      this.sessionManager = new SessionManager();
    }
  }

  initializeAudioContext() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext && !this.audioContext) {
      this.audioContext = new AudioContext();
    }

    // Log audio context capabilities
    console.log('🔊 Audio Context Info:');
    console.log('  Sample Rate:', this.audioContext.sampleRate, 'Hz');
    console.log('  State:', this.audioContext.state);
    console.log('  Max Channels:', this.audioContext.destination.maxChannelCount);
  }

  bindEventListeners() {
    if (this.recordButton) {
      this.recordButton.onclick = () => this.handleRecordClick();
    }

    if (this.downloadAllButton) {
      this.downloadAllButton.onclick = () => this.downloadAllRecordings();
    }

    if (this.clearAllButton) {
      this.clearAllButton.onclick = () => this.clearAllRecordings();
    }

    if (this.recordButton) this.recordButton.disabled = true;
    if (this.clearAllButton) this.clearAllButton.disabled = true;
    if (this.downloadAllButton) this.downloadAllButton.disabled = true;

    this.updateMicrophoneStatus('', 'Requesting microphone...');
  }

  async handleRecordClick() {
    if (this.isRecording) {
      this.stopRecording();
    } else {
      await this.startRecording();
    }
  }

  async startRecording() {
    if (!this.stream) {
      this.showError('No microphone access');
      return;
    }

    try {
      this.isRecording = true;
      this.leftChannel = [];
      this.rightChannel = [];
      this.recordButton.disabled = true;
      this.recordButtonText.textContent = 'Playing buzzer...';
      this.statusMessage.textContent = 'Playing buzzer (0.4s)...';
      this.statusMessage.className = 'status-message recording';

      // Play buzzer before recording
      if (this.buzzerEnabled?.checked && this.buzzer) {
        await this.buzzer.playBuzzer();
        await this.delay(200);
      }

      console.log('🎙️ Starting SPATIAL AUDIO recording...');
      console.log('📱 Device:', this.deviceInfo.isMobile ? 'Mobile' : 'Desktop');
      console.log('🎧 Channel Count:', this.deviceInfo.channelCount);
      console.log('📊 Sample Rate:', this.audioContext.sampleRate, 'Hz');
      console.log('🔊 Buffer Size:', this.deviceInfo.bufferSize);
      
      // Resume audio context if suspended (common on mobile)
      if (this.audioContext.state === 'suspended') {
        console.log('⏸️ Audio context suspended, resuming...');
        await this.audioContext.resume();
        console.log('▶️ Audio context resumed');
      }

      const source = this.audioContext.createMediaStreamSource(this.stream);
      
      // Create gain node for level control
      this.gainNode = this.audioContext.createGain();
      this.gainNode.gain.value = 0.9; // Prevent clipping
      
      source.connect(this.gainNode);

      // Create splitter for stereo (or mono if only 1 channel)
      const channelCount = Math.min(this.deviceInfo.channelCount, 2);
      this.splitter = this.audioContext.createChannelSplitter(channelCount);
      
      this.gainNode.connect(this.splitter);

      // Create script processor for raw sample capture
      const scriptProcessor = this.audioContext.createScriptProcessor(
        this.deviceInfo.bufferSize,
        channelCount,
        channelCount
      );

      // Connect splitter to script processor
      for (let i = 0; i < channelCount; i++) {
        this.splitter.connect(scriptProcessor, i);
      }
      
      scriptProcessor.connect(this.audioContext.destination);

      // Capture raw audio samples
      scriptProcessor.onaudioprocess = (event) => {
        if (!this.isRecording) return;

        const left = event.inputBuffer.getChannelData(0);
        
        this.leftChannel.push(new Float32Array(left));

        // Get right channel if available
        if (event.inputBuffer.numberOfChannels >= 2) {
          const right = event.inputBuffer.getChannelData(1);
          this.rightChannel.push(new Float32Array(right));
        } else {
          // Mono device: duplicate left channel
          this.rightChannel.push(new Float32Array(left));
        }
      };

      this.recordButtonText.textContent = 'Recording (SPATIAL)...';
      this.statusMessage.textContent = '🎙️ Recording spatial audio (L+R channels, ' + this.audioContext.sampleRate + 'Hz)...';
      this.countdownTimer?.classList.remove('hidden');

      const duration = parseInt(this.durationSelect?.value || 2);
      this.startCountdown(duration);

      setTimeout(() => {
        if (this.isRecording) this.stopRecording();
      }, duration * 1000);

    } catch (error) {
      this.resetRecordingState();
      this.showError('Recording failed: ' + error.message);
    }
  }

  stopRecording() {
    if (this.isRecording) {
      this.isRecording = false;
      clearInterval(this.countdownInterval);
      this.countdownTimer?.classList.add('hidden');
      this.recordButtonText.textContent = 'Processing...';
      this.processRecording();
    }
  }

  async processRecording() {
    try {
      console.log('🔄 Processing SPATIAL recording...');
      console.log('🎧 Left channel buffers:', this.leftChannel.length);
      console.log('🎧 Right channel buffers:', this.rightChannel.length);

      const totalSamples = this.leftChannel.reduce((sum, arr) => sum + arr.length, 0);
      console.log('📊 Total samples per channel:', totalSamples);

      // Use actual audio context sample rate (not hardcoded 44100)
      const sampleRate = this.audioContext.sampleRate;
      const duration = (totalSamples / sampleRate).toFixed(2);

      const audioBlob = this.encodeWAV(this.leftChannel, this.rightChannel, sampleRate);
      
      console.log('✅ WAV encoded successfully');
      console.log('📁 WAV file size:', audioBlob.size, 'bytes');
      console.log('⏱️ Duration:', duration, 'seconds');
      console.log('🎧 Channels: 2 (STEREO)');
      console.log('🔊 Sample Rate:', sampleRate, 'Hz');

      const direction = parseInt(this.directionSelect?.value || 0);
      const distance = parseInt(this.distanceSelect?.value || 1);
      const duration_select = parseInt(this.durationSelect?.value || 2);

      const filename = this.generateFilename();
      const recording = {
        id: Date.now(),
        filename,
        blob: audioBlob,
        url: URL.createObjectURL(audioBlob),
        direction,
        distance,
        duration: duration_select,
        channels: 2,
        sampleRate: sampleRate,
        bitDepth: 16,
        processingApplied: 'NONE',
        timestamp: new Date().toISOString(),
        size: audioBlob.size,
        buzzerIncluded: false,
        buzzerPlayedBefore: this.buzzerEnabled?.checked || false,
        actualSamples: totalSamples,
        deviceInfo: {
          isMobile: this.deviceInfo.isMobile,
          dualMic: this.deviceInfo.dualMic,
          userAgent: navigator.userAgent,
        }
      };

      this.recordings.push(recording);
      this.addRecordingToList(recording);
      this.resetRecordingState();
      this.showSuccess('✅ SPATIAL recording saved! (' + totalSamples + ' samples @ ' + sampleRate + 'Hz)');

      await this.saveRecordingMetadata(recording);
      await this.saveRecordingBlob(recording.id, audioBlob);
      this.updateStatistics();

    } catch (error) {
      console.error('❌ Processing error:', error);
      this.showError('Failed to process recording');
      this.resetRecordingState();
    }
  }

  encodeWAV(leftChannel, rightChannel, sampleRate) {
    const totalLength = leftChannel.reduce((sum, arr) => sum + arr.length, 0);
    const outputBuffer = new Float32Array(totalLength * 2);
    let index = 0;
    
    // Interleave left and right channels
    for (let i = 0; i < leftChannel.length; i++) {
      const left = leftChannel[i];
      const right = rightChannel[i] || left; // Fallback to left if right unavailable
      
      for (let j = 0; j < left.length; j++) {
        outputBuffer[index++] = left[j];
        outputBuffer[index++] = right[j];
      }
    }

    return this.floatTo16BitPCM(outputBuffer, sampleRate);
  }

  floatTo16BitPCM(floatArray, sampleRate) {
    const sampleCount = floatArray.length;
    const channels = 2;
    const bitDepth = 16;
    
    const byteRate = sampleRate * channels * (bitDepth / 8);
    const blockAlign = channels * (bitDepth / 8);
    const dataLength = sampleCount * (bitDepth / 8);
    const totalLength = 36 + dataLength;

    const buffer = new ArrayBuffer(44 + dataLength);
    const view = new DataView(buffer);

    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, totalLength, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, channels, true); // 2 = STEREO
    view.setUint32(24, sampleRate, true); // ACTUAL sample rate
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(36, 'data');
    view.setUint32(40, dataLength, true);

    let offset = 44;
    const volume = 0.85; // Optimized for mobile
    for (let i = 0; i < floatArray.length; i++) {
      let sample = Math.max(-1, Math.min(1, floatArray[i])) * volume;
      sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(offset, sample, true);
      offset += 2;
    }

    console.log('📊 WAV Details:');
    console.log('  Channels: 2 (STEREO)');
    console.log('  Sample Rate: ' + sampleRate + ' Hz');
    console.log('  Bit Depth: 16-bit');
    console.log('  Duration: ' + (sampleCount / channels / sampleRate).toFixed(2) + ' sec');
    console.log('  File Size: ' + buffer.byteLength + ' bytes');

    return new Blob([buffer], { type: 'audio/wav' });
  }

  async requestMicrophoneAccess() {
    console.log('📍 requestMicrophoneAccess() called');
    console.log('📱 Device Type:', this.deviceInfo.isMobile ? 'MOBILE' : 'DESKTOP');
    
    if (!navigator.mediaDevices?.getUserMedia) {
      console.error('❌ Microphone API not supported');
      this.updateMicrophoneStatus('error', '❌ Not supported');
      return false;
    }

    try {
      console.log('🎤 Requesting SPATIAL microphone...');
      
      // Request stereo with spatial features enabled
      const constraints = {
        audio: {
          echoCancellation: false, // Disable for spatial data
          noiseSuppression: false, // Keep raw audio
          autoGainControl: false, // Manual control
          channelCount: { ideal: 2 }, // Request stereo
          sampleRate: { ideal: 48000 }, // Mobile standard
          latency: 0.01, // Low latency for spatial
        }
      };
      
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      console.log('✅ MICROPHONE ACCESS GRANTED');
      const audioTracks = this.stream.getAudioTracks();
      console.log('📊 Audio tracks:', audioTracks.length);
      
      if (audioTracks.length > 0) {
        const track = audioTracks;
        const settings = track.getSettings?.();
        
        console.log('🎙️ Microphone Capabilities:');
        console.log('  Channels:', settings?.channelCount || 'unknown', '(Spatial)');
        console.log('  Sample Rate:', settings?.sampleRate || 'unknown', 'Hz');
        console.log('  Echo Cancellation:', settings?.echoCancellation);
        console.log('  Noise Suppression:', settings?.noiseSuppression);
        console.log('  Auto Gain:', settings?.autoGainControl);
        console.log('  Latency:', settings?.latency);

        // Detect dual-mic capability
        if (settings?.channelCount >= 2) {
          this.deviceInfo.dualMic = true;
          console.log('✅ DUAL-MIC detected (spatial audio capable!)');
        } else {
          console.log('⚠️ Single mic - will duplicate channel');
        }

        // Store device info
        this.deviceInfo.sampleRate = settings?.sampleRate || 44100;
        this.deviceInfo.channelCount = settings?.channelCount || 1;
      }
      
      this.updateMicrophoneStatus('active', '✅ Microphone ready (SPATIAL)');
      if (this.recordButton) {
        this.recordButton.disabled = false;
        console.log('✅✅✅ Record button ENABLED ✅✅✅');
      }
      if (this.statusMessage) {
        const micType = this.deviceInfo.dualMic ? 'Dual-Mic Spatial' : 'Single-Mic';
        this.statusMessage.textContent = '✅ Ready to record (' + micType + ', ' + this.deviceInfo.sampleRate + 'Hz)';
        this.statusMessage.className = 'status-message ready';
      }
      
      return true;

    } catch (error) {
      console.error('❌ MICROPHONE DENIED:', error.name);
      this.updateMicrophoneStatus('error', '❌ Microphone denied');
      if (this.recordButton) this.recordButton.disabled = true;
      return false;
    }
  }

  generateFilename() {
    const d = (this.directionSelect?.value || '0') + 'deg';
    const dist = this.distanceSelect?.value || '1';
    const dur = (this.durationSelect?.value || '2') + 'sec';
    const device = this.deviceInfo.isMobile ? 'MOB' : 'DSK';
    const micType = this.deviceInfo.dualMic ? 'DUAL' : 'MONO';
    const now = new Date();
    const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const time = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
    return `SPATIAL_${d}_${dist}ft_${dur}_${device}_${micType}_${date}_${time}.wav`;
  }

  addRecordingToList(rec) {
    if (!this.recordingsList) return;
    
    const emptyState = this.recordingsList.querySelector('.empty-state');
    if (emptyState) emptyState.remove();

    const micType = rec.deviceInfo?.dualMic ? '🎧 Dual-Mic' : '🎤 Mono';
    const device = rec.deviceInfo?.isMobile ? '📱 Mobile' : '🖥️ Desktop';

    const item = document.createElement('div');
    item.className = 'recording-item';
    item.setAttribute('data-recording-id', rec.id);
    item.innerHTML = `
      <div class="recording-details">
        <p class="recording-filename">${rec.filename}</p>
        <p class="recording-metadata">
          Dir: ${rec.direction}° | Dist: ${rec.distance}ft | Dur: ${rec.duration}s | Size: ${(rec.size / 1024).toFixed(1)}KB
        </p>
        <p class="recording-status">✅ STEREO (2ch) | ${rec.sampleRate}Hz | 16-bit | ${rec.actualSamples} samples | ${device} | ${micType}</p>
      </div>
      <div class="recording-actions">
        <button class="btn btn--sm btn--secondary" onclick="audioRecorder.playRecording(${rec.id})">▶️ Play</button>
        <button class="btn btn--sm btn--secondary" onclick="audioRecorder.downloadRecording(${rec.id})">💾 Download</button>
        <button class="btn btn--sm btn--outline" onclick="audioRecorder.deleteRecording(${rec.id})">🗑️ Delete</button>
      </div>
    `;
    this.recordingsList.appendChild(item);
  }

  playRecording(id) {
    const rec = this.recordings.find(r => r.id === id);
    if (rec && this.playbackAudio) {
      this.playbackAudio.src = rec.url;
      this.playbackAudio.play();
    }
  }

  downloadRecording(id) {
    const rec = this.recordings.find(r => r.id === id);
    if (rec && this.downloadManager) {
      this.downloadManager.downloadSingleRecording(rec, rec.filename);
    }
  }

  async deleteRecording(id) {
    const index = this.recordings.findIndex(r => r.id === id);
    if (index !== -1) {
      this.recordings.splice(index, 1);
      await this.deleteRecordingFromDB(id);

      const item = this.recordingsList?.querySelector(`[data-recording-id="${id}"]`);
      if (item) item.remove();

      this.updateStatistics();

      if (this.recordings.length === 0) {
        this.recordingsList.innerHTML = '<div class="empty-state"><p>📄 No recordings yet.</p></div>';
      }
    }
  }

  async clearAllRecordings() {
    if (!confirm('Delete ALL recordings?')) return;

    try {
      const db = await this.dbPromise;
      await db.clear('recordings-metadata');
      await db.clear('recordings-blobs');

      this.recordings = [];
      this.recordingsList.innerHTML = '<div class="empty-state"><p>📄 No recordings yet.</p></div>';
      this.updateStatistics();
      this.clearAllButton.disabled = true;
      this.downloadAllButton.disabled = true;

      this.showSuccess('All recordings cleared');
    } catch (error) {
      this.showError('Failed to clear recordings');
    }
  }

  async downloadAllRecordings() {
    try {
      if (this.recordings.length === 0) {
        this.showError('No recordings to download');
        return;
      }

      for (const rec of this.recordings) {
        if (this.downloadManager) {
          this.downloadManager.downloadSingleRecording(rec, rec.filename);
          await this.delay(500);
        }
      }

      this.showSuccess(`Downloaded ${this.recordings.length} SPATIAL recordings!`);
    } catch (error) {
      this.showError('Download failed');
    }
  }

  async saveRecordingMetadata(metadata) {
    try {
      const db = await this.dbPromise;
      const { blob, ...metaOnly } = metadata;
      await db.put('recordings-metadata', metaOnly);
    } catch (error) {
      console.error('Failed to save metadata:', error);
    }
  }

  async saveRecordingBlob(recordingId, blob) {
    try {
      const db = await this.dbPromise;
      await db.put('recordings-blobs', { recordingId, blob });
    } catch (error) {
      console.error('Failed to save blob:', error);
    }
  }

  async deleteRecordingFromDB(id) {
    try {
      const db = await this.dbPromise;
      await db.delete('recordings-metadata', id);
      await db.delete('recordings-blobs', id);
    } catch (error) {
      console.error('Failed to delete from DB:', error);
    }
  }

  async loadPersistedRecordings() {
    try {
      const db = await this.dbPromise;
      const persisted = await db.getAll('recordings-metadata');
      
      if (persisted.length > 0) {
        this.recordings = persisted;
        for (const rec of persisted) {
          this.addRecordingToList(rec);
        }
        this.clearAllButton.disabled = false;
        this.downloadAllButton.disabled = false;
      }
    } catch (error) {
      console.error('Failed to load persisted recordings:', error);
    }
  }

  updateStatistics() {
    if (this.recordings.length === 0) {
      this.statTotal.textContent = '0';
      this.statSize.textContent = '0 MB';
      this.statStatus.textContent = 'Ready';
      return;
    }

    const totalSize = this.recordings.reduce((sum, r) => sum + (r.size || 0), 0);
    this.statTotal.textContent = this.recordings.length;
    this.statSize.textContent = (totalSize / (1024 * 1024)).toFixed(2) + ' MB';
    this.statStatus.textContent = navigator.onLine ? 'Online' : 'Offline';
  }

  startCountdown(duration) {
    let remaining = duration;
    const updateTimer = () => {
      const m = Math.floor(remaining / 60);
      const s = remaining % 60;
      this.countdownTimer.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
      remaining--;
      if (remaining < 0) clearInterval(this.countdownInterval);
    };
    updateTimer();
    this.countdownInterval = setInterval(updateTimer, 1000);
  }

  updateMicrophoneStatus(status, message) {
    if (this.micStatus) this.micStatus.textContent = message;
    if (this.micIndicator) this.micIndicator.className = `mic-indicator ${status}`;
  }

  resetRecordingState() {
    if (this.recordButton) {
      this.recordButton.disabled = false;
      this.recordButtonText.textContent = '🎤 Record';
      const micType = this.deviceInfo.dualMic ? 'Dual-Mic Spatial' : 'Mono';
      this.statusMessage.textContent = '✅ Ready to record (' + micType + ')';
      this.statusMessage.className = 'status-message ready';
    }
  }

  showSuccess(msg) {
    console.log('✅', msg);
    const div = document.createElement('div');
    div.className = 'success-feedback';
    div.textContent = msg;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 4000);
  }

  showError(msg) {
    console.error('❌', msg);
    const div = document.createElement('div');
    div.className = 'error-feedback';
    div.textContent = msg;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 5000);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ✅ INITIALIZATION
console.log('🚀 app.js loaded - MOBILE-OPTIMIZED SPATIAL AUDIO');
let audioRecorder;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    audioRecorder = new AudioRecorder();
    audioRecorder.initialize();
  });
} else {
  audioRecorder = new AudioRecorder();
  audioRecorder.initialize();
}
