"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Folder,
  File as FileIcon,
  Home,
  Plus,
  UploadCloud,
  MoreVertical,
  Trash2,
  Download,
  FolderPlus,
  Loader2,
} from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

import { getDirectoryContents, createDirectory, deleteFileOrFolder, getThumbnailBaseUrl } from "./actions";
import type { WebDAVFile } from "@/types";


type UploadingFile = {
  name: string;
  progress: number;
  size: number;
};

export default function FileManagerPage() {
  const [files, setFiles] = useState<WebDAVFile[]>([]);
  const [currentPath, setCurrentPath] = useState("/");
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [newFolderName, setNewFolderName] = useState("");
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<WebDAVFile | null>(null);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [thumbnailBaseUrl, setThumbnailBaseUrl] = useState('');

  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const path = searchParams.get("path") || "/";
    setCurrentPath(path);
    fetchFiles(path);
    
    async function loadBaseUrl() {
        const url = await getThumbnailBaseUrl();
        setThumbnailBaseUrl(url);
    }
    loadBaseUrl();
  }, [searchParams]);

  const fetchFiles = async (path: string) => {
    setIsLoading(true);
    try {
      const contents = await getDirectoryContents(path);
      setFiles(contents);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
      setFiles([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName) return;
    startTransition(async () => {
      const path = (currentPath + "/" + newFolderName).replace(/\/+/g, "/");
      const result = await createDirectory(path);
       if (!result.success) {
            toast({ variant: 'destructive', title: 'Error', description: result.message });
        } else {
            toast({ title: 'Success', description: 'Folder created.' });
            setNewFolderName("");
            setIsCreateFolderOpen(false);
            fetchFiles(currentPath);
        }
    });
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    startTransition(async () => {
      await deleteFileOrFolder(itemToDelete.filename);
      toast({ title: 'Success', description: `${itemToDelete.basename} has been deleted.` });
      setItemToDelete(null);
      fetchFiles(currentPath);
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles) return;

    const newUploads: UploadingFile[] = Array.from(selectedFiles).map(file => ({
      name: file.name,
      progress: 0,
      size: file.size,
    }));
    setUploadingFiles(prev => [...prev, ...newUploads]);

    for (const file of selectedFiles) {
      const path = (currentPath + "/" + file.name).replace(/\/+/g, "/");
      
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/files/upload", true);
      
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const progress = (e.loaded / e.total) * 100;
          setUploadingFiles(prev => prev.map(f => f.name === file.name ? { ...f, progress } : f));
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
           setUploadingFiles(prev => prev.filter(f => f.name !== file.name));
           fetchFiles(currentPath); // Refresh list on success
           toast({ title: "Upload Successful", description: `${file.name} has been uploaded.` });
        } else {
            const response = JSON.parse(xhr.responseText);
            toast({ variant: "destructive", title: "Upload Failed", description: response.error || "An unknown error occurred." });
            setUploadingFiles(prev => prev.map(f => f.name === file.name ? { ...f, progress: -1 } : f)); // Mark as failed
        }
      };
      
      xhr.onerror = () => {
        toast({ variant: "destructive", title: "Network Error", description: `Could not upload ${file.name}.` });
        setUploadingFiles(prev => prev.map(f => f.name === file.name ? { ...f, progress: -1 } : f));
      };

      const formData = new FormData();
      formData.append("file", file);
      formData.append("path", path);
      xhr.send(formData);
    }
     // Clear the file input
    event.target.value = '';
  };

  const pathSegments = currentPath.split("/").filter(Boolean);

  const getFileIcon = (filename: string) => {
     if (!thumbnailBaseUrl) return null;
     const thumbUrl = `${thumbnailBaseUrl}/apps/files/api/v1/thumbnail/256/256/${filename}`;
     return thumbUrl;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-2xl font-bold">File Manager</h1>
            <p className="text-muted-foreground">Browse and manage your Nextcloud files.</p>
        </div>
        <div className="flex gap-2">
            <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
                <DialogTrigger asChild>
                    <Button size="sm"><FolderPlus className="mr-2 h-4 w-4" /> New Folder</Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Folder</DialogTitle>
                    </DialogHeader>
                    <Input 
                        placeholder="Folder name"
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                    />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateFolderOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreateFolder} disabled={isPending}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <Button size="sm" asChild>
                <label htmlFor="file-upload">
                    <UploadCloud className="mr-2 h-4 w-4" /> Upload File
                    <input id="file-upload" type="file" multiple className="hidden" onChange={handleFileUpload} />
                </label>
            </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/admin/files?path=/" className="flex items-center gap-2">
                  <Home className="h-4 w-4" /> Home
                </BreadcrumbLink>
              </BreadcrumbItem>
              {pathSegments.map((segment, index) => {
                const href = `/admin/files?path=/${pathSegments.slice(0, index + 1).join("/")}`;
                return (
                  <React.Fragment key={segment}>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbLink href={href}>{segment}</BreadcrumbLink>
                    </BreadcrumbItem>
                  </React.Fragment>
                );
              })}
            </BreadcrumbList>
          </Breadcrumb>
        </CardHeader>
        <CardContent>
            {uploadingFiles.length > 0 && (
                <div className="mb-4 space-y-2">
                    <h3 className="text-sm font-medium">Uploading...</h3>
                    {uploadingFiles.map(file => (
                        <div key={file.name}>
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>{file.name}</span>
                                <span>{Math.round(file.progress)}%</span>
                            </div>
                            <Progress value={file.progress} className="h-2" />
                        </div>
                    ))}
                </div>
            )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Last Modified</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={4} className="text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></TableCell></TableRow>
              ) : files.length === 0 ? (
                 <TableRow><TableCell colSpan={4} className="text-center h-24">This folder is empty.</TableCell></TableRow>
              ) : (
                files.map((file) => (
                  <TableRow key={file.filename}>
                    <TableCell className="font-medium">
                      {file.type === "directory" ? (
                        <Link href={`/admin/files?path=${file.filename}`} className="flex items-center gap-2 hover:underline">
                          <Folder className="h-5 w-5 text-primary" /> {file.basename}
                        </Link>
                      ) : (
                        <span className="flex items-center gap-2">
                          <FileIcon className="h-5 w-5 text-muted-foreground" /> {file.basename}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {file.type !== "directory" && file.size
                        ? `${(file.size / 1024 / 1024).toFixed(2)} MB`
                        : "--"}
                    </TableCell>
                    <TableCell>{new Date(file.lastmod).toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          {file.type !== "directory" && (
                            <DropdownMenuItem asChild>
                                 <a href={`/api/files/download?path=${encodeURIComponent(file.filename)}`} download={file.basename}>
                                    <Download className="mr-2 h-4 w-4" /> Download
                                </a>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => setItemToDelete(file)} className="text-red-500">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete "{itemToDelete?.basename}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
