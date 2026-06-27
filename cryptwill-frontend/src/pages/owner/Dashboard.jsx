import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Coins, Users, UserCheck, Vault, CheckCircle, Clock, AlertTriangle, ArrowRight, Zap, Activity, Lock, Sparkles } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useThemeStore } from "../../store/themeStore";
import api from "../../services/api";
import toast from "react-hot-toast";

const TONES_DARK = {
  gold:  { color:"#d4af37", bg:"rgba(212,175,55,.09)",  border:"rgba(212,175,55,.22)"  },
  green: { color:"#86c578", bg:"rgba(134,197,120,.09)", border:"rgba(134,197,120,.22)" },
  amber: { color:"#f59e0b", bg:"rgba(245,158,11,.09)",  border:"rgba(245,158,11,.22)"  },
  rose:  { color:"#f48fb1", bg:"rgba(244,143,177,.09)", border:"rgba(244,143,177,.22)" },
};
const TONES_LIGHT = {
  gold:  { color:"#8C6A4F", bg:"rgba(140,106,79,.08)",  border:"rgba(140,106,79,.22)"  },
  green: { color:"#5D7A61", bg:"rgba(93,122,97,.08)",   border:"rgba(93,122,97,.22)"   },
  amber: { color:"#D99A4E", bg:"rgba(217,154,78,.08)",  border:"rgba(217,154,78,.22)"  },
  rose:  { color:"#B55A5A", bg:"rgba(181,90,90,.08)",   border:"rgba(181,90,90,.22)"   },
};

