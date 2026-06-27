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
    title:    "linear-gradient(135deg,#d4af37,#f5e6a3,#c8956b)",
    sub:      "rgba(200,180,150,.55)",
    label:    "rgba(200,180,150,.6)",
    inputBg:  "rgba(6,4,15,.7)",
    inputBdr: "rgba(212,175,55,.22)",
    inputFoc: "rgba(212,175,55,.5)",
    inputClr: "#f5f0e8",
    inputPh:  "rgba(200,180,150,.35)",
    iconClr:  (f) => f ? "#d4af37" : "rgba(200,180,150,.4)",
    btnBg:    "linear-gradient(135deg,#c9a227,#8b5e3c)",
    btnClr:   "#06040f",
    btnShadow:"0 4px 24px rgba(201,162,39,.35)",
    btnHover: "0 8px 32px rgba(201,162,39,.5)",
    link:     "#d4af37",
    linkHov:  "#f5e6a3",
    forgotC:  "rgba(212,175,55,.65)",
    forgotH:  "#d4af37",
    hintBg:   "rgba(212,175,55,.06)",
    hintBdr:  "rgba(212,175,55,.15)",
    hintClr:  "rgba(200,180,150,.45)",
    errClr:   "#f87171",
    spinBdr:  "rgba(6,4,15,.3)",
    spinTop:  "#06040f",
  } : {
    title:    "linear-gradient(135deg,#8C6A4F,#c8956b)",
    sub:      "rgba(80,60,45,.6)",
    label:    "rgba(80,60,45,.65)",
    inputBg:  "rgba(255,252,248,.9)",
    inputBdr: "rgba(140,106,79,.25)",
    inputFoc: "rgba(140,106,79,.5)",
    inputClr: "#3B332C",
    inputPh:  "rgba(140,106,79,.4)",
    iconClr:  (f) => f ? "#8C6A4F" : "rgba(140,106,79,.5)",
    btnBg:    "linear-gradient(135deg,#8C6A4F,#73553C)",
    btnClr:   "#fff",
    btnShadow:"0 4px 24px rgba(140,106,79,.3)",
    btnHover: "0 8px 32px rgba(140,106,79,.45)",
    link:     "#8C6A4F",
    linkHov:  "#73553C",
    forgotC:  "rgba(140,106,79,.7)",
    forgotH:  "#8C6A4F",
    hintBg:   "rgba(140,106,79,.05)",
    hintBdr:  "rgba(140,106,79,.15)",
    hintClr:  "rgba(80,60,45,.45)",
    errClr:   "#B55A5A",
    spinBdr:  "rgba(255,255,255,.3)",
    spinTop:  "#fff",
  };

  const inputCss = `
    @keyframes spin{to{transform:rotate(360deg)}}
    .ai{width:100%;border-radius:12px;border:1px solid ${T.inputBdr};background:${T.inputBg};padding:12px 16px 12px 42px;font-size:.88rem;color:${T.inputClr};outline:none;transition:all .2s;box-sizing:border-box;font-family:inherit}
    .ai::placeholder{color:${T.inputPh}}
    .ai:focus{border-color:${T.inputFoc};box-shadow:0 0 0 4px ${isDark?"rgba(212,175,55,.07)":"rgba(140,106,79,.07)"}}
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
        <h2 style={{ fontSize:"1.5rem", fontWeight:700, fontFamily:"Georgia,serif", background:T.title, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", margin:"0 0 8px" }}>
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
