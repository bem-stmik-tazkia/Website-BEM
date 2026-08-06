"use client";

import React, { useState, useEffect } from "react";

export default function DynamicGreeting({ name }: { name: string }) {
  const [greeting, setGreeting] = useState("Halo");
  const [icon, setIcon] = useState("👋");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      setGreeting("Selamat Pagi");
      setIcon("☀️");
    } else if (hour >= 12 && hour < 15) {
      setGreeting("Selamat Siang");
      setIcon("🌤️");
    } else if (hour >= 15 && hour < 18) {
      setGreeting("Selamat Sore");
      setIcon("🌇");
    } else {
      setGreeting("Selamat Malam");
      setIcon("🌙");
    }
  }, []);

  return (
    <div className="flex flex-col">
      <span className="transition-all text-sm md:text-base opacity-80 mb-0.5">
        {greeting} {icon},
      </span>
      <span className="font-bold text-on-surface text-lg md:text-xl">
        {name}
      </span>
    </div>
  );
}
