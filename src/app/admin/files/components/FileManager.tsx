
"use client";

import { useState, useTransition, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  Folder,
  File,
  Loader2,
  FolderPlus,
  Upload,
  MoreVertical,
  Trash2,
  Download,
  Share2,
  Copy,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  getDirectoryContents,
  createDirectory,
  deleteFileOrFolder,
} from '../actions';
import type { WebDAVFile } from '@/types';

function FileActions({
  item,
  currentPath,
  onActionComplete,
}: {
  item: WebDAVFile;
  currentPath: string;
  onActionComplete: () => void;
}) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const fullPath = `${currentPath}${item.basename}`;

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deleteFileOrFolder(fullPath);
    if (result.success) {
      toast({
        title: 'Success',
        description: `${item.basename} has been deleted.`,
      });
      onActionComplete();
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete the item.',
      });
    }
    setIsDeleting(false);
    setIsAlertOpen(false);
  };

  const handleShare = async () => {
    // In Nextcloud, the "share link" is just the direct download link.
    const baseUrl = window.location.origin;
    // We need to properly handle paths that start with or without a slash
    const normalizedPath = fullPath.startsWith('/') ? fullPath : `/${fullPath}`;
    const shareableLink = `${baseUrl}/api/files/download?path=${encodeURIComponent(normalizedPath)}`;
    try {
      await navigator.clipboard.writeText(shareableLink);
      toast({
        title: 'Link Copied',
        description: 'A shareable download link has been copied to your clipboard.',
      });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not copy link to clipboard.',
      });
    }
    setIsShareOpen(false);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {item.type === 'file' && (
            <DropdownMenuItem asChild>
              <a href={`/api/files/download?path=${encodeURIComponent(fullPath)}`} download>
                <Download className="mr-2 h-4 w-4" />
                Download
              </a>
            </DropdownMenuItem>
          )}
          {item.type === 'file' && (
             <DropdownMenuItem onSelect={() => setIsShareOpen(true)}>
                <Share2 className="mr-2 h-4 w-4" />
                Share
             </DropdownMenuItem>
          )}
          <DropdownMenuItem
            className="text-red-600"
            onSelect={() => setIsAlertOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{item.basename}". This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

       <Dialog open={isShareOpen} onOpenChange={setIsShareOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Share File</DialogTitle>
                <DialogDescription>
                    Copy the link below to share a direct download link for this file.
                </DialogDescription>
            </DialogHeader>
            <div className="flex items-center space-x-2">
                <Input value={`${window.location.origin}/api/files/download?path=${encodeURIComponent(fullPath)}`} readOnly />
                <Button onClick={handleShare} size="sm" className="px-3">
                    <span className="sr-only">Copy</span>
                    <Copy className="h-4 w-4" />
                </Button>
            </div>
             <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="secondary">Close</Button>
                </DialogClose>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    </>
  );
}

function FileManagerComponent({
  initialFiles,
  initialError,
}: {
  initialFiles: WebDAVFile[];
  initialError: string | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const path = searchParams.get('path') || '/';
  const { toast } = useToast();

  const [files, setFiles] = useState(initialFiles);
  const [error, setError] = useState(initialError);
  const [newFolderName, setNewFolderName] = useState('');
  const [uploadingFile, setUploadingFile] = useState<File | null>(null);

  const [isPending, startTransition] = useTransition();

  const currentPath = useMemo(() => (path.endsWith('/') ? path : `${path}/`), [
    path,
  ]);
  const pathSegments = useMemo(() => path.split('/').filter(Boolean), [path]);

  const refreshFiles = () => {
    startTransition(async () => {
      try {
        const newFiles = await getDirectoryContents(path);
        setFiles(newFiles);
        setError(null);
      } catch (e: any) {
        setFiles([]);
        setError(e.message);
      }
    });
  };
  
  // This effect syncs the server-fetched data with the client state
  // It's important for handling browser back/forward navigation correctly
  useState(() => {
    setFiles(initialFiles);
    setError(initialError);
  });


  const handleCreateFolder = async () => {
    if (!newFolderName) return;
    const result = await createDirectory(`${currentPath}${newFolderName}`);
    if (result.success) {
      toast({
        title: 'Folder Created',
        description: `Folder "${newFolderName}" was created successfully.`,
      });
      setNewFolderName('');
      refreshFiles();
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.message || 'Could not create the folder.',
      });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(file);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('path', `${currentPath}${file.name}`);

    try {
      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      });
      if (response.ok) {
        toast({
          title: 'Upload Successful',
          description: `File "${file.name}" has been uploaded.`,
        });
        refreshFiles();
      } else {
        throw new Error('Upload failed');
      }
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Upload Error',
        description: 'Failed to upload the file.',
      });
    } finally {
      setUploadingFile(null);
      // Reset file input
      e.target.value = '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>File Manager</CardTitle>
            <CardDescription>
              Browse, upload, and manage your Nextcloud files.
            </CardDescription>
            <Breadcrumb className="mt-2">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href="/admin/files?path=/">/</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                {pathSegments.map((segment, index) => (
                  <BreadcrumbItem key={index}>
                    <BreadcrumbSeparator />
                    <BreadcrumbLink asChild>
                      <Link
                        href={`/admin/files?path=/${pathSegments
                          .slice(0, index + 1)
                          .join('/')}`}
                      >
                        {segment}
                      </Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="flex items-center gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <FolderPlus className="mr-2 h-4 w-4" /> New Folder
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Folder</DialogTitle>
                  <DialogDescription>
                    Enter a name for your new folder in{' '}
                    <code>{currentPath}</code>.
                  </DialogDescription>
                </DialogHeader>
                <Input
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Folder Name"
                />
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="ghost">Cancel</Button>
                  </DialogClose>
                  <DialogClose asChild>
                    <Button onClick={handleCreateFolder}>Create</Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button size="sm" asChild>
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="mr-2 h-4 w-4" /> Upload File
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={!!uploadingFile}
                />
              </label>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isPending || uploadingFile ? (
          <div className="flex h-64 items-center justify-center text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            <span>{uploadingFile ? `Uploading ${uploadingFile.name}...` : 'Loading...'}</span>
          </div>
        ) : error ? (
          <div className="text-destructive">{error}</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Last Modified</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {files.map((item) => (
                <TableRow key={item.filename}>
                  <TableCell className="font-medium">
                    {item.type === 'directory' ? (
                      <Link
                        href={`/admin/files?path=${currentPath}${item.basename}`}
                        className="flex items-center gap-2 hover:underline"
                      >
                        <Folder className="h-4 w-4 text-primary" />{' '}
                        {item.basename}
                      </Link>
                    ) : (
                      <span className="flex items-center gap-2">
                        <File className="h-4 w-4" /> {item.basename}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{item.type}</TableCell>
                  <TableCell>
                    {item.size ? `${(item.size / 1024).toFixed(2)} KB` : '--'}
                  </TableCell>
                  <TableCell>
                    {new Date(item.lastmod).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <FileActions
                      item={item}
                      currentPath={currentPath}
                      onActionComplete={refreshFiles}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

// This is the main component exported from this file.
// It wraps the client component that uses searchParams in a Suspense boundary.
export default function FileManager({
  initialFiles,
  initialError,
}: {
  initialFiles: WebDAVFile[];
  initialError: string | null;
}) {
  return (
    <Suspense fallback={<Loader2 className="h-8 w-8 animate-spin" />}>
      <FileManagerComponent
        initialFiles={initialFiles}
        initialError={initialError}
      />
    </Suspense>
  );
}
