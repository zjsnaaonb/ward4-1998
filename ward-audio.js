/**
 * Ward 4 (1998) Psychiatric & Acoustic Archive Web Audio Engine
 * Zero external audio files — procedural 1998 hospital & analog tape horror:
 * - ICU ECG monitor beep (心电监护滴声) & sudden asystole flatline (长鸣停搏)
 * - Heavy steel ward door observation-slot clang & frantic pounding (铁门探视窗砸门声)
 * - 1998 Open-Reel Magnetic Tape wow/flutter & reversed formant speech (盘式磁带正/倒放音)
 * - Fluorescent ballast 50Hz buzz & 18.98Hz resonance hum
 */
class Ward1998Audio {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.noiseBuffer = null;
    this.buzzGain = null;
    this.ecgTimer = null;
    this.enabled = false;
    this.lowScare = false;
  }

  init(lowScare = false) {
    this.lowScare = lowScare;
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      this.enabled = true;
      return;
    }
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    this.ctx = new AudioCtx();
    const comp = this.ctx.createDynamicsCompressor();
    comp.threshold.value = -12;
    comp.ratio.value = 6;
    comp.connect(this.ctx.destination);

    this.master = this.ctx.createGain();
    this.master.gain.value = lowScare ? 0.42 : 0.86;
    this.master.connect(comp);

    const sr = this.ctx.sampleRate;
    this.noiseBuffer = this.ctx.createBuffer(1, sr * 3, sr);
    const ch = this.noiseBuffer.getChannelData(0);
    let b = 0;
    for (let i = 0; i < ch.length; i++) {
      const w = Math.random() * 2 - 1;
      b = (b + 0.05 * w) / 1.05;
      ch[i] = b * 1.6 + w * 0.14;
    }

    // Old 1998 Hospital Corridor Fluorescent Tube 100Hz Buzz + 18.98Hz Sub-carrier
    this.buzzGain = this.ctx.createGain();
    this.buzzGain.gain.value = 0.035;
    this.buzzGain.connect(this.master);

    const sub = this.ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.value = 18.98;
    const subG = this.ctx.createGain();
    subG.gain.value = 0.65;
    sub.connect(subG);
    subG.connect(this.buzzGain);
    sub.start();

    const tube = this.ctx.createOscillator();
    tube.type = 'sawtooth';
    tube.frequency.value = 100;
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 260;
    const tubeG = this.ctx.createGain();
    tubeG.gain.value = 0.14;
    tube.connect(lp);
    lp.connect(tubeG);
    tubeG.connect(this.buzzGain);
    tube.start();

    this.enabled = true;
    this.startECG(62);
  }

  toggleMute() {
    if (!this.ctx) {
      this.init(false);
      return true;
    }
    this.enabled = !this.enabled;
    this.master.gain.setTargetAtTime(
      this.enabled ? (this.lowScare ? 0.42 : 0.86) : 0,
      this.ctx.currentTime,
      0.08
    );
    return this.enabled;
  }

  startECG(bpm = 62) {
    if (this.ecgTimer) clearInterval(this.ecgTimer);
    const intervalMs = Math.round((60 / bpm) * 1000);
    this.ecgTimer = setInterval(() => {
      if (!this.ctx || !this.enabled || document.hidden) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = 1046.5; // Classic hospital telemetry C6 ping
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.0001, now);
      g.gain.linearRampToValueAtTime(0.028, now + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
      osc.connect(g);
      g.connect(this.master);
      osc.start(now);
      osc.stop(now + 0.1);
    }, intervalMs);
  }

  /**
   * Heavy metallic iron-door observation shutter slide / slam!
   */
  playIronDoorSlam(pan = 0, heavy = true) {
    if (!this.ctx || !this.enabled) return;
    const now = this.ctx.currentTime;
    const scale = (heavy ? 0.92 : 0.45) * (this.lowScare ? 0.45 : 1.0);

    const panner = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;
    if (panner) {
      panner.pan.value = pan;
      panner.connect(this.master);
    }
    const dest = panner || this.master;

    // Low steel door thud + metallic ring partials
    [68, 193, 418, 882].forEach((f, idx) => {
      const o = this.ctx.createOscillator();
      o.type = idx === 0 ? 'sine' : 'square';
      o.frequency.setValueAtTime(f * 1.08, now);
      o.frequency.exponentialRampToValueAtTime(f * 0.72, now + (idx === 0 ? 0.25 : 0.45));
      const g = this.ctx.createGain();
      g.gain.setValueAtTime((scale * 0.42) / (idx + 1), now);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.48);
      o.connect(g);
      g.connect(dest);
      o.start(now);
      o.stop(now + 0.5);
    });

    // Metallic scrape burst
    const n = this.ctx.createBufferSource();
    n.buffer = this.noiseBuffer;
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1450;
    bp.Q.value = 3.0;
    const ng = this.ctx.createGain();
    ng.gain.setValueAtTime(scale * 0.45, now);
    ng.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
    n.connect(bp);
    bp.connect(ng);
    ng.connect(dest);
    n.start(now, 0, 0.25);
  }

  /**
   * 1998 Open-Reel Magnetic Tape playback (forward or eerie reversed formant speech!)
   */
  playReelTape(reversed = false) {
    if (!this.ctx) this.init(false);
    if (!this.enabled) return;
    const now = this.ctx.currentTime;

    // Tape hiss & mechanical motor hum
    const hiss = this.ctx.createBufferSource();
    hiss.buffer = this.noiseBuffer;
    const hp = this.ctx.createBiquadFilter();
    hp.type = 'bandpass';
    hp.frequency.value = reversed ? 1900 : 1200;
    hp.Q.value = 2.2;
    const hg = this.ctx.createGain();
    hg.gain.setValueAtTime(0.18, now);
    hg.gain.exponentialRampToValueAtTime(0.001, now + 2.8);
    hiss.connect(hp);
    hp.connect(hg);
    hg.connect(this.master);
    hiss.start(now, 0, 2.9);

    // Warped magnetic voice / reversed harmonic swells
    const notes = reversed ? [310, 440, 277, 587, 233] : [185, 196, 174, 164];
    notes.forEach((f, idx) => {
      const t = now + idx * 0.48;
      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(reversed ? f * 0.78 : f, t);
      osc.frequency.exponentialRampToValueAtTime(reversed ? f * 1.32 : f * 0.92, t + 0.42);

      const formant = this.ctx.createBiquadFilter();
      formant.type = 'bandpass';
      formant.frequency.value = reversed ? 1350 : 720;
      formant.Q.value = 5.5;

      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      if (reversed) {
        // Reversed envelope: swells up slowly then cuts sharply!
        g.gain.exponentialRampToValueAtTime(0.16, t + 0.38);
        g.gain.linearRampToValueAtTime(0.0001, t + 0.44);
      } else {
        g.gain.linearRampToValueAtTime(0.11, t + 0.05);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.44);
      }
      osc.connect(formant);
      formant.connect(g);
      g.connect(this.master);
      osc.start(t);
      osc.stop(t + 0.46);
    });
  }

  /**
   * 4000-Gauss Electromagnetic Demagnetizer Surge (True Purification Ending)
   */
  playDemagnetizeSurge() {
    if (!this.ctx) this.init(false);
    if (this.ecgTimer) clearInterval(this.ecgTimer);
    if (!this.enabled) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(55, now);
    osc.frequency.exponentialRampToValueAtTime(2400, now + 1.4);
    osc.frequency.exponentialRampToValueAtTime(32, now + 2.6);

    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.01, now);
    g.gain.linearRampToValueAtTime(0.35, now + 1.35);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 2.7);

    osc.connect(g);
    g.connect(this.master);
    osc.start(now);
    osc.stop(now + 2.8);

    this.buzzGain.gain.setTargetAtTime(0.0, now + 1.4, 0.3);
  }

  /**
   * Ward-Wide Total Assimilation Climax (ECG Flatline + Iron Door Pounding + Shriek)
   */
  triggerWardBreach(onStrike) {
    if (!this.ctx) this.init(false);
    if (this.ecgTimer) clearInterval(this.ecgTimer);

    // Frantic stereo pounding on iron ward door
    [0, 220, 400, 540, 650].forEach((ms, i) => {
      setTimeout(() => this.playIronDoorSlam(i % 2 === 0 ? -0.9 : 0.9, true), ms);
    });

    setTimeout(() => {
      if (typeof onStrike === 'function') onStrike();
      if (!this.ctx || !this.enabled) return;
      const t = this.ctx.currentTime;
      const scale = this.lowScare ? 0.35 : 0.92;

      // Piercing ICU Flatline + Tritone Tape Overload
      const flat = this.ctx.createOscillator();
      flat.type = 'sine';
      flat.frequency.value = 1046.5;
      const fg = this.ctx.createGain();
      fg.gain.setValueAtTime(0.22 * scale, t);
      fg.gain.exponentialRampToValueAtTime(0.0001, t + 4.2);
      flat.connect(fg);
      fg.connect(this.master);
      flat.start(t);
      flat.stop(t + 4.3);

      [72, 311.13, 659.25, 1396.9].forEach((f) => {
        const o = this.ctx.createOscillator();
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(f, t);
        o.frequency.linearRampToValueAtTime(f * 0.87, t + 1.6);
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0.18 * scale, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 1.75);
        o.connect(g);
        g.connect(this.master);
        o.start(t);
        o.stop(t + 1.8);
      });
    }, 920);
  }
}

window.wardAudio = new Ward1998Audio();
