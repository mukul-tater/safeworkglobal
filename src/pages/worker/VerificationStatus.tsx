import WorkerPortalLayout from "@/components/layout/WorkerPortalLayout";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  FileText, 
  Shield,
  Upload,
  Loader2,
  Info
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import PortalBreadcrumb from "@/components/PortalBreadcrumb";
import ECRStatusCard from "@/components/worker/ECRStatusCard";

interface VerificationData {
  documents: {
    total: number;
    verified: number;
    pending: number;
    rejected: number;
  };
  profile: {
    hasPassport: boolean;
    nationality: string | null;
    ecrStatus: string;
    ecrCategory: string | null;
  };
  idVerification: {
    aadhaarVerified: boolean;
    panVerified: boolean;
    passportVerified: boolean;
  };
}

export default function VerificationStatus() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [verificationData, setVerificationData] = useState<VerificationData>({
    documents: { total: 0, verified: 0, pending: 0, rejected: 0 },
    profile: { hasPassport: false, nationality: null, ecrStatus: 'not_checked', ecrCategory: null },
    idVerification: { aadhaarVerified: false, panVerified: false, passportVerified: false }
  });

  useEffect(() => {
    loadVerificationData();
  }, [user]);

  const loadVerificationData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Load documents
      const { data: documents, error: docError } = await supabase
        .from('worker_documents')
        .select('document_type, verification_status')
        .eq('worker_id', user.id);

      if (docError) throw docError;

      // Load worker profile
      const { data: workerProfile, error: profileError } = await supabase
        .from('worker_profiles')
        .select('has_passport, nationality, ecr_status, ecr_category')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      // Calculate document stats
      const docStats = documents?.reduce((acc, doc) => {
        acc.total++;
        if (doc.verification_status === 'verified') acc.verified++;
        else if (doc.verification_status === 'pending') acc.pending++;
        else if (doc.verification_status === 'rejected') acc.rejected++;
        return acc;
      }, { total: 0, verified: 0, pending: 0, rejected: 0 }) || { total: 0, verified: 0, pending: 0, rejected: 0 };

      // Check ID verification status
      const idDocs = documents || [];
      const aadhaarDoc = idDocs.find(d => d.document_type === 'Aadhar');
      const panDoc = idDocs.find(d => d.document_type === 'PAN Card');
      const passportDoc = idDocs.find(d => d.document_type === 'Passport');

      setVerificationData({
        documents: docStats,
        profile: {
          hasPassport: workerProfile?.has_passport || false,
          nationality: workerProfile?.nationality || null,
          ecrStatus: workerProfile?.ecr_status || 'not_checked',
          ecrCategory: workerProfile?.ecr_category || null
        },
        idVerification: {
          aadhaarVerified: aadhaarDoc?.verification_status === 'verified',
          panVerified: panDoc?.verification_status === 'verified',
          passportVerified: passportDoc?.verification_status === 'verified'
        }
      });
    } catch (error) {
      console.error('Error loading verification data:', error);
      toast.error("Failed to load verification status");
    } finally {
      setLoading(false);
    }
  };

  const getOverallVerificationScore = () => {
    let score = 0;
    const { idVerification, documents, profile } = verificationData;
    
    if (idVerification.aadhaarVerified) score += 25;
    if (idVerification.panVerified) score += 25;
    if (idVerification.passportVerified) score += 25;
    if (profile.ecrStatus === 'not_required' || profile.ecrStatus === 'exempted') score += 25;
    else if (profile.ecrStatus === 'required' && profile.ecrCategory) score += 15;
    
    return Math.min(score, 100);
  };

  const verificationScore = getOverallVerificationScore();

  if (loading) {
    return (
      <WorkerPortalLayout>
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </WorkerPortalLayout>
    );
  }

  return (
    <WorkerPortalLayout>
          <PortalBreadcrumb />
          <h1 className="text-2xl md:text-3xl font-bold mb-6">Verification Status</h1>

          {/* Overall Verification Score */}
          <Card className="p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold">Overall Verification Score</h2>
                <p className="text-sm text-muted-foreground">Complete all verifications to improve your profile visibility</p>
              </div>
              <div className="text-3xl font-bold text-primary">{verificationScore}%</div>
            </div>
            <Progress value={verificationScore} className="h-3" />
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-2xl font-bold">{verificationData.documents.total}</p>
                <p className="text-xs text-muted-foreground">Total Documents</p>
              </div>
              <div className="p-3 bg-success/10 rounded-lg">
                <p className="text-2xl font-bold text-success">{verificationData.documents.verified}</p>
                <p className="text-xs text-muted-foreground">Verified</p>
              </div>
              <div className="p-3 bg-warning/10 rounded-lg">
                <p className="text-2xl font-bold text-warning">{verificationData.documents.pending}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
              <div className="p-3 bg-destructive/10 rounded-lg">
                <p className="text-2xl font-bold text-destructive">{verificationData.documents.rejected}</p>
                <p className="text-xs text-muted-foreground">Rejected</p>
              </div>
            </div>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            {/* ID Verification Card */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">ID Verification</h2>
                  <p className="text-sm text-muted-foreground">Government ID documents</p>
                </div>
              </div>

              <div className="space-y-4">
                <VerificationItem
                  label="Aadhaar Card"
                  verified={verificationData.idVerification.aadhaarVerified}
                  description="12-digit unique identification number"
                />
                <VerificationItem
                  label="PAN Card"
                  verified={verificationData.idVerification.panVerified}
                  description="Permanent Account Number"
                />
                <VerificationItem
                  label="Passport"
                  verified={verificationData.idVerification.passportVerified}
                  description="International travel document"
                />
              </div>

              <Button 
                className="w-full mt-6" 
                variant="outline"
                onClick={() => navigate('/worker/documents')}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload ID Documents
              </Button>
            </Card>

            {/* ECR Status Card */}
            <ECRStatusCard
              ecrStatus={verificationData.profile.ecrStatus}
              ecrCategory={verificationData.profile.ecrCategory}
              nationality={verificationData.profile.nationality}
              hasPassport={verificationData.profile.hasPassport}
            />
          </div>

          {/* Document Verification Status */}
          <Card className="p-6 mt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Document Verification</h2>
                  <p className="text-sm text-muted-foreground">All uploaded documents status</p>
                </div>
              </div>
              <Button onClick={() => navigate('/worker/documents')}>
                View All Documents
              </Button>
            </div>

            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">How verification works</p>
                  <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                    <li>• Upload your documents in the Documents section</li>
                    <li>• Our team reviews and verifies each document within 24-48 hours</li>
                    <li>• You'll receive notifications about verification status changes</li>
                    <li>• Verified documents improve your profile visibility to employers</li>
                  </ul>
                </div>
              </div>
            </div>
          </Card>
        </WorkerPortalLayout>
  );
}

function VerificationItem({ 
  label, 
  verified, 
  description 
}: { 
  label: string; 
  verified: boolean; 
  description: string;
}) {
  return (
    <div className="flex items-center justify-between p-3 border rounded-lg">
      <div className="flex items-center gap-3">
        {verified ? (
          <CheckCircle className="h-5 w-5 text-success" />
        ) : (
          <Clock className="h-5 w-5 text-muted-foreground" />
        )}
        <div>
          <p className="font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <Badge variant={verified ? "default" : "secondary"}>
        {verified ? "Verified" : "Not Verified"}
      </Badge>
    </div>
  );
}
