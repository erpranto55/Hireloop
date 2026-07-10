"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaFacebookF, FaPinterestP, FaLinkedinIn } from "react-icons/fa";

interface FooterLink {
  label: string;
  href: string;
}

const productLinks: FooterLink[] = [
  {
    label: "Job Discovery",
    href: "/jobs",
  },
  {
    label: "Worker AI",
    href: "/worker-ai",
  },
  {
    label: "Companies",
    href: "/companies",
  },
  {
    label: "Salary Data",
    href: "/salary",
  },
];

const navigationLinks: FooterLink[] = [
  {
    label: "Help Center",
    href: "/help-center",
  },
  {
    label: "Career Library",
    href: "/career-library",
  },
  {
    label: "Contact",
    href: "/contact",
  },
];

const resourceLinks: FooterLink[] = [
  {
    label: "Brand Guideline",
    href: "/brand-guideline",
  },
  {
    label: "Newsroom",
    href: "/newsroom",
  },
];

export default function Footer() {
  const pathname = usePathname();

  if (pathname.startsWith("/dashboard")) return null;
  return (
    <footer className="relative bg-black">
      {/* Top Glow Border */}
      <div className="absolute top-0 left-0 h-px w-full bg-linear-to-r from-transparent via-indigo-500/40 to-transparent" />

      <div className="container mx-auto px-6 lg:px-8">
        <div className="py-20 md:py-24">
          {/* Main Footer */}
          <div className="grid gap-14 text-center lg:grid-cols-[1.7fr_1fr_1fr_1fr] lg:text-left">
            {/* Brand Section */}
            <div className="flex flex-col items-center lg:items-start">
              <Link
                href="/"
                className="flex items-center"
              >
                <Image
                  src="/images/logo.png"
                  alt="HireLoop Logo"
                  width={120}
                  height={120}
                  style={{ height: "auto" }} />
              </Link>

              <p className="mt-6 max-w-xs text-sm leading-7 text-zinc-500 lg:max-w-sm">
                The AI-native career platform. Built for people who take
                their work seriously.
              </p>

              {/* Social Icons */}
              <div className="mt-12 flex items-center justify-center gap-3 lg:justify-start">
                <Link
                  href="#"
                  className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0F0F10] text-zinc-400 transition-all duration-300 hover:bg-zinc-900 hover:text-white"
                >
                  <FaFacebookF size={16} />
                </Link>

                <Link
                  href="#"
                  className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white transition-all duration-300 hover:bg-indigo-500"
                >
                  <FaPinterestP size={16} />
                </Link>

                <Link
                  href="#"
                  className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0F0F10] text-zinc-400 transition-all duration-300 hover:bg-zinc-900 hover:text-white"
                >
                  <FaLinkedinIn size={16} />
                </Link>
              </div>
            </div>

            {/* Product */}
            <div className="flex flex-col items-center lg:items-start">
              <h3 className="text-sm font-medium text-indigo-400">
                Product
              </h3>

              <ul className="mt-6 space-y-5">
                {productLinks.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-zinc-500 transition hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Navigation */}
            <div className="flex flex-col items-center lg:items-start">
              <h3 className="text-sm font-medium text-indigo-400">
                Navigation
              </h3>

              <ul className="mt-6 space-y-5">
                {navigationLinks.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-zinc-500 transition hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources */}
            <div className="flex flex-col items-center lg:items-start">
              <h3 className="text-sm font-medium text-indigo-400">
                Resources
              </h3>

              <ul className="mt-6 space-y-5">
                {resourceLinks.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-zinc-500 transition hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom Footer */}
          <div className="mt-20 border-t border-white/5 pt-8">
            <div className="flex flex-col items-center justify-between gap-5 text-center md:flex-row md:text-left">
              <p className="text-sm text-zinc-600">
                Copyright {new Date().getFullYear()} — HireLoop
              </p>

              <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-zinc-600">
                <Link
                  href="/terms"
                  className="transition hover:text-white"
                >
                  Terms & Policy
                </Link>

                <Link
                  href="/privacy"
                  className="transition hover:text-white"
                >
                  Privacy Guideline
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}


