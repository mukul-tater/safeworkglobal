import DashboardLayout from "@/components/layout/DashboardLayout";
import { adminNavGroups, adminProfileMenu } from "@/config/adminNav";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { FileText, Eye, CheckCircle, XCircle, Clock, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface WorkerDocument {
  id: string;
  document_name: string;
  document_type: string;
  file_url: string;
  file_size: number;
  uploaded_at: string;
  verification_status: string;
  worker_id: string;
  verified_at?: string;
  verified_by?: string;
  profiles?: {
    full_name: string;
    email: string;
  };
}

export default function DocumentVerification() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<WorkerDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedDoc, setSelectedDoc] = useState<WorkerDocument | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState("");

  useEffect(() => {
    loadDocuments();
  }, [statusFilter]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      
      // First get documents
      let query = supabase
        .from('worker_documents')
        .select('*')
        .order('uploaded_at', { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq('verification_status', statusFilter);
      }

      const { data: docs, error: docsError } = await query;
      if (docsError) throw docsError;

      // Then get profiles for the workers
      if (docs && docs.length > 0) {
        const workerIds = [...new Set(docs.map(d => d.worker_id))];
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', workerIds);

        if (profilesError) throw profilesError;

        // Merge profiles with documents
        const documentsWithProfiles = docs.map(doc => ({
          ...doc,
          profiles: profiles?.find(p => p.id === doc.worker_id)
        }));

        setDocuments(documentsWithProfiles);
      } else {
        setDocuments([]);
      }
    } catch (error) {
      console.error('Error loading documents:', error);
      toast.error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async (documentId: string, status: 'verified' | 'rejected') => {
    if (!user) return;

    try {
      setVerifying(true);
      const { error } = await supabase
        .from('worker_documents')
        .update({
          verification_status: status,
          verified_by: user.id,
          verified_at: new Date().toISOString(),
        })
        .eq('id', documentId);

      if (error) throw error;

      toast.success(`Document ${status} successfully`);
      setSelectedDoc(null);
      setVerificationNotes("");
      loadDocuments();
    } catch (error) {
      console.error('Error verifying document:', error);
      toast.error("Failed to verify document");
    } finally {
      setVerifying(false);
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const workerName = doc.profiles?.full_name?.toLowerCase() || '';
    const workerEmail = doc.profiles?.email?.toLowerCase() || '';
    const docName = doc.document_name.toLowerCase();
    const docType = doc.document_type.toLowerCase();
    const search = searchTerm.toLowerCase();

    return workerName.includes(search) || 
           workerEmail.includes(search) || 
           docName.includes(search) || 
           docType.includes(search);
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-success/10 text-success hover:bg-success/20">Verified</Badge>;
      case 'rejected':
        return <Badge className="bg-destructive/10 text-destructive hover:bg-destructive/20">Rejected</Badge>;
      default:
        return <Badge className="bg-warning/10 text-warning hover:bg-warning/20">Pending</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <DashboardLayout navGroups={adminNavGroups} portalLabel="Admin Panel" portalName="Admin Panel" profileMenuItems={adminProfileMenu}>
          <div className="mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Document Verification</h1>
            <p className="text-muted-foreground text-sm md:text-base">Review and verify worker documents</p>
          </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by worker name, email, or document..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Documents</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="verified">Verified</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredDocuments.length === 0 ? (
          <Card className="p-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No documents found</h3>
            <p className="text-muted-foreground">
              {searchTerm || statusFilter !== "all" 
                ? "Try adjusting your search or filters"
                : "No worker documents have been uploaded yet"}
            </p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredDocuments.map((doc) => (
              <Card key={doc.id} className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="bg-primary/10 p-4 rounded-lg flex items-center justify-center w-16 h-16 shrink-0">
                    <FileText className="h-8 w-8 text-primary" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 mb-3">
                      <div>
                        <h3 className="font-semibold text-lg mb-1">{doc.document_name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Worker: {doc.profiles?.full_name || 'Unknown'} ({doc.profiles?.email || 'N/A'})
                        </p>
                      </div>
                      {getStatusBadge(doc.verification_status)}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                      <div>
                        <span className="text-muted-foreground">Type:</span>
                        <p className="font-medium">{doc.document_type}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Size:</span>
                        <p className="font-medium">{formatFileSize(doc.file_size)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Uploaded:</span>
                        <p className="font-medium">{formatDate(doc.uploaded_at)}</p>
                      </div>
                      {doc.verified_at && (
                        <div>
                          <span className="text-muted-foreground">Verified:</span>
                          <p className="font-medium">{formatDate(doc.verified_at)}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setSelectedDoc(doc)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Review
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Review Document</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Document Name</Label>
                                <p className="text-sm font-medium">{doc.document_name}</p>
                              </div>
                              <div>
                                <Label>Document Type</Label>
                                <p className="text-sm font-medium">{doc.document_type}</p>
                              </div>
                              <div>
                                <Label>Worker</Label>
                                <p className="text-sm font-medium">{doc.profiles?.full_name}</p>
                              </div>
                              <div>
                                <Label>Status</Label>
                                <div className="mt-1">{getStatusBadge(doc.verification_status)}</div>
                              </div>
                            </div>
                            
                            <div>
                              <Label>Document Preview</Label>
                              <div className="mt-2 border rounded-lg overflow-hidden bg-muted/50">
                                {doc.file_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                  <img 
                                    src={doc.file_url} 
                                    alt={doc.document_name}
                                    className="w-full h-auto max-h-[500px] object-contain"
                                  />
                                ) : (
                                  <div className="p-8 text-center">
                                    <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                                    <p className="text-sm text-muted-foreground mb-4">Preview not available for this file type</p>
                                    <Button variant="outline" asChild>
                                      <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                                        Open Document
                                      </a>
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div>
                              <Label htmlFor="notes">Verification Notes</Label>
                              <Textarea
                                id="notes"
                                placeholder="Add any notes about this document..."
                                value={verificationNotes}
                                onChange={(e) => setVerificationNotes(e.target.value)}
                                className="mt-2"
                              />
                            </div>
                          </div>
                          <DialogFooter className="gap-2">
                            {doc.verification_status === 'pending' && (
                              <>
                                <Button
                                  variant="outline"
                                  onClick={() => handleVerification(doc.id, 'rejected')}
                                  disabled={verifying}
                                  className="text-destructive hover:bg-destructive/10"
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Reject
                                </Button>
                                <Button
                                  onClick={() => handleVerification(doc.id, 'verified')}
                                  disabled={verifying}
                                >
                                  {verifying ? (
                                    <>
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      Verifying...
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Verify
                                    </>
                                  )}
                                </Button>
                              </>
                            )}
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      
                      <Button variant="ghost" size="sm" asChild>
                        <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                          View File
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
        </DashboardLayout>
  );
}
