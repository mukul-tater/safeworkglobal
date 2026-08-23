import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ECRStatusCardProps {
  ecrStatus: string;
  ecrCategory: string | null;
  nationality: string | null;
  hasPassport: boolean;
}

export default function ECRStatusCard({ 
  ecrStatus, 
  ecrCategory, 
  nationality,
  hasPassport 
}: ECRStatusCardProps) {
  const getECRStatusInfo = () => {
    if (nationality !== 'India') {
      return {
        icon: <CheckCircle className="h-5 w-5 text-green-500" />,
        title: 'ECR Not Applicable',
        description: 'ECR requirements apply only to Indian nationals',
        variant: 'default' as const,
        bgColor: 'bg-green-500/10'
      };
    }

    switch (ecrStatus) {
      case 'not_required':
      case 'exempted':
        return {
          icon: <CheckCircle className="h-5 w-5 text-green-500" />,
          title: 'ECNR - No Clearance Required',
          description: 'You are exempt from emigration clearance',
          variant: 'default' as const,
          bgColor: 'bg-green-500/10'
        };
      case 'required':
        return {
          icon: <AlertCircle className="h-5 w-5 text-yellow-500" />,
          title: 'ECR - Clearance Required',
          description: 'Emigration clearance needed for employment abroad',
          variant: 'secondary' as const,
          bgColor: 'bg-yellow-500/10'
        };
      default:
        return {
          icon: <HelpCircle className="h-5 w-5 text-muted-foreground" />,
          title: 'ECR Status Not Checked',
          description: 'Complete your profile to determine ECR status',
          variant: 'outline' as const,
          bgColor: 'bg-muted/50'
        };
    }
  };

  const statusInfo = getECRStatusInfo();

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${statusInfo.bgColor}`}>
            {statusInfo.icon}
          </div>
          <div>
            <h2 className="text-xl font-bold">ECR Status</h2>
            <p className="text-sm text-muted-foreground">Emigration Check Required</p>
          </div>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button type="button" variant="ghost" size="icon" className="h-11 w-11" aria-label="What is ECR?">
              <HelpCircle className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle>ECR / ECNR</DialogTitle>
              <DialogDescription>
                ECR (Emigration Check Required) applies to Indian passport holders with education below 10th grade.
                ECNR passport holders don't need emigration clearance.
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        <div className="p-4 rounded-lg border bg-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">{statusInfo.title}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {statusInfo.description}
              </p>
            </div>
            <Badge variant={statusInfo.variant}>
              {ecrCategory || 'Pending'}
            </Badge>
          </div>
        </div>

        {nationality === 'India' && ecrStatus === 'required' && (
          <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <p className="text-sm font-medium mb-2">Required Documents:</p>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
              <li>• Valid passport with ECR stamp</li>
              <li>• Emigration clearance from Protector of Emigrants</li>
              <li>• Employment contract attested by Indian Embassy</li>
            </ul>
          </div>
        )}

        {!hasPassport && (
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              Upload your passport to verify your ECR status
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
