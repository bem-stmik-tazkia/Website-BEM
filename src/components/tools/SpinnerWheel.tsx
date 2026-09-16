"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { useTranslations } from "next-intl";
import SafeLottie from "@/components/ui/SafeLottie";

interface SpinnerWheelProps {
  names: string[];
  onRemoveWinner?: (name: string) => void;
}

export default function SpinnerWheel({ names, onRemoveWinner }: SpinnerWheelProps) {
  const t = useTranslations("Spinner");
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);

  const sliceColors = names.map((_, i) => {
    if (names.length % 2 !== 0 && i === names.length - 1) return "#0ea5e9";
    return i % 2 === 0 ? "#1b4086" : "#f2791e";
  });

  const sliceAngle = 360 / (names.length || 1);
  const conicString = names.map((_, i) => {
    return `${sliceColors[i]} ${i * sliceAngle}deg ${(i + 1) * sliceAngle}deg`;
  }).join(", ");

  const spin = () => {
    if (names.length === 0 || isSpinning) return;
    setIsSpinning(true);
    setWinner(null);

    const spinDuration = 5; // seconds
    const spinRotations = 10; // full rotations
    
    // Calculate random angle to land on a specific slice
    const winningIndex = Math.floor(Math.random() * names.length);
    const sliceCenterAngle = winningIndex * sliceAngle + sliceAngle / 2;
    
    // Pointer is at top (12 o'clock), which is 270deg relative to 3 o'clock
    const randomOffset = (Math.random() - 0.5) * (sliceAngle * 0.8);
    const targetAngle = 270 - sliceCenterAngle + randomOffset;
    
    const currentMod = rotation % 360;
    let angleDiff = (targetAngle - currentMod) % 360;
    if (angleDiff < 0) angleDiff += 360;
    
    const newRotation = rotation + (360 * spinRotations) + angleDiff;

    setRotation(newRotation);

    setTimeout(() => {
      setIsSpinning(false);
      setWinner(names[winningIndex]);
      triggerConfetti();
    }, spinDuration * 1000);
  };

  const triggerConfetti = () => {
    const end = Date.now() + 3 * 1000;
    const colors = ['#1b4086', '#f2791e', '#ffffff'];

    (function frame() {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  };

  if (names.length === 0) {
    return <div className="text-center p-8 opacity-50">{t("emptyError")}</div>;
  }

  return (
    <div className="flex flex-col items-center gap-8 w-full">
      <div className="relative w-64 h-64 md:w-80 md:h-80 mx-auto">
        {/* Pointer */}
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[15px] border-r-[15px] border-t-[30px] border-l-transparent border-r-transparent border-t-secondary z-10 drop-shadow-md"></div>
        
        {/* Wheel */}
        <motion.div
          className="w-full h-full rounded-full border-4 border-white shadow-xl overflow-hidden relative"
          animate={{ rotate: rotation }}
          transition={{ duration: 5, ease: [0.2, 0.8, 0.2, 1] }}
          style={{ 
            background: `conic-gradient(from 90deg, ${conicString})`,
            transformOrigin: "center" 
          }}
        >
          {names.map((name, index) => {
            const angle = index * sliceAngle + (sliceAngle / 2);
            
            return (
              <div
                key={index}
                className="absolute top-0 left-1/2 w-1/2 h-full flex items-center"
                style={{
                  transform: `rotate(${angle}deg)`,
                  transformOrigin: "left center",
                }}
              >
                <span 
                  className="w-full text-right pr-4 md:pr-8 text-white font-bold drop-shadow-md truncate"
                  style={{
                    fontSize: names.length > 15 ? '0.75rem' : names.length > 8 ? '0.875rem' : '1rem'
                  }}
                >
                  {name}
                </span>
              </div>
            );
          })}
        </motion.div>
      </div>

      <button
        onClick={spin}
        disabled={isSpinning || names.length < 2}
        className="px-8 py-3 bg-secondary text-white font-bold rounded-full shadow-lg hover:bg-secondary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95"
      >
        {t("spinButton")}
      </button>

      <AnimatePresence>
        {winner && !isSpinning && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setWinner(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-surface rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-secondary/20 text-center flex flex-col items-center"
            >
              <div className="w-40 h-40 -mt-8 mb-2">
                <SafeLottie
                  src="/animations/yeayy.lottie"
                  autoplay
                  loop
                  className="w-full h-full object-contain"
                />
              </div>
              <p className="text-sm text-outline uppercase tracking-wider mb-2 font-semibold">{t("winner")}</p>
              <h2 className="text-4xl font-black text-primary mb-8 drop-shadow-sm">{winner}</h2>
              
              <div className="flex flex-col w-full gap-3">
                <button
                  onClick={() => setWinner(null)}
                  className="w-full py-3 bg-primary text-white font-bold rounded-xl shadow-md hover:bg-primary/90 transition-all active:scale-95"
                >
                  {t("close")}
                </button>
                {onRemoveWinner && (
                  <button
                    onClick={() => {
                      onRemoveWinner(winner);
                      setWinner(null);
                    }}
                    className="w-full py-3 bg-red-100 text-red-600 font-bold rounded-xl hover:bg-red-600 hover:text-white transition-all active:scale-95"
                  >
                    Hapus Pemenang
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
