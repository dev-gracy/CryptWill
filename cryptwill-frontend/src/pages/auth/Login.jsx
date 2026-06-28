import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, ArrowRight, Sparkles } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "../../store/authStore";
import { useThemeStore } from "../../store/themeStore";
import api from "../../services/api";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState(null);
  const navigate = useNavigate();
  const login = useAuthStore(state => state.login);
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  const T = isDark ? {
    title:    "linear-gradient(135deg,var(--color-brand),rgba(244,231,229,.92))",
    sub:      "rgba(244,231,229,.72)",
    label:    "rgba(244,231,229,.78)",
    inputBg:  "rgba(10,8,20,.72)",
    inputBdr: "rgba(198,143,130,.22)",
    inputFoc: "rgba(198,143,130,.45)",
    inputClr: "#F4E9E7",
    inputPh:  "rgba(244,231,229,.5)",
    iconClr:  (f) => f ? "var(--color-brand)" : "rgba(244,231,229,.5)",
    btnBg:    "linear-gradient(135deg,var(--color-brand),rgba(198,143,130,.95))",
    btnClr:   "var(--color-bg)",
    btnShadow:"0 4px 24px rgba(198,143,130,.28)",
    btnHover: "0 8px 32px rgba(198,143,130,.45)",
    link:     "var(--color-brand)",
    linkHov:  "var(--color-brand-hover)",
    forgotC:  "rgba(198,143,130,.75)",
    forgotH:  "var(--color-brand)",
    hintBg:   "rgba(198,143,130,.08)",
    hintBdr:  "rgba(198,143,130,.18)",
    hintClr:  "rgba(244,231,229,.8)",
    errClr:   "#F28888",
    spinBdr:  "rgba(6,4,15,.3)",
    spinTop:  "var(--color-bg)",
  } : {
    title:    "linear-gradient(135deg,var(--color-brand),rgba(244,231,229,.95))",
    sub:      "rgba(89,70,74,.62)",
    label:    "rgba(89,70,74,.72)",
    inputBg:  "rgba(255,250,248,.95)",
    inputBdr: "rgba(198,143,130,.22)",
    inputFoc: "rgba(198,143,130,.4)",
    inputClr: "#3A3232",
    inputPh:  "rgba(89,70,74,.45)",
    iconClr:  (f) => f ? "var(--color-brand)" : "rgba(89,70,74,.5)",
    btnBg:    "linear-gradient(135deg,var(--color-brand-hover),var(--color-brand))",
    btnClr:   "#fff",
    btnShadow:"0 4px 24px rgba(198,143,130,.28)",
    btnHover: "0 8px 32px rgba(198,143,130,.45)",
    link:     "var(--color-brand)",
    linkHov:  "var(--color-brand-hover)",
    forgotC:  "rgba(198,143,130,.7)",
    forgotH:  "var(--color-brand)",
    hintBg:   "rgba(198,143,130,.08)",
    hintBdr:  "rgba(198,143,130,.15)",
    hintClr:  "rgba(89,70,74,.55)",
    errClr:   "#B55A5A",
    spinBdr:  "rgba(255,255,255,.3)",
    spinTop:  "#fff",
  };

  const inputCss = `
    @keyframes spin{to{transform:rotate(360deg)}}
    .ai{width:100%;border-radius:12px;border:1px solid ${T.inputBdr};background:${T.inputBg};padding:12px 16px 12px 42px;font-size:.88rem;color:${T.inputClr};outline:none;transition:all .2s;box-sizing:border-box;font-family:inherit}
    .ai::placeholder{color:${T.inputPh}}
    .ai:focus{border-color:${T.inputFoc};box-shadow:0 0 0 4px rgba(198,143,130,.07)}
    .ai.err{border-color:${T.errClr}}
    .ab{width:100%;border-radius:12px;padding:13px 20px;font-weight:700;font-size:.9rem;cursor:pointer;background:${T.btnBg};border:none;color:${T.btnClr};box-shadow:${T.btnShadow};display:flex;align-items:center;justify-content:center;gap:8px;transition:all .25s;letter-spacing:.02em}
    .ab:hover{transform:translateY(-2px);box-shadow:${T.btnHover}}
    .ab:disabled{opacity:.55;cursor:not-allowed;transform:none}
  `;

  const onSubmit = async (data) => {
    try {
      const res = await api.post("/auth/login", data);
      const { user, token } = res.data.data;
      login(user, token);
      toast.success(`Welcome back, ${user.fullName}!`);
      navigate(user.isOnboarded ? "/app" : "/onboarding");
    } catch (err) {
      if (err.response?.status === 403) {
        toast.error("Email not verified. Redirecting...");
        navigate("/verify-otp", { state: { email: data.email } });
      } else {
        toast.error(err.response?.data?.error || "Login failed. Please try again.");
      }
    }
  };

  return (
    <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:.4 }}>
      <style>{inputCss}</style>

      <div style={{ textAlign:"center", marginBottom:28 }}>
        <h2 style={{ fontSize:"1.5rem", fontWeight:700, fontFamily:"Inter, sans-serif", background:T.title, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", margin:"0 0 8px" }}>
          Welcome back
        </h2>
        <p style={{ fontSize:".83rem", color:T.sub }}>Sign in to manage your crypto inheritance plan</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} style={{ display:"flex", flexDirection:"column", gap:18 }}>
        <div>
          <label style={{ display:"block", fontSize:".72rem", fontWeight:600, color:T.label, marginBottom:6, textTransform:"uppercase", letterSpacing:".06em" }}>Email</label>
          <div style={{ position:"relative" }}>
            <Mail style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", width:16, height:16, color:T.iconClr(focused==="email"), pointerEvents:"none", zIndex:1, transition:"color .2s" }} />
            <input type="email" placeholder="you@example.com" className={`ai${errors.email?" err":""}`}
              onFocus={()=>setFocused("email")} onBlur={()=>setFocused(null)}
              {...register("email", { required:"Email is required", pattern:{ value:/\S+@\S+\.\S+/, message:"Invalid email" } })} />
          </div>
          {errors.email && <p style={{ fontSize:".72rem", color:T.errClr, marginTop:4 }}>{errors.email.message}</p>}
        </div>

        <div>
          <label style={{ display:"block", fontSize:".72rem", fontWeight:600, color:T.label, marginBottom:6, textTransform:"uppercase", letterSpacing:".06em" }}>Password</label>
          <div style={{ position:"relative" }}>
            <Lock style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", width:16, height:16, color:T.iconClr(focused==="password"), pointerEvents:"none", zIndex:1, transition:"color .2s" }} />
            <input type={showPassword?"text":"password"} placeholder="••••••••" className={`ai${errors.password?" err":""}`} style={{ paddingRight:44 }}
              onFocus={()=>setFocused("password")} onBlur={()=>setFocused(null)}
              {...register("password", { required:"Password is required" })} />
            <button type="button" onClick={()=>setShowPassword(v=>!v)} style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:T.iconClr(false), padding:0 }}>
              {showPassword ? <EyeOff style={{ width:16, height:16 }} /> : <Eye style={{ width:16, height:16 }} />}
            </button>
          </div>
          {errors.password && <p style={{ fontSize:".72rem", color:T.errClr, marginTop:4 }}>{errors.password.message}</p>}
        </div>

        <div style={{ textAlign:"right", marginTop:-8 }}>
          <Link to="/forgot-password" style={{ fontSize:".8rem", color:T.forgotC, textDecoration:"none" }}
            onMouseEnter={e=>e.target.style.color=T.forgotH} onMouseLeave={e=>e.target.style.color=T.forgotC}>
            Forgot password?
          </Link>
        </div>

        <button type="submit" disabled={isSubmitting} className="ab">
          {isSubmitting
            ? <><div style={{ width:16, height:16, border:`2px solid ${T.spinBdr}`, borderTop:`2px solid ${T.spinTop}`, borderRadius:"50%", animation:"spin .8s linear infinite" }} /> Signing in...</>
            : <><Sparkles style={{ width:15, height:15 }} /> Sign In <ArrowRight style={{ width:15, height:15 }} /></>
          }
        </button>
      </form>

      <p style={{ marginTop:22, textAlign:"center", fontSize:".83rem", color:T.sub }}>
        {"Don't have an account? "}
        <Link to="/signup" style={{ color:T.link, fontWeight:600, textDecoration:"none" }}
          onMouseEnter={e=>e.target.style.color=T.linkHov} onMouseLeave={e=>e.target.style.color=T.link}>
          Create one free
        </Link>
      </p>

      <div style={{ marginTop:18, padding:"10px 14px", borderRadius:10, background:T.hintBg, border:`1px solid ${T.hintBdr}`, fontSize:".72rem", color:T.hintClr, textAlign:"center" }}>
        Demo: Use any registered credentials to sign in
      </div>
    </motion.div>
  );
}
