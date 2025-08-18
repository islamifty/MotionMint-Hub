
'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import NProgress from 'nprogress';

export function NextNProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    NProgress.configure({ showSpinner: false });
    NProgress.done();
  }, [pathname, searchParams]);

  useEffect(() => {
    const handleAnchorClick = (event: MouseEvent) => {
      const targetUrl = (event.currentTarget as HTMLAnchorElement).href;
      const currentUrl = window.location.href;
      if (targetUrl !== currentUrl) {
        NProgress.start();
      }
    };

    const handleMutation: MutationCallback = () => {
      const anchorElements = document.querySelectorAll('a[href]');
      anchorElements.forEach(anchor => {
        if (anchor.getAttribute('data-nprogress-handled') !== 'true') {
          anchor.addEventListener('click', handleAnchorClick);
          anchor.setAttribute('data-nprogress-handled', 'true');
        }
      });
    };

    const mutationObserver = new MutationObserver(handleMutation);
    mutationObserver.observe(document, { childList: true, subtree: true });

    // Initial run
    handleMutation([]);

    return () => {
        mutationObserver.disconnect();
        // Clean up event listeners from all anchors
        document.querySelectorAll('a[href]').forEach(anchor => {
            anchor.removeEventListener('click', handleAnchorClick);
        });
    }
  }, []);

  return null;
}
