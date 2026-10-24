import DashboardLayout from "@/components/layout/DashboardLayout";
import { adminNavGroups, adminProfileMenu } from "@/config/adminNav";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, Search, UserX, UserCheck, ExternalLink, FileText, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { displayableEmail } from "@/lib/workerAuthEmail";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { adminSetUserEnabled, adminSetUserRole } from "@/services/AdminService";
import AdminDeleteUserButton from "@/components/admin/AdminDeleteUserButton";
import AdminUserMediaSection from "@/components/admin/AdminUserMediaSection";

const BANNED_ACTIONS = new Set(["banned", "blocked", "suspended"]);

interface User {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: string;
  kind: string;
  kindLabel: string;
  is_banned: boolean;
  joined: string;
}

const KIND_OPTIONS = [
  { value: "all", label: "All accounts" },
  { value: "worker", label: "Worker" },
  { value: "employer", label: "Employer" },
  { value: "emitra", label: "e-Mitra" },
  { value: "trade_test", label: "Trade test" },
  { value: "ra", label: "RA" },
  { value: "partner", label: "Other partner" },
  { value: "agent", label: "Agent" },
  { value: "interviewer", label: "Interviewer" },
  { value: "admin", label: "Admin" },
] as const;

function accountKind(role: string, partnerTypeCode: string | null): { kind: string; kindLabel: string } {
  const code = partnerTypeCode?.toUpperCase() ?? "";
  if (code === "SEN") return { kind: "emitra", kindLabel: "e-Mitra" };
  if (code === "SSVN") return { kind: "trade_test", kindLabel: "Trade test" };
  if (code === "SRN") return { kind: "ra", kindLabel: "RA" };
  if (code === "ITI") return { kind: "partner", kindLabel: "ITI partner" };
  if (code === "CONSULTANT") return { kind: "partner", kindLabel: "Consultant" };
  if (code === "SEN_GLOBAL") return { kind: "partner", kindLabel: "Employer network" };
  if (role === "partner") return { kind: "partner", kindLabel: "Partner" };
  if (role === "employer") return { kind: "employer", kindLabel: "Employer" };
  if (role === "admin") return { kind: "admin", kindLabel: "Admin" };
  if (role === "agent") return { kind: "agent", kindLabel: "Agent" };
  if (role === "interviewer") return { kind: "interviewer", kindLabel: "Interviewer" };
  return { kind: "worker", kindLabel: "Worker" };
}

interface UserMediaItem {
  id: string;
  title: string;
  type: "image" | "video" | "pdf" | "document";
  url: string;
  category: string;
  status?: string | null;
  uploadedAt?: string | null;
}

function documentStoragePath(urlOrPath: string): string {
  if (!urlOrPath) return "";
  const marker = "/worker-documents/";
  const idx = urlOrPath.indexOf(marker);
  if (idx === -1) return urlOrPath.split("?")[0];
  let path = urlOrPath.substring(idx + marker.length);
  const query = path.indexOf("?");
  if (query !== -1) path = path.substring(0, query);
  try {
    return decodeURIComponent(path);
  } catch {
    return path;
  }
}

