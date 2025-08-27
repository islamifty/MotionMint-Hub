
'use client';

import { Suspense, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import NProgress from 'nprogress';

// This is the actual component that uses the hooks.
// It will be rendered only on the client, inside the Suspense boundary.
function ProgressBar() {
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

// This is the exported component. It wraps the ProgressBar in a Suspense boundary.
// This is safe to include in layouts because the part that uses the hook is suspended.
export function NextNProgress() {
  return (
    <Suspense fallback={null}>
      <ProgressBar />
    </Suspense>
  );
}
