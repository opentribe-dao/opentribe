"use client";

import { useEffect, useState } from "react";

export function Background() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="-z-10 fixed inset-0 bg-[#0a0a0a]">
      {/* Main gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20" />

      {/* Primary color blobs with heavy blur for soft glow effect */}
      <div className="absolute inset-0">
        {/* Pink/Purple glow - top left area */}
        <div className="-left-[0%] -top-[10%] absolute h-[40vh] w-[40vw] rounded-full bg-gradient-to-br from-[#E6007A]/40 to-purple-700/30 blur-[480px]" />

        {/* Purple central glow */}
        <div className="absolute top-[30%] left-[20%] h-[40vh] w-[40vw] rounded-full bg-purple-600/25 blur-[400px]" />

        {/* Blue glow - bottom right area */}
        <div className="-bottom-[10%] -right-[10%] absolute h-[60vh] w-[60vw] rounded-full bg-gradient-to-tl from-blue-600/30 to-blue-800/20 blur-[480px]" />

        {/* Additional ambient glows */}
        <div className="absolute top-[10%] left-[70%] h-[30vh] w-[30vw] rounded-full bg-purple-500/20 blur-[80px]" />
        <div className="absolute right-[20%] bottom-[40%] h-[35vh] w-[35vw] rounded-full bg-blue-500/15 blur-[90px]" />
      </div>

      {/* Subtle concentric stadium shapes - left side */}
      <div
        className="-left-[40%] absolute top-[10%] h-[60vh] w-[80vw]"
        style={{ transform: `translateY(${scrollY * 0.05}px)` }}
      >
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100">
          <defs>
            <linearGradient id="leftGradient" x1="0%" x2="100%" y1="0%" y2="0%">
              <stop offset="0%" stopColor="#E6007A" stopOpacity="0" />
              <stop offset="20%" stopColor="#E6007A" stopOpacity="0.15" />
              <stop offset="50%" stopColor="#E6007A" stopOpacity="0.25" />
              <stop offset="80%" stopColor="#E6007A" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#E6007A" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[...Array(8)].map((_, i) => (
            <rect
              fill="none"
              height={`${(i + 1) * 8}%`}
              key={`left-${i}`}
              opacity={0.4 - i * 0.05}
              rx={`${(i + 1) * 4}%`}
              stroke="url(#leftGradient)"
              strokeWidth="0.5"
              width={`${(i + 1) * 12}%`}
              x={`${48 - (i + 1) * 6}%`}
              y={`${47 - (i + 1) * 4}%`}
            />
          ))}
        </svg>
      </div>

      {/* Subtle concentric stadium shapes - right side */}
      <div
        className="-right-[40%] absolute bottom-[10%] h-[60vh] w-[80vw]"
        style={{ transform: `translateY(${-scrollY * 0.05}px)` }}
      >
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100">
          <defs>
            <linearGradient
              id="rightGradient"
              x1="0%"
              x2="100%"
              y1="0%"
              y2="0%"
            >
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0" />
              <stop offset="20%" stopColor="#3B82F6" stopOpacity="0.1" />
              <stop offset="50%" stopColor="#3B82F6" stopOpacity="0.2" />
              <stop offset="80%" stopColor="#3B82F6" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[...Array(10)].map((_, i) => (
            <rect
              fill="none"
              height={`${(i + 1) * 10}%`}
              key={`right-${i}`}
              opacity={0.35 - i * 0.035}
              rx={`${(i + 1) * 5}%`}
              stroke="url(#rightGradient)"
              strokeWidth="0.5"
              width={`${(i + 1) * 14}%`}
              x={`${49 - (i + 1) * 7}%`}
              y={`${49 - (i + 1) * 5}%`}
            />
          ))}
        </svg>
      </div>

      {/* Very subtle noise texture */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(
            '<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><filter id="noise"><feTurbulence type="fractalNoise" baseFrequency="0.65" seed="5" /></filter><rect width="100%" height="100%" filter="url(#noise)" /></svg>'
          )}")`,
        }}
      />
    </div>
  );
}
