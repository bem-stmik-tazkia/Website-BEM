"use client";

import React, { useState } from "react";
import Image from "next/image";
import { canOptimizeAvatarUrl, getAvatarRequestSize } from "@/lib/avatar";

export interface UserAvatarProps {
  src?: string | null;
  alt: string;
  /** Rendered CSS size in pixels (used to pick a crisp ~2x pre-resized asset). */
  size?: number;
  fit?: "cover" | "contain";
  imgClassName?: string;
  fallback?: React.ReactNode;
  priority?: boolean;
}

function AvatarMedia({
  src,
  alt,
  size,
  fit,
  imgClassName,
  fallback,
  priority,
}: {
  src: string;
  alt: string;
  size: number;
  fit: "cover" | "contain";
  imgClassName?: string;
  fallback?: React.ReactNode;
  priority?: boolean;
}) {
  const canOptimize = canOptimizeAvatarUrl(src);
  const [stage, setStage] = useState<"next" | "raw" | "error">(
    canOptimize ? "next" : "raw"
  );

  if (stage === "error") {
    return <>{fallback ?? null}</>;
  }

  const baseClass =
    fit === "contain"
      ? "w-full h-full object-contain"
      : "w-full h-full object-cover object-[50%_20%]";
  const combinedClass = imgClassName ? `${baseClass} ${imgClassName}` : baseClass;

  if (stage === "next") {
    const requestSize = getAvatarRequestSize(size);
    return (
      <Image
        src={src}
        alt={alt}
        width={requestSize}
        height={requestSize}
        quality={90}
        priority={priority}
        className={combinedClass}
        onError={() => setStage("raw")}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={combinedClass}
      onError={() => setStage("error")}
    />
  );
}

/**
 * Renders profile/author avatars using Next.js Image Optimization when allowed (to eliminate
 * browser single-pass downscaling pixelation on small circles) with graceful raw/fallback recovery.
 */
export default function UserAvatar({
  src,
  alt,
  size = 40,
  fit = "cover",
  imgClassName,
  fallback,
  priority = false,
}: UserAvatarProps) {
  const cleanSrc = src?.trim() || "";

  if (!cleanSrc) {
    return <>{fallback ?? null}</>;
  }

  return (
    <AvatarMedia
      key={cleanSrc}
      src={cleanSrc}
      alt={alt}
      size={size}
      fit={fit}
      imgClassName={imgClassName}
      fallback={fallback}
      priority={priority}
    />
  );
}
