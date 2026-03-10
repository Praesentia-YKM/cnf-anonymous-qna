"use client";

import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  function handleToggle() {
    // 전환 전에 transition 클래스 추가
    document.documentElement.classList.add("theme-transition");
    setTheme(theme === "dark" ? "light" : "dark");
    // 전환 완료 후 클래스 제거
    setTimeout(() => {
      document.documentElement.classList.remove("theme-transition");
    }, 500);
  }

  return (
    <button
      onClick={handleToggle}
      className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer shadow-sm"
      aria-label="테마 전환"
    >
      {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
}
