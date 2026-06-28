import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle, Check, CheckCircle, Clock, FileText,
  History, Hourglass, Mail, Shield, ThumbsDown, ThumbsUp,
  UserCheck, Users, Vote, X, Sparkles,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import { useAuthStore } from "../../store/authStore";

const TABS = [
  { id: "myInvites",       label: "My Invitations",    icon: Mail },
  { id: "overview",        label: "Overview",           icon: Shield },
  { id: "pendingInvites",  label: "Invitation Pending", icon: Hourglass },
  { id: "decision",        label: "Decision",           icon: Vote },
  { id: "decisionPending", label: "Decision Pending",   icon: Clock },
  { id: "history",         label: "History",            icon: History },
];

const formatDate = (v) => (!v ? "Not available" : new Date(v).toLocaleString());

function GCard({ children, style = {} }) {
  return (
    <div style={{
      background: "rgba(10,7,22,0.78)",
      border: "1px solid rgba(198,143,130,0.18)",
      borderRadius: 20, padding: 24,
      backdropFilter: "blur(18px)",
      boxShadow: "0 8px 48px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.03)",
      ...style,
    }}>{children}</div>
  );
}

function SH({ icon: Icon, children, color = "#c68f82" }) {
  return (
    <h2 style={{ fontWeight:700, color:"#f5f0e8", marginBottom:18, display:"flex", alignItems:"center", gap:10, fontFamily:"Inter, sans-serif", fontSize:"1rem" }}>
      <span style={{ width:30, height:30, borderRadius:8, background:`${color}18`, border:`1px solid ${color}30`, display:"inline-flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
        <Icon style={{ width:15, height:15, color }} />
      </span>
      {children}
    </h2>
  );
}

function StatCard({ label, value, icon: Icon, color = "#d4af37" }) {
  return (
    <motion.div whileHover={{ y:-3, scale:1.02 }} transition={{ duration:0.18 }} style={{ background:"rgba(10,7,22,0.75)", border:`1px solid ${color}35`, borderRadius:16, padding:"16px 18px", display:"flex", alignItems:"center", gap:14, backdropFilter:"blur(14px)", boxShadow:`0 0 24px ${color}12, 0 4px 20px rgba(0,0,0,0.4)` }}>
      <div style={{ width:40, height:40, borderRadius:11, background:`${color}10`, border:`1px solid ${color}28`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
        <Icon style={{ width:19, height:19, color }} />
      </div>
      <div>
        <p style={{ fontSize:"1.3rem", fontWeight:700, color:"#f5f0e8", lineHeight:1 }}>{value}</p>
        <p style={{ fontSize:"0.7rem", color:"rgba(200,180,150,0.6)", marginTop:4, textTransform:"uppercase", letterSpacing:"0.07em" }}>{label}</p>
      </div>
    </motion.div>
  );
}

function Empty({ icon: Icon, title, message }) {
  return (
    <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} style={{ background:"rgba(10,7,22,0.65)", border:"1px dashed rgba(212,175,55,0.2)", borderRadius:20, padding:"48px 32px", textAlign:"center", backdropFilter:"blur(12px)" }}>
      <div style={{ width:54, height:54, borderRadius:14, background:"rgba(212,175,55,0.07)", border:"1px solid rgba(212,175,55,0.18)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 14px" }}>
        <Icon style={{ width:24, height:24, color:"#d4af37" }} />
      </div>
      <h3 style={{ fontWeight:600, color:"#f5f0e8", fontSize:"0.98rem", fontFamily:"Georgia,serif" }}>{title}</h3>
      <p style={{ fontSize:"0.83rem", color:"rgba(200,180,150,0.6)", marginTop:8, maxWidth:380, margin:"8px auto 0", lineHeight:1.6 }}>{message}</p>
    </motion.div>
  );
}

function VBadge({ vote }) {
  const ok = vote === "APPROVE";
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:4, borderRadius:999, padding:"4px 12px", fontSize:"0.71rem", fontWeight:700, background: ok ? "rgba(134,197,120,0.1)" : "rgba(239,68,68,0.1)", color: ok ? "#86c578" : "#f87171", border:`1px solid ${ok ? "rgba(134,197,120,0.28)" : "rgba(239,68,68,0.28)"}` }}>
      {ok ? <Check style={{ width:11, height:11 }} /> : <X style={{ width:11, height:11 }} />}
      {ok ? "Approved" : "Denied"}
    </span>
  );
}

