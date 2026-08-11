"use client";

import React from "react";
import { motion } from "framer-motion";
import { FiX } from "react-icons/fi";
import { ProjectData } from "@/components/mahasiswa/ProjectCard";
import ProfileView, { ProfileViewData } from "./ProfileView";
import LanguageSwitcher from "@/components/layout/LanguageSwitcher";

interface ProfileOverlayProps {
  profile: ProfileViewData;
  projects: ProjectData[];
  onClose: () => void;
  isOwnProfile?: boolean;
  onEditProfile?: () => void;
}

export default function ProfileOverlay({
  profile,
  projects,
  onClose,
  isOwnProfile = false,
  onEditProfile,
}: ProfileOverlayProps) {
  return (
    <motion.div
      initial={{ y: "100%", opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: "100%", opacity: 0 }}
      transition={{ type: "spring", damping: 28, stiffness: 230 }}
      className="fixed inset-0 z-[100] bg-surface overflow-y-auto"
    >
      <div className="relative min-h-full">
        {/* Top Right Actions */}
        <div className="absolute top-6 sm:top-8 right-5 md:right-8 z-[200] flex items-center gap-3">
          {/* Close button for overlay mode */}
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-black/25 text-white flex items-center justify-center hover:bg-black/45 hover:scale-110 active:scale-95 transition-all backdrop-blur-sm border border-white/15 shadow-sm"
          >
            <FiX size={18} />
          </button>
        </div>

        <ProfileView
          profile={profile}
          projects={projects}
          isOwnProfile={isOwnProfile}
          onEditProfile={onEditProfile}
        />

        {/* Floating Language Switcher at Bottom Right using Sticky */}
        <div className="sticky bottom-6 sm:bottom-8 w-full flex justify-end px-6 sm:px-8 pointer-events-none z-[300] mt-auto">
          <div className="bg-surface/80 backdrop-blur-md border border-outline-variant/30 shadow-xl rounded-full px-2 py-1 flex items-center pointer-events-auto">
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
