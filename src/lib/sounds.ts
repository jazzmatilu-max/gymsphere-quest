const audioCtx = () => new (window.AudioContext || (window as any).webkitAudioContext)();

function beep(freq: number, duration: number, type: OscillatorType = "sine", vol = 0.15) {
  try {
    const ctx = audioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = vol;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.stop(ctx.currentTime + duration);
  } catch {}
}

export const sounds = {
  // UI navigation - soft click
  click: () => beep(800, 0.08, "square", 0.08),
  // Success - ascending triad
  success: () => { beep(523, 0.15, "sine"); setTimeout(() => beep(659, 0.15, "sine"), 100); setTimeout(() => beep(784, 0.2, "sine"), 200); },
  // Purchase - high sparkle
  purchase: () => { beep(1200, 0.1, "sine"); setTimeout(() => beep(1600, 0.15, "sine"), 80); },
  // Error - low growl
  error: () => { beep(200, 0.2, "sawtooth", 0.1); setTimeout(() => beep(150, 0.3, "sawtooth", 0.1), 150); },
  // Match found - ascending fanfare
  match: () => { beep(440, 0.1, "sine"); setTimeout(() => beep(660, 0.1, "sine"), 100); setTimeout(() => beep(880, 0.1, "sine"), 200); setTimeout(() => beep(1100, 0.2, "sine"), 300); },
  // Level up - epic ascending
  levelUp: () => { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => beep(f, 0.2, "sine", 0.12), i * 120)); },
  // Radar sonar ping
  sonar: () => { beep(600, 0.4, "sine", 0.1); setTimeout(() => beep(600, 0.3, "sine", 0.06), 400); },
  // Navigation tab switch - soft boop
  navigate: () => beep(500, 0.06, "triangle", 0.06),
  // Heavy action - power button
  powerAction: () => { beep(300, 0.15, "square", 0.1); setTimeout(() => beep(600, 0.2, "sine", 0.1), 100); },
  // Coin drop sound
  coinDrop: () => { [2000, 1800, 1600, 1400].forEach((f, i) => setTimeout(() => beep(f, 0.08, "sine", 0.06), i * 60)); },
  // Scan/analyze
  scan: () => { beep(400, 0.1, "sine", 0.05); setTimeout(() => beep(800, 0.1, "sine", 0.05), 100); setTimeout(() => beep(1200, 0.15, "sine", 0.08), 200); },
};
