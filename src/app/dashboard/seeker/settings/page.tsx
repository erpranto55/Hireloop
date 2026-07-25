"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { toast } from "react-toastify";

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

      const res = await fetch(`http://localhost:5001/api/users/${user.email}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success("Profile updated successfully!");
        router.refresh();
      } else {
        const err = await res.json();
        toast.error(err.message || "Failed to update profile");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
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
            <div className="mt-4">
              <label className="block text-sm text-zinc-500" htmlFor="resumeUrl">Resume PDF URL</label>
              <input
                id="resumeUrl"
                type="url"
                placeholder="https://drive.google.com/..."
                value={resumeUrl}
                onChange={(e) => setResumeUrl(e.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none focus:border-indigo-500"
              />
              <p className="mt-2 text-xs text-zinc-500">
                Provide a shareable URL to your resume PDF (Google Drive, Dropbox, or personal site).
              </p>
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
