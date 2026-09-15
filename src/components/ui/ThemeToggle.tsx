"use client";

import * as React from "react";
import { useTheme } from "@/components/providers/ThemeProvider";
import { FiSun, FiMoon } from "react-icons/fi";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button aria-label="Toggle theme" className="w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center opacity-0">
        <FiSun size={20} />
      </button>
    );
  }

  const isDark = (resolvedTheme as string) === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="relative w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center bg-transparent border border-outline-variant/30 text-on-surface hover:bg-surface-variant/50 hover:text-primary transition-all duration-300"
      aria-label="Toggle theme"
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <div className="relative w-5 h-5 flex items-center justify-center">
        <FiSun 
          size={18} 
          className={`absolute transition-all duration-500 ease-in-out ${isDark ? "opacity-0 -rotate-90 scale-50" : "opacity-100 rotate-0 scale-100"}`} 
        />
        <FiMoon 
          size={18} 
          className={`absolute transition-all duration-500 ease-in-out ${isDark ? "opacity-100 rotate-0 scale-100" : "opacity-0 rotate-90 scale-50"}`} 
        />
      </div>
    </button>
  );
}
