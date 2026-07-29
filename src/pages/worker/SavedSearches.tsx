import WorkerPortalLayout from "@/components/layout/WorkerPortalLayout";
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Search, Trash2, Play, Bell, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import PortalBreadcrumb from "@/components/PortalBreadcrumb";

interface SavedSearch {
  id: string;
  name: string;
  filters: any;
  alerts_enabled: boolean;
  alert_frequency: string;
  created_at: string;
}

export default function SavedSearches() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    loadSavedSearches();
  }, []);

  const loadSavedSearches = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('saved_searches')
        .select('*')
        .eq('user_id', user.id)
        .eq('search_type', 'jobs')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSearches(data || []);
    } catch (error) {
      console.error('Error loading saved searches:', error);
      toast.error('Failed to load saved searches');
    } finally {
      setLoading(false);
    }
  };

  const handleRunSearch = (filters: any) => {
    // Navigate to jobs page with filters
    navigate('/jobs', { state: { filters } });
  };

  const handleToggleAlerts = async (id: string, enabled: boolean) => {
    try {
      const { error } = await supabase
        .from('saved_searches')
        .update({ alerts_enabled: enabled } as any)
        .eq('id', id);

      if (error) throw error;

      setSearches(searches.map(s => 
        s.id === id ? { ...s, alerts_enabled: enabled } : s
      ));

      toast.success(enabled ? 'Alerts enabled' : 'Alerts disabled');
    } catch (error) {
      console.error('Error updating alerts:', error);
      toast.error('Failed to update alerts');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase
        .from('saved_searches')
        .delete()
        .eq('id', deleteId);

      if (error) throw error;

      setSearches(searches.filter(s => s.id !== deleteId));
      toast.success('Search deleted');
      setDeleteId(null);
    } catch (error) {
      console.error('Error deleting search:', error);
      toast.error('Failed to delete search');
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
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Saved Searches</h1>
            <p className="text-muted-foreground">
              Manage your saved job searches and alerts
            </p>
          </div>

        {searches.length === 0 ? (
          <Card className="p-12 text-center">
            <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No saved searches yet</h3>
            <p className="text-muted-foreground mb-6">
              Save your job searches to quickly access them later and get alerts for new matches
            </p>
            <Button onClick={() => navigate('/jobs')}>
              Browse Jobs
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {searches.map((search) => (
              <Card key={search.id} className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{search.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Created {new Date(search.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteId(search.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>

                {/* Filter Summary */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {search.filters.keyword && (
                    <Badge variant="outline">Keyword: {search.filters.keyword}</Badge>
                  )}
                  {search.filters.country !== 'All Countries' && (
                    <Badge variant="outline">Country: {search.filters.country}</Badge>
                  )}
                  {search.filters.jobCategory !== 'All Categories' && (
                    <Badge variant="outline">Category: {search.filters.jobCategory}</Badge>
                  )}
                  {search.filters.visaSponsorship && (
                    <Badge className="bg-success text-success-foreground">Visa Sponsorship</Badge>
                  )}
                  {search.filters.skills?.length > 0 && (
                    <Badge variant="secondary">
                      {search.filters.skills.length} skill{search.filters.skills.length > 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>

                {/* Alerts Settings */}
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg mb-4">
                  <div className="flex items-center gap-3">
                    <Bell className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <Label htmlFor={`alerts-${search.id}`} className="cursor-pointer">
                        Email Alerts
                      </Label>
                      {search.alerts_enabled && (
                        <p className="text-xs text-muted-foreground">
                          Frequency: {search.alert_frequency}
                        </p>
                      )}
                    </div>
                  </div>
                  <Switch
                    id={`alerts-${search.id}`}
                    checked={search.alerts_enabled}
                    onCheckedChange={(checked) => handleToggleAlerts(search.id, checked)}
                  />
                </div>

                {/* Actions */}
                <Button
                  onClick={() => handleRunSearch(search.filters)}
                  className="w-full"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Run This Search
                </Button>
              </Card>
            ))}
          </div>
        )}

        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Saved Search?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete this saved search and disable any alerts.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </WorkerPortalLayout>
  );
}
