import { Button } from "@packages/base/components/ui/button";
import { Input } from "@packages/base/components/ui/input";
import { Facebook, Twitter, Linkedin, Github } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  const communityLinks = [
    { title: "Polkadot", href: "https://polkadot.com/community/" },
    { title: "Discord", href: "#" },
    { title: "Telegram", href: "#" },
    { title: "Twitter", href: "https://x.com/opentribe_io" },
    { title: "GitHub", href: "https://github.com/opentribe-dao/" },
  ];

  const categoriesLinks = [
    { title: "Development", href: "#" },
    { title: "Design", href: "#" },
    { title: "Marketing", href: "#" },
    { title: "Writing", href: "#" },
    { title: "Research", href: "#" },
  ];

  const aboutLinks = [
    { title: "FAQ", href: "/faq" }, // 404
    { title: "Blog", href: "/blog" }, // 200
    { title: "Changelog", href: "/changelog" }, // 404
    { title: "Contact", href: "/contact" }, // 200
  ];

  const legalLinks = [
    { title: "Terms", href: "/legal/terms" }, // 404
    { title: "Privacy", href: "/legal/privacy" }, // 404
    { title: "Cookies", href: "/legal/cookies" }, // 404
  ];

  return (
    <footer className="bg-black border-t border-white/10">
      <div className="container mx-auto px-4 py-12">
        {/* Newsletter Section */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-8 mb-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-2xl font-bold mb-2">Join our newsletter</h3>
              <p className="text-white/60">
                Get exclusive access to new opportunities and ecosystem news.
              </p>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Input
                type="email"
                placeholder="Enter your email"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
              <Button className="bg-pink-600 hover:bg-pink-700 whitespace-nowrap">
                Subscribe →
              </Button>
            </div>
          </div>
        </div>

        {/* Main Footer Content */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-12">
          {/* Logo and Description */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <span className="text-xl font-heading font-bold tracking-[0.25em] bg-gradient-to-r from-white/35 to-white bg-clip-text text-transparent leading-[1.75]">
                OPENTRIBE
              </span>
            </Link>
            <p className="text-white/60 text-sm mb-4">
              Opentribe is a talent marketplace connecting builders with
              opportunities in the Polkadot ecosystem. Find grants, bounties,
              and RFPs from leading projects.
            </p>
            <p className="text-white/40 text-xs">
              {currentYear} Opentribe. Built for builders.
            </p>
          </div>

          {/* Community */}
          <div>
            <h4 className="font-semibold mb-4">Community</h4>
            <ul className="space-y-2">
              {communityLinks.map((link) => (
                <li key={link.title}>
                  <Link
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/60 hover:text-white text-sm transition-colors"
                  >
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-semibold mb-4">Categories</h4>
            <ul className="space-y-2">
              {categoriesLinks.map((link) => (
                <li key={link.title}>
                  <Link
                    href={link.href}
                    className="text-white/60 hover:text-white text-sm transition-colors"
                  >
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* About */}
          <div>
            <h4 className="font-semibold mb-4">About</h4>
            <ul className="space-y-2">
              {aboutLinks.map((link) => (
                <li key={link.title}>
                  <Link
                    href={link.href}
                    className="text-white/60 hover:text-white text-sm transition-colors"
                  >
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2">
              {legalLinks.map((link) => (
                <li key={link.title}>
                  <Link
                    href={link.href}
                    className="text-white/60 hover:text-white text-sm transition-colors"
                  >
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-white/40 text-sm">
            © {currentYear} Opentribe. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="https://x.com/opentribe_io"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/40 hover:text-white transition-colors"
            >
              <Twitter className="w-5 h-5" />
            </Link>
            <Link
              href="https://github.com/opentribe-dao/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/40 hover:text-white transition-colors"
            >
              <Github className="w-5 h-5" />
            </Link>
            <Link
              href="#"
              className="text-white/40 hover:text-white transition-colors"
            >
              <Linkedin className="w-5 h-5" />
            </Link>
            <Link
              href="#"
              className="text-white/40 hover:text-white transition-colors"
            >
              <Facebook className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
