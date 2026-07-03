"use client";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch — only render after client mounts
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div style={{ width: 36, height: 36 }} />;

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Toggle theme"
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 36,
        height: 36,
        borderRadius: "50%",
        border: "1px solid var(--border)",
        background: "var(--bg-hover)",
        color: "var(--text)",
        cursor: "pointer",
        transition: "background 0.2s, color 0.2s, border-color 0.2s",
        flexShrink: 0,
      }}
    >
      {isDark ? <Sun size={16} strokeWidth={2} /> : <Moon size={16} strokeWidth={2} />}
    </button>
  );
}