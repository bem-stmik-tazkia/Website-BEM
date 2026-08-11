import React from "react";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import ProfileView from "@/components/mahasiswa/ProfileView";
import { ProjectData } from "@/components/mahasiswa/ProjectCard";

export const revalidate = 0;

export default async function DashboardProfilePage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // Get user profile from mahasiswa_profiles (public profile data)
  let { data: profile } = await supabase
    .from("mahasiswa_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();
    
  if (!profile) {
    // If no public profile exists yet, fetch basic profile for fallback
    const { data: basicProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
      
    if (basicProfile) {
      profile = {
        id: basicProfile.id,
        user_id: user.id,
        full_name: basicProfile.full_name,
        email: basicProfile.email,
        avatar_url: basicProfile.avatar_url,
      };
    } else {
      // Create a dummy profile just in case
      profile = {
        full_name: "User",
        user_id: user.id,
      };
    }
  }

  // Get user's public projects
  const { data: karyaList } = await supabase
    .from("karya")
    .select("*")
    .eq("status", "approved")
    .or(`user_id.eq.${user.id},team.cs.[{"user_id":"${user.id}"}]`)
    .order("created_at", { ascending: false });

  // Map to ProjectData
  const projects: ProjectData[] = (karyaList || []).map((k: any) => ({
    id: k.id,
    title: k.title,
    description: k.description,
    cover_image: k.image_url,
    category: k.category,
    tech_stack: k.tech_stack || [],
    tags: k.tags || [],
    github_url: k.github_url,
    demo_url: k.demo_url,
    drive_url: k.drive_url,
    figma_url: k.figma_url,
    youtube_url: k.youtube_url,
    likes_count: k.likes || 0,
    views_count: k.views || 0,
  }));

  return (
    <div style={{ marginTop: '-5rem', marginLeft: '-1rem', marginRight: '-1rem' }} className="md:!mt-[-7rem] md:!mx-[-2rem]">
      <ProfileView
        profile={profile}
        projects={projects}
        isOwnProfile={true}
      />
    </div>
  );
}
