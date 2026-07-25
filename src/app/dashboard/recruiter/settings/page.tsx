"use client";

import React, { useState, useEffect } from "react";
import Link from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

export default function RecruiterSettingsPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const user = session?.user;

  const [name, setName] = useState("");
  const [image, setImage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setImage(user.image || "");
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email) return;

    try {
      setSaving(true);
      const res = await fetch(`http://localhost:5001/api/users/${user.email}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, image }),
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
        <p className="text-sm font-medium text-indigo-400">Recruiter</p>
        <h1 className="mt-2 text-3xl font-semibold md:text-5xl">Recruiter Settings</h1>
        <p className="mt-3 max-w-2xl text-zinc-400 font-medium text-sm">Update recruiter account details and jump back to company management.</p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-5 h-fit">
          <h2 className="text-2xl font-semibold">Personal Information</h2>
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="block text-sm text-zinc-500" htmlFor="name">Full Name</label>
              <input
                id="name"
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
                className="mt-2 w-full rounded-xl border border-zinc-900/50 bg-zinc-900/50 px-4 py-3 text-sm text-zinc-500 outline-none cursor-not-allowed"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm text-zinc-500" htmlFor="image">Avatar Image URL</label>
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

          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-500 transition disabled:opacity-50 cursor-pointer"
          >
            {saving ? "Saving Changes..." : "Save Settings"}
          </button>
        </section>

        <aside className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 h-fit">
          <h2 className="text-xl font-semibold">Linked Company</h2>
          <p className="mt-3 text-sm leading-6 text-zinc-400">
            Your recruiter profile is linked to your company profile. Company details and approval status live on the My Company page.
          </p>
          <button
            type="button"
            onClick={() => router.push("/dashboard/recruiter/company")}
            className="mt-6 w-full rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-zinc-200 hover:bg-white/10 transition cursor-pointer"
          >
            Manage Company
          </button>
        </aside>
      </form>
    </div>
  );
}
