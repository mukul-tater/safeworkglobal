import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  History,
  FileText,
  Upload,
  ExternalLink,
  Loader2,
  Plus,
  X,
  FileUp,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ContractVersion {
  id: string;
  version_number: number;
  contract_url: string;
  change_summary: string | null;
  is_current: boolean;
  created_at: string;
  uploaded_by: string;
}

interface ContractVersionHistoryProps {
  formalityId: string;
  isEmployer?: boolean;
  onVersionUploaded?: () => void;
}

export default function ContractVersionHistory({
  formalityId,
  isEmployer = false,
  onVersionUploaded,
}: ContractVersionHistoryProps) {
  const { user } = useAuth();
  const [versions, setVersions] = useState<ContractVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [changeSummary, setChangeSummary] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchVersions();
  }, [formalityId]);

  const fetchVersions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("contract_versions")
        .select("*")
        .eq("formality_id", formalityId)
        .order("version_number", { ascending: false });

      if (error) throw error;
      setVersions(data || []);
    } catch (error) {
      console.error("Error fetching contract versions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        toast.error("Please select a PDF file");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUploadNewVersion = async () => {
    if (!selectedFile || !user) return;

    setIsUploading(true);

    try {
      // Upload file
      const fileExt = selectedFile.name.split(".").pop();
      const fileName = `${formalityId}-v${versions.length + 1}-${Date.now()}.${fileExt}`;
      const filePath = `contracts/${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("worker-documents")
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("worker-documents")
        .getPublicUrl(filePath);

      // Create version record
      const { error: insertError } = await supabase
        .from("contract_versions")
        .insert({
          formality_id: formalityId,
          version_number: versions.length + 1,
          contract_url: urlData.publicUrl,
          change_summary: changeSummary || null,
          uploaded_by: user.id,
          is_current: true,
        });

      if (insertError) throw insertError;

      // Update job_formalities with latest contract URL
      await supabase
        .from("job_formalities")
        .update({ contract_url: urlData.publicUrl })
        .eq("id", formalityId);

      toast.success("New contract version uploaded successfully");
      setUploadDialogOpen(false);
      setSelectedFile(null);
      setChangeSummary("");
      fetchVersions();
      onVersionUploaded?.();
    } catch (error) {
      console.error("Error uploading contract version:", error);
      toast.error("Failed to upload contract version");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setDialogOpen(true)}
        className="gap-2"
      >
        <History className="h-4 w-4" />
        Version History {versions.length > 0 && `(${versions.length})`}
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Contract Version History
            </DialogTitle>
            <DialogDescription>
              View all versions and amendments of this contract
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {isEmployer && (
              <Button onClick={() => setUploadDialogOpen(true)} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Upload New Version
              </Button>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : versions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No contract versions uploaded yet</p>
              </div>
            ) : (
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-3">
                  {versions.map((version) => (
                    <div
                      key={version.id}
                      className={`p-4 rounded-lg border ${
                        version.is_current
                          ? "border-primary bg-primary/5"
                          : "border-border"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="bg-muted p-2 rounded-lg">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                Version {version.version_number}
                              </span>
                              {version.is_current && (
                                <Badge className="bg-primary text-primary-foreground">
                                  Current
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {new Date(version.created_at).toLocaleDateString()} at{" "}
                              {new Date(version.created_at).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(version.contract_url, "_blank")}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                      {version.change_summary && (
                        <div className="mt-3 text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                          <span className="font-medium">Changes: </span>
                          {version.change_summary}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Upload New Version Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload New Contract Version</DialogTitle>
            <DialogDescription>
              Upload an amended contract. This will be marked as the current version.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Contract Document (PDF)</Label>
              {selectedFile ? (
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedFile(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-2 pb-2">
                    <FileUp className="h-6 w-6 text-muted-foreground mb-1" />
                    <p className="text-sm text-muted-foreground">
                      Click to upload PDF
                    </p>
                    <p className="text-xs text-muted-foreground">Max 10MB</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="application/pdf"
                    onChange={handleFileSelect}
                  />
                </label>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="change-summary">Change Summary</Label>
              <Textarea
                id="change-summary"
                placeholder="Describe what changed in this version..."
                value={changeSummary}
                onChange={(e) => setChangeSummary(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUploadNewVersion}
              disabled={!selectedFile || isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Version {versions.length + 1}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
