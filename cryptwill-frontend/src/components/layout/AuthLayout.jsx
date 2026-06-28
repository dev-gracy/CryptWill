import { Outlet, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Lock, Users } from "lucide-react";
import ThemeToggle from "../common/ThemeToggle";
import { useThemeStore } from "../../store/themeStore";

/* ── Floating crypto particles ── */
const PARTICLE_COLORS_DARK  = ['rgba(198,143,130,0.7)', 'rgba(244,143,177,0.5)', 'rgba(160,130,200,0.5)', 'rgba(198,143,130,0.4)', 'rgba(255,200,150,0.5)'];
const PARTICLE_COLORS_LIGHT = ['rgba(198,143,130,0.5)', 'rgba(200,100,100,0.35)', 'rgba(160,100,160,0.35)', 'rgba(180,130,100,0.4)', 'rgba(220,160,100,0.4)'];

const PARTICLES = Array.from({ length: 22 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  delay: Math.random() * 10,
  duration: 8 + Math.random() * 10,
  size: 6 + Math.random() * 12,
  rotation: Math.random() * 360,
  opacity: 0.18 + Math.random() * 0.38,
  shape: i % 4,
  colorIdx: Math.floor(Math.random() * 5),
  drift: (Math.random() - 0.5) * 60,
}));

function Particle({ x, delay, duration, size, rotation, opacity, shape, colorIdx, drift, isDark }) {
  const colors = isDark ? PARTICLE_COLORS_DARK : PARTICLE_COLORS_LIGHT;
  const color  = colors[colorIdx];
  const paths = [
    'M10,0 C15,5 15,15 10,20 C5,15 5,5 10,0',
    'M10,0 C20,5 20,15 10,20 C0,15 0,5 10,0',
    'M10,5 L12,9 L17,9 L13,12 L15,17 L10,14 L5,17 L7,12 L3,9 L8,9 Z',
    'M10,2 L12,8 L18,8 L13,12 L15,18 L10,14 L5,18 L7,12 L2,8 L8,8 Z',
  ];
  return (
    <motion.svg
      width={size} height={size} viewBox="0 0 20 20"
      style={{ position: 'absolute', left: `${x}%`, top: -30, opacity, zIndex: 0, pointerEvents: 'none' }}
      initial={{ y: -40, rotate: rotation }}
      animate={{ y: '110vh', rotate: rotation + 360, x: [0, drift, -drift * 0.5, drift * 0.3, 0] }}
      transition={{ duration, delay, repeat: Infinity, ease: 'linear', x: { duration: duration * 0.7, repeat: Infinity, ease: 'easeInOut' } }}
    >
      <path d={paths[shape]} fill={color} />
    </motion.svg>
  );
}

