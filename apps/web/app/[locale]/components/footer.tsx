"use client";

import { Logo } from "@packages/base/components/logo";
import { Button } from "@packages/base/components/ui/button";
import { Input } from "@packages/base/components/ui/input";
import { Facebook, Github, Linkedin, Twitter, Youtube } from "lucide-react";
import Link from "next/link";
import type React from "react";
import { useState } from "react";
import { toast } from "sonner";
import { CookieSettingsTrigger } from "../legal/components/cookie-settings-trigger";

export const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/newsletter/subscribe`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );

      const result = await response.json();

      if (result.success) {
        toast.success(result.message || "Successfully subscribed!");
        setEmail(""); // Clear the input
      } else {
        toast.error(result.error || "Failed to subscribe");
      }
    } catch {
      toast.error("Failed to subscribe. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const communityLinks = [
    { title: "Polkadot", href: "https://polkadot.com/community/" },
    { title: "Discord", href: "https://discord.gg/EB3mHy2Jwg" },
    { title: "Telegram", href: "https://t.me/opentribe_dao" },
    { title: "Twitter", href: "https://x.com/opentribe_io" },
    { title: "GitHub", href: "https://github.com/opentribe-dao/" },
  ];

  // const categoriesLinks = [
  //   { title: 'Development', href: '#' },
  //   { title: 'Design', href: '#' },
  //   { title: 'Marketing', href: '#' },
  //   { title: 'Writing', href: '#' },
  //   { title: 'Research', href: '#' },
  // ];

  const aboutLinks = [
    { title: "FAQ", href: "/faq" }, // 404
    { title: "Blog", href: "/blog" }, // 200
    { title: "Changelog", href: "/changelog" }, // 404
    { title: "Contact", href: "/contact" }, // 200
    { title: "Support", href: "/support" }, // 200
  ];

  const legalLinks = [
    { title: "Terms", href: "/legal/terms-of-service" },
    { title: "Privacy", href: "/legal/privacy-policy" },
    { title: "Cookies", href: "/legal/cookie-policy" },
  ];

  return (
    <footer className="border-white/10 border-t bg-black">
      <div className="container mx-auto px-4 py-12">
        {/* Newsletter Section */}
        <div className="mb-12 rounded-lg border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div>
              <h3 className="mb-2 font-bold text-2xl">Join our newsletter</h3>
              <p className="text-white/60">
                Get exclusive access to new opportunities and ecosystem news.
              </p>
            </div>
            <form
              className="flex w-full gap-2 md:w-auto"
              onSubmit={handleSubscribe}
            >
              <Input
                className="w-64 border-white/20 bg-white/10 text-white placeholder:text-white/50"
                disabled={loading}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                type="email"
                value={email}
              />
              <Button
                className="-ml-8 whitespace-nowrap bg-pink-600 hover:bg-pink-700"
                disabled={loading}
                type="submit"
              >
                {loading ? "Subscribing..." : "Subscribe →"}
              </Button>
            </form>
          </div>
        </div>

        {/* Main Footer Content */}
        <div className="mb-12 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Logo and Description */}
          <div>
            <Link className="mb-4 flex items-center gap-2" href="/">
              <Logo size="md" />
            </Link>
            <p className="mb-4 text-sm text-white/60">
              Opentribe is a talent marketplace connecting builders with
              opportunities in the Polkadot ecosystem. Find grants, bounties,
              and RFPs from leading projects.
            </p>
            <p className="text-white/40 text-xs">
              {currentYear} Opentribe. Built for builders.
            </p>
          </div>

          {/* Links Container - All links in one section */}
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:ml-8">
            {/* Community */}
            <div>
              <h4 className="mb-4 font-semibold">Community</h4>
              <ul className="space-y-2">
                {communityLinks.map((link) => (
                  <li key={link.title}>
                    <Link
                      className="text-sm text-white/60 transition-colors hover:text-white"
                      href={link.href}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      {link.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* About */}
            <div>
              <h4 className="mb-4 font-semibold">About</h4>
              <ul className="space-y-2">
                {aboutLinks.map((link) => (
                  <li key={link.title}>
                    <Link
                      className="text-sm text-white/60 transition-colors hover:text-white"
                      href={link.href}
                    >
                      {link.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="mb-4 font-semibold">Legal</h4>
              <ul className="space-y-2">
                {legalLinks.map((link) => (
                  <li key={link.title}>
                    <Link
                      className="text-sm text-white/60 transition-colors hover:text-white"
                      href={link.href}
                    >
                      {link.title}
                    </Link>
                  </li>
                ))}
                <li>
                  <CookieSettingsTrigger variant="link">
                    <span className="text-sm text-white/60 transition-colors hover:text-white">
                      Cookie Settings
                    </span>
                  </CookieSettingsTrigger>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="flex flex-col items-center justify-between gap-4 border-white/10 border-t pt-8 md:flex-row">
          <p className="text-sm text-white/40">
            © {currentYear} Opentribe. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link
              className="text-white/40 transition-colors hover:text-white"
              href="https://x.com/opentribe_io"
              rel="noopener noreferrer"
              target="_blank"
            >
              <Twitter className="h-5 w-5" />
            </Link>
            <Link
              className="text-white/40 transition-colors hover:text-white"
              href="https://github.com/opentribe-dao/"
              rel="noopener noreferrer"
              target="_blank"
            >
              <Github className="h-5 w-5" />
            </Link>
            <Link
              className="text-white/40 transition-colors hover:text-white"
              href="https://www.linkedin.com/company/opentribe-dao/"
              rel="noopener noreferrer"
              target="_blank"
            >
              <Linkedin className="h-5 w-5" />
            </Link>
            <Link
              className="text-white/40 transition-colors hover:text-white"
              href="https://www.facebook.com/opentribe.io"
              rel="noopener noreferrer"
              target="_blank"
            >
              <Facebook className="h-5 w-5" />
            </Link>
            <Link
              className="text-white/40 transition-colors hover:text-white"
              href="https://www.youtube.com/@Opentribe_io"
              rel="noopener noreferrer"
              target="_blank"
            >
              <Youtube className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
