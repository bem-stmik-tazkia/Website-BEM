"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiUser, FiCheck, FiMail, FiShield, FiFileText, FiRefreshCw } from "react-icons/fi";
import ImageUpload from "@/components/ui/ImageUpload";
import { updateMyProfile } from "@/actions/profile";
import { useToast } from "@/components/ui/Toast";
import { useTranslations } from "next-intl";

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: any;
  onProfileUpdated?: (updated: any) => void;
}

export default function ProfileSettingsModal({
  isOpen,
  onClose,
  userProfile,
  onProfileUpdated,
}: ProfileSettingsModalProps) {
  const { toast } = useToast();
  const t = useTranslations("ProfileSettingsModal");

  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bio, setBio] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (userProfile && isOpen) {
      setFullName(userProfile.full_name || userProfile.user_metadata?.full_name || "");
      setAvatarUrl(userProfile.avatar_url || userProfile.user_metadata?.avatar_url || userProfile.user_metadata?.picture || "");
      setBio(userProfile.bio || "");
    }
  }, [userProfile, isOpen]);

  if (!isOpen) return null;

  const googleAvatar =
    userProfile?.user_metadata?.avatar_url ||
    userProfile?.user_metadata?.picture ||
    userProfile?.raw_user_meta_data?.avatar_url ||
    null;

  const handleResetToGoogle = () => {
    if (googleAvatar) {
      setAvatarUrl(googleAvatar);
      toast(t("resetSuccess"), "info");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast(t("fullNameRequired"), "error");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await updateMyProfile({
        full_name: fullName.trim(),
        avatar_url: avatarUrl || null,
        bio: bio.trim() || null,
      });

      if (res.error) {
        throw new Error(res.error);
      }

      toast(t("saveSuccess"), "success");
      if (onProfileUpdated && res.profile) {
        onProfileUpdated(res.profile);
      }
      onClose();
    } catch (err: any) {
      toast(`${t("saveError")}${err.message || ""}`, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg bg-surface border border-outline-variant/30 rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/20 bg-surface-variant/20">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                <FiUser size={18} />
              </div>
              <div>
                <h2 className="text-base font-black text-on-surface">{t("title")}</h2>
                <p className="text-[11px] text-on-surface-variant">
                  {t("subtitle")}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              type="button"
              className="p-2 rounded-xl text-on-surface-variant hover:bg-surface-variant hover:text-on-surface transition-colors cursor-pointer"
            >
              <FiX size={18} />
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
            {/* Foto Profil */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-on-surface">{t("avatarLabel")}</label>
                {googleAvatar && avatarUrl !== googleAvatar && (
                  <button
                    type="button"
                    onClick={handleResetToGoogle}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                  >
                    <FiRefreshCw size={11} />
                    <span>{t("resetToGoogle")}</span>
                  </button>
                )}
              </div>
              <ImageUpload
                value={avatarUrl}
                onChange={(url) => setAvatarUrl(url)}
                folder="avatars"
                label={t("changeAvatar")}
              />
            </div>

            {/* Nama Lengkap */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-on-surface flex items-center justify-between">
                <span>{t("fullNameLabel")} <span className="text-rose-500">*</span></span>
                <span className="text-[10px] text-on-surface-variant font-normal">{fullName.length}/80</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                maxLength={80}
                required
                placeholder={t("fullNamePlaceholder")}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-variant/20 border border-outline-variant/40 focus:border-primary focus:ring-2 focus:ring-primary/20 text-on-surface text-xs sm:text-sm outline-none transition-all placeholder:text-on-surface-variant/40"
              />
            </div>

            {/* Bio Penulis */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-on-surface flex items-center gap-1">
                  <FiFileText size={13} className="text-primary" />
                  <span>{t("bioLabel")}</span>
                </label>
                <span className="text-[10px] text-on-surface-variant font-normal">{bio.length}/250</span>
              </div>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={250}
                rows={3}
                placeholder={t("bioPlaceholder")}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-variant/20 border border-outline-variant/40 focus:border-primary focus:ring-2 focus:ring-primary/20 text-on-surface text-xs sm:text-sm outline-none transition-all placeholder:text-on-surface-variant/40 resize-none leading-relaxed"
              />
              <p className="text-[10px] text-on-surface-variant/70">
                {t("bioHint")}
              </p>
            </div>

            {/* Read-Only Info: Email & Role Badge */}
            <div className="p-3 rounded-2xl bg-surface-variant/15 border border-outline-variant/20 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                <FiMail size={13} />
                <span className="font-mono text-[11px] truncate max-w-[200px]">{userProfile?.email}</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-extrabold uppercase tracking-wider">
                <FiShield size={11} />
                <span>{userProfile?.role === "admin" ? t("roleAdmin") : t("roleMahasiswa")}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-outline-variant/20 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl border border-outline-variant/40 text-on-surface hover:bg-surface-variant/30 text-xs font-bold transition-colors cursor-pointer"
              >
                {t("cancel")}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold shadow-md shadow-primary/20 transition-all cursor-pointer disabled:opacity-50"
              >
                <FiCheck size={14} />
                <span>{isSubmitting ? t("saving") : t("save")}</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

