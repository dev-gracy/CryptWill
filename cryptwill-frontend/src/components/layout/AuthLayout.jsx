import { Outlet, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Lock, Users } from "lucide-react";
import ThemeToggle from "../common/ThemeToggle";
import { useThemeStore } from "../../store/themeStore";

const CSS = `
@keyframes aOrb{0%,100%{transform:translate(0,0) scale(1);opacity:.3}40%{transform:translate(20px,-18px) scale(1.1);opacity:.5}70%{transform:translate(-12px,10px) scale(.92);opacity:.22}}
@keyframes aOrb2{0%,100%{transform:translate(0,0) scale(1);opacity:.2}45%{transform:translate(-25px,14px) scale(1.12);opacity:.4}75%{transform:translate(16px,-9px) scale(.9);opacity:.16}}
@keyframes spinSlow{to{transform:rotate(360deg)}}
@keyframes petalA{0%,100%{transform:translateY(0) rotate(0deg);opacity:.45}50%{transform:translateY(-16px) rotate(210deg);opacity:.18}}
@keyframes shimG{0%,100%{opacity:.65}50%{opacity:1}}
.auth-panel-left { background: var(--auth-left-bg); border-right: 1px solid var(--auth-border); }
.auth-form-card { background: var(--auth-card-bg); border: 1px solid var(--auth-border); border-radius: 24px; padding: 36px 32px; backdrop-filter: blur(20px); box-shadow: var(--auth-card-shadow); }
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
    "--auth-left-bg": "linear-gradient(180deg,#080614 0%,#0d0920 55%,#080614 100%)",
    "--auth-border": "rgba(212,175,55,0.18)",
    "--auth-card-bg": "rgba(10,7,22,0.82)",
    "--auth-card-shadow": "0 24px 80px rgba(0,0,0,.65), inset 0 1px 0 rgba(255,255,255,.03)",
    "--auth-title-color": "#d4af37",
    "--auth-title-from": "#d4af37",
    "--auth-title-to": "#f5e6a3",
    "--auth-icon-bg": "rgba(212,175,55,0.12)",
    "--auth-icon-border": "rgba(212,175,55,0.28)",
    "--auth-icon-color": "#d4af37",
    "--auth-orb1": "rgba(147,51,234,.22)",
    "--auth-orb2": "rgba(212,175,55,.14)",
    "--auth-orb3": "rgba(244,143,177,.08)",
    "--auth-text-body": "rgba(200,180,150,.65)",
    "--auth-ring-bg": "linear-gradient(135deg,rgba(212,175,55,.12),rgba(168,85,247,.08))",
    "--auth-ring-border": "rgba(212,175,55,.25)",
    "--auth-petal1": "#a855f7",
    "--auth-petal2": "#d4af37",
    "--auth-petal3": "#f48fb1",
    "--auth-petal4": "#a855f7",
    "--auth-copy": "rgba(200,180,150,.35)",
    "--auth-bg-page": "#06040f",
  } : {
    "--auth-left-bg": "linear-gradient(180deg,#fdfaf5 0%,#f8f0e3 55%,#fdfaf5 100%)",
    "--auth-border": "rgba(140,106,79,0.18)",
    "--auth-card-bg": "rgba(255,252,248,0.92)",
    "--auth-card-shadow": "0 24px 80px rgba(140,106,79,.12), inset 0 1px 0 rgba(255,255,255,.9)",
    "--auth-title-color": "#8C6A4F",
    "--auth-title-from": "#8C6A4F",
    "--auth-title-to": "#c8956b",
    "--auth-icon-bg": "rgba(140,106,79,0.1)",
    "--auth-icon-border": "rgba(140,106,79,0.22)",
    "--auth-icon-color": "#8C6A4F",
    "--auth-orb1": "rgba(140,106,79,.12)",
    "--auth-orb2": "rgba(200,160,100,.1)",
    "--auth-orb3": "rgba(180,140,200,.07)",
    "--auth-text-body": "rgba(80,60,45,.65)",
    "--auth-ring-bg": "linear-gradient(135deg,rgba(140,106,79,.1),rgba(200,149,107,.08))",
    "--auth-ring-border": "rgba(140,106,79,.22)",
    "--auth-petal1": "#c8956b",
    "--auth-petal2": "#8C6A4F",
    "--auth-petal3": "#d4a066",
    "--auth-petal4": "#b07a50",
    "--auth-copy": "rgba(80,60,45,.4)",
    "--auth-bg-page": "#fdfbf7",
  };

  return (
    <div style={{ minHeight:"100vh", display:"flex", background: vars["--auth-bg-page"], ...vars }}>
      <style>{CSS}</style>

      {/* ── Left panel ── */}
      <div style={{ display:"none", width:480, flexShrink:0, position:"relative", overflow:"hidden" }} className="auth-panel-left lg:flex flex-col">
        <div style={{ position:"absolute", inset:0, pointerEvents:"none" }}>
          <div style={{ position:"absolute", width:380, height:380, borderRadius:"50%", background:`radial-gradient(circle,${vars["--auth-orb1"]} 0%,transparent 70%)`, top:-60, left:-60, filter:"blur(64px)", animation:"aOrb 14s ease-in-out infinite" }} />
          <div style={{ position:"absolute", width:300, height:300, borderRadius:"50%", background:`radial-gradient(circle,${vars["--auth-orb2"]} 0%,transparent 70%)`, bottom:40, right:-40, filter:"blur(56px)", animation:"aOrb2 18s ease-in-out infinite" }} />
          <div style={{ position:"absolute", width:200, height:200, borderRadius:"50%", background:`radial-gradient(circle,${vars["--auth-orb3"]} 0%,transparent 70%)`, top:"50%", left:"40%", filter:"blur(50px)", animation:"aOrb 22s ease-in-out infinite 5s" }} />
          {[{t:"15%",l:"8%",c:vars["--auth-petal1"],d:"0s",dr:"9s"},{t:"40%",r:"10%",c:vars["--auth-petal2"],d:"3s",dr:"11s"},{t:"70%",l:"5%",c:vars["--auth-petal3"],d:"1.5s",dr:"8s"},{t:"80%",r:"6%",c:vars["--auth-petal4"],d:"5s",dr:"12s"}].map((p,i)=>(
            <div key={i} style={{ position:"absolute", width:6, height:10, borderRadius:"60% 60% 40% 40%", background:p.c, opacity:.38, top:p.t, left:p.l, right:p.r, animation:`petalA ${p.dr} ease-in-out infinite ${p.d}`, pointerEvents:"none" }} />
          ))}
        </div>

        <div style={{ position:"relative", zIndex:10, display:"flex", flexDirection:"column", height:"100%", padding:40 }}>
          <Link to="/" style={{ display:"flex", alignItems:"center", gap:12, marginBottom:64, textDecoration:"none" }}>
            <div style={{ width:42, height:42, borderRadius:12, background:vars["--auth-icon-bg"], border:`1px solid ${vars["--auth-icon-border"]}`, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 0 20px ${vars["--auth-icon-bg"]}` }}>
              <Shield style={{ width:20, height:20, color:vars["--auth-icon-color"] }} />
            </div>
            <span style={{ fontSize:"1.2rem", fontWeight:700, fontFamily:"Georgia,serif", background:`linear-gradient(135deg,${vars["--auth-title-from"]},${vars["--auth-title-to"]})`, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
              CryptWill
            </span>
          </Link>

          <div style={{ flex:1, display:"flex", flexDirection:"column", justifyContent:"center" }}>
            <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:.6 }}>
              <h1 style={{ fontSize:"2.2rem", fontWeight:700, fontFamily:"Georgia,serif", lineHeight:1.25, marginBottom:16, color:"var(--color-text-primary)" }}>
                Your crypto.<br />Your legacy.<br />
                <span style={{ background:`linear-gradient(135deg,${vars["--auth-title-from"]},${vars["--auth-title-to"]})`, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", animation:"shimG 3s ease-in-out infinite" }}>
                  Your rules.
                </span>
              </h1>
              <p style={{ color:vars["--auth-text-body"], fontSize:".92rem", lineHeight:1.7, marginBottom:40 }}>
                Decentralized crypto inheritance on the Stellar blockchain. No lawyers. No intermediaries. Just code.
              </p>
            </motion.div>

            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              {FEATURES.map((item, i) => (
                <motion.div key={i} initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }} transition={{ delay:.3+i*.15 }} style={{ display:"flex", alignItems:"flex-start", gap:12 }}>
                  <div style={{ width:34, height:34, borderRadius:9, background:vars["--auth-icon-bg"], border:`1px solid ${vars["--auth-icon-border"]}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:2 }}>
                    <item.icon style={{ width:16, height:16, color:vars["--auth-icon-color"] }} />
                  </div>
                  <p style={{ fontSize:".83rem", color:vars["--auth-text-body"], lineHeight:1.6 }}>{item.text}</p>
                </motion.div>
              ))}
            </div>

            {/* Vault ring decoration */}
            <div style={{ marginTop:48, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <div style={{ position:"relative", width:96, height:96 }}>
                <div style={{ position:"absolute", inset:0, borderRadius:"50%", border:`1px solid ${vars["--auth-icon-border"]}`, animation:"spinSlow 20s linear infinite" }}>
                  {[0,60,120,180,240,300].map((deg,i)=>(
                    <div key={i} style={{ position:"absolute", width:6, height:6, borderRadius:"50%", background:[vars["--auth-petal1"],vars["--auth-petal2"],vars["--auth-petal3"],vars["--auth-petal1"],"#86c578",vars["--auth-petal4"]][i], top:"50%", left:"50%", transform:`rotate(${deg}deg) translateX(44px) translateY(-50%)`, transformOrigin:"0 0" }} />
                  ))}
                </div>
                <div style={{ position:"absolute", inset:10, borderRadius:"50%", background:vars["--auth-ring-bg"], border:`1px solid ${vars["--auth-ring-border"]}`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <Shield style={{ width:28, height:28, color:vars["--auth-icon-color"] }} />
                </div>
              </div>
            </div>
          </div>

          <p style={{ fontSize:".72rem", color:vars["--auth-copy"], marginTop:"auto" }}>
            Copyright 2025 CryptWill · Powered by Stellar Soroban
          </p>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div style={{ flex:1, display:"flex", flexDirection:"column" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"20px 24px" }}>
          <Link to="/" style={{ display:"flex", alignItems:"center", gap:10, textDecoration:"none" }} className="lg:hidden">
            <div style={{ width:32, height:32, borderRadius:9, background:vars["--auth-icon-bg"], border:`1px solid ${vars["--auth-icon-border"]}`, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Shield style={{ width:16, height:16, color:vars["--auth-icon-color"] }} />
            </div>
            <span style={{ fontWeight:700, fontFamily:"Georgia,serif", background:`linear-gradient(135deg,${vars["--auth-title-from"]},${vars["--auth-title-to"]})`, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>CryptWill</span>
          </Link>
          <div style={{ marginLeft:"auto" }}>
            <ThemeToggle />
          </div>
        </div>

        <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:"24px 24px 48px" }}>
          <div className="auth-form-card" style={{ width:"100%", maxWidth:400 }}>
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
