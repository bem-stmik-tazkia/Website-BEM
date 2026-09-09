"use client";

import React, { useState } from "react";
import { FiHeart } from "react-icons/fi";
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { toggleLike } from "@/actions/like";

export default function LikeButton({ 
  initialLikes, 
  id, 
  table, 
  label, 
  size = 16 
}: { 
  initialLikes: number; 
  id: string; 
  table: 'berita'; 
  label?: string; 
  size?: number; 
}) {
  const [liked, setLiked] = useState(false);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newLikedState = !liked;
    setLiked(newLikedState);
    
    // Call the server action to update database
    await toggleLike(table, id, newLikedState);
  };

  return (
    <span 
      onClick={handleLike}
      className={`flex items-center gap-1 cursor-pointer transition-colors ${liked ? "text-red-500" : "hover:text-red-300"}`}
    >
      <div className="flex items-center justify-center shrink-0" style={{ width: size + 8, height: size + 8, marginLeft: -4, marginRight: -2 }}>
        {liked ? (
          <DotLottieReact src="/animations/Heart Animated.lottie" autoplay loop={false} />
        ) : (
          <FiHeart size={size} />
        )}
      </div>
      {initialLikes + (liked ? 1 : 0)} {label && label}
    </span>
  );
}
