"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiGlobe } from "react-icons/fi";
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
    <>
      <motion.div
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 230 }}
        className="fixed inset-0 z-[100] bg-surface overflow-y-auto"
      >
        <div className="relative min-h-full">
          {/* Close button — top right */}
          <button
            onClick={onClose}
            className="absolute top-6 sm:top-8 right-5 md:right-8 z-[200] w-10 h-10 rounded-full bg-black/25 text-white flex items-center justify-center hover:bg-black/45 hover:scale-110 active:scale-95 transition-all backdrop-blur-sm border border-white/15"
          >
            <FiX size={18} />
          </button>

          <ProfileView
            profile={profile}
            projects={projects}
            isOwnProfile={isOwnProfile}
            onEditProfile={onEditProfile}
          />
        </div>
      </motion.div>

      {/* Language Switcher — floating bottom right, outside the transformed container */}
      <div className="fixed bottom-6 right-6 z-[9999] flex items-center gap-2">
        <div className="bg-surface/90 backdrop-blur-md border border-outline-variant/40 shadow-2xl rounded-full px-2 py-1 flex items-center">
          <LanguageSwitcher />
        </div>
      </div>
    </>
  );
}
