"use client";

import React from 'react';

interface NexoLogoProps {
  size?: number;
}

export default function NexoLogo({ size = 32 }: NexoLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="nexo-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F0B90B" />
          <stop offset="1" stopColor="#F5D547" />
        </linearGradient>
        <linearGradient id="nexo-grad-dark" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#D4A20A" />
          <stop offset="1" stopColor="#B38808" />
        </linearGradient>
      </defs>
      {/* Base Rounded Hexagon/Diamond */}
      <rect width="40" height="40" rx="12" fill="url(#nexo-grad)" />
      {/* Geometric N Shape - Modern & 3D illusion */}
      <path
        d="M12 28V12L19 12L25 21V12H28V28H21L15 19V28H12Z"
        fill="#1E2329"
      />
      {/* Accent Overlay to give it a tech feel */}
      <path
        d="M12 12H19L25 21L21 28L15 19H12V12Z"
        fill="url(#nexo-grad-dark)"
        opacity="0.9"
      />
      {/* Light Reflection */}
      <path
        d="M12 12C12 12 18 11 28 12C28 12 28 17 28 17C20 17 12 14 12 12Z"
        fill="#FFFFFF"
        opacity="0.15"
      />
    </svg>
  );
}
