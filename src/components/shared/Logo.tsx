
"use client";

import Image from 'next/image';
import { useBranding } from '@/context/BrandingContext';

export function Logo() {
  const { branding } = useBranding();

  return (
    <div className="flex items-center gap-2">
      <div className="rounded-full h-8 w-8 flex items-center justify-center">
        {branding.logoUrl ? (
          <Image src={branding.logoUrl} alt="Custom Logo" width={32} height={32} className="rounded-full object-cover" />
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            className="h-8 w-8 text-primary-foreground transition-all group-hover:scale-110"
            fill="currentColor"
          >
            <circle cx="12" cy="12" r="12" fill="hsl(var(--primary))"></circle>
            <path
              fill="#ffffff"
              d="M6.2,16.8V9.3h1.7l1.4,2.8c0.4,0.7,0.7,1.4,0.9,2.1h0.1c-0.1-0.8-0.1-1.6-0.1-2.5V9.3h1.6v7.5H9.9L8.5,14c-0.4-0.8-0.7-1.5-0.9-2.2h-0.1c0.1,0.8,0.1,1.6,0.1,2.5v2.5H6.2z M12.5,16.8V9.3h1.7l1.4,2.8c0.4,0.7,0.7,1.4,0.9,2.1h0.1c-0.1-0.8-0.1-1.6-0.1-2.5V9.3h1.6v7.5h-1.8l-1.4-2.8c-0.4-0.7-0.7-1.4-0.9-2.1h-0.1c0.1,0.8,0.1,1.6,0.1,2.5v2.5H12.5z"
            />
          </svg>
        )}
      </div>
      <span className="text-xl font-bold font-headline tracking-tight">
        MotionMint Hub
      </span>
    </div>
  );
}
