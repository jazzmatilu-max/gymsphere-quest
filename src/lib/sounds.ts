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
  click: () => beep(800, 0.08, "square", 0.08),
  success: () => { beep(523, 0.15, "sine"); setTimeout(() => beep(659, 0.15, "sine"), 100); setTimeout(() => beep(784, 0.2, "sine"), 200); },
  purchase: () => { beep(1200, 0.1, "sine"); setTimeout(() => beep(1600, 0.15, "sine"), 80); },
  error: () => { beep(200, 0.2, "sawtooth", 0.1); setTimeout(() => beep(150, 0.3, "sawtooth", 0.1), 150); },
  match: () => { beep(440, 0.1, "sine"); setTimeout(() => beep(660, 0.1, "sine"), 100); setTimeout(() => beep(880, 0.1, "sine"), 200); setTimeout(() => beep(1100, 0.2, "sine"), 300); },
  levelUp: () => { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => beep(f, 0.2, "sine", 0.12), i * 120)); },
  sonar: () => { beep(600, 0.4, "sine", 0.1); setTimeout(() => beep(600, 0.3, "sine", 0.06), 400); },
};
