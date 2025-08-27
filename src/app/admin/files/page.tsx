
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import FileManager from './components/FileManager';
import { getDirectoryContents } from './actions';
import type { WebDAVFile } from '@/types';

export const dynamic = 'force-dynamic';

// This is a server component that fetches initial data
export default async function FileManagerPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const path = typeof searchParams.path === 'string' ? searchParams.path : '/';
  let initialFiles: WebDAVFile[] = [];
  let initialError: string | null = null;

  try {
    initialFiles = await getDirectoryContents(path);
  } catch (error: any) {
    initialError = error.message;
  }

  return (
    <Suspense fallback={<div className="flex h-full min-h-[50vh] w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <FileManager initialFiles={initialFiles} initialError={initialError} />
    </Suspense>
  );
}
