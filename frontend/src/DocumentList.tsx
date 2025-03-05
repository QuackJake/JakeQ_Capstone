"use client"

import "./styles/DocumentList.css"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { Search, FileText, ExternalLink, Loader2, SortAsc, SortDesc, Download, Clock, FileIcon } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { ScrollArea } from "@/components/ui/scroll-area"
import { renderAsync } from "docx-preview"

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
}

export default function DocumentList() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([])
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8
  const [previewLoading, setPreviewLoading] = useState(false)
  const docxPreviewRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setLoading(true)
        const response = await fetch("http://localhost:5000/api/documents")
        const data = await response.json()

        // Process the data from the backend
        const processedData = data.map((doc: Document) => {
          // Extract file extension from title
          const fileExtension = doc.title.split(".").pop()?.toUpperCase() || ""

          // Set the type based on the file extension
          const type = fileExtension

          // Add date_added (we don't have this from the backend, so use current date)
          const date_added = new Date().toLocaleDateString()

          return {
            ...doc,
            type,
            date_added,
            // We'll set size and content when a document is selected
            size: "Unknown",
            content: "Select to view content",
            previewLoaded: false,
          }
        })

        setDocuments(processedData)
        setFilteredDocuments(processedData)
      } catch (error) {
        console.error("Failed to fetch documents:", error)
        // If API fails, show an empty state instead of mock data
        setDocuments([])
        setFilteredDocuments([])
      } finally {
        setLoading(false)
      }
    }

    fetchDocuments()
  }, [])

  useEffect(() => {
    // Filter documents based on search query
    const filtered = documents.filter(
      (doc) =>
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.description.toLowerCase().includes(searchQuery.toLowerCase()),
    )

    // Sort documents
    const sorted = [...filtered].sort((a, b) => {
      if (sortOrder === "asc") {
        return a.title.localeCompare(b.title)
      } else {
        return b.title.localeCompare(a.title)
      }
    })

    setFilteredDocuments(sorted)
    setCurrentPage(1) // Reset to first page when filtering
  }, [searchQuery, documents, sortOrder])

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
      } finally {
        setPreviewLoading(false)
      }
    }
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  const toggleSortOrder = () => {
    setSortOrder((prevOrder) => (prevOrder === "asc" ? "desc" : "asc"))
  }

  // Calculate pagination
  const totalPages = Math.ceil(filteredDocuments.length / itemsPerPage)
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredDocuments.slice(indexOfFirstItem, indexOfLastItem)

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

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
            Document Library
          </h1>

          <div className="flex items-center gap-2 w-full md:w-auto">
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
            <Button
              variant="outline"
              size="icon"
              onClick={toggleSortOrder}
              title={sortOrder === "asc" ? "Sort Descending" : "Sort Ascending"}
            >
              {sortOrder === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-6">
          {/* Left Column - Document List */}
          <div className="flex flex-col">
            <Tabs defaultValue="list" className="w-full">
              <TabsList className="mb-4 bg-violet-50 dark:bg-violet-950/30">
                <TabsTrigger
                  value="list"
                  className="data-[state=active]:bg-violet-100 data-[state=active]:text-violet-900 dark:data-[state=active]:bg-violet-900/30 dark:data-[state=active]:text-violet-100"
                >
                  List View
                </TabsTrigger>
                <TabsTrigger
                  value="grid"
                  className="data-[state=active]:bg-violet-100 data-[state=active]:text-violet-900 dark:data-[state=active]:bg-violet-900/30 dark:data-[state=active]:text-violet-100"
                >
                  Grid View
                </TabsTrigger>
              </TabsList>

              <TabsContent value="list" className="space-y-4">
                <Card className="border-violet-200 dark:border-violet-800/30">
                  <CardContent className="p-0">
                    {loading ? (
                      <div className="flex justify-center items-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin text-violet-600 dark:text-violet-400" />
                        <span className="ml-2 text-lg">Loading documents...</span>
                      </div>
                    ) : (
                      <div className="rounded-md border border-violet-200 dark:border-violet-800/30">
                        <Table>
                          <TableHeader className="bg-violet-50 dark:bg-violet-950/30">
                            <TableRow className="hover:bg-violet-100/50 dark:hover:bg-violet-900/20">
                              <TableHead>Type</TableHead>
                              <TableHead>Title</TableHead>
                              <TableHead className="hidden md:table-cell">Date</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {currentItems.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={3} className="text-center h-24 text-muted-foreground">
                                  No documents found matching your search.
                                </TableCell>
                              </TableRow>
                            ) : (
                              currentItems.map((doc) => (
                                <TableRow
                                  key={doc.id}
                                  className={`cursor-pointer transition-colors hover:bg-violet-50 dark:hover:bg-violet-950/20 ${
                                    selectedDocument?.id === doc.id ? "bg-violet-100 dark:bg-violet-900/30" : ""
                                  }`}
                                  onClick={() => handleSelectDocument(doc)}
                                >
                                  <TableCell>
                                    <Badge className={`${getDocumentTypeColor(doc.type)}`}>{doc.type}</Badge>
                                  </TableCell>
                                  <TableCell className="font-medium">
                                    <div className="flex items-center gap-2">
                                      {getDocumentTypeIcon(doc.type)}
                                      <span className="truncate max-w-[180px]">{doc.title}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="hidden md:table-cell">{doc.date_added}</TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                  {!loading && totalPages > 1 && (
                    <CardFooter className="flex justify-center py-4">
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                              className={`${currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"} text-violet-600 dark:text-violet-400`}
                            />
                          </PaginationItem>

                          {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                            let pageNumber = i + 1

                            // Adjust page numbers for pagination with ellipsis
                            if (totalPages > 5 && currentPage > 3) {
                              if (i === 0) {
                                pageNumber = 1
                              } else if (i === 1) {
                                return (
                                  <PaginationItem key="ellipsis-start">
                                    <PaginationEllipsis />
                                  </PaginationItem>
                                )
                              } else {
                                pageNumber = Math.min(currentPage + i - 2, totalPages)
                              }
                            }

                            return (
                              <PaginationItem key={pageNumber}>
                                <PaginationLink
                                  isActive={currentPage === pageNumber}
                                  onClick={() => setCurrentPage(pageNumber)}
                                  className={
                                    currentPage === pageNumber ? "bg-violet-600 text-white dark:bg-violet-800" : ""
                                  }
                                >
                                  {pageNumber}
                                </PaginationLink>
                              </PaginationItem>
                            )
                          })}

                          <PaginationItem>
                            <PaginationNext
                              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                              className={`${currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"} text-violet-600 dark:text-violet-400`}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </CardFooter>
                  )}
                </Card>
              </TabsContent>

              <TabsContent value="grid" className="space-y-4">
                {loading ? (
                  <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-violet-600 dark:text-violet-400" />
                    <span className="ml-2 text-lg">Loading documents...</span>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {currentItems.length === 0 ? (
                        <div className="col-span-full text-center py-12 text-muted-foreground">
                          No documents found matching your search.
                        </div>
                      ) : (
                        currentItems.map((doc) => (
                          <Card
                            key={doc.id}
                            className={`cursor-pointer transition-all hover:shadow-md border-violet-200 dark:border-violet-800/30 ${
                              selectedDocument?.id === doc.id
                                ? "ring-2 ring-violet-500 dark:ring-violet-400 bg-violet-50 dark:bg-violet-900/20"
                                : ""
                            }`}
                            onClick={() => handleSelectDocument(doc)}
                          >
                            <CardHeader className="pb-2">
                              <div className="flex justify-between items-start">
                                <Badge className={`${getDocumentTypeColor(doc.type)}`}>{doc.type}</Badge>
                                <span className="text-sm text-muted-foreground">{doc.date_added}</span>
                              </div>
                              <CardTitle className="text-lg mt-2 flex items-center gap-2">
                                {getDocumentTypeIcon(doc.type)}
                                <span className="truncate">{doc.title}</span>
                              </CardTitle>
                              <CardDescription className="line-clamp-2 h-10">{doc.description}</CardDescription>
                            </CardHeader>
                            <CardFooter className="pt-2 flex justify-end">
                              <Button
                                variant="ghost"
                                size="sm"
                                asChild
                                onClick={(e) => {
                                  e.stopPropagation()
                                }}
                              >
                                <a
                                  href={getFileUrl(doc.file_path)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300"
                                >
                                  <ExternalLink className="h-4 w-4 mr-1" />
                                  Open
                                </a>
                              </Button>
                            </CardFooter>
                          </Card>
                        ))
                      )}
                    </div>

                    {totalPages > 1 && (
                      <div className="flex justify-center py-4">
                        <Pagination>
                          <PaginationContent>
                            <PaginationItem>
                              <PaginationPrevious
                                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                className={`${currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"} text-violet-600 dark:text-violet-400`}
                              />
                            </PaginationItem>

                            {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                              let pageNumber = i + 1

                              // Adjust page numbers for pagination with ellipsis
                              if (totalPages > 5 && currentPage > 3) {
                                if (i === 0) {
                                  pageNumber = 1
                                } else if (i === 1) {
                                  return (
                                    <PaginationItem key="ellipsis-start">
                                      <PaginationEllipsis />
                                    </PaginationItem>
                                  )
                                } else {
                                  pageNumber = Math.min(currentPage + i - 2, totalPages)
                                }
                              }

                              return (
                                <PaginationItem key={pageNumber}>
                                  <PaginationLink
                                    isActive={currentPage === pageNumber}
                                    onClick={() => setCurrentPage(pageNumber)}
                                    className={
                                      currentPage === pageNumber ? "bg-violet-600 text-white dark:bg-violet-800" : ""
                                    }
                                  >
                                    {pageNumber}
                                  </PaginationLink>
                                </PaginationItem>
                              )
                            })}

                            <PaginationItem>
                              <PaginationNext
                                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                className={`${currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"} text-violet-600 dark:text-violet-400`}
                              />
                            </PaginationItem>
                          </PaginationContent>
                        </Pagination>
                      </div>
                    )}
                  </>
                )}
              </TabsContent>
            </Tabs>
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border-b">
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
                    Select a document from the list on the left to view its details here.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

