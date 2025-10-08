"use client";

import { Button } from "@packages/base/components/ui/button";
import { Input } from "@packages/base/components/ui/input";
import { Facebook, Twitter, Linkedin, Github, Youtube } from "lucide-react";
import Link from "next/link";

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
    <footer className='border-white/10 border-t bg-black'>
      <div className="container mx-auto px-4 py-12">
        {/* Newsletter Section */}
        <div className='mb-12 rounded-lg border border-white/10 bg-white/5 p-8 backdrop-blur-sm'>
          <div className='flex flex-col items-center justify-between gap-6 md:flex-row'>
            <div>
              <h3 className='mb-2 font-bold text-2xl'>Join our newsletter</h3>
              <p className="text-white/60">
                Get exclusive access to new opportunities and ecosystem news.
              </p>
            </div>
            <div className='flex w-full gap-2 md:w-auto'>
              <Input
                type="email"
                placeholder="Enter your email"
                className='w-64 border-white/20 bg-white/10 text-white placeholder:text-white/50'
              />
              <Button className='-ml-8 whitespace-nowrap bg-pink-600 hover:bg-pink-700'>
                Subscribe →
              </Button>
            </div>
          </div>
        </div>

        {/* Main Footer Content */}
        <div className='mb-12 grid grid-cols-2 gap-8 md:grid-cols-6'>
          {/* Logo and Description */}
          <div className="col-span-2">
            <Link href="/" className='mb-4 flex items-center gap-2'>
              <span className='bg-gradient-to-r from-white/35 to-white bg-clip-text font-bold font-heading text-transparent text-xl leading-[1.75] tracking-[0.25em]'>
                OPENTRIBE
              </span>
            </Link>
            <p className='mb-4 text-sm text-white/60'>
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
            <h4 className='mb-4 font-semibold'>Community</h4>
            <ul className="space-y-2">
              {communityLinks.map((link) => (
                <li key={link.title}>
                  <Link
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className='text-sm text-white/60 transition-colors hover:text-white'
                  >
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className='mb-4 font-semibold'>Categories</h4>
            <ul className="space-y-2">
              {categoriesLinks.map((link) => (
                <li key={link.title}>
                  <Link
                    href={link.href}
                    className='text-sm text-white/60 transition-colors hover:text-white'
                  >
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* About */}
          <div>
            <h4 className='mb-4 font-semibold'>About</h4>
            <ul className="space-y-2">
              {aboutLinks.map((link) => (
                <li key={link.title}>
                  <Link
                    href={link.href}
                    className='text-sm text-white/60 transition-colors hover:text-white'
                  >
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className='mb-4 font-semibold'>Legal</h4>
            <ul className="space-y-2">
              {legalLinks.map((link) => (
                <li key={link.title}>
                  <Link
                    href={link.href}
                    className='text-sm text-white/60 transition-colors hover:text-white'
                  >
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className='flex flex-col items-center justify-between gap-4 border-white/10 border-t pt-8 md:flex-row'>
          <p className='text-sm text-white/40'>
            © {currentYear} Opentribe. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="https://x.com/opentribe_io"
              target="_blank"
              rel="noopener noreferrer"
              className='text-white/40 transition-colors hover:text-white'
            >
              <Twitter className='h-5 w-5' />
            </Link>
            <Link
              href="https://github.com/opentribe-dao/"
              target="_blank"
              rel="noopener noreferrer"
              className='text-white/40 transition-colors hover:text-white'
            >
              <Github className='h-5 w-5' />
            </Link>
            <Link
              target="_blank"
              rel="noopener noreferrer"
              href="https://www.linkedin.com/company/opentribe-dao/"
              className='text-white/40 transition-colors hover:text-white'
            >
              <Linkedin className='h-5 w-5' />
            </Link>
            <Link
              target="_blank"
              rel="noopener noreferrer"
              href="https://www.facebook.com/opentribe.io"
              className='text-white/40 transition-colors hover:text-white'
            >
              <Facebook className='h-5 w-5' />
            </Link>
            <Link
              target="_blank"
              rel="noopener noreferrer"
              href="https://www.youtube.com/@Opentribe_io"
              className='text-white/40 transition-colors hover:text-white'
            >
              <Youtube className='h-5 w-5' />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
