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
  AlertCircle, 
  Clock, 
  Eye,
  Loader2,
  User,
  Plane,
  FileCheck
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
import { Label } from "@/components/ui/label";

interface WorkerECRData {
  user_id: string;
  full_name: string | null;
  email: string;
  nationality: string | null;
  ecr_status: string | null;
  ecr_category: string | null;
  has_passport: boolean;
  passport_verified: boolean;
  education_proof_verified: boolean;
}

const ECR_CATEGORIES = [
  { value: 'ECNR', label: 'ECNR (No Clearance Required)', description: 'Passport holders with matriculation or above' },
  { value: 'ECR', label: 'ECR (Clearance Required)', description: 'Requires emigration clearance from POE' },
  { value: 'EXEMPTED', label: 'Exempted', description: 'Not applicable (non-Indian nationals)' },
];

export default function ECRManagement() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [workers, setWorkers] = useState<WorkerECRData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedWorker, setSelectedWorker] = useState<WorkerECRData | null>(null);
  const [updating, setUpdating] = useState(false);
  const [newEcrStatus, setNewEcrStatus] = useState<string>("");
  const [newEcrCategory, setNewEcrCategory] = useState<string>("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    loadWorkers();
  }, []);

  const loadWorkers = async () => {
    try {
      setLoading(true);

      // Get all profiles
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, email');

      if (profileError) throw profileError;

      // Get worker profiles
      const { data: workerProfiles, error: wpError } = await supabase
        .from('worker_profiles')
        .select('user_id, nationality, ecr_status, ecr_category, has_passport');

      if (wpError) throw wpError;

      // Get passport documents
      const { data: passportDocs, error: docError } = await supabase
        .from('worker_documents')
        .select('worker_id, verification_status, document_type')
        .in('document_type', ['Passport', 'Educational Certificate']);

      if (docError) throw docError;

      // Combine data
      const workersData: WorkerECRData[] = workerProfiles?.map(wp => {
        const profile = profiles?.find(p => p.id === wp.user_id);
        const passportDoc = passportDocs?.find(d => d.worker_id === wp.user_id && d.document_type === 'Passport');
        const educationDoc = passportDocs?.find(d => d.worker_id === wp.user_id && d.document_type === 'Educational Certificate');

        return {
          user_id: wp.user_id,
          full_name: profile?.full_name || null,
          email: displayableEmail(profile?.email) || '',
          nationality: wp.nationality,
          ecr_status: wp.ecr_status,
          ecr_category: wp.ecr_category,
          has_passport: wp.has_passport || false,
          passport_verified: passportDoc?.verification_status === 'verified',
          education_proof_verified: educationDoc?.verification_status === 'verified'
        };
      }) || [];

      // Filter to only show Indian nationals or those needing ECR check
      const indianWorkers = workersData.filter(w => 
        w.nationality === 'India' || 
        w.nationality?.toLowerCase().includes('india') ||
        w.ecr_status === 'not_checked' ||
        !w.ecr_status
      );

      setWorkers(indianWorkers);
    } catch (error) {
      console.error('Error loading workers:', error);
      toast.error("Failed to load ECR data");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateECR = async () => {
    if (!user || !selectedWorker || !newEcrStatus) return;

    try {
      setUpdating(true);

      const { error } = await supabase
        .from('worker_profiles')
        .update({
          ecr_status: newEcrStatus,
          ecr_category: newEcrCategory || null
        })
        .eq('user_id', selectedWorker.user_id);

      if (error) throw error;

      // Create compliance check record
      await supabase.from('compliance_checks').insert({
        entity_id: selectedWorker.user_id,
        entity_type: 'worker',
        check_type: 'ecr_verification',
        status: 'completed',
        findings: {
          ecr_status: newEcrStatus,
          ecr_category: newEcrCategory,
          notes: notes,
          verified_by: user.id,
          verified_at: new Date().toISOString()
        },
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString()
      });

      toast.success("ECR status updated successfully");
      setSelectedWorker(null);
      setNewEcrStatus("");
      setNewEcrCategory("");
      setNotes("");
      loadWorkers();
    } catch (error) {
      console.error('Error updating ECR:', error);
      toast.error("Failed to update ECR status");
    } finally {
      setUpdating(false);
    }
  };

  const filteredWorkers = workers.filter(worker => {
    const matchesSearch = 
      worker.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      worker.email?.toLowerCase().includes(searchTerm.toLowerCase());

    if (statusFilter === "all") return matchesSearch;
    if (statusFilter === "not_checked") return matchesSearch && (!worker.ecr_status || worker.ecr_status === 'not_checked');
    if (statusFilter === "required") return matchesSearch && worker.ecr_status === 'required';
    if (statusFilter === "not_required") return matchesSearch && (worker.ecr_status === 'not_required' || worker.ecr_status === 'exempted');

    return matchesSearch;
  });

  const getECRBadge = (status: string | null, category: string | null) => {
    if (!status || status === 'not_checked') {
      return <Badge variant="secondary">Not Checked</Badge>;
    }
    if (status === 'not_required' || status === 'exempted') {
      return <Badge className="bg-success/10 text-success">ECNR</Badge>;
    }
    if (status === 'required') {
      return <Badge variant="outline" className="border-warning text-warning">ECR</Badge>;
    }
    return <Badge variant="secondary">{category || status}</Badge>;
  };

  // Stats
  const notChecked = workers.filter(w => !w.ecr_status || w.ecr_status === 'not_checked').length;
  const ecrRequired = workers.filter(w => w.ecr_status === 'required').length;
  const ecnr = workers.filter(w => w.ecr_status === 'not_required' || w.ecr_status === 'exempted').length;

  return (
    <DashboardLayout navGroups={adminNavGroups} portalLabel="Admin Panel" portalName="Admin Panel" profileMenuItems={adminProfileMenu}>
          <h1 className="text-2xl md:text-3xl font-bold mb-6">ECR Management</h1>

          {/* Info Card */}
          <Card className="p-4 mb-6 bg-primary/5 border-primary/20">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">About ECR (Emigration Check Required)</p>
                <p className="text-sm text-muted-foreground mt-1">
                  ECR applies to Indian passport holders who have not completed matriculation (10th grade). 
                  They require emigration clearance from the Protector of Emigrants before traveling to 
                  ECR countries (UAE, Qatar, Saudi Arabia, etc.) for employment.
                </p>
              </div>
            </div>
          </Card>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{workers.length}</p>
                  <p className="text-sm text-muted-foreground">Total Workers</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/10">
                  <Clock className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{notChecked}</p>
                  <p className="text-sm text-muted-foreground">Not Checked</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-500/10">
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{ecrRequired}</p>
                  <p className="text-sm text-muted-foreground">ECR Required</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <CheckCircle className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{ecnr}</p>
                  <p className="text-sm text-muted-foreground">ECNR / Exempted</p>
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
                  <SelectItem value="not_checked">Not Checked</SelectItem>
                  <SelectItem value="required">ECR Required</SelectItem>
                  <SelectItem value="not_required">ECNR / Exempted</SelectItem>
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
              <Plane className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No workers to review</h3>
              <p className="text-muted-foreground">
                Indian nationals will appear here for ECR verification
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
                    <TableHead>ECR Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredWorkers.map((worker) => (
                    <TableRow key={worker.user_id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{worker.full_name || 'Unknown'}</p>
                          <p className="text-sm text-muted-foreground">{worker.email || 'No contact email yet'}</p>
                        </div>
                      </TableCell>
                      <TableCell>{worker.nationality || 'Not specified'}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-sm">
                            {worker.passport_verified ? (
                              <CheckCircle className="h-3 w-3 text-success" />
                            ) : (
                              <Clock className="h-3 w-3 text-muted-foreground" />
                            )}
                            <span>Passport</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            {worker.education_proof_verified ? (
                              <CheckCircle className="h-3 w-3 text-success" />
                            ) : (
                              <Clock className="h-3 w-3 text-muted-foreground" />
                            )}
                            <span>Education Proof</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getECRBadge(worker.ecr_status, worker.ecr_category)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedWorker(worker);
                            setNewEcrStatus(worker.ecr_status || '');
                            setNewEcrCategory(worker.ecr_category || '');
                          }}
                        >
                          <FileCheck className="h-4 w-4 mr-2" />
                          Update ECR
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}

          {/* Update ECR Dialog */}
          <Dialog open={!!selectedWorker} onOpenChange={() => setSelectedWorker(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Update ECR Status</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="font-medium">{selectedWorker?.full_name}</p>
                  <p className="text-sm text-muted-foreground">{selectedWorker?.email || 'Not provided yet'}</p>
                  <p className="text-sm text-muted-foreground">Nationality: {selectedWorker?.nationality}</p>
                </div>

                <div className="space-y-2">
                  <Label>ECR Status</Label>
                  <Select value={newEcrStatus} onValueChange={setNewEcrStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select ECR status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not_required">ECNR - No Clearance Required</SelectItem>
                      <SelectItem value="required">ECR - Clearance Required</SelectItem>
                      <SelectItem value="exempted">Exempted (Non-Indian)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>ECR Category</Label>
                  <Select value={newEcrCategory} onValueChange={setNewEcrCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {ECR_CATEGORIES.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add verification notes..."
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setSelectedWorker(null)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpdateECR}
                    disabled={updating || !newEcrStatus}
                  >
                    {updating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      'Update ECR Status'
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </DashboardLayout>
  );
}