function formatMediaTitle(raw: string): string {
  const map: Record<string, string> = {
    aadhaar_front: "Aadhaar Card (Front)",
    aadhaar_back: "Aadhaar Card (Back)",
    aadhaar: "Aadhaar Card",
    pan: "PAN Card",
    pan_card: "PAN Card",
    passport: "Passport",
    passport_front: "Passport (Front Page)",
    passport_last: "Passport (Last Page)",
    selfie: "Face Selfie",
    visa: "Visa",
    tenth_marksheet: "10th Marksheet",
    resume: "Resume / CV",
    certificate: "Certificate",
    id_proof: "ID Proof",
    shop_photo: "Center / Shop Photo",
    emitra_certificate: "e-Mitra Certificate",
    address_proof: "Address Proof",
    owner_photo: "Owner Photo",
  };
  if (map[raw]) return map[raw];
  return raw
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function detectFileType(url: string, rawType?: string): "image" | "video" | "pdf" | "document" {
  const clean = (url || "").split("?")[0].toLowerCase();
  const typeLower = (rawType || "").toLowerCase();
  if (
    clean.match(/\.(jpeg|jpg|png|webp|gif|svg)$/i) ||
    typeLower.includes("photo") ||
    typeLower.includes("selfie") ||
    typeLower.includes("image")
  ) {
    return "image";
  }
  if (
    clean.match(/\.(mp4|webm|mov|mkv|avi)$/i) ||
    typeLower.includes("video")
  ) {
    return "video";
  }
  if (clean.endsWith(".pdf") || typeLower.includes("pdf")) {
    return "pdf";
  }
  return "document";
}

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionType, setActionType] = useState<"ban" | "unban" | null>(null);
  const [reason, setReason] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [roleUpdating, setRoleUpdating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [kindFilter, setKindFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewUser, setViewUser] = useState<User | null>(null);
  const [viewProfile, setViewProfile] = useState<any>(null);
  const [viewMedia, setViewMedia] = useState<UserMediaItem[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, email, full_name, phone, created_at");
      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from("user_roles").select("user_id, role");
      if (rolesError) throw rolesError;

      const { data: moderations, error: moderationsError } = await supabase
        .from("user_moderation").select("user_id, action, is_active").eq("is_active", true);
      if (moderationsError) throw moderationsError;

      const partnerTypeByUser = new Map<string, string>();
      const { data: partnerLinks, error: partnerError } = await supabase
        .from("partners")
        .select("user_id, partner_types(code)");
      if (partnerError) {
        console.error("Error loading partner types:", partnerError);
      }
      for (const link of partnerLinks ?? []) {
        const typeRow = link.partner_types as { code: string } | { code: string }[] | null;
        const code = Array.isArray(typeRow) ? typeRow[0]?.code : typeRow?.code;
        if (link.user_id && code) partnerTypeByUser.set(link.user_id, code);
      }

      const usersData: User[] = profiles.map((profile) => {
        const userRole = roles.find((r) => r.user_id === profile.id);
        const moderation = moderations.find((m) => m.user_id === profile.id);
        const role = userRole?.role || "worker";
        const kind = accountKind(role, partnerTypeByUser.get(profile.id) ?? null);
        return {
          id: profile.id,
          email: displayableEmail(profile.email) || "",
          full_name: profile.full_name,
          phone: profile.phone,
          role,
          kind: kind.kind,
          kindLabel: kind.kindLabel,
          is_banned: moderation ? BANNED_ACTIONS.has(moderation.action) : false,
          joined: new Date(profile.created_at).toISOString().split("T")[0],
        };
      });
      setUsers(usersData);
    } catch (error: any) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleBanUnban = async () => {
    if (!selectedUser || !actionType) return;
    if (actionType === "ban" && !reason.trim()) {
      toast.error("Please provide a reason");
      return;
    }
    try {
      const enabling = actionType === "unban";
      const { error } = await adminSetUserEnabled(
        selectedUser.id,
        enabling,
        reason.trim(),
      );
      if (error) throw new Error(error);
      toast.success(
        enabling
          ? `${selectedUser.full_name || selectedUser.email || "User"} can sign in again`
          : `${selectedUser.full_name || selectedUser.email || "User"} is disabled and cannot sign in`,
      );
      setShowDialog(false); setReason(""); setSelectedUser(null); setActionType(null);
      fetchUsers();
    } catch (error: any) {
      console.error("Error updating user status:", error);
      toast.error(error.message || "Failed to update user status");
    }
  };

  const handleRoleChange = async (user: User, newRole: string) => {
    if (user.role === newRole) return;
    setRoleUpdating(true);
    try {
      const { error } = await adminSetUserRole(
        user.id,
        newRole as "worker" | "employer" | "partner" | "agent"
      );
      if (error) throw new Error(error);
      toast.success(`Role updated to ${newRole}`);
      setViewUser((prev) => (prev?.id === user.id ? { ...prev, role: newRole } : prev));
      fetchUsers();
    } catch (error: any) {
      console.error("Error updating role:", error);
      toast.error(error.message || "Failed to update role");
    } finally {
      setRoleUpdating(false);
    }
  };

  const handleViewUser = async (user: User) => {
    setViewUser(user);
    setViewProfile(null);
    setViewMedia([]);
    setMediaLoading(true);

    try {
      if (user.role === "worker") {
        const { data: profile } = await supabase.from("worker_profiles").select("*").eq("user_id", user.id).maybeSingle();
        setViewProfile(profile);

        const [docsRes, skillMediaRes, videosRes] = await Promise.all([
          supabase
            .from("worker_documents")
            .select("id, document_type, document_name, file_url, verification_status, uploaded_at")
            .eq("worker_id", user.id)
            .order("uploaded_at", { ascending: false }),
          supabase
            .from("worker_skill_media")
            .select("id, skill_id, media_type, file_path, created_at, worker_skills(skill_name)")
            .eq("worker_id", user.id)
            .order("created_at", { ascending: false }),
          supabase
            .from("worker_videos")
            .select("id, title, video_url, thumbnail_url, created_at")
            .eq("worker_id", user.id),
        ]);

        const items: UserMediaItem[] = [];

        // 1. Skill media (photos / videos in worker-videos bucket)
        if (skillMediaRes.data && skillMediaRes.data.length > 0) {
          await Promise.all(
            skillMediaRes.data.map(async (sm) => {
              try {
                const { data: signed } = await supabase.storage
                  .from("worker-videos")
                  .createSignedUrl(sm.file_path, 3600);
                if (signed?.signedUrl) {
                  const skillRow = sm.worker_skills as { skill_name?: string } | { skill_name?: string }[] | null;
                  const skillName = Array.isArray(skillRow) ? skillRow[0]?.skill_name : skillRow?.skill_name;
                  items.push({
                    id: sm.id,
                    title: skillName ? `${skillName} (${sm.media_type})` : `Skill Work (${sm.media_type})`,
                    type: sm.media_type === "video" ? "video" : "image",
                    url: signed.signedUrl,
                    category: "Skill Media",
                    uploadedAt: sm.created_at,
                  });
                }
              } catch (e) {
                console.error("Error signing skill media url:", e);
              }
            })
          );
        }

        // 2. Documents & KYC (Aadhaar, Passport, Selfie, Resume, etc.)
        if (docsRes.data && docsRes.data.length > 0) {
          await Promise.all(
            docsRes.data.map(async (doc) => {
              try {
                let url = doc.file_url;
                const path = documentStoragePath(doc.file_url);
                if (path) {
                  const { data: signed } = await supabase.storage
                    .from("worker-documents")
                    .createSignedUrl(path, 3600);
                  if (signed?.signedUrl) url = signed.signedUrl;
                }
                if (url) {
                  items.push({
                    id: doc.id,
                    title: formatMediaTitle(doc.document_type || doc.document_name || "Document"),
                    type: detectFileType(url, doc.document_type),
                    url,
                    category: "Documents & KYC",
                    status: doc.verification_status,
                    uploadedAt: doc.uploaded_at,
                  });
                }
              } catch (e) {
                console.error("Error signing document url:", e);
              }
            })
          );
        }

        // 3. Worker intro videos
        if (videosRes.data && videosRes.data.length > 0) {
          for (const v of videosRes.data) {
            if (v.video_url) {
              items.push({
                id: v.id,
                title: v.title || "Intro Video",
                type: "video",
                url: v.video_url,
                category: "Video Portfolio",
                uploadedAt: v.created_at,
              });
            }
          }
        }

        setViewMedia(items);
      } else if (user.role === "employer") {
        const { data: profile } = await supabase.from("employer_profiles").select("*").eq("user_id", user.id).maybeSingle();
        setViewProfile(profile);

        const items: UserMediaItem[] = [];
        if (profile?.company_logo_url) {
          items.push({
            id: "logo",
            title: "Company Logo",
            type: "image",
            url: profile.company_logo_url,
            category: "Employer Media",
          });
        }
        if (profile?.company_profile_path) {
          const { data: signed } = await supabase.storage
            .from("employer-documents")
            .createSignedUrl(profile.company_profile_path, 3600);
          if (signed?.signedUrl) {
            items.push({
              id: "profile_doc",
              title: "Company Profile Document",
              type: detectFileType(signed.signedUrl),
              url: signed.signedUrl,
              category: "Employer Media",
            });
          }
        }
        setViewMedia(items);
      } else if (user.role === "partner") {
        const { data: profile } = await supabase.from("partner_profiles").select("*").eq("user_id", user.id).maybeSingle();
        setViewProfile(profile);

        const items: UserMediaItem[] = [];
        if (profile) {
          const partnerDocFields: [string, string][] = [
            ["aadhaar_front_url", "Aadhaar Front"],
            ["aadhaar_back_url", "Aadhaar Back"],
            ["pan_card_url", "PAN Card"],
            ["shop_photo_url", "Center / Shop Photo"],
            ["emitra_certificate_url", "e-Mitra Certificate"],
            ["address_proof_url", "Address Proof"],
            ["owner_photo_url", "Owner Photo"],
          ];
          for (const [key, label] of partnerDocFields) {
            const rawPath = (profile as Record<string, any>)[key];
            if (rawPath) {
              const { data: signed } = await supabase.storage
                .from("partner-documents")
                .createSignedUrl(rawPath, 3600);
              if (signed?.signedUrl) {
                items.push({
                  id: key,
                  title: label,
                  type: detectFileType(signed.signedUrl, key),
                  url: signed.signedUrl,
                  category: "Partner Documents",
                });
              }
            }
          }
        }
        setViewMedia(items);
      }
    } catch (err) {
      console.error("Error fetching profile & media:", err);
    } finally {
      setMediaLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch = !searchQuery || 
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phone?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = kindFilter === "all" || user.kind === kindFilter;
    const matchesStatus = statusFilter === "all" ||
      (statusFilter === "active" && !user.is_banned) ||
      (statusFilter === "banned" && user.is_banned);
    return matchesSearch && matchesRole && matchesStatus;
  });

  if (loading) {
    return (
      <DashboardLayout navGroups={adminNavGroups} portalLabel="Admin Panel" portalName="Admin Panel" profileMenuItems={adminProfileMenu}>
        <h1 className="text-2xl md:text-3xl font-bold mb-6">User Management</h1>
        <p className="text-muted-foreground">Loading users...</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navGroups={adminNavGroups} portalLabel="Admin Panel" portalName="Admin Panel" profileMenuItems={adminProfileMenu}>
      <h1 className="text-2xl md:text-3xl font-bold mb-2">User Management</h1>
      <p className="text-muted-foreground text-sm mb-6">
        Disable, enable, or delete any account — workers, employers, e-Mitra, trade test centres, RAs, and other partners.
        {" "}{users.length} total. Disable blocks sign-in. Delete permanently removes the account.
      </p>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name, email, or phone..." className="pl-9"
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        <Select value={kindFilter} onValueChange={setKindFilter}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Account type" /></SelectTrigger>
          <SelectContent>
            {KIND_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="banned">Disabled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {[
          { label: "Total", value: users.length, color: "text-primary" },
          { label: "Workers", value: users.filter(u => u.kind === "worker").length, color: "text-success" },
          { label: "e-Mitra", value: users.filter(u => u.kind === "emitra").length, color: "text-primary" },
          { label: "Trade test", value: users.filter(u => u.kind === "trade_test").length, color: "text-primary" },
          { label: "RA", value: users.filter(u => u.kind === "ra").length, color: "text-primary" },
          { label: "Disabled", value: users.filter(u => u.is_banned).length, color: "text-destructive" },
        ].map(s => (
          <Card key={s.label} className="p-3 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* User list */}
      <div className="space-y-3">
        {filteredUsers.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No users match your filters</p>
        ) : filteredUsers.map((user) => (
          <Card key={user.id} className="p-4 md:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h3 className="text-base font-semibold truncate">{user.full_name || "No Name"}</h3>
                  <Badge variant={user.kind === "worker" ? "default" : user.kind === "employer" ? "secondary" : "outline"}>
                    {user.kindLabel}
                  </Badge>
                  <Badge variant={user.is_banned ? "destructive" : "default"} className="text-xs">
                    {user.is_banned ? "Disabled" : "Active"}
                  </Badge>
                </div>
                <p className="text-muted-foreground text-sm truncate">
                  {user.email || user.phone || "No contact email yet"}
                </p>
                <div className="flex gap-4 mt-1">
                  {user.phone && <span className="text-xs text-muted-foreground">{user.phone}</span>}
                  <span className="text-xs text-muted-foreground">Joined {user.joined}</span>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button variant="outline" size="icon" onClick={() => handleViewUser(user)} title="View details">
                  <Eye className="h-4 w-4" />
                </Button>
                {user.role !== "admin" && user.id !== currentUser?.id && (
                  user.is_banned ? (
                    <Button variant="outline" size="icon" onClick={() => { setSelectedUser(user); setActionType("unban"); setShowDialog(true); }} title="Enable user">
                      <UserCheck className="h-4 w-4 text-success" />
                    </Button>
                  ) : (
                    <Button variant="outline" size="icon" onClick={() => { setSelectedUser(user); setActionType("ban"); setShowDialog(true); }} title="Disable user">
                      <UserX className="h-4 w-4 text-destructive" />
                    </Button>
                  )
                )}
                <AdminDeleteUserButton
                  userId={user.id}
                  userRole={user.role}
                  userLabel={user.full_name || user.email || user.phone || "this user"}
                  onDeleted={fetchUsers}
                />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Ban/Unban Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{actionType === "ban" ? "Disable User" : "Enable User"}</DialogTitle>
            <DialogDescription>
              {actionType === "ban"
                ? `This signs ${selectedUser?.full_name || selectedUser?.email || "this user"} out and blocks future sign-in. Their data stays in place.`
                : `This restores sign-in for ${selectedUser?.full_name || selectedUser?.email || "this user"}.`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="reason">Reason{actionType === "ban" ? " *" : " (optional)"}</Label>
              <Textarea id="reason" value={reason} onChange={(e) => setReason(e.target.value)}
                placeholder="Provide a reason for this action..." className="mt-2" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
              <Button onClick={handleBanUnban} disabled={actionType === "ban" && !reason.trim()}
                variant={actionType === "ban" ? "destructive" : "default"}>
                {actionType === "ban" ? "Disable User" : "Enable User"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View User Dialog */}
      <Dialog open={!!viewUser} onOpenChange={() => setViewUser(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {viewUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs text-muted-foreground">Name</Label><p className="font-medium">{viewUser.full_name || "N/A"}</p></div>
                <div><Label className="text-xs text-muted-foreground">Email</Label><p className="font-medium text-sm">{viewUser.email || "Not provided yet"}</p></div>
                <div><Label className="text-xs text-muted-foreground">Phone</Label><p className="font-medium">{viewUser.phone || "N/A"}</p></div>
                <div>
                  <Label className="text-xs text-muted-foreground">Role</Label>
                  {viewUser.role === "admin" || viewUser.id === currentUser?.id ? (
                    <Badge>{viewUser.role}</Badge>
                  ) : (
                    <Select
                      value={viewUser.role}
                      onValueChange={(value) => handleRoleChange(viewUser, value)}
                      disabled={roleUpdating}
                    >
                      <SelectTrigger className="h-8 mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="worker">Worker</SelectItem>
                        <SelectItem value="employer">Employer</SelectItem>
                        <SelectItem value="partner">Partner</SelectItem>
                        <SelectItem value="agent">Agent</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div><Label className="text-xs text-muted-foreground">Status</Label>
                  <Badge variant={viewUser.is_banned ? "destructive" : "default"}>{viewUser.is_banned ? "Disabled" : "Active"}</Badge>
                  <p className="text-xs text-muted-foreground mt-1">{viewUser.kindLabel}</p>
                </div>
                <div><Label className="text-xs text-muted-foreground">Joined</Label><p className="font-medium">{viewUser.joined}</p></div>
              </div>

              {viewProfile && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3 text-sm">{viewUser.role === "worker" ? "Worker" : viewUser.role === "employer" ? "Employer" : "Agent"} Profile</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {viewUser.role === "worker" && (
                      <>
                        <div><span className="text-muted-foreground">City:</span> {viewProfile.current_city || "N/A"}</div>
                        <div><span className="text-muted-foreground">Country:</span> {viewProfile.country || "N/A"}</div>
                        <div><span className="text-muted-foreground">Experience:</span> {viewProfile.years_of_experience || 0} yrs</div>
                        <div><span className="text-muted-foreground">Skill:</span> {viewProfile.skill_level || "N/A"}</div>
                        <div><span className="text-muted-foreground">Availability:</span> {viewProfile.availability || "N/A"}</div>
                        <div><span className="text-muted-foreground">Passport:</span> {viewProfile.has_passport ? "Yes" : "No"}</div>
                        <div><span className="text-muted-foreground">Onboarded:</span> {viewProfile.onboarding_completed ? "Yes" : "No"}</div>
                      </>
                    )}
                    {viewUser.role === "employer" && (
                      <>
                        <div><span className="text-muted-foreground">Company:</span> {viewProfile.company_name || "N/A"}</div>
                        <div><span className="text-muted-foreground">Type:</span> {viewProfile.business_type || "N/A"}</div>
                        <div><span className="text-muted-foreground">Size:</span> {viewProfile.company_size || "N/A"}</div>
                        <div><span className="text-muted-foreground">Country:</span> {viewProfile.country || "N/A"}</div>
                        <div><span className="text-muted-foreground">Safety:</span> {viewProfile.follows_safety_standards ? "Yes" : "No"}</div>
                        <div><span className="text-muted-foreground">Onboarded:</span> {viewProfile.onboarding_completed ? "Yes" : "No"}</div>
                      </>
                    )}
                    {viewUser.role === "partner" && (
                      <>
                        <div><span className="text-muted-foreground">Center:</span> {viewProfile.center_name || "N/A"}</div>
                        <div><span className="text-muted-foreground">Owner:</span> {viewProfile.owner_name || "N/A"}</div>
                        <div><span className="text-muted-foreground">District:</span> {viewProfile.district || "N/A"}</div>
                        <div><span className="text-muted-foreground">State:</span> {viewProfile.state || "N/A"}</div>
                        <div><span className="text-muted-foreground">Status:</span> {viewProfile.status || "applied"}</div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {viewUser.role === "worker" && <AdminUserMediaSection userId={viewUser.id} />}

              {viewUser.role !== "worker" && (
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-sm">Media & Documents</h4>
                    {viewMedia.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {viewMedia.length} {viewMedia.length === 1 ? "item" : "items"}
                      </Badge>
                    )}
                  </div>

                  {mediaLoading ? (
                    <div className="flex items-center gap-2 py-4 text-xs text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      <span>Loading media and documents...</span>
                    </div>
                  ) : viewMedia.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-2">
                      No media or documents uploaded for this user yet.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {viewMedia.map((item) => (
                        <div
                          key={item.id}
                          className="rounded-lg border border-border p-3 bg-muted/20 flex flex-col justify-between gap-2 text-xs"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-foreground truncate" title={item.title}>
                                {item.title}
                              </p>
                              <p className="text-[11px] text-muted-foreground">{item.category}</p>
                            </div>
                            {item.status && (
                              <Badge
                                variant={
                                  item.status === "verified"
                                    ? "default"
                                    : item.status === "rejected"
                                    ? "destructive"
                                    : "outline"
                                }
                                className="text-[10px] capitalize shrink-0"
                              >
                                {item.status}
                              </Badge>
                            )}
                          </div>

                          {item.type === "image" && (
                            <div className="relative rounded overflow-hidden bg-muted aspect-video flex items-center justify-center border border-border">
                              <img
                                src={item.url}
                                alt={item.title}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            </div>
                          )}

                          {item.type === "video" && (
                            <div className="relative rounded overflow-hidden bg-black aspect-video flex items-center justify-center border border-border">
                              <video
                                src={item.url}
                                controls
                                preload="metadata"
                                className="w-full h-full object-contain"
                              />
                            </div>
                          )}

                          {item.type === "pdf" && (
                            <div className="rounded bg-muted/60 p-4 flex flex-col items-center justify-center gap-1.5 text-muted-foreground border border-border">
                              <FileText className="h-8 w-8 text-destructive" />
                              <span className="text-[11px] font-medium">PDF Document</span>
                            </div>
                          )}

                          {item.type === "document" && (
                            <div className="rounded bg-muted/60 p-4 flex flex-col items-center justify-center gap-1.5 text-muted-foreground border border-border">
                              <FileText className="h-8 w-8 text-primary" />
                              <span className="text-[11px] font-medium">Document File</span>
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[10px] text-muted-foreground">
                              {item.uploadedAt ? new Date(item.uploadedAt).toLocaleDateString("en-IN") : ""}
                            </span>
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline ml-auto"
                            >
                              <span>Open file</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                {viewUser.role !== "admin" && viewUser.id !== currentUser?.id && (
                  viewUser.is_banned ? (
                    <Button size="sm" onClick={() => { setViewUser(null); setSelectedUser(viewUser); setActionType("unban"); setShowDialog(true); }}>
                      <UserCheck className="h-4 w-4 mr-1" /> Enable User
                    </Button>
                  ) : (
                    <Button size="sm" variant="destructive" onClick={() => { setViewUser(null); setSelectedUser(viewUser); setActionType("ban"); setShowDialog(true); }}>
                      <UserX className="h-4 w-4 mr-1" /> Disable User
                    </Button>
                  )
                )}
                <AdminDeleteUserButton
                  userId={viewUser.id}
                  userRole={viewUser.role}
                  userLabel={viewUser.full_name || viewUser.email || viewUser.phone || "this user"}
                  variant="destructive"
                  label="Delete User"
                  onDeleted={() => {
                    setViewUser(null);
                    fetchUsers();
                  }}
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </DashboardLayout>
  );
}
