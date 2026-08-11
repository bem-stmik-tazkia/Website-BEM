"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";

export default function DynamicGreeting({ name }: { name: string }) {
  const t = useTranslations("Dashboard");
  const [greeting, setGreeting] = useState(t("greetingDefault"));
  const [icon, setIcon] = useState("👋");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      setGreeting(t("greetingMorning"));
      setIcon("☀️");
    } else if (hour >= 12 && hour < 15) {
      setGreeting(t("greetingAfternoon"));
      setIcon("🌤️");
    } else if (hour >= 15 && hour < 18) {
      setGreeting(t("greetingEvening"));
      setIcon("🌇");
    } else {
      setGreeting(t("greetingNight"));
      setIcon("🌙");
    }
  }, [t]);

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
