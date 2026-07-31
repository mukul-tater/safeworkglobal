import DashboardLayout from "@/components/layout/DashboardLayout";
import { adminNavGroups, adminProfileMenu } from "@/config/adminNav";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Shield, 
  Search, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye,
  Loader2,
  FileText,
  User,
  AlertTriangle
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { displayableEmail } from "@/lib/workerAuthEmail";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface WorkerWithDocuments {
  user_id: string;
  full_name: string | null;
  email: string;
  nationality: string | null;
  ecr_status: string | null;
  documents: {
    id: string;
    document_type: string;
    document_name: string;
    verification_status: string;
    file_url: string;
    uploaded_at: string;
  }[];
}

export default function IDVerification() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [workers, setWorkers] = useState<WorkerWithDocuments[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedWorker, setSelectedWorker] = useState<WorkerWithDocuments | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<WorkerWithDocuments['documents'][0] | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState("");

  useEffect(() => {
    loadWorkers();
  }, []);

  const loadWorkers = async () => {
    try {
      setLoading(true);

      // Get all worker profiles with ID documents
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, email');

      if (profileError) throw profileError;

      // Get worker profiles
      const { data: workerProfiles, error: wpError } = await supabase
        .from('worker_profiles')
        .select('user_id, nationality, ecr_status');

      if (wpError) throw wpError;

      // Get all ID documents
      const { data: documents, error: docError } = await supabase
        .from('worker_documents')
        .select('*')
        .in('document_type', ['Aadhar', 'PAN Card', 'Passport', 'Identity Card', 'Driving License'])
        .order('uploaded_at', { ascending: false });

      if (docError) throw docError;

      // Combine data
      const workersMap = new Map<string, WorkerWithDocuments>();

      documents?.forEach(doc => {
        const profile = profiles?.find(p => p.id === doc.worker_id);
        const workerProfile = workerProfiles?.find(wp => wp.user_id === doc.worker_id);

        if (!workersMap.has(doc.worker_id)) {
          workersMap.set(doc.worker_id, {
            user_id: doc.worker_id,
            full_name: profile?.full_name || null,
            email: displayableEmail(profile?.email) || '',
            nationality: workerProfile?.nationality || null,
            ecr_status: workerProfile?.ecr_status || null,
            documents: []
          });
        }

        workersMap.get(doc.worker_id)?.documents.push({
          id: doc.id,
          document_type: doc.document_type,
          document_name: doc.document_name,
          verification_status: doc.verification_status || 'pending',
          file_url: doc.file_url,
          uploaded_at: doc.uploaded_at
        });
      });

      setWorkers(Array.from(workersMap.values()));
    } catch (error) {
      console.error('Error loading workers:', error);
      toast.error("Failed to load verification data");
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async (docId: string, status: 'verified' | 'rejected') => {
    if (!user) return;

    try {
      setVerifying(true);

      const { error } = await supabase
        .from('worker_documents')
        .update({
          verification_status: status,
          verified_by: user.id,
          verified_at: new Date().toISOString()
        })
        .eq('id', docId);

      if (error) throw error;

      toast.success(`Document ${status === 'verified' ? 'verified' : 'rejected'} successfully`);
      setSelectedDoc(null);
      setVerificationNotes("");
      loadWorkers();
    } catch (error) {
      console.error('Error updating verification:', error);
      toast.error("Failed to update verification status");
    } finally {
      setVerifying(false);
    }
  };

  const filteredWorkers = workers.filter(worker => {
    const matchesSearch = 
      worker.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      worker.email?.toLowerCase().includes(searchTerm.toLowerCase());

    if (statusFilter === "all") return matchesSearch;
    
    const hasPendingDocs = worker.documents.some(d => d.verification_status === 'pending');
    const hasVerifiedDocs = worker.documents.some(d => d.verification_status === 'verified');
    const hasRejectedDocs = worker.documents.some(d => d.verification_status === 'rejected');

    if (statusFilter === "pending") return matchesSearch && hasPendingDocs;
    if (statusFilter === "verified") return matchesSearch && hasVerifiedDocs && !hasPendingDocs;
    if (statusFilter === "rejected") return matchesSearch && hasRejectedDocs;

    return matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-success/10 text-success border-success/20">Verified</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Stats
  const totalDocs = workers.reduce((acc, w) => acc + w.documents.length, 0);
  const pendingDocs = workers.reduce((acc, w) => acc + w.documents.filter(d => d.verification_status === 'pending').length, 0);
  const verifiedDocs = workers.reduce((acc, w) => acc + w.documents.filter(d => d.verification_status === 'verified').length, 0);

  return (
    <DashboardLayout navGroups={adminNavGroups} portalLabel="Admin Panel" portalName="Admin Panel" profileMenuItems={adminProfileMenu}>
          <h1 className="text-2xl md:text-3xl font-bold mb-6">ID Verification</h1>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalDocs}</p>
                  <p className="text-sm text-muted-foreground">Total Documents</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/10">
                  <Clock className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pendingDocs}</p>
                  <p className="text-sm text-muted-foreground">Pending Review</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <CheckCircle className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{verifiedDocs}</p>
                  <p className="text-sm text-muted-foreground">Verified</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{workers.length}</p>
                  <p className="text-sm text-muted-foreground">Workers</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Filters */}
          <Card className="p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Workers</SelectItem>
                  <SelectItem value="pending">Pending Review</SelectItem>
                  <SelectItem value="verified">Fully Verified</SelectItem>
                  <SelectItem value="rejected">Has Rejections</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>

          {/* Workers List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredWorkers.length === 0 ? (
            <Card className="p-12 text-center">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No ID documents to verify</h3>
              <p className="text-muted-foreground">
                Workers will appear here when they upload ID documents
              </p>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Worker</TableHead>
                    <TableHead>Nationality</TableHead>
                    <TableHead>Documents</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredWorkers.map((worker) => {
                    const pendingCount = worker.documents.filter(d => d.verification_status === 'pending').length;
                    const verifiedCount = worker.documents.filter(d => d.verification_status === 'verified').length;
                    
                    return (
                      <TableRow key={worker.user_id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{worker.full_name || 'Unknown'}</p>
                            <p className="text-sm text-muted-foreground">{worker.email || 'No contact email yet'}</p>
                          </div>
                        </TableCell>
                        <TableCell>{worker.nationality || 'Not specified'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span>{worker.documents.length} documents</span>
                            {pendingCount > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                {pendingCount} pending
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {verifiedCount === worker.documents.length ? (
                            <Badge className="bg-success/10 text-success">All Verified</Badge>
                          ) : pendingCount > 0 ? (
                            <Badge variant="secondary">Pending Review</Badge>
                          ) : (
                            <Badge variant="outline">Partial</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedWorker(worker)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Review
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          )}

          {/* Worker Documents Dialog */}
          <Dialog open={!!selectedWorker} onOpenChange={() => setSelectedWorker(null)}>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  ID Documents - {selectedWorker?.full_name || 'Worker'}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm">
                    <span className="font-medium">Email:</span> {selectedWorker?.email || 'Not provided yet'}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Nationality:</span> {selectedWorker?.nationality || 'Not specified'}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">ECR Status:</span> {selectedWorker?.ecr_status || 'Not checked'}
                  </p>
                </div>

                <div className="space-y-3">
                  {selectedWorker?.documents.map((doc) => (
                    <Card key={doc.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{doc.document_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {doc.document_type} • Uploaded {formatDate(doc.uploaded_at)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(doc.verification_status)}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(doc.file_url, '_blank')}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {doc.verification_status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleVerification(doc.id, 'verified')}
                                disabled={verifying}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Verify
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => setSelectedDoc(doc)}
                                disabled={verifying}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Rejection Dialog */}
          <Dialog open={!!selectedDoc} onOpenChange={() => setSelectedDoc(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Reject Document
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <p className="text-muted-foreground">
                  Are you sure you want to reject "{selectedDoc?.document_name}"?
                </p>
                <div>
                  <label className="text-sm font-medium">Reason for rejection (optional)</label>
                  <Textarea
                    value={verificationNotes}
                    onChange={(e) => setVerificationNotes(e.target.value)}
                    placeholder="Explain why this document is being rejected..."
                    className="mt-2"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setSelectedDoc(null)}>
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => selectedDoc && handleVerification(selectedDoc.id, 'rejected')}
                    disabled={verifying}
                  >
                    {verifying ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Rejecting...
                      </>
                    ) : (
                      'Confirm Rejection'
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </DashboardLayout>
  );
}
