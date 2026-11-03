"use client";

import React, { useState, useEffect } from "react";
import { FiHeart } from "react-icons/fi";
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { toggleLike } from "@/actions/like";
import { getDeviceId } from "@/utils/identity";
import { createClient } from "@/utils/supabase/client";

export default function LikeButton({ 
  initialLikes, 
  id, 
  table, 
  label, 
  size = 16 
}: { 
  initialLikes: number; 
  id: string; 
  table: 'berita' | 'articles'; 
  label?: string; 
  size?: number; 
}) {
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(initialLikes);
  const [isLiking, setIsLiking] = useState(false);

  useEffect(() => {
    setLikesCount(initialLikes);
  }, [initialLikes]);

  // Cek apakah item sudah pernah di-like oleh user / device ini
  useEffect(() => {
    let isMounted = true;
    async function checkLiked() {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id || null;
        const deviceId = getDeviceId();

        const rpcName = table === 'articles' ? 'check_article_liked' : 'check_berita_liked';
        const paramObj = table === 'articles'
          ? { p_article_id: id, p_device_id: deviceId, p_user_id: userId }
          : { p_berita_id: id, p_device_id: deviceId, p_user_id: userId };

        const { data: isLiked } = await supabase.rpc(rpcName, paramObj);
        if (isMounted && typeof isLiked === 'boolean') {
          setLiked(isLiked);
        }
      } catch {
        // Abaikan jika RPC offline / belum ada
      }
    }
    checkLiked();
    return () => { isMounted = false; };
  }, [id, table]);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isLiking) return;

    setIsLiking(true);
    const newLikedState = !liked;
    setLiked(newLikedState);
    setLikesCount(prev => newLikedState ? prev + 1 : Math.max(0, prev - 1));

    try {
      const deviceId = getDeviceId();
      const actualLiked = await toggleLike(table, id, newLikedState, deviceId);
      setLiked(actualLiked);
    } catch (err) {
      console.error("[LikeButton] toggleLike error:", err);
      // rollback jika error
      setLiked(liked);
      setLikesCount(prev => liked ? prev + 1 : Math.max(0, prev - 1));
    } finally {
      setIsLiking(false);
    }
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
      {likesCount} {label && label}
    </span>
  );
}
