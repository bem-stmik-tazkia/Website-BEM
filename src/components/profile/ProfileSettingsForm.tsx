"use client";

import React, { useEffect, useRef, useState } from "react";
import { Link, useRouter } from "@/i18n/routing";
import Image from "next/image";
import { useTranslations } from "next-intl";
import {
  FiArrowLeft,
  FiCheck,
  FiFileText,
  FiLock,
  FiMail,
  FiRefreshCw,
  FiShield,
  FiUser,
} from "react-icons/fi";
import ImageUpload from "@/components/ui/ImageUpload";
import { updateMyProfile } from "@/actions/profile";
import { useToast } from "@/components/ui/Toast";
import type { ProfilePageData } from "@/lib/profile-server";

export default function ProfileSettingsForm({
  initialProfile,
  backHref = "/dashboard",
  backLabelKey = "backToDashboard",
}: {
  initialProfile: ProfilePageData;
  backHref?: "/" | "/dashboard";
  backLabelKey?: "backToDashboard" | "backToHome";
}) {
  const t = useTranslations("ProfileSettingsModal");
  const { toast } = useToast();
  const router = useRouter();

  const [fullName, setFullName] = useState(initialProfile.fullName);
  const [avatarUrl, setAvatarUrl] = useState(initialProfile.avatarUrl);
  const [bio, setBio] = useState(initialProfile.bio);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const savedSuccessfullyRef = useRef(false);

  const hasChanges =
    fullName.trim() !== initialProfile.fullName.trim() ||
    (avatarUrl || "").trim() !== (initialProfile.avatarUrl || "").trim() ||
    bio.trim() !== initialProfile.bio.trim();

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges && !isSubmitting && !savedSuccessfullyRef.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasChanges, isSubmitting]);

  const handleLeaveCheck = (e: React.MouseEvent) => {
    if (hasChanges && !isSubmitting && !savedSuccessfullyRef.current) {
      if (!window.confirm(t("unsavedConfirm"))) {
        e.preventDefault();
      }
    }
  };

  const initials = (fullName || initialProfile.email || "U")
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || "")
    .join("");

  const handleResetToGoogle = () => {
    if (initialProfile.googleAvatarUrl) {
      setAvatarUrl(initialProfile.googleAvatarUrl);
      toast(t("resetSuccess"), "info");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasChanges || isSubmitting) return;

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

      savedSuccessfullyRef.current = true;
      toast(t("saveSuccess"), "success");
      if (typeof window !== "undefined" && res.profile) {
        window.dispatchEvent(
          new CustomEvent("profile_updated", { detail: res.profile })
        );
      }
      router.push(backHref);
      router.refresh();
    } catch (err: any) {
      toast(`${t("saveError")}${err?.message || ""}`, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Top Bar Back & Page Title */}
      <div className="flex flex-col gap-3">
        <Link
          href={backHref}
          onClick={handleLeaveCheck}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors w-fit"
        >
          <FiArrowLeft size={15} />
          <span>{t(backLabelKey)}</span>
        </Link>

        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <FiUser size={22} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-on-surface tracking-tight">
              {t("title")}
            </h1>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
              {t("subtitle")}
            </p>
          </div>
        </div>
      </div>

      {/* Live Preview Banner */}
      <div className="bg-surface border border-outline-variant/30 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-black text-xl overflow-hidden shrink-0">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={fullName || "Avatar"}
                width={64}
                height={64}
                unoptimized
                className="w-full h-full object-cover"
              />
            ) : (
              initials
            )}
          </div>
          <div className="min-w-0">
            <p className="text-base sm:text-lg font-extrabold text-on-surface truncate">
              {fullName || initialProfile.email}
            </p>
            <p className="text-xs text-on-surface-variant truncate">
              {initialProfile.email}
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-extrabold uppercase tracking-wider w-fit shrink-0">
          <FiShield size={12} />
          <span>
            {initialProfile.role === "admin" ? t("roleAdmin") : t("roleMahasiswa")}
          </span>
        </span>
      </div>

      {/* Main Settings Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-surface border border-outline-variant/30 rounded-3xl p-5 sm:p-7 shadow-sm space-y-6"
      >
        {/* Foto Profil */}
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="text-xs sm:text-sm font-bold text-on-surface">
              {t("avatarLabel")}
            </label>
            {initialProfile.googleAvatarUrl &&
              avatarUrl !== initialProfile.googleAvatarUrl && (
                <button
                  type="button"
                  onClick={handleResetToGoogle}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline cursor-pointer"
                >
                  <FiRefreshCw size={12} />
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

        <hr className="border-outline-variant/20" />

        {/* Identitas & Bio */}
        <div className="space-y-5">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-on-surface-variant">
            {t("personalInfoTitle")}
          </h2>

          {/* Nama Lengkap */}
          <div className="space-y-1.5">
            <label className="text-xs sm:text-sm font-bold text-on-surface flex items-center justify-between">
              <span>
                {t("fullNameLabel")} <span className="text-rose-500">*</span>
              </span>
              <span className="text-[11px] text-on-surface-variant font-normal">
                {fullName.length}/80
              </span>
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              maxLength={80}
              required
              placeholder={t("fullNamePlaceholder")}
              className="w-full px-4 py-3 rounded-xl bg-background border border-outline-variant/40 focus:border-primary focus:ring-2 focus:ring-primary/20 text-on-surface text-sm outline-none transition-all placeholder:text-on-surface-variant/40"
            />
          </div>

          {/* Bio Penulis */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs sm:text-sm font-bold text-on-surface flex items-center gap-1.5">
                <FiFileText size={14} className="text-primary" />
                <span>{t("bioLabel")}</span>
              </label>
              <span className="text-[11px] text-on-surface-variant font-normal">
                {bio.length}/250
              </span>
            </div>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={250}
              rows={3}
              placeholder={t("bioPlaceholder")}
              className="w-full px-4 py-3 rounded-xl bg-background border border-outline-variant/40 focus:border-primary focus:ring-2 focus:ring-primary/20 text-on-surface text-sm outline-none transition-all placeholder:text-on-surface-variant/40 resize-none leading-relaxed"
            />
            <p className="text-[11px] text-on-surface-variant/80">{t("bioHint")}</p>
          </div>
        </div>

        <hr className="border-outline-variant/20" />

        {/* Read-Only Account Info */}
        <div className="space-y-3">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
            <FiLock size={13} />
            <span>{t("accountInfoTitle")}</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-surface-variant/15 border border-outline-variant/25">
              <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                {t("emailLabel")}
              </p>
              <div className="flex items-center gap-2 text-xs sm:text-sm text-on-surface font-mono truncate">
                <FiMail size={14} className="text-primary shrink-0" />
                <span className="truncate">{initialProfile.email}</span>
              </div>
            </div>
            <div className="p-3.5 rounded-2xl bg-surface-variant/15 border border-outline-variant/25">
              <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                {t("roleLabel")}
              </p>
              <div className="flex items-center gap-2 text-xs sm:text-sm text-on-surface font-bold">
                <FiShield size={14} className="text-primary shrink-0" />
                <span>
                  {initialProfile.role === "admin" ? t("roleAdmin") : t("roleMahasiswa")}
                </span>
              </div>
            </div>
          </div>
          <p className="text-[11px] text-on-surface-variant/80">
            {t("lockedFieldsHint")}
          </p>
        </div>

        {/* Actions */}
        <div className="pt-4 border-t border-outline-variant/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="text-xs text-on-surface-variant/80">
            {!hasChanges ? t("noChanges") : ""}
          </span>
          <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-3 w-full sm:w-auto">
            <Link
              href={backHref}
              onClick={handleLeaveCheck}
              className="w-full sm:w-auto px-5 py-3 rounded-xl border border-outline-variant/40 text-on-surface hover:bg-surface-variant/30 text-xs sm:text-sm font-bold transition-colors text-center"
            >
              {t("cancel")}
            </Link>
            <button
              type="submit"
              disabled={isSubmitting || !hasChanges || !fullName.trim()}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs sm:text-sm font-bold shadow-md shadow-primary/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiCheck size={16} />
              <span>{isSubmitting ? t("saving") : t("save")}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
