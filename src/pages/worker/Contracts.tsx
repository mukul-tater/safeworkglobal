import WorkerPortalLayout from "@/components/layout/WorkerPortalLayout";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileSignature, Download, Eye, CheckCircle, Loader2, ExternalLink, History, CalendarClock, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import ContractVersionHistory from "@/components/ContractVersionHistory";
import PortalBreadcrumb from "@/components/PortalBreadcrumb";

interface Contract {
  id: string;
  title: string;
  employer: string;
  salary: string;
  location: string;
  country: string;
  startDate: string | null;
  status: string;
  signedAt: string | null;
  contractUrl: string | null;
  contractSent: boolean;
  contractSigned: boolean;
  contractExpiryDate: string | null;
}

export default function Contracts() {
  const { user } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [signingDialogOpen, setSigningDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isSigning, setIsSigning] = useState(false);

  useEffect(() => {
    if (user) {
      fetchContracts();
    }
  }, [user]);

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("job_formalities")
        .select(`
          id,
          contract_sent,
          contract_signed,
          contract_signed_date,
          contract_url,
          expected_joining_date,
          contract_expiry_date,
          jobs (
            id,
            title,
            location,
            country,
            salary_min,
            salary_max,
            currency,
            employer_profiles (
              company_name
            )
          )
        `)
        .eq("worker_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formattedContracts: Contract[] = (data || []).map((item) => {
        const job = item.jobs as any;
        const employer = job?.employer_profiles;
        const salaryRange = job?.salary_min && job?.salary_max 
          ? `${job.salary_min} - ${job.salary_max} ${job.currency}/month`
          : "Not specified";

        let status = "DRAFT";
        if (item.contract_signed) {
          status = "ACTIVE";
        } else if (item.contract_sent) {
          status = "SENT";
        }

        return {
          id: item.id,
          title: job?.title || "Unknown Position",
          employer: employer?.company_name || "Unknown Employer",
          salary: salaryRange,
          location: job?.location || "",
          country: job?.country || "",
          startDate: item.expected_joining_date,
          status,
          signedAt: item.contract_signed_date,
          contractUrl: item.contract_url,
          contractSent: item.contract_sent || false,
          contractSigned: item.contract_signed || false,
          contractExpiryDate: item.contract_expiry_date,
        };
      });

      setContracts(formattedContracts);
    } catch (error) {
      console.error("Error fetching contracts:", error);
      toast.error("Failed to load contracts");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <Badge className="bg-green-500">Active</Badge>;
      case "SENT":
        return <Badge className="bg-primary">Awaiting Signature</Badge>;
      case "SIGNED":
        return <Badge className="bg-purple-500">Signed</Badge>;
      case "COMPLETED":
        return <Badge variant="secondary">Completed</Badge>;
      case "DRAFT":
        return <Badge variant="outline">Draft</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const openSigningDialog = (contract: Contract) => {
    setSelectedContract(contract);
    setTermsAccepted(false);
    setSigningDialogOpen(true);
  };

  const openPreviewDialog = (contract: Contract) => {
    setSelectedContract(contract);
    setPreviewDialogOpen(true);
  };

  const handleSign = async () => {
    if (!selectedContract || !termsAccepted) return;

    setIsSigning(true);

    try {
      const signedDate = new Date().toISOString();

      const { error } = await supabase
        .from("job_formalities")
        .update({
          contract_signed: true,
          contract_signed_date: signedDate,
        })
        .eq("id", selectedContract.id);

      if (error) throw error;

      setContracts((prev) =>
        prev.map((c) =>
          c.id === selectedContract.id
            ? { ...c, status: "ACTIVE", signedAt: signedDate.split("T")[0], contractSigned: true }
            : c
        )
      );

      setSigningDialogOpen(false);
      toast.success(`Contract signed successfully: ${selectedContract.title}`);
    } catch (error) {
      console.error("Error signing contract:", error);
      toast.error("Failed to sign contract");
    } finally {
      setIsSigning(false);
    }
  };

  const handleDownload = (contract: Contract) => {
    if (contract.contractUrl) {
      window.open(contract.contractUrl, "_blank");
    } else {
      toast.info("Contract document not available yet");
    }
  };

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
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Contracts & Offer Letters</h1>
            <p className="text-muted-foreground">View and manage your employment contracts</p>
          </div>

        {contracts.length === 0 ? (
          <Card className="p-8 text-center">
            <FileSignature className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Contracts Yet</h3>
            <p className="text-muted-foreground">
              Contracts will appear here once your job applications are approved.
            </p>
          </Card>
        ) : (
          <div className="grid gap-6">
            {contracts.map((contract) => (
              <Card key={contract.id} className="p-6">
                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 p-3 rounded-lg">
                    <FileSignature className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-lg mb-1">{contract.title}</h3>
                        <p className="text-sm text-muted-foreground mb-2">{contract.employer}</p>
                      </div>
                      {getStatusBadge(contract.status)}
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Salary</p>
                        <p className="font-medium">{contract.salary}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Location</p>
                        <p className="font-medium">{contract.location}, {contract.country}</p>
                      </div>
                      {contract.startDate && (
                        <div>
                          <p className="text-sm text-muted-foreground">Expected Start Date</p>
                          <p className="font-medium">{contract.startDate}</p>
                        </div>
                      )}
                    </div>

                    {contract.signedAt && (
                      <div className="flex items-center gap-2 mt-4 text-sm text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span>Signed on {new Date(contract.signedAt).toLocaleDateString()}</span>
                      </div>
                    )}

                    {contract.status === "SENT" && contract.contractExpiryDate && (
                      <div className={`flex items-center gap-2 mt-4 text-sm ${
                        new Date(contract.contractExpiryDate) < new Date() 
                          ? "text-destructive" 
                          : new Date(contract.contractExpiryDate) <= new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
                            ? "text-amber-600"
                            : "text-muted-foreground"
                      }`}>
                        {new Date(contract.contractExpiryDate) < new Date() ? (
                          <AlertTriangle className="h-4 w-4" />
                        ) : (
                          <CalendarClock className="h-4 w-4" />
                        )}
                        <span>
                          {new Date(contract.contractExpiryDate) < new Date() 
                            ? `Contract expired on ${new Date(contract.contractExpiryDate).toLocaleDateString()}`
                            : `Sign before ${new Date(contract.contractExpiryDate).toLocaleDateString()}`}
                        </span>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-3 mt-4">
                      <Button variant="outline" onClick={() => openPreviewDialog(contract)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Contract
                      </Button>
                      {contract.contractUrl && (
                        <Button variant="outline" onClick={() => handleDownload(contract)}>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      )}
                      <ContractVersionHistory
                        formalityId={contract.id}
                        isEmployer={false}
                      />
                      {contract.status === "SENT" && (
                        <Button onClick={() => openSigningDialog(contract)}>
                          <FileSignature className="h-4 w-4 mr-2" />
                          Sign Contract
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Contract Signing Dialog */}
        <Dialog open={signingDialogOpen} onOpenChange={setSigningDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Sign Employment Contract</DialogTitle>
              <DialogDescription>
                Review the contract details below and sign to accept the terms.
              </DialogDescription>
            </DialogHeader>

            {selectedContract && (
              <div className="space-y-4">
                <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Position</p>
                    <p className="font-medium">{selectedContract.title}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Employer</p>
                    <p className="font-medium">{selectedContract.employer}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Salary</p>
                      <p className="font-medium">{selectedContract.salary}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Location</p>
                      <p className="font-medium">{selectedContract.location}</p>
                    </div>
                  </div>
                  {selectedContract.startDate && (
                    <div>
                      <p className="text-sm text-muted-foreground">Expected Start Date</p>
                      <p className="font-medium">{selectedContract.startDate}</p>
                    </div>
                  )}
                </div>

                {selectedContract?.contractUrl ? (
                  <div className="border rounded-lg overflow-hidden bg-muted/20">
                    <div className="flex items-center justify-between p-2 bg-muted/50 border-b">
                      <p className="text-sm font-medium">Contract Document</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(selectedContract.contractUrl!, "_blank")}
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Open in New Tab
                      </Button>
                    </div>
                    <iframe
                      src={`${selectedContract.contractUrl}#toolbar=0`}
                      className="w-full h-48 border-0"
                      title="Contract Preview"
                    />
                  </div>
                ) : (
                  <div className="border rounded-lg p-4 bg-muted/20">
                    <p className="text-sm text-muted-foreground mb-2">Contract Document</p>
                    <div className="h-32 border-2 border-dashed border-muted rounded flex items-center justify-center text-muted-foreground text-sm">
                      Contract document not yet uploaded by employer
                    </div>
                  </div>
                )}

                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="terms"
                    checked={termsAccepted}
                    onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                  />
                  <label htmlFor="terms" className="text-sm leading-tight cursor-pointer">
                    I have read and agree to the terms and conditions of this employment contract.
                    I understand that this is a legally binding agreement.
                  </label>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setSigningDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSign} disabled={!termsAccepted || isSigning}>
                {isSigning ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Signing...
                  </>
                ) : (
                  <>
                    <FileSignature className="h-4 w-4 mr-2" />
                    Sign Contract
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Contract Preview Dialog */}
        <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Contract Document</DialogTitle>
              <DialogDescription>
                {selectedContract?.title} - {selectedContract?.employer}
              </DialogDescription>
            </DialogHeader>

            {selectedContract && (
              <div className="space-y-4">
                {selectedContract.contractUrl ? (
                  <div className="border rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between p-3 bg-muted/50 border-b">
                      <div className="flex items-center gap-2">
                        <FileSignature className="h-5 w-5 text-primary" />
                        <span className="font-medium">{selectedContract.title}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(selectedContract.contractUrl!, "_blank")}
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Open in New Tab
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(selectedContract)}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                    <iframe
                      src={selectedContract.contractUrl}
                      className="w-full h-[60vh] border-0"
                      title="Contract Document"
                    />
                  </div>
                ) : (
                  <div className="border rounded-lg p-8 bg-muted/20 text-center">
                    <FileSignature className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-medium mb-2">Contract Document Not Available</h3>
                    <p className="text-sm text-muted-foreground">
                      The employer has not uploaded the contract document yet.
                    </p>
                  </div>
                )}

                {selectedContract.status === "SENT" && (
                  <div className="flex justify-end">
                    <Button onClick={() => {
                      setPreviewDialogOpen(false);
                      openSigningDialog(selectedContract);
                    }}>
                      <FileSignature className="h-4 w-4 mr-2" />
                      Proceed to Sign
                    </Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
        </WorkerPortalLayout>
  );
}
