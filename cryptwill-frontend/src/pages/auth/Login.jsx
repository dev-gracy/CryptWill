import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, ArrowRight, Sparkles, Shield } from "lucide-react";
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
    inputFoc: "rgba(198,143,130,.55)",
    inputClr: "#F4E9E7",
    inputPh:  "rgba(244,231,229,.5)",
    iconClr:  (f) => f ? "var(--color-brand)" : "rgba(244,231,229,.5)",
    btnBg:    "linear-gradient(135deg,var(--color-brand),rgba(198,143,130,.95))",
    btnClr:   "var(--color-bg)",
    btnShadow:"0 4px 24px rgba(198,143,130,.28)",
    btnHover: "0 8px 32px rgba(198,143,130,.45)",
    link:     "var(--color-brand)",
    forgotC:  "rgba(198,143,130,.75)",
    hintBg:   "rgba(198,143,130,.08)",
    hintBdr:  "rgba(198,143,130,.18)",
    hintClr:  "rgba(244,231,229,.8)",
    errClr:   "#F28888",
    spinBdr:  "rgba(6,4,15,.3)",
    spinTop:  "var(--color-bg)",
    fieldGlow:"rgba(198,143,130,0.08)",
  } : {
    title:    "linear-gradient(135deg,var(--color-brand),rgba(120,60,60,.85))",
    sub:      "rgba(89,70,74,.62)",
    label:    "rgba(89,70,74,.72)",
    inputBg:  "rgba(255,250,248,.95)",
    inputBdr: "rgba(198,143,130,.22)",
    inputFoc: "rgba(198,143,130,.55)",
    inputClr: "#3A3232",
    inputPh:  "rgba(89,70,74,.45)",
    iconClr:  (f) => f ? "var(--color-brand)" : "rgba(89,70,74,.5)",
    btnBg:    "linear-gradient(135deg,var(--color-brand-hover),var(--color-brand))",
    btnClr:   "#fff",
    btnShadow:"0 4px 24px rgba(198,143,130,.28)",
    btnHover: "0 8px 32px rgba(198,143,130,.45)",
    link:     "var(--color-brand)",
    forgotC:  "rgba(198,143,130,.7)",
    hintBg:   "rgba(198,143,130,.08)",
    hintBdr:  "rgba(198,143,130,.15)",
    hintClr:  "rgba(89,70,74,.55)",
    errClr:   "#B55A5A",
    spinBdr:  "rgba(255,255,255,.3)",
    spinTop:  "#fff",
    fieldGlow:"rgba(198,143,130,0.06)",
  };

  const inputCss = `
    @keyframes spin{to{transform:rotate(360deg)}}
    .ai{width:100%;border-radius:12px;border:1.5px solid ${T.inputBdr};background:${T.inputBg};padding:12px 16px 12px 42px;font-size:.88rem;color:${T.inputClr};outline:none;transition:all .25s;box-sizing:border-box;font-family:inherit}
    .ai::placeholder{color:${T.inputPh}}
    .ai:focus{border-color:${T.inputFoc};box-shadow:0 0 0 4px ${T.fieldGlow}}
    .ai.err{border-color:${T.errClr}}
    .ab{width:100%;border-radius:12px;padding:13px 20px;font-weight:700;font-size:.9rem;cursor:pointer;background:${T.btnBg};border:none;color:${T.btnClr};box-shadow:${T.btnShadow};display:flex;align-items:center;justify-content:center;gap:8px;transition:all .25s;letter-spacing:.02em}
    .ab:hover:not(:disabled){transform:translateY(-2px);box-shadow:${T.btnHover}}
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <style>{inputCss}</style>

      {/* Header */}
      <motion.div
        style={{ textAlign: "center", marginBottom: 28 }}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        {/* Animated icon ring */}
        <div style={{ position: "relative", width: 64, height: 64, margin: "0 auto 16px" }}>
          <motion.div
            style={{
              position: "absolute", inset: 0, borderRadius: "50%",
              border: "1px solid rgba(198,143,130,0.3)",
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          >
            {[0, 120, 240].map((deg, i) => (
              <motion.div
                key={i}
                style={{
                  position: "absolute", width: 6, height: 6, borderRadius: "50%",
                  background: ["var(--color-brand)", "rgba(244,143,177,0.8)", "rgba(198,143,130,0.7)"][i],
                  top: "50%", left: "50%",
                  transform: `rotate(${deg}deg) translateX(28px) translateY(-50%)`,
                  transformOrigin: "0 0",
                }}
                animate={{ scale: [1, 1.5, 1] }}
                transition={{ duration: 2, delay: i * 0.6, repeat: Infinity }}
              />
            ))}
          </motion.div>
          <div
            style={{
              position: "absolute", inset: 8, borderRadius: "50%",
              background: "rgba(198,143,130,0.12)",
              border: "1px solid rgba(198,143,130,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <Shield style={{ width: 20, height: 20, color: "var(--color-brand)" }} />
          </div>
        </div>

        <h2 style={{
          fontSize: "1.5rem", fontWeight: 700, fontFamily: "Inter, sans-serif",
          background: T.title, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          margin: "0 0 8px",
        }}>
          Welcome back
        </h2>
        <p style={{ fontSize: ".83rem", color: T.sub }}>Sign in to manage your crypto inheritance plan</p>
      </motion.div>

      <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: 18 }}>

        {/* Email field */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{
            opacity: 1,
            x: 0,
            scale: focused === "email" ? 1.015 : 1
          }}
          transition={{
            scale: { duration: 0.15 },
            opacity: { delay: 0.2, duration: 0.4 },
            x: { delay: 0.2, duration: 0.4 }
          }}
        >
          <label style={{ display: "block", fontSize: ".72rem", fontWeight: 600, color: T.label, marginBottom: 6, textTransform: "uppercase", letterSpacing: ".06em" }}>Email</label>
          <div style={{ position: "relative" }}>
            <motion.div
              style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", zIndex: 1, pointerEvents: "none" }}
              animate={{ color: focused === "email" ? "var(--color-brand)" : T.iconClr(false) }}
              transition={{ duration: 0.2 }}
            >
              <Mail style={{ width: 16, height: 16 }} />
            </motion.div>
            <input type="email" placeholder="you@example.com" className={`ai${errors.email ? " err" : ""}`}
              onFocus={() => setFocused("email")} onBlur={() => setFocused(null)}
              {...register("email", { required: "Email is required", pattern: { value: /\S+@\S+\.\S+/, message: "Invalid email" } })} />
          </div>
          <AnimatePresence>
            {errors.email && (
              <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                style={{ fontSize: ".72rem", color: T.errClr, marginTop: 4 }}>
                {errors.email.message}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Password field */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{
            opacity: 1,
            x: 0,
            scale: focused === "password" ? 1.015 : 1
          }}
          transition={{
            scale: { duration: 0.15 },
            opacity: { delay: 0.3, duration: 0.4 },
            x: { delay: 0.3, duration: 0.4 }
          }}
        >
          <label style={{ display: "block", fontSize: ".72rem", fontWeight: 600, color: T.label, marginBottom: 6, textTransform: "uppercase", letterSpacing: ".06em" }}>Password</label>
          <div style={{ position: "relative" }}>
            <motion.div
              style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", zIndex: 1, pointerEvents: "none" }}
              animate={{ color: focused === "password" ? "var(--color-brand)" : T.iconClr(false) }}
              transition={{ duration: 0.2 }}
            >
              <Lock style={{ width: 16, height: 16 }} />
            </motion.div>
            <input type={showPassword ? "text" : "password"} placeholder="••••••••"
              className={`ai${errors.password ? " err" : ""}`} style={{ paddingRight: 44 }}
              onFocus={() => setFocused("password")} onBlur={() => setFocused(null)}
              {...register("password", { required: "Password is required" })} />
            <motion.button
              type="button" onClick={() => setShowPassword(v => !v)}
              style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: T.iconClr(false), padding: 0 }}
              whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
            >
              {showPassword ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
            </motion.button>
          </div>
          <AnimatePresence>
            {errors.password && (
              <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                style={{ fontSize: ".72rem", color: T.errClr, marginTop: 4 }}>
                {errors.password.message}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Forgot password */}
        <motion.div
          style={{ textAlign: "right", marginTop: -8 }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
        >
          <Link to="/forgot-password" style={{ fontSize: ".8rem", color: T.forgotC, textDecoration: "none", transition: "color 0.2s" }}
            onMouseEnter={e => e.target.style.color = "var(--color-brand)"}
            onMouseLeave={e => e.target.style.color = T.forgotC}>
            Forgot password?
          </Link>
        </motion.div>

        {/* Submit */}
        <motion.button
          type="submit" disabled={isSubmitting} className="ab"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.4 }}
          whileHover={!isSubmitting ? { scale: 1.02 } : {}}
          whileTap={!isSubmitting ? { scale: 0.98 } : {}}
        >
          <AnimatePresence mode="wait">
            {isSubmitting ? (
              <motion.span key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 16, height: 16, border: `2px solid ${T.spinBdr}`, borderTop: `2px solid ${T.spinTop}`, borderRadius: "50%", animation: "spin .8s linear infinite" }} />
                Signing in...
              </motion.span>
            ) : (
              <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Sparkles style={{ width: 15, height: 15 }} />
                Sign In
                <ArrowRight style={{ width: 15, height: 15 }} />
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </form>

      {/* Sign up link */}
      <motion.p
        style={{ marginTop: 22, textAlign: "center", fontSize: ".83rem", color: T.sub }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}
      >
        {"Don't have an account? "}
        <Link to="/signup" style={{ color: T.link, fontWeight: 600, textDecoration: "none" }}
          onMouseEnter={e => e.target.style.opacity = "0.75"} onMouseLeave={e => e.target.style.opacity = "1"}>
          Create one free
        </Link>
      </motion.p>

      {/* Demo hint */}
      <motion.div
        style={{ marginTop: 18, padding: "10px 14px", borderRadius: 10, background: T.hintBg, border: `1px solid ${T.hintBdr}`, fontSize: ".72rem", color: T.hintClr, textAlign: "center" }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65 }}
      >
        Demo: Use any registered credentials to sign in
      </motion.div>
    </motion.div>
  );
}
