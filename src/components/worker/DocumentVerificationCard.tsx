import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, CheckCircle, Clock, XCircle, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface Document {
  id: string;
  document_name: string;
  document_type: string;
  verification_status: string;
  uploaded_at: string;
}

interface DocumentVerificationCardProps {
  documents: Document[];
  /** Class 10 marksheet is required only when the worker passed 10th. */
  tenthPass?: boolean | null;
}

export default function DocumentVerificationCard({
  documents,
  tenthPass = null,
}: DocumentVerificationCardProps) {
  const navigate = useNavigate();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <FileText className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge variant="default" className="bg-green-500">Verified</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">Not Uploaded</Badge>;
    }
  };

  const requiredDocuments = [
    'Passport',
    ...(tenthPass === true ? ['Educational Certificate'] : []),
    'Experience Letter',
    'Police Clearance Certificate',
    'Medical Certificate',
  ];

  const documentMap = new Map(documents.map(doc => [doc.document_type, doc]));

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Document Verification</h2>
        <Button onClick={() => navigate('/worker/documents')} size="sm">
          <Upload className="h-4 w-4 mr-2" />
          Upload Documents
        </Button>
      </div>
      <div className="space-y-3">
        {requiredDocuments.map((docType) => {
          const doc = documentMap.get(docType);
          return (
            <div key={docType} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                {getStatusIcon(doc?.verification_status || 'not_uploaded')}
                <div>
                  <p className="font-medium">{docType}</p>
                  {doc && (
                    <p className="text-xs text-muted-foreground">
                      Uploaded {new Date(doc.uploaded_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
              {getStatusBadge(doc?.verification_status || 'not_uploaded')}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
