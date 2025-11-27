import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Clock, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface SLAIndicatorProps {
  slaBreachAt: string | null;
  slaStatus: string;
  status: string;
  size?: "sm" | "md" | "lg";
}

export function SLAIndicator({ slaBreachAt, slaStatus, status, size = "md" }: SLAIndicatorProps) {
  if (!slaBreachAt || status === "closed" || status === "resolved") {
    return null;
  }

  const now = new Date();
  const breachTime = new Date(slaBreachAt);
  const timeRemaining = breachTime.getTime() - now.getTime();
  const totalTime = breachTime.getTime() - new Date(breachTime.getTime() - 24 * 60 * 60 * 1000).getTime();
  const progressPercentage = Math.max(0, Math.min(100, (timeRemaining / totalTime) * 100));

  const getStatusConfig = () => {
    switch (slaStatus) {
      case "breached":
        return {
          icon: <XCircle className="w-4 h-4" />,
          color: "bg-destructive/20 text-destructive border-destructive/50",
          label: "SLA Breached",
          message: `Breached ${formatDistanceToNow(breachTime, { addSuffix: true })}`,
          progressColor: "bg-destructive",
        };
      case "at_risk":
        return {
          icon: <AlertTriangle className="w-4 h-4" />,
          color: "bg-warning/20 text-warning border-warning/50",
          label: "SLA At Risk",
          message: `${formatDistanceToNow(breachTime, { addSuffix: true })}`,
          progressColor: "bg-warning",
        };
      case "met":
        return {
          icon: <CheckCircle2 className="w-4 h-4" />,
          color: "bg-success/20 text-success border-success/50",
          label: "SLA Met",
          message: "Resolved within SLA",
          progressColor: "bg-success",
        };
      default:
        return {
          icon: <Clock className="w-4 h-4" />,
          color: "bg-primary/20 text-primary border-primary/50",
          label: "On Track",
          message: `${formatDistanceToNow(breachTime, { addSuffix: true })}`,
          progressColor: "bg-primary",
        };
    }
  };

  const config = getStatusConfig();

  if (size === "sm") {
    return (
      <Badge variant="outline" className={`${config.color} text-xs`}>
        {config.icon}
        <span className="ml-1">{config.label}</span>
      </Badge>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Badge variant="outline" className={config.color}>
          {config.icon}
          <span className="ml-1.5">{config.label}</span>
        </Badge>
        <span className="text-xs text-muted-foreground">{config.message}</span>
      </div>
      {slaStatus !== "breached" && slaStatus !== "met" && (
        <div className="space-y-1">
          <Progress value={progressPercentage} className={`h-2 ${config.progressColor}`} />
          <p className="text-xs text-muted-foreground text-right">
            {Math.round(progressPercentage)}% time remaining
          </p>
        </div>
      )}
    </div>
  );
}