export default function Dashboard() {
  const { user } = useAuthStore();
  const { theme } = useThemeStore();
  const isDark = theme === "dark";
  const TONES = isDark ? TONES_DARK : TONES_LIGHT;

  const [stats, setStats] = useState(null);
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);

  /* ---- theme tokens ---- */
  const T = isDark ? {
    cardBg:      "rgba(10,7,22,.78)",
    cardBorder:  "rgba(212,175,55,.15)",
    cardShadow:  "0 4px 32px rgba(0,0,0,.45),inset 0 1px 0 rgba(255,255,255,.025)",
    cardHoverBdr:"rgba(212,175,55,.32)",
    titleGrad:   "linear-gradient(135deg,#d4af37,#f5e6a3,#c8956b)",
    subClr:      "rgba(200,180,150,.55)",
    orb1:        "rgba(147,51,234,.14)",
    orb2:        "rgba(212,175,55,.09)",
    petalClrs:   ["#a855f7","#d4af37","#f48fb1"],
    sectLabel:   "rgba(200,180,150,.45)",
    sectVal:     "#f5f0e8",
    divider:     "rgba(212,175,55,.1)",
    contractBg:  "rgba(10,7,22,.78)",
    contractBdr: "rgba(212,175,55,.18)",
    linkClr:     "#d4af37",
    checkBg:     "rgba(134,197,120,.07)",
    checkBdr:    "rgba(134,197,120,.2)",
    checkBtnBg:  "linear-gradient(135deg,#86c578,#5d7a61)",
    checkBtnClr: "#06040f",
    checkBtnSdw: "0 4px 20px rgba(134,197,120,.3)",
    checkBtnHvr: "0 8px 28px rgba(134,197,120,.45)",
    secHeadClr:  "#f5f0e8",
    spinClr:     "#d4af37",
    spinBdr:     "rgba(212,175,55,.12)",
    upgradeClr:  "#d4af37",
    upgradeBg:   "rgba(212,175,55,.08)",
    upgradeBdr:  "rgba(212,175,55,.25)",
    upgradeHov:  "rgba(212,175,55,.15)",
    qaBg:        "rgba(10,7,22,.72)",
    qaBdr:       "rgba(212,175,55,.12)",
    qaHovBdr:    "rgba(212,175,55,.3)",
    qaHovBg:     "rgba(212,175,55,.05)",
  } : {
    cardBg:      "rgba(255,252,248,.92)",
    cardBorder:  "rgba(140,106,79,.15)",
    cardShadow:  "0 4px 20px rgba(140,106,79,.08),inset 0 1px 0 rgba(255,255,255,.9)",
    cardHoverBdr:"rgba(140,106,79,.35)",
    titleGrad:   "linear-gradient(135deg,#8C6A4F,#c8956b)",
    subClr:      "rgba(80,60,45,.55)",
    orb1:        "rgba(140,106,79,.08)",
    orb2:        "rgba(200,160,100,.06)",
    petalClrs:   ["#c8956b","#8C6A4F","#d4a066"],
    sectLabel:   "rgba(80,60,45,.48)",
    sectVal:     "#3B332C",
    divider:     "rgba(140,106,79,.1)",
    contractBg:  "rgba(255,252,248,.92)",
    contractBdr: "rgba(140,106,79,.2)",
    linkClr:     "#8C6A4F",
    checkBg:     "rgba(93,122,97,.07)",
    checkBdr:    "rgba(93,122,97,.2)",
    checkBtnBg:  "linear-gradient(135deg,#5D7A61,#3d5a41)",
    checkBtnClr: "#fff",
    checkBtnSdw: "0 4px 20px rgba(93,122,97,.25)",
    checkBtnHvr: "0 8px 28px rgba(93,122,97,.4)",
    secHeadClr:  "#3B332C",
    spinClr:     "#8C6A4F",
    spinBdr:     "rgba(140,106,79,.12)",
    upgradeClr:  "#8C6A4F",
    upgradeBg:   "rgba(140,106,79,.08)",
    upgradeBdr:  "rgba(140,106,79,.25)",
    upgradeHov:  "rgba(140,106,79,.15)",
    qaBg:        "rgba(255,252,248,.85)",
    qaBdr:       "rgba(140,106,79,.15)",
    qaHovBdr:    "rgba(140,106,79,.35)",
    qaHovBg:     "rgba(140,106,79,.04)",
  };

  const CSS = `
@keyframes oOrb{0%,100%{transform:translate(0,0) scale(1);opacity:.25}40%{transform:translate(16px,-12px) scale(1.08);opacity:.4}70%{transform:translate(-9px,8px) scale(.94);opacity:.18}}
@keyframes oOrb2{0%,100%{transform:translate(0,0) scale(1);opacity:.15}45%{transform:translate(-20px,10px) scale(1.1);opacity:.3}75%{transform:translate(12px,-7px) scale(.9);opacity:.12}}
@keyframes petalO{0%,100%{transform:translateY(0) rotate(0deg);opacity:.38}50%{transform:translateY(-12px) rotate(180deg);opacity:.15}}
@keyframes spin{to{transform:rotate(360deg)}}
.o-card{background:${T.cardBg};border:1px solid ${T.cardBorder};border-radius:18px;padding:20px;backdrop-filter:blur(16px);box-shadow:${T.cardShadow};transition:all .22s}
.o-card:hover{border-color:${T.cardHoverBdr};transform:translateY(-3px)}
.qa-lnk{display:flex;flex-direction:column;gap:12px;padding:16px;border-radius:14px;background:${T.qaBg};border:1px solid ${T.qaBdr};text-decoration:none;transition:all .2s;backdrop-filter:blur(12px)}
.qa-lnk:hover{border-color:${T.qaHovBdr};background:${T.qaHovBg};transform:translateY(-2px)}
`;

  useEffect(() => {
    Promise.all([
      api.get("/assets").catch(()=>({data:{data:[]}})),
      api.get("/beneficiaries").catch(()=>({data:{data:[]}})),
      api.get("/guardians").catch(()=>({data:{data:[]}})),
      api.get("/contract/status").catch(()=>({data:{data:null}})),
      api.get("/vault").catch(()=>({data:{data:{files:[]}}})),
    ]).then(([assets,bens,guards,cont,vault])=>{
      setStats({ assets:assets.data.data?.assets?.length??assets.data.data?.length??0, beneficiaries:bens.data.data?.beneficiaries?.length??0, guardians:guards.data.data?.guardians?.length??0, vaultFiles:vault.data.data?.files?.length??0 });
      setContract(cont.data.data?.contract??cont.data.data);
    }).finally(()=>setLoading(false));
  },[]);

  const handleCheckin = async () => {
    try { await api.post("/checkin"); toast.success("Check-in recorded on Stellar!"); }
    catch (err) { toast.error(err.response?.data?.error||"Check-in failed"); }
  };

  const quickActions = [
    { label:"Add Asset",       to:"/app/assets",        icon:Coins,    desc:"Register crypto wallet or token", tone:"gold"  },
    { label:"Add Beneficiary", to:"/app/beneficiaries", icon:Users,    desc:"Name your heirs",                 tone:"green" },
    { label:"Add Guardian",    to:"/app/guardians",     icon:UserCheck,desc:"Set trusted confirmers",          tone:"amber" },
    { label:"Upload Document", to:"/app/vault",         icon:Vault,    desc:"Encrypt & store files",           tone:"rose"  },
  ];

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:280, flexDirection:"column", gap:16 }}>
      <style>{CSS}</style>
      <div style={{ width:40, height:40, border:`2px solid ${T.spinBdr}`, borderTop:`2px solid ${T.spinClr}`, borderRadius:"50%", animation:"spin .9s linear infinite" }} />
      <p style={{ color:T.spinClr, fontSize:".8rem", fontFamily:"Georgia,serif", fontStyle:"italic", opacity:.6 }}>Loading your estate plan...</p>
    </div>
  );

  const cStatus = contract?.status || "NOT_DEPLOYED";
  const decisionOpen = cStatus === "TRIGGERED";

  return (
    <div style={{ position:"relative", maxWidth:1100 }}>
      <style>{CSS}</style>

      {/* Ambient orbs */}
      <div style={{ position:"absolute", inset:0, overflow:"hidden", pointerEvents:"none" }}>
        <div style={{ position:"absolute", width:420, height:420, borderRadius:"50%", background:`radial-gradient(circle,${T.orb1} 0%,transparent 70%)`, top:-80, right:-60, filter:"blur(70px)", animation:"oOrb 15s ease-in-out infinite" }} />
        <div style={{ position:"absolute", width:320, height:320, borderRadius:"50%", background:`radial-gradient(circle,${T.orb2} 0%,transparent 70%)`, bottom:40, left:-40, filter:"blur(60px)", animation:"oOrb2 18s ease-in-out infinite" }} />
        {T.petalClrs.map((c,i)=>(
          <div key={i} style={{ position:"absolute", width:6, height:10, borderRadius:"60% 60% 40% 40%", background:c, opacity:.3, top:[`10%`,`30%`,`65%`][i], left:i===1?undefined:`1%`, right:i===1?`3%`:undefined, animation:`petalO ${["9s","11s","8s"][i]} ease-in-out infinite ${["0s","3s","1.5s"][i]}`, pointerEvents:"none", zIndex:0 }} />
        ))}
      </div>

      {/* Header */}
      <motion.div initial={{ opacity:0, y:-12 }} animate={{ opacity:1, y:0 }} style={{ position:"relative", zIndex:1, marginBottom:28, display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:14 }}>
        <div>
          <h1 style={{ fontSize:"1.55rem", fontWeight:700, fontFamily:"Georgia,serif", background:T.titleGrad, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", margin:"0 0 6px" }}>
            Welcome back, {user?.fullName?.split(" ")[0]} ✦
          </h1>
          <p style={{ fontSize:".83rem", color:T.subClr }}>Your crypto inheritance plan at a glance</p>
        </div>
        {user?.plan === "FREE" && (
          <Link to="/app/settings" style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 16px", borderRadius:999, background:T.upgradeBg, border:`1px solid ${T.upgradeBdr}`, color:T.upgradeClr, fontSize:".8rem", fontWeight:600, textDecoration:"none", transition:"all .2s" }}
            onMouseEnter={e=>{e.currentTarget.style.background=T.upgradeHov}} onMouseLeave={e=>{e.currentTarget.style.background=T.upgradeBg}}>
            <Zap style={{ width:14, height:14 }} /> Upgrade to Pro
          </Link>
        )}
      </motion.div>

      {/* Check-in status banner */}
      {(() => {
        if (!contract || cStatus==="NOT_DEPLOYED") return (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:.1 }} style={{ position:"relative", zIndex:1, marginBottom:24, display:"flex", alignItems:"center", gap:12, padding:"12px 16px", borderRadius:14, background:TONES.amber.bg, border:`1px solid ${TONES.amber.border}`, backdropFilter:"blur(10px)" }}>
            <AlertTriangle style={{ width:16, height:16, color:TONES.amber.color, flexShrink:0 }} />
            <p style={{ fontSize:".85rem", color:T.sectVal }}>Deploy your smart contract to start check-ins</p>
          </motion.div>
        );
        const now = new Date(); const due = new Date(contract.nextCheckinDue);
        const daysLeft = Math.ceil((due - now) / 86400000);
        const tone = daysLeft <= 3 ? TONES.rose : daysLeft <= 7 ? TONES.amber : TONES.green;
        return (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:.1 }} style={{ position:"relative", zIndex:1, marginBottom:24, display:"flex", alignItems:"center", gap:12, padding:"12px 16px", borderRadius:14, background:tone.bg, border:`1px solid ${tone.border}`, backdropFilter:"blur(10px)" }}>
            {daysLeft <= 7 ? <Clock style={{ width:16, height:16, color:tone.color, flexShrink:0 }} /> : <CheckCircle style={{ width:16, height:16, color:tone.color, flexShrink:0 }} />}
            <div style={{ flex:1 }}>
              <p style={{ fontSize:".85rem", fontWeight:600, color:T.sectVal }}>{daysLeft > 0 ? `Next check-in due in ${daysLeft} day${daysLeft!==1?"s":""}` : "Check-in overdue!"}</p>
              <p style={{ fontSize:".73rem", color:T.subClr, marginTop:2 }}>Due: {due.toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})}</p>
            </div>
            <span style={{ fontSize:".78rem", fontWeight:700, color:tone.color }}>{daysLeft > 0 ? `${daysLeft}d` : "NOW"}</span>
          </motion.div>
        );
      })()}

      {/* Stats */}
      <div style={{ position:"relative", zIndex:1, display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:14, marginBottom:28 }}>
        {[
          { icon:Coins,     label:"Assets Registered", value:stats?.assets??0,        tone:"gold"  },
          { icon:Users,     label:"Beneficiaries",      value:stats?.beneficiaries??0,  tone:"green" },
          { icon:UserCheck, label:"Guardians",           value:stats?.guardians??0,      tone:"amber" },
          { icon:Lock,      label:"Vault Files",         value:stats?.vaultFiles??0,     tone:"rose"  },
        ].map(({ icon:Icon, label, value, tone }, i) => {
          const t = TONES[tone];
          return (
            <motion.div key={label} className="o-card" initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0, transition:{ delay:i*.08, duration:.4 } }} whileHover={{ y:-3 }} transition={{ duration:.2 }}>
              <div style={{ width:40, height:40, borderRadius:11, background:t.bg, border:`1px solid ${t.border}`, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:14 }}>
                <Icon style={{ width:19, height:19, color:t.color }} />
              </div>
              <p style={{ fontSize:"1.7rem", fontWeight:700, color:T.sectVal, lineHeight:1 }}>{value}</p>
              <p style={{ fontSize:".78rem", color:T.subClr, marginTop:6 }}>{label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Contract Status */}
      {contract && (
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:.35 }} style={{ position:"relative", zIndex:1, marginBottom:28, background:T.contractBg, border:`1px solid ${T.contractBdr}`, borderRadius:20, padding:24, backdropFilter:"blur(16px)", boxShadow:T.cardShadow }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18 }}>
            <h2 style={{ fontWeight:700, color:T.secHeadClr, display:"flex", alignItems:"center", gap:8, fontFamily:"Georgia,serif", fontSize:"1rem", margin:0 }}>
              <Activity style={{ width:16, height:16, color:TONES.gold.color }} /> Smart Contract Status
            </h2>
            <span style={{ fontSize:".72rem", borderRadius:999, padding:"4px 12px", fontWeight:700,
              background: cStatus==="ACTIVE"?TONES.green.bg:cStatus==="TRIGGERED"?TONES.amber.bg:TONES.gold.bg,
              color:       cStatus==="ACTIVE"?TONES.green.color:cStatus==="TRIGGERED"?TONES.amber.color:TONES.gold.color,
              border:`1px solid ${cStatus==="ACTIVE"?TONES.green.border:cStatus==="TRIGGERED"?TONES.amber.border:TONES.gold.border}` }}>
              {cStatus.replace("_"," ")}
            </span>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:16 }}>
            {[["Network",contract.network||"—"],["Check-in interval",`${contract.checkinIntervalDays} days`],["Guardian quorum",`${contract.guardianQuorum} of ${stats?.guardians}`]].map(([l,v])=>(
              <div key={l}>
                <p style={{ fontSize:".72rem", color:T.sectLabel, marginBottom:3 }}>{l}</p>
                <p style={{ fontSize:".88rem", fontWeight:600, color:T.sectVal }}>{v}</p>
              </div>
            ))}
          </div>
          {cStatus === "NOT_DEPLOYED" && (
            <div style={{ marginTop:18, paddingTop:18, borderTop:`1px solid ${T.divider}` }}>
              <Link to="/app/settings" style={{ display:"inline-flex", alignItems:"center", gap:6, fontSize:".83rem", color:T.linkClr, fontWeight:600, textDecoration:"none" }}>
                Deploy Smart Contract <ArrowRight style={{ width:14, height:14 }} />
              </Link>
            </div>
          )}
        </motion.div>
      )}

      {/* Quick Actions */}
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:.45 }} style={{ position:"relative", zIndex:1, marginBottom:28 }}>
        <h2 style={{ fontWeight:700, color:T.secHeadClr, marginBottom:16, display:"flex", alignItems:"center", gap:8, fontFamily:"Georgia,serif", fontSize:"1rem" }}>
          <Shield style={{ width:16, height:16, color:TONES.gold.color }} /> Quick Actions
        </h2>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:12 }}>
          {quickActions.map(({ label, to, icon:Icon, desc, tone }, i) => {
            const t = TONES[tone];
            return (
              <motion.div key={label} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:.5+i*.08 }}>
                <Link to={to} className="qa-lnk">
                  <div style={{ width:36, height:36, borderRadius:10, background:t.bg, border:`1px solid ${t.border}`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <Icon style={{ width:17, height:17, color:t.color }} />
                  </div>
                  <div>
                    <p style={{ fontSize:".88rem", fontWeight:600, color:T.sectVal }}>{label}</p>
                    <p style={{ fontSize:".75rem", color:T.subClr, marginTop:3 }}>{desc}</p>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Check-in CTA */}
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:.6 }} style={{ position:"relative", zIndex:1, overflow:"hidden", borderRadius:20, background:T.checkBg, border:`1px solid ${T.checkBdr}`, padding:24, backdropFilter:"blur(12px)" }}>
        <div style={{ position:"absolute", inset:0, background:`radial-gradient(ellipse at right,${T.checkBg},transparent 60%)`, pointerEvents:"none" }} />
        <div style={{ position:"relative", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:16 }}>
          <div>
            <h3 style={{ fontWeight:700, color:T.secHeadClr, marginBottom:6, display:"flex", alignItems:"center", gap:8, fontFamily:"Georgia,serif", fontSize:"1rem" }}>
              <CheckCircle style={{ width:18, height:18, color:TONES.green.color }} /> Proof of Life Check-In
            </h3>
            <p style={{ fontSize:".83rem", color:T.subClr, lineHeight:1.6 }}>
              Confirm you're alive — this resets your Dead Man's Switch and mints a PoL token on Stellar.
            </p>
          </div>
          <button onClick={handleCheckin} style={{ display:"flex", alignItems:"center", gap:8, background:T.checkBtnBg, border:"none", color:T.checkBtnClr, padding:"11px 22px", borderRadius:12, fontWeight:700, fontSize:".88rem", cursor:"pointer", boxShadow:T.checkBtnSdw, transition:"all .2s" }}
            onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow=T.checkBtnHvr}}
            onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow=T.checkBtnSdw}}>
            <Sparkles style={{ width:15, height:15 }} /> I'm Alive — Check In Now
          </button>
        </div>
      </motion.div>
    </div>
  );
}
