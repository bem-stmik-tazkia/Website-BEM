"use client";

import React from "react";
import { motion } from "framer-motion";
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

export default function CarAnimation() {
  return (
    <div className="absolute -top-[70px] left-0 right-0 h-[80px] pointer-events-none z-10 overflow-hidden flex items-end">
      <motion.div 
        initial={{ x: "-100%" }}
        animate={{ x: "100vw" }}
        transition={{ 
          duration: 15, 
          repeat: Infinity, 
          ease: "linear" 
        }}
        className="w-32 h-32"
      >
        <DotLottieReact src="/animations/car.lottie" autoplay loop />
      </motion.div>
    </div>
  );
}