const CSS = `
@keyframes gOrb{0%,100%{transform:translate(0,0) scale(1);opacity:.35}40%{transform:translate(18px,-14px) scale(1.08);opacity:.5}70%{transform:translate(-10px,9px) scale(.95);opacity:.28}}
@keyframes gOrb2{0%,100%{transform:translate(0,0) scale(1);opacity:.22}45%{transform:translate(-22px,11px) scale(1.1);opacity:.38}75%{transform:translate(14px,-7px) scale(.92);opacity:.18}}
@keyframes petal{0%,100%{transform:translateY(0) rotate(0deg);opacity:.45}50%{transform:translateY(-14px) rotate(200deg);opacity:.2}}
@keyframes shimmer{0%,100%{opacity:.45}50%{opacity:.85}}
@keyframes spin{to{transform:rotate(360deg)}}
.g-orb{position:absolute;border-radius:50%;filter:blur(72px);pointer-events:none;z-index:0}
.g-tab{border:1px solid transparent;border-radius:10px;padding:7px 13px;font-size:.8rem;font-weight:500;cursor:pointer;display:flex;align-items:center;gap:7px;transition:all .18s;color:rgba(200,180,150,.6);background:transparent;white-space:nowrap}
.g-tab:hover{color:rgba(198,143,130,.85);background:rgba(198,143,130,.08);border-color:rgba(198,143,130,.28)}
.g-tab.active{background:linear-gradient(135deg,rgba(198,143,130,.18),rgba(168,85,247,.09));border-color:rgba(198,143,130,.38)!important;color:#c68f82!important}
.g-btn-ok{display:flex;align-items:center;justify-content:center;gap:8px;border-radius:12px;padding:12px 20px;font-weight:600;font-size:.88rem;cursor:pointer;transition:all .2s;border:1px solid rgba(134,197,120,.38);background:rgba(134,197,120,.07);color:#86c578}
.g-btn-ok:hover{background:rgba(134,197,120,.17);transform:translateY(-1px);box-shadow:0 4px 18px rgba(134,197,120,.18)}
.g-btn-ok:disabled{opacity:.45;cursor:not-allowed;transform:none}
.g-btn-no{display:flex;align-items:center;justify-content:center;gap:8px;border-radius:12px;padding:12px 20px;font-weight:600;font-size:.88rem;cursor:pointer;transition:all .2s;border:1px solid rgba(239,68,68,.28);background:rgba(239,68,68,.06);color:#f87171}
.g-btn-no:hover{background:rgba(239,68,68,.14);transform:translateY(-1px)}
.g-btn-no:disabled{opacity:.45;cursor:not-allowed;transform:none}
.drow{display:flex;justify-content:space-between;align-items:center;gap:16px;padding:9px 0;border-bottom:1px solid rgba(212,175,55,.07)}
.drow:last-child{border-bottom:none}
.dlabel{font-size:.78rem;color:rgba(200,180,150,.52)}
.dval{font-size:.84rem;color:#f5f0e8;font-weight:500;text-align:right}
`;

