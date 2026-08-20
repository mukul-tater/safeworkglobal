import DashboardLayout from "@/components/layout/DashboardLayout";
import { employerNavGroups, employerProfileMenu } from "@/config/employerNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Star, Trash2, User, FileText, GitCompare, Plus, Handshake, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import EmployerFlowStepper from "@/components/employer/EmployerFlowStepper";
import SendJobRequestDialog from "@/components/employer/SendJobRequestDialog";
import { Send } from "lucide-react";
import { fetchEmployerWorkers, type EmployerWorkerRow } from "@/services/employerWorkerAccessService";

interface ShortlistedWorker {
  id: string;
  worker_id: string;
  list_name: string;
  notes: string | null;
  rating: number | null;
  created_at: string;
  profiles: {
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  };
}

export default function WorkerShortlist() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [shortlistedWorkers, setShortlistedWorkers] = useState<ShortlistedWorker[]>([]);
  const [filteredWorkers, setFilteredWorkers] = useState<ShortlistedWorker[]>([]);
  const [loading, setLoading] = useState(true);
  const [listFilter, setListFilter] = useState<string>("ALL");
  const [lists, setLists] = useState<string[]>([]);
  const [selectedWorker, setSelectedWorker] = useState<ShortlistedWorker | null>(null);
  const [notes, setNotes] = useState("");
  const [rating, setRating] = useState<number>(0);
  const [newListName, setNewListName] = useState("");
  const [compareMode, setCompareMode] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      fetchShortlistedWorkers();
    }
  }, [user]);

  useEffect(() => {
    filterWorkers();
  }, [shortlistedWorkers, listFilter]);

  const fetchShortlistedWorkers = async () => {
    try {
      // Fetch shortlisted workers first
      const { data: shortlistData, error: shortlistError } = await supabase
        .from("shortlisted_workers")
        .select("*")
        .eq("employer_id", user?.id)
        .order("created_at", { ascending: false });

      if (shortlistError) throw shortlistError;

      if (!shortlistData || shortlistData.length === 0) {
        setShortlistedWorkers([]);
        setLists([]);
        setLoading(false);
        return;
      }

      // Worker details come from the access-controlled backend function:
      // only workers assigned to this employer, and only the permitted fields.
      const allowed = await fetchEmployerWorkers({ limit: 500 });
      const allowedById = new Map<string, EmployerWorkerRow>(allowed.map(w => [w.worker_user_id, w]));

      const enrichedWorkers = shortlistData
        .filter(worker => allowedById.has(worker.worker_id))
        .map(worker => {
          const w = allowedById.get(worker.worker_id)!;
          return {
            ...worker,
            profiles: {
              full_name: w.full_name,
              email: w.email ?? "",
              avatar_url: w.avatar_url,
            },
          };
        });

      setShortlistedWorkers(enrichedWorkers as any);
      
      // Extract unique list names
      const uniqueLists = [...new Set(shortlistData?.map(w => w.list_name).filter(Boolean) || [])];
      setLists(uniqueLists as string[]);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterWorkers = () => {
    if (listFilter === "ALL") {
      setFilteredWorkers(shortlistedWorkers);
    } else {
      setFilteredWorkers(shortlistedWorkers.filter(w => w.list_name === listFilter));
    }
  };

  const updateWorker = async () => {
    if (!selectedWorker) return;

    try {
      const { error } = await supabase
        .from("shortlisted_workers")
        .update({ 
          notes,
          rating: rating || null,
          list_name: newListName || selectedWorker.list_name
        })
        .eq("id", selectedWorker.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Worker details updated",
      });

      fetchShortlistedWorkers();
      setSelectedWorker(null);
      setNotes("");
      setRating(0);
      setNewListName("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const removeFromShortlist = async (id: string) => {
    try {
      const { error } = await supabase
        .from("shortlisted_workers")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Worker removed from shortlist",
      });

      fetchShortlistedWorkers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const toggleCompareSelection = (workerId: string) => {
    setSelectedForCompare(prev => 
      prev.includes(workerId) 
        ? prev.filter(id => id !== workerId)
        : prev.length < 4 
          ? [...prev, workerId]
          : prev
    );
  };

  if (loading) {
    return (
      <DashboardLayout navGroups={employerNavGroups} portalLabel="Employer Portal" portalName="Employer Portal" profileMenuItems={employerProfileMenu}>
            <div className="text-center">Loading shortlist...</div>
          </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navGroups={employerNavGroups} portalLabel="Employer Portal" portalName="Employer Portal" profileMenuItems={employerProfileMenu}>
        <EmployerFlowStepper current="shortlist" />
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Worker Shortlist</h1>
            <p className="text-sm text-muted-foreground mt-1">Pick a candidate and click <strong>Hire & Open Escrow</strong> to start the secure payment.</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={compareMode ? "default" : "outline"}
              onClick={() => {
                setCompareMode(!compareMode);
                setSelectedForCompare([]);
              }}
            >
              <GitCompare className="h-4 w-4 mr-2" />
              {compareMode ? "Exit Compare" : "Compare Workers"}
            </Button>
          </div>
        </div>

        <div className="mb-6">
          <Select value={listFilter} onValueChange={setListFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by list" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Lists</SelectItem>
              {lists.map(list => (
                <SelectItem key={list} value={list}>{list}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {compareMode && selectedForCompare.length > 0 && (
          <Card className="p-4 mb-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">
                Selected {selectedForCompare.length} worker(s) for comparison (max 4)
              </p>
              <Button 
                size="sm" 
                disabled={selectedForCompare.length < 2}
                onClick={() => {
                  // Navigate to comparison view
                  toast({
                    title: "Comparison View",
                    description: "Comparison feature coming soon",
                  });
                }}
              >
                View Comparison
              </Button>
            </div>
          </Card>
        )}

        {filteredWorkers.length === 0 ? (
          <Card className="p-12 text-center">
            <Star className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No Workers Shortlisted</h3>
            <p className="text-muted-foreground">
              Add workers to your shortlist from the application review page
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredWorkers.map((worker) => (
              <Card key={worker.id} className="p-6 relative">
                {compareMode && (
                  <div className="absolute top-4 right-4">
                    <input
                      type="checkbox"
                      checked={selectedForCompare.includes(worker.worker_id)}
                      onChange={() => toggleCompareSelection(worker.worker_id)}
                      className="h-5 w-5"
                      disabled={!selectedForCompare.includes(worker.worker_id) && selectedForCompare.length >= 4}
                    />
                  </div>
                )}
                <div className="flex flex-col items-center mb-4">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                    {worker.profiles?.avatar_url ? (
                      <img 
                        src={worker.profiles.avatar_url} 
                        alt="" 
                        className="h-16 w-16 rounded-full object-cover" 
                      />
                    ) : (
                      <User className="h-8 w-8 text-primary" />
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-center mb-1">
                    {worker.profiles?.full_name || "Anonymous"}
                  </h3>
                  <p className="text-sm text-muted-foreground text-center mb-2">
                    {worker.profiles?.email}
                  </p>
                  <Badge variant="outline">{worker.list_name}</Badge>
                </div>

                {worker.rating && (
                  <div className="flex justify-center gap-1 mb-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= worker.rating! ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                )}

                {worker.notes && (
                  <div className="mb-4 p-3 bg-muted rounded-md">
                    <p className="text-sm line-clamp-3">{worker.notes}</p>
                  </div>
                )}

                <Button
                  size="sm"
                  className="w-full mb-2 gap-1"
                  onClick={() => navigate(`/employer/escrow?workerId=${worker.worker_id}`)}
                >
                  <Handshake className="h-4 w-4" />
                  Hire & Open Escrow
                  <Shield className="h-3.5 w-3.5 opacity-80" />
                </Button>
                <SendJobRequestDialog
                  workerId={worker.worker_id}
                  workerName={worker.profiles?.full_name}
                  trigger={
                    <Button variant="outline" size="sm" className="w-full mb-2 gap-1">
                      <Send className="h-4 w-4" />
                      Send Job Request
                    </Button>
                  }
                />
                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          setSelectedWorker(worker);
                          setNotes(worker.notes || "");
                          setRating(worker.rating || 0);
                          setNewListName(worker.list_name);
                        }}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Worker Details</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block">List Name</label>
                          <Input
                            placeholder="e.g., Top Candidates, Interview Round 2"
                            value={newListName}
                            onChange={(e) => setNewListName(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block">Rating</label>
                          <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-6 w-6 cursor-pointer ${
                                  star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                                }`}
                                onClick={() => setRating(star)}
                              />
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block">Notes</label>
                          <Textarea
                            placeholder="Add notes about this candidate..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={6}
                          />
                        </div>
                        <Button onClick={updateWorker} className="w-full">
                          Save Changes
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeFromShortlist(worker.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </DashboardLayout>
  );
}
