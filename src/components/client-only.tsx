
'use client';

import { useState, useEffect, type ReactNode } from 'react';

// This component is a solution to the "Text content does not match server-rendered HTML"
// error in Next.js. It ensures that components that depend on client-side state
// (like localStorage) are only rendered on the client, after the initial server render.
export function ClientOnly({ children }: { children: ReactNode }) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    // Return null on the server and during the initial client-side render
    // to prevent hydration mismatch.
    return null;
  }

  return <>{children}</>;
}