export default function GuardianDashboard() {
  const [activeTab, setActiveTab] = useState("myInvites");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [responding, setResponding] = useState(null);
  const [notes, setNotes] = useState("");
  const { user, login } = useAuthStore();
  const navigate = useNavigate();

  const loadPortal = async () => {
    const oid = localStorage.getItem("cryptwill-guardian-owner");
    const res = await api.get("/guardians/my-portal", { params: oid ? { ownerId: oid } : undefined });
    const d = res.data.data;
    setData(d);
    if (d?.selectedOwnerId) localStorage.setItem("cryptwill-guardian-owner", d.selectedOwnerId);
    return d;
  };

  useEffect(() => {
    loadPortal()
      .catch(err => {
        if (err.response?.status === 401 || err.response?.status === 403) {
          toast.error("Session expired"); navigate("/guardian/login");
        } else toast.error("Failed to load guardian portal");
      })
      .finally(() => setLoading(false));
    const t = setInterval(() => loadPortal().catch(() => {}), 30000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInviteResponse = async (guardianId, action) => {
    if (!window.confirm(`Are you sure you want to ${action === "accept" ? "accept this guardian role" : "decline this invitation"}?`)) return;
    setResponding(guardianId);
    try {
      const res = await api.post("/guardians/respond-invite", { guardianId, action });
      const rd = res.data?.data;
      if (action === "accept") {
        if (rd?.token && user) login({ ...user, role: "GUARDIAN" }, rd.token);
        if (rd?.selectedOwnerId) localStorage.setItem("cryptwill-guardian-owner", rd.selectedOwnerId);
      }
      toast.success(action === "accept" ? "Invitation accepted!" : "Invitation declined");
      await loadPortal();
      setActiveTab(action === "accept" ? "overview" : "myInvites");
    } catch (err) { toast.error(err.response?.data?.error || "Failed to respond"); }
    finally { setResponding(null); }
  };

  const sm = useMemo(() => {
    const c = data?.contract; const v = data?.votes || [];
    return { contract:c, votes:v, approveCount:v.filter(x=>x.vote==="APPROVE").length, denyCount:v.filter(x=>x.vote==="DENY").length, pendingInvites:data?.pendingInvitations||[], myPendingInvites:data?.myPendingInvites||[], activeRoles:data?.activeRoles||[], activeGuardians:data?.activeGuardians||[], history:data?.history||[] };
  }, [data]);

  const handleVote = async (approve) => {
    if (!sm.contract?.id) return;
    if (!window.confirm(`Are you sure you want to ${approve ? "confirm this passing" : "deny this request"}?`)) return;
    setVoting(true);
    try {
      await api.post(`/guardians/${sm.contract.id}/vote`, { vote: approve ? "APPROVE" : "DENY", notes });
      toast.success(approve ? "Decision recorded: confirmed" : "Decision recorded: denied");
      setNotes("");
      await loadPortal();
      setActiveTab("decision");
    } catch (err) { toast.error(err.response?.data?.error || "Failed to record decision"); }
    finally { setVoting(false); }
  };

  if (loading) return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:300, gap:18 }}>
      <style>{CSS}</style>
      <div style={{ width:44, height:44, border:"2px solid rgba(212,175,55,0.12)", borderTop:"2px solid #d4af37", borderRadius:"50%", animation:"spin .9s linear infinite" }} />
      <p style={{ color:"rgba(212,175,55,.55)", fontSize:"0.82rem", fontFamily:"Georgia,serif", fontStyle:"italic" }}>Awakening your guardian portal...</p>
    </div>
  );

  const cStatus = sm.contract?.status || "NOT_DEPLOYED";
  const decisionOpen = cStatus === "TRIGGERED";
  const progress = sm.contract?.guardianQuorum ? Math.min(100, (sm.approveCount / sm.contract.guardianQuorum) * 100) : 0;

  return (
    <div style={{ position:"relative", maxWidth:1100 }}>
      <style>{CSS}</style>

      <div style={{ position:"absolute", inset:0, overflow:"hidden", pointerEvents:"none" }}>
        <div className="g-orb" style={{ width:480, height:480, background:"radial-gradient(circle,rgba(147,51,234,.17) 0%,transparent 70%)", top:-80, right:-60, animation:"gOrb 14s ease-in-out infinite" }} />
        <div className="g-orb" style={{ width:380, height:380, background:"radial-gradient(circle,rgba(198,143,130,.14) 0%,transparent 70%)", bottom:20, left:-50, animation:"gOrb2 17s ease-in-out infinite" }} />
        <div className="g-orb" style={{ width:260, height:260, background:"radial-gradient(circle,rgba(244,143,177,.07) 0%,transparent 70%)", top:"45%", left:"35%", animation:"gOrb 20s ease-in-out infinite 4s" }} />
        {[{t:"12%",l:"3%",c:"#a855f7",d:"0s",dr:"9s"},{t:"28%",r:"6%",c:"#d4af37",d:"2s",dr:"11s"},{t:"58%",l:"1%",c:"#f48fb1",d:"4s",dr:"8s"},{t:"78%",r:"4%",c:"#a855f7",d:"1s",dr:"12s"}].map((p,i)=>(
          <div key={i} style={{ position:"absolute", width:6, height:10, borderRadius:"60% 60% 40% 40%", background:p.c, opacity:.38, top:p.t, left:p.l, right:p.r, animation:`petal ${p.dr} ease-in-out infinite ${p.d}`, pointerEvents:"none", zIndex:0 }} />
        ))}
      </div>

      <motion.div initial={{ opacity:0, y:-12 }} animate={{ opacity:1, y:0 }} transition={{ duration:.5 }} style={{ position:"relative", zIndex:1, marginBottom:26, display:"flex", flexWrap:"wrap", alignItems:"flex-start", justifyContent:"space-between", gap:14 }}>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:6 }}>
            <div style={{ width:42, height:42, borderRadius:12, background:"linear-gradient(135deg,rgba(198,143,130,.18),rgba(168,85,247,.13))", border:"1px solid rgba(198,143,130,.32)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Shield style={{ width:20, height:20, color:"#c68f82" }} />
            </div>
            <h1 style={{ fontSize:"1.55rem", fontWeight:700, fontFamily:"Inter, sans-serif", background:"linear-gradient(135deg,#c68f82,rgba(244,231,229,.92),#c0a09a)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", margin:0 }}>Guardian Portal</h1>
          </div>
          <p style={{ fontSize:"0.83rem", color:"rgba(200,180,150,.55)", paddingLeft:54 }}>
            {data?.ownerName ? `Synced with ${data.ownerName}'s inheritance plan` : "Invitations from estate owners appear here in real time"}
          </p>
        </div>
        <div style={{ borderRadius:999, padding:"6px 16px", fontSize:"0.73rem", fontWeight:600, background: decisionOpen ? "rgba(245,158,11,.1)" : "rgba(134,197,120,.08)", border:`1px solid ${decisionOpen ? "rgba(245,158,11,.32)" : "rgba(134,197,120,.28)"}`, color: decisionOpen ? "#f59e0b" : "#86c578", display:"flex", alignItems:"center", gap:6, animation: decisionOpen ? "shimmer 2s ease-in-out infinite" : "none" }}>
          <Sparkles style={{ width:12, height:12 }} />
          {decisionOpen ? "Decision required" : "No decision required"}
        </div>
      </motion.div>

      <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ duration:.45, delay:.1 }} style={{ position:"relative", zIndex:1, display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(175px,1fr))", gap:12, marginBottom:24 }}>
        <StatCard label="My pending invites" value={sm.myPendingInvites.length} icon={Mail} color="#d4af37" />
        <StatCard label="Active guardians" value={sm.activeGuardians.length} icon={UserCheck} color="#86c578" />
        <StatCard label="Approvals" value={`${sm.approveCount}/${sm.contract?.guardianQuorum || 0}`} icon={ThumbsUp} color="#a855f7" />
        <StatCard label="Beneficiaries" value={data?.beneficiaries?.length || 0} icon={Users} color="#f48fb1" />
      </motion.div>

      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ duration:.4, delay:.15 }} style={{ position:"relative", zIndex:1, display:"flex", flexWrap:"wrap", gap:5, marginBottom:22, padding:6, background:"rgba(8,5,18,.55)", borderRadius:14, border:"1px solid rgba(212,175,55,.1)", backdropFilter:"blur(12px)" }}>
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)} className={`g-tab${activeTab === id ? " active" : ""}`}>
            <Icon style={{ width:13, height:13 }} />
            {label}
            {id === "myInvites" && sm.myPendingInvites.length > 0 && (
              <span style={{ marginLeft:3, borderRadius:999, background:"#d4af37", color:"#0a0810", fontSize:".62rem", fontWeight:700, padding:"1px 6px" }}>{sm.myPendingInvites.length}</span>
            )}
          </button>
        ))}
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-6 }} transition={{ duration:.22 }} style={{ position:"relative", zIndex:1 }}>

          {activeTab === "myInvites" && (
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              {sm.myPendingInvites.length === 0
                ? <Empty icon={Mail} title="No invitations for you" message="When an estate owner adds your registered email as a guardian, the invitation will appear here instantly." />
                : sm.myPendingInvites.map(inv => (
                  <GCard key={inv.id} style={{ border:"1px solid rgba(245,158,11,.28)", boxShadow:"0 8px 40px rgba(0,0,0,.5),0 0 32px rgba(245,158,11,.06)" }}>
                    <div style={{ display:"flex", gap:14, marginBottom:14 }}>
                      <div style={{ width:50, height:50, borderRadius:"50%", background:"linear-gradient(135deg,rgba(198,143,130,.18),rgba(244,143,177,.12))", border:"1px solid rgba(198,143,130,.28)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.25rem", fontWeight:700, color:"#c68f82", flexShrink:0 }}>{inv.ownerName?.[0] || "O"}</div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ fontWeight:700, color:"#f5f0e8", fontSize:"1rem", fontFamily:"Georgia,serif" }}>{inv.ownerName} invited you as a Guardian</p>
                        <p style={{ fontSize:".82rem", color:"rgba(200,180,150,.6)", marginTop:4 }}>Named as <strong style={{ color:"#d4af37" }}>{inv.fullName}</strong> on their CryptWill plan.</p>
                        <div style={{ display:"flex", flexWrap:"wrap", gap:14, marginTop:6, fontSize:".73rem", color:"rgba(200,180,150,.45)" }}>
                          <span>{inv.ownerEmail}</span><span>Plan: {inv.ownerPlan}</span><span>{formatDate(inv.createdAt)}</span>
                        </div>
                      </div>
                      <span style={{ borderRadius:999, background:"rgba(245,158,11,.1)", color:"#f59e0b", border:"1px solid rgba(245,158,11,.28)", padding:"3px 9px", fontSize:".68rem", fontWeight:700, flexShrink:0, height:"fit-content" }}>New</span>
                    </div>
                    <p style={{ fontSize:".83rem", color:"rgba(200,180,150,.6)", marginBottom:18, lineHeight:1.6 }}>As a guardian, you may be asked to confirm if {inv.ownerName} has passed away. Only accept if you personally know them.</p>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                      <button disabled={responding === inv.id} className="g-btn-no" onClick={() => handleInviteResponse(inv.id, "decline")}><X style={{ width:15, height:15 }} /> Decline</button>
                      <button disabled={responding === inv.id} className="g-btn-ok" onClick={() => handleInviteResponse(inv.id, "accept")}>
                        {responding === inv.id ? <div style={{ width:15, height:15, border:"2px solid rgba(134,197,120,.28)", borderTop:"2px solid #86c578", borderRadius:"50%", animation:"spin .8s linear infinite" }} /> : <Check style={{ width:15, height:15 }} />}
                        Accept Role
                      </button>
                    </div>
                  </GCard>
                ))}
              {sm.activeRoles.length > 0 && (
                <GCard style={{ marginTop:4 }}>
                  <SH icon={CheckCircle} color="#86c578">Active Guardian Roles</SH>
                  {sm.activeRoles.map(r => (
                    <div key={r.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"11px 0", borderBottom:"1px solid rgba(212,175,55,.07)" }}>
                      <CheckCircle style={{ width:17, height:17, color:"#86c578", flexShrink:0 }} />
                      <div style={{ flex:1, minWidth:0 }}><p style={{ fontSize:".88rem", fontWeight:600, color:"#f5f0e8" }}>{r.ownerName}</p><p style={{ fontSize:".73rem", color:"rgba(200,180,150,.48)" }}>Accepted {formatDate(r.createdAt)}</p></div>
                      <span style={{ fontSize:".7rem", color:"#86c578", fontWeight:700, background:"rgba(134,197,120,.09)", borderRadius:999, padding:"3px 10px", border:"1px solid rgba(134,197,120,.22)" }}>Active</span>
                    </div>
                  ))}
                </GCard>
              )}
            </div>
          )}

          {activeTab === "overview" && (
            !data?.ownerName
              ? <Empty icon={Shield} title="No active guardian role yet" message="Accept an invitation from the My Invitations tab to view an owner estate plan." />
              : <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))", gap:20 }}>
                  <GCard>
                    <SH icon={FileText}>Owner Plan</SH>
                    <div className="drow"><span className="dlabel">Owner</span><span className="dval">{data?.ownerName}</span></div>
                    <div className="drow"><span className="dlabel">Email</span><span className="dval">{data?.ownerEmail}</span></div>
                    <div className="drow"><span className="dlabel">Plan</span><span className="dval">{data?.ownerPlan || "FREE"}</span></div>
                    <div className="drow"><span className="dlabel">Contract status</span><span className="dval" style={{ color: cStatus==="TRIGGERED"?"#f59e0b":cStatus==="EXECUTING"?"#86c578":"#d4af37" }}>{cStatus}</span></div>
                    <div className="drow"><span className="dlabel">Last check-in</span><span className="dval">{formatDate(sm.contract?.lastCheckinAt)}</span></div>
                    <div className="drow"><span className="dlabel">Next check-in due</span><span className="dval">{formatDate(sm.contract?.nextCheckinDue)}</span></div>
                  </GCard>
                  <GCard>
                    <SH icon={Vote} color="#a855f7">Decision Progress</SH>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10, fontSize:".83rem" }}>
                      <span style={{ color:"#86c578", fontWeight:600 }}>{sm.approveCount} approve</span>
                      <span style={{ color:"rgba(200,180,150,.48)" }}>{sm.contract?.guardianQuorum || 0} required</span>
                      <span style={{ color:"#f87171", fontWeight:600 }}>{sm.denyCount} deny</span>
                    </div>
                    <div style={{ height:7, background:"rgba(212,175,55,.08)", borderRadius:999, overflow:"hidden", border:"1px solid rgba(212,175,55,.14)" }}>
                      <motion.div initial={{ width:0 }} animate={{ width:`${progress}%` }} transition={{ duration:.8, ease:"easeOut" }} style={{ height:"100%", background:"linear-gradient(90deg,#86c578,#d4af37)", borderRadius:999 }} />
                    </div>
                    <p style={{ fontSize:".77rem", color:"rgba(200,180,150,.48)", marginTop:12, fontStyle:"italic" }}>{decisionOpen ? "A decision window is open. Review before voting." : "No active decision request at this time."}</p>
                  </GCard>
                </div>
          )}

          {activeTab === "pendingInvites" && (
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {sm.pendingInvites.length === 0
                ? <Empty icon={Mail} title="No pending invitations" message="Every invited guardian has either accepted or no active invitation is waiting." />
                : sm.pendingInvites.map(inv => (
                  <GCard key={inv.id} style={{ display:"flex", alignItems:"center", gap:14, padding:"15px 20px" }}>
                    <div style={{ width:38, height:38, borderRadius:"50%", background:"rgba(245,158,11,.09)", border:"1px solid rgba(245,158,11,.22)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, color:"#f59e0b", flexShrink:0 }}>{inv.fullName?.[0]}</div>
                    <div style={{ flex:1, minWidth:0 }}><p style={{ fontWeight:600, color:"#f5f0e8", fontSize:".88rem" }}>{inv.fullName}</p><p style={{ fontSize:".76rem", color:"rgba(200,180,150,.48)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{inv.email}</p></div>
                    <span style={{ fontSize:".68rem", borderRadius:999, background:"rgba(245,158,11,.08)", color:"#f59e0b", border:"1px solid rgba(245,158,11,.22)", padding:"3px 10px", flexShrink:0 }}>Pending</span>
                  </GCard>
                ))}
            </div>
          )}

          {activeTab === "decision" && (
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              {data?.hasVoted ? (
                <GCard>
                  <SH icon={Vote}>Your Recorded Decision</SH>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:14 }}>
                    <VBadge vote={data?.myVote?.vote} />
                    <span style={{ fontSize:".78rem", color:"rgba(200,180,150,.48)" }}>{formatDate(data?.myVote?.votedAt)}</span>
                  </div>
                  {data?.myVote?.notes && <p style={{ fontSize:".83rem", color:"rgba(200,180,150,.65)", marginTop:14, fontStyle:"italic" }}>{data.myVote.notes}</p>}
                </GCard>
              ) : decisionOpen ? (
                <GCard style={{ border:"1px solid rgba(245,158,11,.28)", boxShadow:"0 8px 40px rgba(0,0,0,.5),0 0 40px rgba(245,158,11,.06)" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:9, marginBottom:10 }}>
                    <AlertTriangle style={{ width:19, height:19, color:"#f59e0b" }} />
                    <h2 style={{ fontWeight:700, color:"#f5f0e8", fontFamily:"Georgia,serif", fontSize:".98rem", margin:0 }}>Cast Your Decision</h2>
                  </div>
                  <p style={{ fontSize:".83rem", color:"rgba(200,180,150,.62)", marginBottom:18, lineHeight:1.6 }}>{data?.ownerName} has missed {sm.contract?.missedCheckinCount || 0} check-ins. Vote only after reviewing the situation.</p>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Optional notes for the decision record..." style={{ width:"100%", borderRadius:12, border:"1px solid rgba(212,175,55,.18)", background:"rgba(8,5,18,.65)", padding:"11px 15px", fontSize:".83rem", color:"#f5f0e8", resize:"none", outline:"none", fontFamily:"inherit", boxSizing:"border-box" }} />
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginTop:14 }}>
                    <button disabled={voting} className="g-btn-no" onClick={() => handleVote(false)}><ThumbsDown style={{ width:15, height:15 }} /> Deny</button>
                    <button disabled={voting} className="g-btn-ok" onClick={() => handleVote(true)}>
                      {voting ? <div style={{ width:15, height:15, border:"2px solid rgba(134,197,120,.28)", borderTop:"2px solid #86c578", borderRadius:"50%", animation:"spin .8s linear infinite" }} /> : <ThumbsUp style={{ width:15, height:15 }} />}
                      Confirm
                    </button>
                  </div>
                </GCard>
              ) : <Empty icon={CheckCircle} title="No decision needed" message="There is no active death-confirmation request for you to decide right now." />}
              {sm.votes.length > 0 && (
                <GCard>
                  <SH icon={Users} color="#a855f7">All Decisions</SH>
                  {sm.votes.map(v => (
                    <div key={v.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"11px 0", borderBottom:"1px solid rgba(212,175,55,.07)" }}>
                      <div style={{ flex:1, minWidth:0 }}><p style={{ fontSize:".87rem", fontWeight:600, color:"#f5f0e8" }}>{v.guardian?.fullName}</p><p style={{ fontSize:".72rem", color:"rgba(200,180,150,.45)" }}>{formatDate(v.votedAt)}</p></div>
                      <VBadge vote={v.vote} />
                    </div>
                  ))}
                </GCard>
              )}
            </div>
          )}

          {activeTab === "decisionPending" && (
            data?.decisionPending
              ? <GCard style={{ border:"1px solid rgba(245,158,11,.28)" }}>
                  <div style={{ display:"flex", gap:14 }}>
                    <Clock style={{ width:21, height:21, color:"#f59e0b", flexShrink:0, marginTop:2 }} />
                    <div><h2 style={{ fontWeight:700, color:"#f5f0e8", fontFamily:"Georgia,serif", marginBottom:8, fontSize:"1rem" }}>Your decision is pending</h2><p style={{ fontSize:".83rem", color:"rgba(200,180,150,.62)", lineHeight:1.6 }}>Review the owner missed check-in status and submit your decision from the Decision tab.</p></div>
                  </div>
                </GCard>
              : <Empty icon={CheckCircle} title="Nothing pending from you" message="Your guardian account has no pending decision request at this time." />
          )}

          {activeTab === "history" && (
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {sm.history.length === 0
                ? <Empty icon={History} title="No history yet" message="Guardian invitations, check-ins, and decisions will appear here as they happen." />
                : sm.history.map((item, idx) => {
                  const c = {GUARDIAN_ACCEPTED:"#86c578",GUARDIAN_DECLINED:"#f87171",GUARDIAN_INVITED:"#f59e0b",OWNER_CHECKIN:"#d4af37",GUARDIAN_DECISION:"#a855f7"}[item.type] || "#d4af37";
                  return (
                    <motion.div key={item.id} initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }} transition={{ delay:idx*0.04 }} style={{ display:"flex", gap:14, padding:"15px 18px", background:"rgba(10,7,22,.68)", border:"1px solid rgba(212,175,55,.1)", borderRadius:15, backdropFilter:"blur(12px)", alignItems:"flex-start" }}>
                      <div style={{ width:34, height:34, borderRadius:9, background:`${c}12`, border:`1px solid ${c}28`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                        <History style={{ width:15, height:15, color:c }} />
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ fontWeight:600, color:"#f5f0e8", fontSize:".87rem" }}>{item.title}</p>
                        <p style={{ fontSize:".71rem", color:"rgba(200,180,150,.43)", marginTop:4 }}>{formatDate(item.timestamp)} &bull; <span style={{ color:c }}>{item.type?.replace(/_/g," ")}</span></p>
                        {item.stellarExplorerUrl && <a href={item.stellarExplorerUrl} target="_blank" rel="noreferrer" style={{ fontSize:".71rem", color:"#d4af37", textDecoration:"none", marginTop:4, display:"inline-block" }}>View blockchain record</a>}
                      </div>
                    </motion.div>
                  );
                })}
            </div>
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  );
}
