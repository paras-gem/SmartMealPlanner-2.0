"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebaseConfig";
import { toast } from "sonner";

const TABS = ["login", "signup", "reset"];

async function syncUserToDb(user, authProvider) {
  try {
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firebaseUID: user.uid,
        email: user.email,
        name: user.displayName || user.email.split("@")[0],
        photoURL: user.photoURL || "",
        authProvider,
      }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.error("DB sync failed:", e);
  }
  return null;
}

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const dbUser = await syncUserToDb(result.user, "google");
      toast.success(`Welcome, ${result.user.displayName}!`);
      if (dbUser && !dbUser.onboarded) {
        router.push("/onboarding");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const dbUser = await syncUserToDb(result.user, "email");
      toast.success("Welcome back!");
      if (dbUser && !dbUser.onboarded) {
        router.push("/onboarding");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      toast.error(err.code === "auth/invalid-credential" ? "Incorrect email or password." : err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (password !== confirmPass) return toast.error("Passwords do not match.");
    if (password.length < 6) return toast.error("Password must be at least 6 characters.");
    setLoading(true);
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(result.user, { displayName: name });
      await syncUserToDb({ ...result.user, displayName: name }, "email");
      toast.success("Account created! Let's set up your profile.");
      router.push("/onboarding");
    } catch (err) {
      toast.error(err.code === "auth/email-already-in-use" ? "Email already in use. Try logging in." : err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (!email) return toast.error("Please enter your email address.");
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success("Password reset email sent! Check your inbox.");
      setTab("login");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "14px 16px",
    borderRadius: "12px",
    border: "1px solid var(--border)",
    background: "var(--bg-main)",
    color: "var(--text-main)",
    fontSize: "1rem",
    outline: "none",
    transition: "border-color 0.2s",
    boxSizing: "border-box",
  };

  const btnPrimary = {
    width: "100%",
    padding: "14px",
    background: "var(--primary-color)",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    fontWeight: "700",
    fontSize: "1rem",
    cursor: loading ? "not-allowed" : "pointer",
    opacity: loading ? 0.7 : 1,
    transition: "opacity 0.2s",
  };

  const btnGoogle = {
    width: "100%",
    padding: "13px",
    background: "var(--bg-card)",
    color: "var(--text-main)",
    border: "1px solid var(--border)",
    borderRadius: "12px",
    fontWeight: "700",
    fontSize: "1rem",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    transition: "background 0.2s",
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 20px",
      background: "var(--bg-main)",
    }}>
      <div style={{
        width: "100%",
        maxWidth: "460px",
        background: "var(--bg-card)",
        borderRadius: "var(--radius-xl)",
        border: "1px solid var(--border)",
        padding: "48px 40px",
        boxShadow: "var(--shadow-lg)",
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <span style={{ fontSize: "2rem", fontWeight: "900", color: "var(--primary-color)", letterSpacing: "-0.05em" }}>
            SmartMeal 🥗
          </span>
          <p style={{ color: "var(--text-muted)", marginTop: "8px", fontSize: "0.95rem" }}>
            {tab === "login" && "Sign in to continue your journey"}
            {tab === "signup" && "Create your free account"}
            {tab === "reset" && "Reset your password"}
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderRadius: "12px", background: "var(--bg-hover)", padding: "4px", marginBottom: "32px", gap: "4px" }}>
          {[["login", "Log In"], ["signup", "Sign Up"]].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{
                flex: 1, padding: "10px", borderRadius: "10px",
                border: "none", fontWeight: "700", fontSize: "0.95rem",
                cursor: "pointer", transition: "all 0.2s",
                background: tab === key ? "var(--bg-card)" : "transparent",
                color: tab === key ? "var(--text-main)" : "var(--text-muted)",
                boxShadow: tab === key ? "var(--shadow)" : "none",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Google Auth */}
        {tab !== "reset" && (
          <>
            <button onClick={handleGoogleSignIn} disabled={loading} style={btnGoogle}>
              <svg width="20" height="20" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
                <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
                <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
                <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
              </svg>
              Continue with Google
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: "16px", margin: "24px 0" }}>
              <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
              <span style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: "600" }}>or</span>
              <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
            </div>
          </>
        )}

        {/* Login Form */}
        {tab === "login" && (
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <input type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} required style={inputStyle} />
            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required style={inputStyle} />
            <button type="submit" disabled={loading} style={btnPrimary}>
              {loading ? "Signing in..." : "Sign In"}
            </button>
            <p style={{ textAlign: "center", fontSize: "0.9rem", color: "var(--text-muted)" }}>
              <button type="button" onClick={() => setTab("reset")} style={{ background: "none", border: "none", color: "var(--primary-color)", cursor: "pointer", fontWeight: "700", fontSize: "0.9rem" }}>
                Forgot your password?
              </button>
            </p>
          </form>
        )}

        {/* Signup Form */}
        {tab === "signup" && (
          <form onSubmit={handleSignup} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <input type="text" placeholder="Full name" value={name} onChange={e => setName(e.target.value)} required style={inputStyle} />
            <input type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} required style={inputStyle} />
            <input type="password" placeholder="Password (min 6 chars)" value={password} onChange={e => setPassword(e.target.value)} required style={inputStyle} />
            <input type="password" placeholder="Confirm password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} required style={inputStyle} />
            <button type="submit" disabled={loading} style={btnPrimary}>
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>
        )}

        {/* Reset Password Form */}
        {tab === "reset" && (
          <form onSubmit={handleReset} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ textAlign: "center", marginBottom: "8px" }}>
              <span style={{ fontSize: "3rem" }}>🔑</span>
            </div>
            <p style={{ color: "var(--text-muted)", textAlign: "center", fontSize: "0.95rem", marginBottom: "8px" }}>
              Enter your email and we'll send you a reset link.
            </p>
            <input type="email" placeholder="Your email address" value={email} onChange={e => setEmail(e.target.value)} required style={inputStyle} />
            <button type="submit" disabled={loading} style={btnPrimary}>
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
            <button type="button" onClick={() => setTab("login")} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "0.9rem" }}>
              ← Back to Login
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
