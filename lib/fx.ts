export function confettiBurst() {
  const c = document.getElementById('fx') as HTMLCanvasElement | null;
  const x = c?.getContext('2d');
  if (!c || !x) return;
  c.width = innerWidth;
  c.height = innerHeight;
  const cols = ['#a3e635', '#ffc857', '#3ddc97', '#ff6b8a', '#5aa9ff', '#ffb454'];
  const ps = Array.from({ length: 110 }, () => ({
    x: innerWidth / 2, y: innerHeight / 3,
    vx: (Math.random() - 0.5) * 14, vy: -Math.random() * 13 - 3,
    s: Math.random() * 7 + 4, c: cols[(Math.random() * cols.length) | 0], r: Math.random() * 6,
  }));
  let f = 0;
  (function step() {
    x.clearRect(0, 0, c.width, c.height);
    ps.forEach((p) => {
      p.x += p.vx; p.y += p.vy; p.vy += 0.35; p.r += 0.2;
      x.fillStyle = p.c;
      x.save(); x.translate(p.x, p.y); x.rotate(p.r);
      x.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.6);
      x.restore();
    });
    if (++f < 110) requestAnimationFrame(step);
    else x.clearRect(0, 0, c.width, c.height);
  })();
}

export function beep() {
  try {
    const a = new AudioContext(), o = a.createOscillator(), g = a.createGain();
    o.connect(g); g.connect(a.destination);
    o.frequency.value = 660;
    g.gain.setValueAtTime(0.2, a.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + 0.8);
    o.start(); o.stop(a.currentTime + 0.8);
  } catch {
    /* audio unavailable */
  }
}
