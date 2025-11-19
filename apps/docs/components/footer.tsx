import { Facebook, Github, Linkedin, Twitter, Youtube } from "lucide-react";
import Link from "next/link";

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-white/10 border-t bg-black">
      <div className="container mx-auto px-4 py-8">
        {/* Bottom Section */}
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
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
