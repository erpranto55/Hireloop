"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { toast } from "react-toastify";
import { apiFetch } from "@/lib/api";

export default function SeekerSettingsPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const user = session?.user;

  const [name, setName] = useState("");
  const [headline, setHeadline] = useState("");
  const [image, setImage] = useState("");
  const [bio, setBio] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");
  const [skills, setSkills] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);

  const handleResumeFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Only PDF files are supported.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size cannot exceed 5MB.");
      return;
    }

    try {
      setUploadingResume(true);
      const formData = new FormData();
      formData.append("resume", file);

      const res = await apiFetch<{ url: string }>("/api/resumes/upload", {
        method: "POST",
        body: formData,
      });

      setResumeUrl(res.url);
      toast.success("Resume uploaded successfully! Remember to click Save Profile.");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to upload resume.");
    } finally {
      setUploadingResume(false);
    }
  };

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setHeadline((user as any).headline || "");
      setImage(user.image || "");
      setBio((user as any).bio || "");
      setResumeUrl((user as any).resumeUrl || "");
      setSkills((user as any).skills || "");
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email) return;

    try {
      setSaving(true);
      const payload = {
        name,
        headline,
        image,
        bio,
        resumeUrl,
        skills,
      };

      await apiFetch(`/api/users/${encodeURIComponent(user.email)}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });

      toast.success("Profile updated successfully!");
      router.refresh();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (isPending) {
    return (
      <div className="flex h-96 items-center justify-center bg-black text-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <p className="text-sm font-medium text-indigo-400">Seeker</p>
        <h1 className="mt-2 text-3xl font-semibold md:text-5xl">Seeker Settings</h1>
        <p className="mt-3 max-w-2xl text-zinc-400">Update profile details, resume, skills, and account preferences.</p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Left Section: Profile Info */}
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-5">
          <h2 className="text-2xl font-semibold">Profile Information</h2>
          
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="block text-sm text-zinc-500" htmlFor="name">Full Name</label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm text-zinc-500" htmlFor="email">Email (Read Only)</label>
              <input
                id="email"
                type="email"
                readOnly
                value={user?.email || ""}
                className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-900/50 px-4 py-3 text-sm text-zinc-500 outline-none cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm text-zinc-500" htmlFor="headline">Headline</label>
              <input
                id="headline"
                type="text"
                placeholder="e.g. Senior Frontend Engineer"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm text-zinc-500" htmlFor="image">Avatar URL</label>
              <input
                id="image"
                type="url"
                placeholder="https://example.com/photo.jpg"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-zinc-500" htmlFor="bio">Bio</label>
            <textarea
              id="bio"
              rows={5}
              placeholder="Introduce yourself..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none focus:border-indigo-500 resize-none"
            />
          </div>
        </section>

        {/* Right Section: Resume and Skills */}
        <aside className="space-y-6">
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <h2 className="text-xl font-semibold">Resume</h2>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm text-zinc-500 mb-2">Upload PDF File</label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    id="settings-resume-upload"
                    accept=".pdf,application/pdf"
                    onChange={handleResumeFileUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="settings-resume-upload"
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-white/10 transition cursor-pointer"
                  >
                    {uploadingResume ? "Uploading..." : "Choose PDF..."}
                  </label>
                  {resumeUrl && (
                    <span className="text-xs text-emerald-400 font-medium">✓ Resume on file</span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm text-zinc-500" htmlFor="resumeUrl">Or Resume Link</label>
                <input
                  id="resumeUrl"
                  type="text"
                  placeholder="https://drive.google.com/... or /api/resumes/..."
                  value={resumeUrl}
                  onChange={(e) => setResumeUrl(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none focus:border-indigo-500"
                />
                <p className="mt-1 text-xs text-zinc-500">
                  Direct shareable link or server-stored PDF reference.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <h2 className="text-xl font-semibold">Skills</h2>
            <div className="mt-4">
              <label className="block text-sm text-zinc-500" htmlFor="skills">Skills (Comma-separated)</label>
              <input
                id="skills"
                type="text"
                placeholder="React, TypeScript, Next.js"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none focus:border-indigo-500"
              />
              <p className="mt-2 text-xs text-zinc-500">
                Separate skills with commas (e.g. React, Next.js, Node.js).
              </p>
            </div>
          </section>
        </aside>

        <div className="lg:col-span-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-500 transition disabled:opacity-50 cursor-pointer"
          >
            {saving ? "Saving Changes..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
