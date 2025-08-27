
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// HSL string to HSL values
const parseHsl = (hslStr: string): [number, number, number] | null => {
    if (hslStr.startsWith('#')) {
        let hex = hslStr.slice(1);
        if (hex.length === 3) {
            hex = hex.split('').map(char => char + char).join('');
        }
        const bigint = parseInt(hex, 16);
        let r = (bigint >> 16) & 255;
        let g = (bigint >> 8) & 255;
        let b = bigint & 255;

        r /= 255;
        g /= 255;
        b /= 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h = 0, s = 0, l = (max + min) / 2;

        if (max !== min) {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }

        return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
    }

    const match = hslStr.match(/(\d+)\s*(\d+)%\s*(\d+)%/);
    if (!match) {
         const legacyMatch = hslStr.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
         if (!legacyMatch) return null;
         return [parseInt(legacyMatch[1]), parseInt(legacyMatch[2]), parseInt(legacyMatch[3])];
    };
    return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
};


interface Branding {
  logoUrl: string | null;
  primaryColor: string;
  backgroundColor: string;
  accentColor: string;
}

interface BrandingContextType {
  branding: Branding;
  setBranding: (branding: Partial<Branding>) => void;
}

const defaultBranding: Branding = {
  logoUrl: null,
  primaryColor: '#16a34a', // Default green
  backgroundColor: '#f5f5f5', // Default light gray
  accentColor: '#15803d', // Default dark green
};

const BrandingContext = createContext<BrandingContextType>({
  branding: defaultBranding,
  setBranding: () => {},
});

export const useBranding = () => useContext(BrandingContext);

export const BrandingProvider = ({ children }: { children: ReactNode }) => {
  const [branding, setBrandingState] = useState<Branding>(defaultBranding);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      try {
        const savedBranding = localStorage.getItem('branding');
        if (savedBranding) {
          setBrandingState(JSON.parse(savedBranding));
        }
      } catch (error) {
        console.error("Failed to parse branding from localStorage", error);
      }
    }
  }, [isMounted]);

  const setBranding = (newBranding: Partial<Branding>) => {
    setBrandingState(prevBranding => {
      const updatedBranding = { ...prevBranding, ...newBranding };
      try {
        localStorage.setItem('branding', JSON.stringify(updatedBranding));
      } catch (error) {
          console.error("Failed to save branding to localStorage", error);
      }
      return updatedBranding;
    });
  };

  useEffect(() => {
    const root = document.documentElement;
    
    const primaryHsl = parseHsl(branding.primaryColor);
    if(primaryHsl) {
        root.style.setProperty('--primary', `${primaryHsl[0]} ${primaryHsl[1]}% ${primaryHsl[2]}%`);
    }
    
    const backgroundHsl = parseHsl(branding.backgroundColor);
    if(backgroundHsl) {
        root.style.setProperty('--background', `${backgroundHsl[0]} ${backgroundHsl[1]}% ${backgroundHsl[2]}%`);
    }

    const accentHsl = parseHsl(branding.accentColor);
    if(accentHsl) {
        root.style.setProperty('--accent', `${accentHsl[0]} ${accentHsl[1]}% ${accentHsl[2]}%`);
    }
  }, [branding]);

  return (
    <BrandingContext.Provider value={{ branding, setBranding }}>
      {children}
    </BrandingContext.Provider>
  );
};
