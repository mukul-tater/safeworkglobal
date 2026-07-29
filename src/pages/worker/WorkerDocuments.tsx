import DashboardLayout from "@/components/layout/DashboardLayout";
import { workerNavGroups, workerProfileMenu } from "@/config/workerNav";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Loader2, Upload, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import PortalBreadcrumb from "@/components/PortalBreadcrumb";

interface WorkerDocument {
  id: string;
  document_name: string;
  document_type: string;
  file_url: string;
  file_size: number;
  uploaded_at: string;
  verification_status: string;
}

export default function WorkerDocuments() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<WorkerDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [documentType, setDocumentType] = useState<string>("");
  const [documentName, setDocumentName] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    loadDocuments();
  }, [user]);

  const loadDocuments = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('worker_documents')
        .select('*')
        .eq('worker_id', user.id)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error loading documents:', error);
      toast.error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!user || !selectedFile || !documentType || !documentName) {
      toast.error("Please fill in all fields and select a file");
      return;
    }

    try {
      setUploading(true);

      // Upload file to storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('worker-documents')
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      // Get signed URL for private bucket
      const { data: urlData, error: urlError } = await supabase.storage
        .from('worker-documents')
        .createSignedUrl(fileName, 31536000); // 1 year expiry

      if (urlError) {
        console.error('URL error:', urlError);
        throw urlError;
      }

      // Save document record
      const { error: dbError } = await supabase
        .from('worker_documents')
        .insert({
          worker_id: user.id,
          document_name: documentName,
          document_type: documentType,
          file_url: urlData.signedUrl,
          file_size: selectedFile.size,
        });

      if (dbError) {
        console.error('Database error:', dbError);
        throw dbError;
      }

      toast.success("Document uploaded successfully!");
      setShowUploadDialog(false);
      setSelectedFile(null);
      setDocumentName("");
      setDocumentType("");
      loadDocuments();
    } catch (error: any) {
      console.error('Error uploading document:', error);
      toast.error(error?.message || "Failed to upload document");
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = (fileUrl: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    link.click();
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;

    try {
      const { error } = await supabase
        .from('worker_documents')
        .delete()
        .eq('id', documentId);

      if (error) throw error;
      
      toast.success("Document deleted successfully!");
      loadDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error("Failed to delete document");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <DashboardLayout navGroups={workerNavGroups} portalLabel="Worker Portal" portalName="Worker Portal" profileMenuItems={workerProfileMenu}>
          <PortalBreadcrumb />
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl md:text-3xl font-bold">My Documents</h1>
            <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Document
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload New Document</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="documentName">Document Name *</Label>
                    <Input
                      id="documentName"
                      value={documentName}
                      onChange={(e) => setDocumentName(e.target.value)}
                      placeholder="e.g., Passport front"
                    />
                  </div>
                  <div>
                    <Label htmlFor="documentType">Document Type *</Label>
                    <Select value={documentType} onValueChange={setDocumentType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select document type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Certification">Certification</SelectItem>
                        <SelectItem value="Aadhar">Aadhar Card</SelectItem>
                        <SelectItem value="Passport">Passport</SelectItem>
                        <SelectItem value="Visa">Visa</SelectItem>
                        <SelectItem value="Driving License">Driving License</SelectItem>
                        <SelectItem value="PAN Card">PAN Card</SelectItem>
                        <SelectItem value="Identity Card">Identity Card</SelectItem>
                        <SelectItem value="Work Permit">Work Permit / LMIA</SelectItem>
                        <SelectItem value="Educational Certificate">Educational Qualification Proof</SelectItem>
                        <SelectItem value="Experience Certificate">Experience Certificate</SelectItem>
                        <SelectItem value="Professional License">Professional License</SelectItem>
                        <SelectItem value="Job Offer Letter">Job Offer Letter / Employment Contract</SelectItem>
                        <SelectItem value="Employer Sponsorship">Employer Sponsorship Documents</SelectItem>
                        <SelectItem value="Medical Exam">Medical Exam Results</SelectItem>
                        <SelectItem value="Police Clearance">Police Clearance Certificate</SelectItem>
                        <SelectItem value="Tax Returns">Tax Returns / Salary Slips</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="file">File *</Label>
                    <Input
                      id="file"
                      type="file"
                      onChange={handleFileSelect}
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Max file size: 10MB. Supported formats: PDF, DOC, DOCX, JPG, PNG
                    </p>
                  </div>
                  <Button 
                    onClick={handleUpload} 
                    disabled={uploading || !selectedFile || !documentType || !documentName}
                    className="w-full"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      'Upload Document'
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : documents.length === 0 ? (
            <Card className="p-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No documents uploaded yet</h3>
              <p className="text-muted-foreground mb-4">
                Upload your documents to complete your profile and apply for jobs
              </p>
              <Button onClick={() => setShowUploadDialog(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload Your First Document
              </Button>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {documents.map((doc) => (
                <Card key={doc.id} className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-3 rounded-lg">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold mb-1 truncate">{doc.document_name}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{doc.document_type}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{formatDate(doc.uploaded_at)}</span>
                        <span>•</span>
                        <span>{formatFileSize(doc.file_size)}</span>
                      </div>
                      <div className="mt-2">
                        <span className={`text-xs px-2 py-1 rounded ${
                          doc.verification_status === 'verified' 
                            ? 'bg-success/10 text-success' 
                            : doc.verification_status === 'pending'
                            ? 'bg-warning/10 text-warning'
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {doc.verification_status === 'verified' ? 'Verified' : 
                           doc.verification_status === 'pending' ? 'Pending Verification' : 
                           'Not Verified'}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleDownload(doc.file_url, doc.document_name)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleDelete(doc.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </DashboardLayout>
  );
}
