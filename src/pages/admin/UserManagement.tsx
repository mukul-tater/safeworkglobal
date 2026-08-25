import DashboardLayout from "@/components/layout/DashboardLayout";
import { adminNavGroups, adminProfileMenu } from "@/config/adminNav";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, Search, UserX, UserCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { displayableEmail } from "@/lib/workerAuthEmail";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { adminSetUserRole } from "@/services/AdminService";
import AdminDeleteUserButton from "@/components/admin/AdminDeleteUserButton";

const BANNED_ACTIONS = new Set(["banned", "blocked", "suspended"]);

interface User {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: string;
  is_banned: boolean;
  joined: string;
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
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewUser, setViewUser] = useState<User | null>(null);
  const [viewProfile, setViewProfile] = useState<any>(null);

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

      const usersData: User[] = profiles.map((profile) => {
        const userRole = roles.find((r) => r.user_id === profile.id);
        const moderation = moderations.find((m) => m.user_id === profile.id);
        return {
          id: profile.id,
          email: displayableEmail(profile.email) || "",
          full_name: profile.full_name,
          phone: profile.phone,
          role: userRole?.role || "worker",
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
    if (!selectedUser || !actionType || !reason.trim()) {
      toast.error("Please provide a reason");
      return;
    }
    try {
      const adminId = (await supabase.auth.getUser()).data.user?.id;
      if (!adminId) throw new Error("Not authenticated");

      if (actionType === "ban") {
        const { error } = await supabase.from("user_moderation").insert({
          user_id: selectedUser.id,
          action: "banned",
          reason: reason.trim(),
          actioned_by: adminId,
          is_active: true,
        });
        if (error) throw error;
        toast.success(`${selectedUser.full_name || selectedUser.email} has been banned`);
      } else {
        const { error } = await supabase.from("user_moderation")
          .update({ is_active: false })
          .eq("user_id", selectedUser.id).eq("is_active", true);
        if (error) throw error;
        toast.success(`${selectedUser.full_name || selectedUser.email} has been unbanned`);
      }
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
    try {
      if (user.role === "worker") {
        const { data } = await supabase.from("worker_profiles").select("*").eq("user_id", user.id).maybeSingle();
        setViewProfile(data);
      } else if (user.role === "employer") {
        const { data } = await supabase.from("employer_profiles").select("*").eq("user_id", user.id).maybeSingle();
        setViewProfile(data);
      } else if (user.role === "partner") {
        const { data } = await supabase.from("partner_profiles").select("*").eq("user_id", user.id).maybeSingle();
        setViewProfile(data);
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch = !searchQuery || 
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phone?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
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
        Manage all workers, employers, and agents — {users.length} total users.
        Delete permanently removes the account and related data.
      </p>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name, email, or phone..." className="pl-9"
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Role" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="worker">Worker</SelectItem>
            <SelectItem value="employer">Employer</SelectItem>
            <SelectItem value="partner">Partner (e-Mitra)</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="banned">Banned</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total", value: users.length, color: "text-primary" },
          { label: "Workers", value: users.filter(u => u.role === "worker").length, color: "text-success" },
          { label: "Employers", value: users.filter(u => u.role === "employer").length, color: "text-primary" },
          { label: "Banned", value: users.filter(u => u.is_banned).length, color: "text-destructive" },
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
                  <Badge variant={user.role === "worker" ? "default" : user.role === "employer" ? "secondary" : "outline"}>
                    {user.role}
                  </Badge>
                  <Badge variant={user.is_banned ? "destructive" : "default"} className="text-xs">
                    {user.is_banned ? "Banned" : "Active"}
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
                {user.is_banned ? (
                  <Button variant="outline" size="icon" onClick={() => { setSelectedUser(user); setActionType("unban"); setShowDialog(true); }} title="Enable user">
                    <UserCheck className="h-4 w-4 text-success" />
                  </Button>
                ) : (
                  <Button variant="outline" size="icon" onClick={() => { setSelectedUser(user); setActionType("ban"); setShowDialog(true); }} title="Disable user">
                    <UserX className="h-4 w-4 text-destructive" />
                  </Button>
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
                ? `This will ban ${selectedUser?.full_name || selectedUser?.email} from accessing the platform.`
                : `This will restore access for ${selectedUser?.full_name || selectedUser?.email}.`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="reason">Reason *</Label>
              <Textarea id="reason" value={reason} onChange={(e) => setReason(e.target.value)}
                placeholder="Provide a reason for this action..." className="mt-2" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
              <Button onClick={handleBanUnban} disabled={!reason.trim()}
                variant={actionType === "ban" ? "destructive" : "default"}>
                {actionType === "ban" ? "Disable User" : "Enable User"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View User Dialog */}
      <Dialog open={!!viewUser} onOpenChange={() => setViewUser(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
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
                  <Badge variant={viewUser.is_banned ? "destructive" : "default"}>{viewUser.is_banned ? "Banned" : "Active"}</Badge>
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

              <div className="flex justify-end gap-2 pt-2">
                {viewUser.is_banned ? (
                  <Button size="sm" onClick={() => { setViewUser(null); setSelectedUser(viewUser); setActionType("unban"); setShowDialog(true); }}>
                    <UserCheck className="h-4 w-4 mr-1" /> Enable User
                  </Button>
                ) : (
                  <Button size="sm" variant="destructive" onClick={() => { setViewUser(null); setSelectedUser(viewUser); setActionType("ban"); setShowDialog(true); }}>
                    <UserX className="h-4 w-4 mr-1" /> Disable User
                  </Button>
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
