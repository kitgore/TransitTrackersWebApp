'use client';
import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import Image from 'next/image';
import { Mail } from '@/components/mail';
import { accounts, mails } from '../data';
import React from 'react';
import { useCallback } from 'react';

export default function MailPage() {
  const [defaultLayout, setDefaultLayout] = useState<[number, number]>([60, 40]);

  useEffect(() => {
    const cookieName = 'react-resizable-panels:layout';
    const savedLayout = Cookies.get(cookieName);
    
    if (savedLayout) {
      try {
        const parsed = JSON.parse(savedLayout);
        if (Array.isArray(parsed) && parsed.length === 2 &&
            parsed.every(size => typeof size === 'number' && !isNaN(size))) {
          // Ensure minimum sizes are respected
          const validSizes = parsed.map(size => Math.max(30, size));
          const total = validSizes.reduce((sum, size) => sum + size, 0);
          setDefaultLayout([
            (validSizes[0] / total) * 100,
            (validSizes[1] / total) * 100
          ]);
        }
      } catch (e) {
        console.error('Failed to parse layout:', e);
        // Keep default layout
      }
    }
  }, []);

  const handleLayoutChange = useCallback((sizes: number[]) => {
    if (sizes.length !== 2 || sizes.some(size => isNaN(size))) {
      return;
    }
    
    // Ensure minimum sizes and normalization
    const validSizes = sizes.map(size => Math.max(30, size));
    const total = validSizes.reduce((sum, size) => sum + size, 0);
    const normalized = [
      (validSizes[0] / total) * 100,
      (validSizes[1] / total) * 100
    ];
    
    Cookies.set('react-resizable-panels:layout', JSON.stringify(normalized), {
      expires: 365,
      path: '/messaging',
      sameSite: 'strict'
    });
  }, []);

  if (!defaultLayout) return null;

  return (
    <>
      <div className="md:hidden">
        <Image
          src="/examples/mail-dark.png"
          width={1280}
          height={727}
          alt="Mail"
          className="hidden dark:block"
        />
        <Image
          src="/examples/mail-light.png"
          width={1280}
          height={727}
          alt="Mail"
          className="block dark:hidden"
        />
      </div>
      <div className="hidden flex-col md:flex">
        <Mail
          accounts={accounts}
          mails={mails}
          defaultLayout={defaultLayout}
          navCollapsedSize={4}
          onLayoutChange={handleLayoutChange}
        />
      </div>
    </>
  );
}