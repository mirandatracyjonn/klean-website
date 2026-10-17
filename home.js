// Home page: rising bubbles in the hero (paused for people who prefer reduced motion).
import "./site.js";

const canvas = document.querySelector("canvas.bubbles");
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
if (canvas && !reduce) {
  const ctx = canvas.getContext("2d");
  let bubbles = [];
  const resize = () => {
    const ratio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = canvas.clientWidth * ratio;
    canvas.height = canvas.clientHeight * ratio;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    bubbles = Array.from({ length: Math.round(canvas.clientWidth / 45) }, () => spawn(true));
  };
  const spawn = (anywhere) => ({
    x: Math.random() * canvas.clientWidth,
    y: anywhere ? Math.random() * canvas.clientHeight : canvas.clientHeight + 20,
    r: 4 + Math.random() * 18,
    speed: 0.25 + Math.random() * 0.7,
    drift: Math.random() * Math.PI * 2,
  });
  const frame = (t) => {
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    for (const b of bubbles) {
      b.y -= b.speed;
      const x = b.x + Math.sin(t / 1400 + b.drift) * 8;
      if (b.y < -30) Object.assign(b, spawn(false));
      ctx.beginPath();
      ctx.arc(x, b.y, b.r, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,255,255,0.28)";
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x - b.r * 0.35, b.y - b.r * 0.35, b.r * 0.22, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.fill();
    }
    requestAnimationFrame(frame);
  };
  addEventListener("resize", resize);
  resize();
  requestAnimationFrame(frame);
}
