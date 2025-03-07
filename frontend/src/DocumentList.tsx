"use client"

import "./styles/DocumentList.css"
import "./styles/docx-preview.css"
"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import {
  Search,
  FileText,
  ExternalLink,
  Loader2,
  Download,
  Clock,
  FileIcon,
  FolderIcon,
  ChevronRight,
  ChevronDown,
  Upload,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { renderAsync } from "docx-preview"
import { cn } from "@/lib/utils"
import { FileUploadDialog } from "@/components/file-upload-dialog"
import { useToast } from "@/components/ui/use-toast"

interface Document {
  id: number
  title: string
  description: string
  file_path: string
  type?: string
  date_added?: string
  size?: string
  content?: string
  previewLoaded?: boolean
  directory?: string
}

interface Directory {
  name: string
  path: string
  documents: Document[]
  subdirectories: Directory[]
  expanded: boolean
}

export default function DocumentList() {
  const [directories, setDirectories] = useState<Directory[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([])
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [previewLoading, setPreviewLoading] = useState(false)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const docxPreviewRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      const response = await fetch("http://localhost:5000/api/documents")
      const data = await response.json()

      // Process the data from the backend and organize into directories
      const processedData = data.map((doc: Document) => {
        // Extract file extension from title
        const fileExtension = doc.title.split(".").pop()?.toUpperCase() || ""

        // Set the type based on the file extension
        const type = fileExtension

        // Add date_added (we don't have this from the backend, so use current date)
        const date_added = new Date().toLocaleDateString()

        // Extract directory from file_path
        // Assuming file_path is like "/files/dir1/dir2/filename.docx"
        const pathParts = doc.file_path.split("/")
        const directory = pathParts.length > 3 ? `/${pathParts.slice(2, -1).join("/")}` : "/"

        return {
          ...doc,
          type,
          date_added,
          directory,
          size: "Unknown",
          content: "Select to view content",
          previewLoaded: false,
        }
      })

      // Organize documents into directory structure
      const directoryTree: Directory[] = []
      const rootDocuments: Document[] = []

      // First pass: identify all unique directories
      const uniqueDirs = new Set<string>()
      processedData.forEach((doc: Document) => {
        if (doc.directory && doc.directory !== "/") {
          // Split the directory path into parts
          const dirParts = doc.directory.split("/").filter(Boolean)
          let currentPath = ""

          // Add each level of the path
          dirParts.forEach((part) => {
            currentPath += `/${part}`
            uniqueDirs.add(currentPath)
          })
        }
      })

      // Create directory objects
      const dirMap = new Map<string, Directory>()

      // Add root directory
      const rootDir: Directory = {
        name: "Root",
        path: "/",
        documents: [],
        subdirectories: [],
        expanded: true,
      }
      dirMap.set("/", rootDir)
      directoryTree.push(rootDir)

      // Create directory objects for each unique directory
      Array.from(uniqueDirs)
        .sort()
        .forEach((dirPath) => {
          const dirName = dirPath.split("/").pop() || ""
          const dir: Directory = {
            name: dirName,
            path: dirPath,
            documents: [],
            subdirectories: [],
            expanded: false,
          }
          dirMap.set(dirPath, dir)

          // Find parent directory
          const parentPath = dirPath.substring(0, dirPath.lastIndexOf("/")) || "/"
          const parentDir = dirMap.get(parentPath)

          if (parentDir) {
            parentDir.subdirectories.push(dir)
          } else {
            // If parent not found, add to root
            directoryTree.push(dir)
          }
        })

      // Second pass: assign documents to directories
      processedData.forEach((doc: Document) => {
        const dirPath = doc.directory || "/"
        const dir = dirMap.get(dirPath)

        if (dir) {
          dir.documents.push(doc)
        } else {
          // If directory not found, add to root documents
          rootDocuments.push(doc)
        }
      })

      // Add root documents to root directory
      if (rootDocuments.length > 0) {
        const rootDir = dirMap.get("/")
        if (rootDir) {
          rootDir.documents.push(...rootDocuments)
        }
      }

      setDirectories(directoryTree)
      setDocuments(processedData)
      setFilteredDocuments(processedData)
    } catch (error) {
      console.error("Failed to fetch documents:", error)
      setDirectories([])
      setDocuments([])
      setFilteredDocuments([])

      toast({
        title: "Error",
        description: "Failed to load documents. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Filter documents based on search query
    if (searchQuery) {
      const filtered = documents.filter(
        (doc) =>
          doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          doc.description.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      setFilteredDocuments(filtered)
    } else {
      setFilteredDocuments(documents)
    }
  }, [searchQuery, documents])

  const handleSelectDocument = async (doc: Document) => {
    setSelectedDocument(doc)

    // If we haven't loaded the document preview yet, try to fetch and render it
    if (!doc.previewLoaded) {
      setPreviewLoading(true)

      try {
        if (doc.type === "DOCX") {
          // For DOCX files, we'll fetch the file and render it
          const response = await fetch(getFileUrl(doc.file_path))
          const blob = await response.blob()

          // Update the document in our state to mark it as loaded
          const updatedDoc = {
            ...doc,
            previewLoaded: true,
            size: `${(blob.size / (1024 * 1024)).toFixed(2)} MB`, // Calculate actual file size
          }

          setSelectedDocument(updatedDoc)
          setDocuments((prevDocs) => prevDocs.map((d) => (d.id === doc.id ? updatedDoc : d)))
          setFilteredDocuments((prevDocs) => prevDocs.map((d) => (d.id === doc.id ? updatedDoc : d)))

          // Render the DOCX file to the preview container
          if (docxPreviewRef.current) {
            // Clear previous content
            docxPreviewRef.current.innerHTML = ""

            // Render the DOCX file
            await renderAsync(blob, docxPreviewRef.current, docxPreviewRef.current, {
              className: "docx-preview",
              inWrapper: true,
              ignoreWidth: false,
              ignoreHeight: false,
              ignoreFonts: false,
              breakPages: true,
              debug: false,
            })
          }
        } else if (doc.type === "PDF") {
          // For PDF files, we'll just update the state with a message
          const updatedDoc = {
            ...doc,
            content: `This is a PDF file. PDF preview is not available directly in this view. Please use the Open button to view the PDF in a new tab.`,
            previewLoaded: true,
            size: `Unknown`, // We don't have the actual file size
          }

          setSelectedDocument(updatedDoc)
          setDocuments((prevDocs) => prevDocs.map((d) => (d.id === doc.id ? updatedDoc : d)))
          setFilteredDocuments((prevDocs) => prevDocs.map((d) => (d.id === doc.id ? updatedDoc : d)))
        } else {
          // For other file types, just update with a generic message
          const updatedDoc = {
            ...doc,
            content: `This file type (${doc.type}) is not supported for preview. Please use the Open button to view the file in a new tab.`,
            previewLoaded: true,
            size: `Unknown`, // We don't have the actual file size
          }

          setSelectedDocument(updatedDoc)
          setDocuments((prevDocs) => prevDocs.map((d) => (d.id === doc.id ? updatedDoc : d)))
          setFilteredDocuments((prevDocs) => prevDocs.map((d) => (d.id === doc.id ? updatedDoc : d)))
        }
      } catch (error) {
        console.error("Failed to load document preview:", error)

        // Update with an error message
        const updatedDoc = {
          ...doc,
          content: `Error loading document preview. Please try again or use the Open button to view the file in a new tab.`,
          previewLoaded: false,
        }

        setSelectedDocument(updatedDoc)
        setDocuments((prevDocs) => prevDocs.map((d) => (d.id === doc.id ? updatedDoc : d)))
        setFilteredDocuments((prevDocs) => prevDocs.map((d) => (d.id === doc.id ? updatedDoc : d)))

        toast({
          title: "Error",
          description: "Failed to load document preview.",
          variant: "destructive",
        })
      } finally {
        setPreviewLoading(false)
      }
    }
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  const toggleDirectory = (dirPath: string) => {
    setDirectories((prevDirs) => {
      // Create a deep copy of the directory structure
      const updateDirectoryExpanded = (dirs: Directory[]): Directory[] => {
        return dirs.map((dir) => {
          if (dir.path === dirPath) {
            return { ...dir, expanded: !dir.expanded }
          } else {
            return {
              ...dir,
              subdirectories: updateDirectoryExpanded(dir.subdirectories),
            }
          }
        })
      }

      return updateDirectoryExpanded(prevDirs)
    })
  }

  const handleUploadComplete = async (filename: string) => {
    toast({
      title: "Upload Successful",
      description: `${filename} has been uploaded successfully.`,
      variant: "default",
    })

    // Refresh the document list to include the new file
    await fetchDocuments()

    // Try to retrieve the uploaded file from temporary storage
    try {
      const response = await fetch(`http://localhost:5000/retrieve/${filename}`)
      if (response.ok) {
        // Find the newly uploaded document in the list
        const newDoc = documents.find((doc) => doc.title === filename)
        if (newDoc) {
          handleSelectDocument(newDoc)
        }
      }
    } catch (error) {
      console.error("Error retrieving uploaded file:", error)
    }
  }

  const getDocumentTypeColor = (type = "") => {
    switch (type.toUpperCase()) {
      case "PDF":
        return "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
      case "DOCX":
        return "bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300"
      default:
        return "bg-slate-100 text-slate-800 dark:bg-slate-950 dark:text-slate-300"
    }
  }

  const getDocumentTypeIcon = (type = "") => {
    switch (type.toUpperCase()) {
      case "PDF":
        return <FileText className="h-4 w-4 text-rose-600 dark:text-rose-400" />
      case "DOCX":
        return <FileText className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
      default:
        return <FileIcon className="h-4 w-4 text-slate-600 dark:text-slate-400" />
    }
  }

  // Function to get the full URL for a file
  const getFileUrl = (filePath: string) => {
    return `http://localhost:5000${filePath}`
  }

  // Recursive function to render directory tree
  const renderDirectoryTree = (directories: Directory[], level = 0) => {
    return directories.map((dir) => (
      <div key={dir.path} className="directory-tree-item">
        <div
          className={cn(
            "flex items-center py-1.5 px-2 rounded-md cursor-pointer hover:bg-violet-50 dark:hover:bg-violet-900/20",
            level > 0 && "ml-4",
          )}
          onClick={() => toggleDirectory(dir.path)}
        >
          {dir.expanded ? (
            <ChevronDown className="h-4 w-4 mr-1 text-violet-600 dark:text-violet-400" />
          ) : (
            <ChevronRight className="h-4 w-4 mr-1 text-violet-600 dark:text-violet-400" />
          )}
          <FolderIcon className="h-4 w-4 mr-2 text-violet-600 dark:text-violet-400" />
          <span className="font-medium">{dir.name}</span>
          <span className="ml-2 text-xs text-muted-foreground">({dir.documents.length})</span>
        </div>

        {dir.expanded && (
          <div className="ml-6">
            {/* Render documents in this directory */}
            {dir.documents.map((doc) => (
              <div
                key={doc.id}
                className={cn(
                  "flex items-center py-1.5 px-2 rounded-md cursor-pointer hover:bg-violet-50 dark:hover:bg-violet-900/20",
                  selectedDocument?.id === doc.id && "bg-violet-100 dark:bg-violet-900/30",
                )}
                onClick={() => handleSelectDocument(doc)}
              >
                {getDocumentTypeIcon(doc.type)}
                <span className="ml-2 truncate">{doc.title}</span>
              </div>
            ))}

            {/* Render subdirectories */}
            {renderDirectoryTree(dir.subdirectories, level + 1)}
          </div>
        )}
      </div>
    ))
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
            Document Library
          </h1>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setUploadDialogOpen(true)}
              className="bg-violet-50 hover:bg-violet-100 text-violet-700 dark:bg-violet-900/20 dark:hover:bg-violet-900/30 dark:text-violet-300"
              title="Upload Document"
            >
              <Upload className="h-4 w-4" />
            </Button>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search documents..."
                className="pl-8 w-full"
                value={searchQuery}
                onChange={handleSearch}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-6">
          {/* Left Column - Directory Tree */}
          <div className="flex flex-col">
            <Card className="border-violet-200 dark:border-violet-800/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <FolderIcon className="h-5 w-5 mr-2 text-violet-600 dark:text-violet-400" />
                  Directory Structure
                </CardTitle>
                <CardDescription>Browse documents by directory</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-violet-600 dark:text-violet-400" />
                    <span className="ml-2 text-lg">Loading documents...</span>
                  </div>
                ) : directories.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">No directories found.</div>
                ) : (
                  <ScrollArea className="h-[calc(100vh-300px)] pr-4">
                    <div className="directory-tree">{renderDirectoryTree(directories)}</div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Document Preview */}
          <div className="flex flex-col">
            {selectedDocument ? (
              <Card className="h-full border-violet-200 dark:border-violet-800/30">
                <CardHeader className="pb-2 border-b">
                  <div className="flex justify-between items-start">
                    <Badge className={`${getDocumentTypeColor(selectedDocument.type)}`}>{selectedDocument.type}</Badge>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="text-violet-600 dark:text-violet-400" asChild>
                        <a
                          href={getFileUrl(selectedDocument.file_path)}
                          download={selectedDocument.title}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </a>
                      </Button>
                      <Button asChild variant="outline" size="sm" className="text-violet-600 dark:text-violet-400">
                        <a href={getFileUrl(selectedDocument.file_path)} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Open
                        </a>
                      </Button>
                    </div>
                  </div>
                  <CardTitle className="text-xl mt-2 flex items-center gap-2">
                    {getDocumentTypeIcon(selectedDocument.type)}
                    {selectedDocument.title}
                  </CardTitle>
                  <CardDescription>{selectedDocument.description}</CardDescription>
                </CardHeader>
                <CardContent className="p-0 flex-grow">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border-b">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Date Added</p>
                        <p>{selectedDocument.date_added}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileIcon className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Type</p>
                        <p>{selectedDocument.type}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <FolderIcon className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Directory</p>
                        <p className="truncate">{selectedDocument.directory || "/"}</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-semibold mb-2 text-violet-800 dark:text-violet-300">
                      Document Preview
                    </h3>
                    {previewLoading ? (
                      <div className="flex justify-center items-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin text-violet-600 dark:text-violet-400" />
                        <span className="ml-2 text-lg">Loading preview...</span>
                      </div>
                    ) : (
                      <>
                        {selectedDocument.type === "DOCX" ? (
                          <ScrollArea className="h-[calc(100vh-400px)] min-h-[300px] rounded-md border p-4 bg-white dark:bg-slate-900">
                            <div ref={docxPreviewRef} className="docx-container" />
                          </ScrollArea>
                        ) : selectedDocument.type === "PDF" ? (
                          <div className="flex flex-col gap-4">
                            <div className="bg-amber-50 border border-amber-200 rounded-md p-4 text-amber-800 dark:bg-amber-900/20 dark:border-amber-800/30 dark:text-amber-300">
                              <p className="text-sm">
                                <strong>Note:</strong> PDF preview is not available in this view. Please use the Open
                                button to view the PDF in a new tab.
                              </p>
                            </div>
                            <ScrollArea className="h-[calc(100vh-450px)] min-h-[250px] rounded-md border p-4 bg-white dark:bg-slate-900">
                              <pre className="whitespace-pre-wrap font-sans text-sm">{selectedDocument.content}</pre>
                            </ScrollArea>
                          </div>
                        ) : (
                          <ScrollArea className="h-[calc(100vh-400px)] min-h-[300px] rounded-md border p-4 bg-white dark:bg-slate-900">
                            <pre className="whitespace-pre-wrap font-sans text-sm">{selectedDocument.content}</pre>
                          </ScrollArea>
                        )}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="h-full border-violet-200 dark:border-violet-800/30 flex items-center justify-center">
                <CardContent className="py-12 text-center">
                  <div className="mx-auto w-16 h-16 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mb-4">
                    <FileText className="h-8 w-8 text-violet-600 dark:text-violet-400" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No Document Selected</h3>
                  <p className="text-muted-foreground max-w-md">
                    Select a document from the directory tree on the left to view its details here.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* File Upload Dialog */}
      <FileUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onUploadComplete={handleUploadComplete}
      />
    </div>
  )
}

