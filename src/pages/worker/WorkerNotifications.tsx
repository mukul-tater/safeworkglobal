import WorkerPortalLayout from "@/components/layout/WorkerPortalLayout";
import { Card } from "@/components/ui/card";
import { Bell, Briefcase, MessageSquare, CheckCircle, FileText, Plane } from "lucide-react";
import PortalBreadcrumb from "@/components/PortalBreadcrumb";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  data: any;
}

const typeIconMap: Record<string, any> = {
  application_update: Briefcase,
  formality_update: Plane,
  message: MessageSquare,
  success: CheckCircle,
};

export default function WorkerNotifications() {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    if (!profile?.id) return;
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(50);
    setNotifications(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchNotifications();
  }, [profile?.id]);

  // Real-time subscription for new notifications
  useEffect(() => {
    if (!profile?.id) return;
    const channel = supabase
      .channel("worker-notifications-page")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${profile.id}` },
        () => fetchNotifications()
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [profile?.id]);

  const markAsRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true, read_at: new Date().toISOString() }).eq("id", id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  };

  const markAllRead = async () => {
    if (!profile?.id) return;
    await supabase.from("notifications").update({ is_read: true, read_at: new Date().toISOString() }).eq("user_id", profile.id).eq("is_read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  return (
    <WorkerPortalLayout>
      <PortalBreadcrumb />
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Notifications</h1>
        {notifications.some((n) => !n.is_read) && (
          <button onClick={markAllRead} className="text-sm text-primary hover:underline">
            Mark all as read
          </button>
        )}
      </div>

      <div className="space-y-3 max-w-3xl">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-5 animate-pulse">
              <div className="flex gap-4">
                <div className="h-10 w-10 bg-muted rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/3" />
                  <div className="h-3 bg-muted rounded w-2/3" />
                </div>
              </div>
            </Card>
          ))
        ) : notifications.length === 0 ? (
          <Card className="p-8 text-center">
            <Bell className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No notifications yet</p>
          </Card>
        ) : (
          notifications.map((notification) => {
            const Icon = typeIconMap[notification.type] || FileText;
            return (
              <Card
                key={notification.id}
                className={`p-5 cursor-pointer transition-colors hover:bg-muted/50 ${
                  !notification.is_read ? "border-l-4 border-l-primary" : ""
                }`}
                onClick={() => !notification.is_read && markAsRead(notification.id)}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-2.5 rounded-lg ${!notification.is_read ? "bg-primary/10" : "bg-muted"}`}>
                    <Icon className={`h-5 w-5 ${!notification.is_read ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`text-sm mb-0.5 ${!notification.is_read ? "font-semibold" : "font-medium"}`}>
                      {notification.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{notification.message}</p>
                    <span className="text-xs text-muted-foreground mt-1 block">
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  {!notification.is_read && (
                    <div className="h-2.5 w-2.5 rounded-full bg-primary shrink-0 mt-1.5" />
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>
    </WorkerPortalLayout>
  );
}
