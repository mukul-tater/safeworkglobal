import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Bell, 
  Search, 
  Filter, 
  MapPin, 
  Clock, 
  ExternalLink, 
  Bookmark, 
  Trash2,
  Pause,
  Play,
  Eye
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DESTINATION_COUNTRIES } from "@/lib/constants";

interface JobAlert {
  id: string;
  title: string;
  company: string;
  location: string;
  country: string;
  industry: string;
  priority: "critical" | "high" | "medium";
  timeAgo: string;
  isRead: boolean;
  isSaved: boolean;
}

const AlertsManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCountry, setFilterCountry] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const { toast } = useToast();

  const mockAlerts: JobAlert[] = [
    {
      id: "1",
      title: "Senior Electrical Engineer",
      company: "Tokyo Infrastructure Corp",
      location: "Tokyo",
      country: "Japan",
      industry: "Electrical & Electronics",
      priority: "critical",
      timeAgo: "5 min ago",
      isRead: false,
      isSaved: false
    },
    {
      id: "2", 
      title: "Construction Project Manager",
      company: "Dubai Construction Ltd",
      location: "Dubai",
      country: "UAE",
      industry: "Construction & Infrastructure",
      priority: "high",
      timeAgo: "15 min ago",
      isRead: false,
      isSaved: true
    },
    {
      id: "3",
      title: "Certified Welder",
      company: "Berlin Steel Works",
      location: "Berlin",
      country: "Germany", 
      industry: "Welding & Metalwork",
      priority: "high",
      timeAgo: "1 hour ago",
      isRead: true,
      isSaved: false
    },
    {
      id: "4",
      title: "HVAC Technician",
      company: "Oslo Energy Solutions",
      location: "Oslo",
      country: "Norway",
      industry: "Plumbing & HVAC",
      priority: "medium",
      timeAgo: "2 hours ago",
      isRead: true,
      isSaved: true
    }
  ];

  const [alerts, setAlerts] = useState(mockAlerts);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "bg-destructive text-destructive-foreground";
      case "high": return "bg-warning text-warning-foreground";
      case "medium": return "bg-primary text-primary-foreground";
      default: return "bg-secondary text-secondary-foreground";
    }
  };

  const handleMarkAsRead = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, isRead: true } : alert
    ));
  };

  const handleSaveAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, isSaved: !alert.isSaved } : alert
    ));
    
    const alert = alerts.find(a => a.id === alertId);
    toast({
      title: alert?.isSaved ? "Alert Unsaved" : "Alert Saved",
      description: alert?.isSaved ? "Removed from saved alerts" : "Added to saved alerts",
    });
  };

  const handleDeleteAlert = (alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
    toast({
      title: "Alert Deleted",
      description: "The job alert has been removed.",
    });
  };

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch =                          alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alert.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCountry = filterCountry === "all" || alert.country === filterCountry;
    const matchesPriority = filterPriority === "all" || alert.priority === filterPriority;
    
    return matchesSearch && matchesCountry && matchesPriority;
  });

  const unreadCount = alerts.filter(alert => !alert.isRead).length;
  const savedCount = alerts.filter(alert => alert.isSaved).length;

  const AlertCard = ({ alert }: { alert: JobAlert }) => (
    <Card className={`${!alert.isRead ? 'border-primary/50 bg-primary/5' : ''} hover:shadow-md transition-shadow`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className={`font-semibold ${!alert.isRead ? 'text-primary' : ''}`}>
                {alert.title}
              </h3>
              <Badge className={getPriorityColor(alert.priority)}>
                {alert.priority}
              </Badge>
              {!alert.isRead && (
                <Badge variant="secondary" className="text-xs">New</Badge>
              )}
            </div>
            
            <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {alert.location}, {alert.country}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {alert.timeAgo}
              </span>
            </div>
            
            <Badge variant="outline" className="text-xs">
              {alert.industry}
            </Badge>
          </div>
          
          <div className="flex flex-col gap-2 ml-4">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleMarkAsRead(alert.id)}
              className="h-8 w-8 p-0"
              disabled={alert.isRead}
            >
              <Eye className="h-3 w-3" />
            </Button>
            
            <Button
              size="sm"
              variant={alert.isSaved ? "default" : "outline"}
              onClick={() => handleSaveAlert(alert.id)}
              className="h-8 w-8 p-0"
            >
              <Bookmark className="h-3 w-3" />
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleDeleteAlert(alert.id)}
              className="h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
        
        <div className="flex gap-2 mt-3">
          <Button size="sm" className="flex-1">
            <ExternalLink className="h-3 w-3 mr-1" />
            Apply Now
          </Button>
          <Button size="sm" variant="outline">
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="w-full max-w-5xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Job Alerts Management
          </CardTitle>
          <CardDescription>
            Manage your job alerts and notifications
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">
            All Alerts ({alerts.length})
          </TabsTrigger>
          <TabsTrigger value="unread">
            Unread ({unreadCount})
          </TabsTrigger>
          <TabsTrigger value="saved">
            Saved ({savedCount})
          </TabsTrigger>
        </TabsList>

        <div className="flex flex-col sm:flex-row gap-4 mt-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search alerts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={filterCountry} onValueChange={setFilterCountry}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Country" />
            </SelectTrigger>
            <SelectContent className="max-h-64">
              <SelectItem value="all">All Countries</SelectItem>
              {DESTINATION_COUNTRIES.filter(c => c !== 'All Countries').map(country => (
                <SelectItem key={country} value={country}>{country}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <TabsContent value="all" className="space-y-4 mt-6">
          {filteredAlerts.map(alert => (
            <AlertCard key={alert.id} alert={alert} />
          ))}
        </TabsContent>

        <TabsContent value="unread" className="space-y-4 mt-6">
          {filteredAlerts.filter(alert => !alert.isRead).map(alert => (
            <AlertCard key={alert.id} alert={alert} />
          ))}
        </TabsContent>

        <TabsContent value="saved" className="space-y-4 mt-6">
          {filteredAlerts.filter(alert => alert.isSaved).map(alert => (
            <AlertCard key={alert.id} alert={alert} />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AlertsManagement;