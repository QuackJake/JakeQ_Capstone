import { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import './styles/DocumentList.css'

interface Document {
  id: number;
  title: string;
  description: string;
  file_path: string;
}

const DocumentList = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);

  useEffect(() => {
    const fetchDocuments = async () => {
      const response = await fetch('http://localhost:5000/api/documents');
      const data = await response.json();
      setDocuments(data);
    };

    fetchDocuments();
  }, []);

  const handleSelectDocument = (doc: Document) => {
    setSelectedDocument(doc);
  };

  return (
    <div className="container">
      <h1>Document Library</h1>

      {/* Table for displaying the document list */}
      <Table>
        <TableCaption>List of Documents</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="text-center text-gray-500">No documents found.</TableCell>
            </TableRow>
          ) : (
            documents.map((doc) => (
              <TableRow
                key={doc.id}
                className="cursor-pointer hover:bg-gray-100 transition duration-200"
                onClick={() => handleSelectDocument(doc)}
              >
                <TableCell>{doc.title}</TableCell>
                <TableCell>{doc.description}</TableCell>
                <TableCell>
                  <a
                    href={doc.file_path}
                    target="_blank"
                    className="table-link"
                  >
                    Open Document
                  </a>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Display the selected document's details */}
      {selectedDocument && (
        <div className="card">
          <h2>Document Details</h2>
          <p><strong>Title:</strong> {selectedDocument.title}</p>
          <p><strong>Description:</strong> {selectedDocument.description}</p>
          <a
            href={selectedDocument.file_path}
            target="_blank"
            className="table-link"
          >
            View or Download Document
          </a>
        </div>
      )}
    </div>
  );
};

export default DocumentList;