function GlowOrb({ cx, cy, r, color, delay }) {
  return (
    <motion.div
      style={{ position: 'absolute', left: `${cx}%`, top: `${cy}%`, width: r, height: r, borderRadius: '50%', background: color, filter: 'blur(70px)', zIndex: 0, pointerEvents: 'none' }}
      animate={{ scale: [1, 1.25, 0.88, 1.1, 1], opacity: [0.35, 0.55, 0.25, 0.5, 0.35] }}
      transition={{ duration: 10, delay, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}

const CSS = `
@keyframes aOrb{0%,100%{transform:translate(0,0) scale(1);opacity:.3}40%{transform:translate(20px,-18px) scale(1.1);opacity:.5}70%{transform:translate(-12px,10px) scale(.92);opacity:.22}}
@keyframes aOrb2{0%,100%{transform:translate(0,0) scale(1);opacity:.2}45%{transform:translate(-25px,14px) scale(1.12);opacity:.4}75%{transform:translate(16px,-9px) scale(.9);opacity:.16}}
@keyframes spinSlow{to{transform:rotate(360deg)}}
@keyframes spinSlowRev{from{transform:rotate(0deg)}to{transform:rotate(-360deg)}}
@keyframes petalA{0%,100%{transform:translateY(0) rotate(0deg);opacity:.45}50%{transform:translateY(-16px) rotate(210deg);opacity:.18}}
@keyframes shimG{0%,100%{opacity:.65}50%{opacity:1}}
.auth-panel-left { background: var(--auth-left-bg); border-right: 1px solid var(--auth-border); }
.auth-form-card { background: var(--auth-card-bg); border: 1px solid var(--auth-border); border-radius: 24px; padding: 36px 32px; backdrop-filter: blur(24px); box-shadow: var(--auth-card-shadow); }
`;

const FEATURES = [
  { icon: Lock,   text: "Client-side AES-256 encryption keeps your keys on your device." },
  { icon: Shield, text: "Dead Man Switch with 3-guardian confirmation quorum." },
  { icon: Users,  text: "Staged asset release to multiple beneficiaries via smart contract." },
];

export default function AuthLayout() {
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  const vars = isDark ? {
    "--auth-left-bg":      "linear-gradient(180deg,#091225 0%,#101d36 55%,#081026 100%)",
    "--auth-border":       "rgba(198,143,130,0.14)",
    "--auth-card-bg":      "rgba(10,7,22,0.82)",
    "--auth-card-shadow":  "0 24px 80px rgba(0,0,0,.65), inset 0 1px 0 rgba(255,255,255,.03)",
    "--auth-title-color":  "var(--color-brand)",
    "--auth-title-from":   "var(--color-brand)",
    "--auth-title-to":     "rgba(244,231,229,0.72)",
    "--auth-icon-bg":      "rgba(198,143,130,0.12)",
    "--auth-icon-border":  "rgba(198,143,130,0.26)",
    "--auth-icon-color":   "var(--color-brand)",
    "--auth-orb1":         "rgba(198,143,130,.16)",
    "--auth-orb2":         "rgba(198,143,130,.08)",
    "--auth-orb3":         "rgba(244,143,177,.08)",
    "--auth-text-body":    "rgba(244,231,229,.72)",
    "--auth-ring-bg":      "linear-gradient(135deg,rgba(198,143,130,.12),rgba(255,255,255,.06))",
    "--auth-ring-border":  "rgba(198,143,130,.22)",
    "--auth-petal1":       "rgba(198,143,130,.95)",
    "--auth-petal2":       "var(--color-brand)",
    "--auth-petal3":       "rgba(244,143,177,.7)",
    "--auth-petal4":       "rgba(198,143,130,.6)",
    "--auth-copy":         "rgba(244,231,229,.45)",
    "--auth-bg-page":      "var(--color-bg)",
  } : {
    "--auth-left-bg":      "linear-gradient(180deg,#f7f0ec 0%,#eee2de 55%,#f7f0ec 100%)",
    "--auth-border":       "rgba(198,143,130,0.14)",
    "--auth-card-bg":      "rgba(255,255,255,0.96)",
    "--auth-card-shadow":  "0 24px 80px rgba(60,42,20,.12), inset 0 1px 0 rgba(255,255,255,.9)",
    "--auth-title-color":  "var(--color-brand)",
    "--auth-title-from":   "var(--color-brand)",
    "--auth-title-to":     "rgba(244,231,229,.95)",
    "--auth-icon-bg":      "rgba(198,143,130,0.14)",
    "--auth-icon-border":  "rgba(198,143,130,0.26)",
    "--auth-icon-color":   "var(--color-brand)",
    "--auth-orb1":         "rgba(198,143,130,.16)",
    "--auth-orb2":         "rgba(244,143,177,.08)",
    "--auth-orb3":         "rgba(198,143,130,.08)",
    "--auth-text-body":    "rgba(58,50,50,.72)",
    "--auth-ring-bg":      "linear-gradient(135deg,rgba(198,143,130,.14),rgba(255,255,255,.1))",
    "--auth-ring-border":  "rgba(198,143,130,.28)",
    "--auth-petal1":       "rgba(198,143,130,.95)",
    "--auth-petal2":       "var(--color-brand)",
    "--auth-petal3":       "rgba(244,143,177,.7)",
    "--auth-petal4":       "rgba(198,143,130,.65)",
    "--auth-copy":         "rgba(58,50,50,.42)",
    "--auth-bg-page":      "#F7F0ED",
  };

  const orbColor1 = isDark ? "rgba(198,143,130,0.18)" : "rgba(198,143,130,0.22)";
  const orbColor2 = isDark ? "rgba(160,100,200,0.12)" : "rgba(200,130,160,0.15)";
  const orbColor3 = isDark ? "rgba(100,160,220,0.10)" : "rgba(180,140,200,0.14)";
  const vineColor = isDark ? "rgba(198,143,130,0.12)" : "rgba(198,143,130,0.18)";
  const ringColor = isDark ? "rgba(198,143,130,0.10)" : "rgba(198,143,130,0.14)";

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: vars["--auth-bg-page"], ...vars }}>
      <style>{CSS}</style>

      {/* ── Left panel ── */}
      <div style={{ display: "none", width: 480, flexShrink: 0, position: "relative", overflow: "hidden" }} className="auth-panel-left lg:flex flex-col">
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          <div style={{ position: "absolute", width: 380, height: 380, borderRadius: "50%", background: `radial-gradient(circle,${vars["--auth-orb1"]} 0%,transparent 70%)`, top: -60, left: -60, filter: "blur(64px)", animation: "aOrb 14s ease-in-out infinite" }} />
          <div style={{ position: "absolute", width: 300, height: 300, borderRadius: "50%", background: `radial-gradient(circle,${vars["--auth-orb2"]} 0%,transparent 70%)`, bottom: 40, right: -40, filter: "blur(56px)", animation: "aOrb2 18s ease-in-out infinite" }} />
          <div style={{ position: "absolute", width: 200, height: 200, borderRadius: "50%", background: `radial-gradient(circle,${vars["--auth-orb3"]} 0%,transparent 70%)`, top: "50%", left: "40%", filter: "blur(50px)", animation: "aOrb 22s ease-in-out infinite 5s" }} />
          {[{ t: "15%", l: "8%", c: vars["--auth-petal1"], d: "0s", dr: "9s" }, { t: "40%", r: "10%", c: vars["--auth-petal2"], d: "3s", dr: "11s" }, { t: "70%", l: "5%", c: vars["--auth-petal3"], d: "1.5s", dr: "8s" }, { t: "80%", r: "6%", c: vars["--auth-petal4"], d: "5s", dr: "12s" }].map((p, i) => (
            <div key={i} style={{ position: "absolute", width: 6, height: 10, borderRadius: "60% 60% 40% 40%", background: p.c, opacity: .38, top: p.t, left: p.l, right: p.r, animation: `petalA ${p.dr} ease-in-out infinite ${p.d}`, pointerEvents: "none" }} />
          ))}
        </div>

        <div style={{ position: "relative", zIndex: 10, display: "flex", flexDirection: "column", height: "100%", padding: 40 }}>
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 64, textDecoration: "none" }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: vars["--auth-icon-bg"], border: `1px solid ${vars["--auth-icon-border"]}`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 20px ${vars["--auth-icon-bg"]}` }}>
              <Shield style={{ width: 20, height: 20, color: vars["--auth-icon-color"] }} />
            </div>
            <span style={{ fontSize: "1.2rem", fontWeight: 700, fontFamily: "Inter, sans-serif", background: `linear-gradient(135deg,${vars["--auth-title-from"]},${vars["--auth-title-to"]})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              CryptWill
            </span>
          </Link>

          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .6 }}>
              <h1 style={{ fontSize: "2.2rem", fontWeight: 700, fontFamily: "Inter, sans-serif", lineHeight: 1.25, marginBottom: 16, color: "var(--color-text-primary)" }}>
                Your crypto.<br />Your legacy.<br />
                <span style={{ background: `linear-gradient(135deg,${vars["--auth-title-from"]},${vars["--auth-title-to"]})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", animation: "shimG 3s ease-in-out infinite" }}>
                  Your rules.
                </span>
              </h1>
              <p style={{ color: vars["--auth-text-body"], fontSize: ".92rem", lineHeight: 1.7, marginBottom: 40 }}>
                Decentralized crypto inheritance on the Stellar blockchain. No lawyers. No intermediaries. Just code.
              </p>
            </motion.div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {FEATURES.map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: .3 + i * .15 }} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: vars["--auth-icon-bg"], border: `1px solid ${vars["--auth-icon-border"]}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                    <item.icon style={{ width: 16, height: 16, color: vars["--auth-icon-color"] }} />
                  </div>
                  <p style={{ fontSize: ".83rem", color: vars["--auth-text-body"], lineHeight: 1.6 }}>{item.text}</p>
                </motion.div>
              ))}
            </div>

            <div style={{ marginTop: 48, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ position: "relative", width: 96, height: 96 }}>
                <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `1px solid ${vars["--auth-icon-border"]}`, animation: "spinSlow 20s linear infinite" }}>
                  {[0, 60, 120, 180, 240, 300].map((deg, i) => (
                    <div key={i} style={{ position: "absolute", width: 6, height: 6, borderRadius: "50%", background: [vars["--auth-petal1"], vars["--auth-petal2"], vars["--auth-petal3"], vars["--auth-petal1"], "#86c578", vars["--auth-petal4"]][i], top: "50%", left: "50%", transform: `rotate(${deg}deg) translateX(44px) translateY(-50%)`, transformOrigin: "0 0" }} />
                  ))}
                </div>
                <div style={{ position: "absolute", inset: 10, borderRadius: "50%", background: vars["--auth-ring-bg"], border: `1px solid ${vars["--auth-ring-border"]}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Shield style={{ width: 28, height: 28, color: vars["--auth-icon-color"] }} />
                </div>
              </div>
            </div>
          </div>

          <p style={{ fontSize: ".72rem", color: vars["--auth-copy"], marginTop: "auto" }}>
            Copyright 2025 CryptWill · Powered by Stellar Soroban
          </p>
        </div>
      </div>

      {/* ── Right panel (animated) ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>

        {/* Ambient glow orbs */}
        <GlowOrb cx={-5}  cy={-5}  r={350} color={orbColor1} delay={0} />
        <GlowOrb cx={70}  cy={60}  r={300} color={orbColor2} delay={3} />
        <GlowOrb cx={80}  cy={-10} r={280} color={orbColor3} delay={6} />
        <GlowOrb cx={10}  cy={75}  r={250} color={orbColor1} delay={2} />

        {/* Floating particles */}
        <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
          {PARTICLES.map(p => <Particle key={p.id} {...p} isDark={isDark} />)}
        </div>

        {/* Animated vine / circuit lines */}
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0 }} preserveAspectRatio="none">
          <motion.path
            d="M-20,180 Q120,100 260,170 Q400,240 520,150 Q640,60 760,130 Q880,200 1000,110"
            stroke={vineColor} strokeWidth="1.2" fill="none"
            initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 3.5, ease: "easeOut", delay: 0.2 }}
          />
          <motion.path
            d="M-20,500 Q180,420 360,490 Q540,560 700,470 Q860,380 1000,450"
            stroke={vineColor} strokeWidth="1" fill="none"
            initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 4, ease: "easeOut", delay: 0.8 }}
          />
          <motion.path
            d="M200,-20 Q260,140 210,300 Q160,460 230,620"
            stroke={vineColor} strokeWidth="0.8" fill="none"
            initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 3, ease: "easeOut", delay: 1.2 }}
          />
          {[
            { cx: "30%", cy: "28%" }, { cx: "58%", cy: "18%" }, { cx: "72%", cy: "68%" },
            { cx: "18%", cy: "72%" }, { cx: "88%", cy: "42%" },
          ].map((dot, i) => (
            <motion.circle
              key={i} cx={dot.cx} cy={dot.cy} r="2.5"
              fill={isDark ? "rgba(198,143,130,0.6)" : "rgba(198,143,130,0.5)"}
              animate={{ r: [2.5, 4, 2.5], opacity: [0.5, 0.9, 0.5] }}
              transition={{ duration: 2.5, delay: i * 0.7, repeat: Infinity, ease: "easeInOut" }}
            />
          ))}
        </svg>

        {/* Spinning corner rings */}
        <div style={{ position: "absolute", top: -40, right: -40, width: 180, height: 180, borderRadius: "50%", border: `1px solid ${ringColor}`, animation: "spinSlow 28s linear infinite", pointerEvents: "none", zIndex: 0 }} />
        <div style={{ position: "absolute", bottom: -60, left: -60, width: 220, height: 220, borderRadius: "50%", border: `1px solid ${ringColor}`, animation: "spinSlowRev 38s linear infinite", pointerEvents: "none", zIndex: 0 }} />

        {/* Top bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", position: "relative", zIndex: 10 }}>
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }} className="lg:hidden">
            <div style={{ width: 32, height: 32, borderRadius: 9, background: vars["--auth-icon-bg"], border: `1px solid ${vars["--auth-icon-border"]}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Shield style={{ width: 16, height: 16, color: vars["--auth-icon-color"] }} />
            </div>
            <span style={{ fontWeight: 700, fontFamily: "Inter, sans-serif", background: `linear-gradient(135deg,${vars["--auth-title-from"]},${vars["--auth-title-to"]})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>CryptWill</span>
          </Link>
          <div style={{ marginLeft: "auto" }}>
            <ThemeToggle />
          </div>
        </div>

        {/* Form card with smooth entrance */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 24px 48px", position: "relative", zIndex: 10 }}>
          <motion.div
            className="auth-form-card"
            style={{ width: "100%", maxWidth: 400 }}
            initial={{ opacity: 0, y: 32, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          >
            <Outlet />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
