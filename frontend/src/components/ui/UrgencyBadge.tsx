"use client";

import { differenceInHours, differenceInDays, isPast, format } from "date-fns";
import { Clock, AlertTriangle, CheckCircle2, Timer, AlertCircle } from "lucide-react";

type UrgencyLevel = "overdue" | "due-soon" | "upcoming" | "on-track" | "completed" | "no-deadline";

interface UrgencyConfig {
    level: UrgencyLevel;
    label: string;
    color: string;
    bgColor: string;
    borderColor: string;
    icon: any;
}

const urgencyConfigs: Record<UrgencyLevel, UrgencyConfig> = {
    overdue: {
        level: "overdue",
        label: "Overdue",
        color: "#dc2626",
        bgColor: "#fef2f2",
        borderColor: "#fecaca",
        icon: AlertTriangle,
    },
    "due-soon": {
        level: "due-soon",
        label: "Due Soon",
        color: "#ea580c",
        bgColor: "#fff7ed",
        borderColor: "#fed7aa",
        icon: AlertCircle,
    },
    upcoming: {
        level: "upcoming",
        label: "Upcoming",
        color: "#ca8a04",
        bgColor: "#fefce8",
        borderColor: "#fef08a",
        icon: Timer,
    },
    "on-track": {
        level: "on-track",
        label: "On Track",
        color: "#16a34a",
        bgColor: "#f0fdf4",
        borderColor: "#bbf7d0",
        icon: CheckCircle2,
    },
    completed: {
        level: "completed",
        label: "Completed",
        color: "#0d9488",
        bgColor: "#f0fdfa",
        borderColor: "#99f6e4",
        icon: CheckCircle2,
    },
    "no-deadline": {
        level: "no-deadline",
        label: "No Deadline",
        color: "#6b7280",
        bgColor: "#f9fafb",
        borderColor: "#e5e7eb",
        icon: Clock,
    },
};

export function getUrgencyLevel(dueDate: Date | string | null | undefined, status: string): UrgencyLevel {
    // If task is done, always show completed
    if (status === "DONE") {
        return "completed";
    }

    // No deadline set
    if (!dueDate) {
        return "no-deadline";
    }

    const due = new Date(dueDate);
    const now = new Date();

    // Check if overdue
    if (isPast(due)) {
        return "overdue";
    }

    const hoursUntilDue = differenceInHours(due, now);
    const daysUntilDue = differenceInDays(due, now);

    // Due within 24 hours
    if (hoursUntilDue <= 24) {
        return "due-soon";
    }

    // Due within 3 days
    if (daysUntilDue <= 3) {
        return "upcoming";
    }

    // More than 3 days away
    return "on-track";
}

export function getUrgencyConfig(dueDate: Date | string | null | undefined, status: string): UrgencyConfig {
    const level = getUrgencyLevel(dueDate, status);
    return urgencyConfigs[level];
}

interface UrgencyBadgeProps {
    dueDate: Date | string | null | undefined;
    status: string;
    showLabel?: boolean;
    size?: "sm" | "md";
    className?: string;
}

export function UrgencyBadge({ dueDate, status, showLabel = true, size = "sm", className = "" }: UrgencyBadgeProps) {
    const config = getUrgencyConfig(dueDate, status);
    const Icon = config.icon;

    // Don't show badge for tasks without deadlines (unless you want to)
    if (config.level === "no-deadline") {
        return null;
    }

    const sizeClasses = size === "sm"
        ? "text-xs px-2 py-0.5 gap-1"
        : "text-sm px-3 py-1 gap-1.5";

    const iconSize = size === "sm" ? "w-3 h-3" : "w-4 h-4";

    return (
        <span
            className={`inline-flex items-center font-medium rounded-full border ${sizeClasses} ${className}`}
            style={{
                color: config.color,
                backgroundColor: config.bgColor,
                borderColor: config.borderColor,
            }}
        >
            <Icon className={iconSize} />
            {showLabel && <span>{config.label}</span>}
        </span>
    );
}

interface DeadlineDisplayProps {
    dueDate: Date | string | null | undefined;
    status: string;
    showTime?: boolean;
    className?: string;
}

export function DeadlineDisplay({ dueDate, status, showTime = true, className = "" }: DeadlineDisplayProps) {
    if (!dueDate) return null;

    const due = new Date(dueDate);
    const config = getUrgencyConfig(dueDate, status);
    const now = new Date();

    // Calculate time remaining or overdue
    const hoursRemaining = differenceInHours(due, now);
    const daysRemaining = differenceInDays(due, now);

    let timeText = "";
    if (status === "DONE") {
        timeText = `Completed`;
    } else if (hoursRemaining < 0) {
        const hoursOverdue = Math.abs(hoursRemaining);
        if (hoursOverdue < 24) {
            timeText = `${hoursOverdue}h overdue`;
        } else {
            timeText = `${Math.abs(daysRemaining)}d overdue`;
        }
    } else if (hoursRemaining < 1) {
        const minutesRemaining = Math.max(0, Math.round((due.getTime() - now.getTime()) / 60000));
        timeText = `${minutesRemaining}m left`;
    } else if (hoursRemaining < 24) {
        timeText = `${hoursRemaining}h left`;
    } else if (daysRemaining < 7) {
        timeText = `${daysRemaining}d left`;
    } else {
        timeText = format(due, "MMM d");
    }

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <UrgencyBadge dueDate={dueDate} status={status} showLabel={false} />
            <span
                className="text-xs font-medium"
                style={{ color: config.color }}
            >
                {timeText}
            </span>
            {showTime && (
                <span className="text-xs text-gray-400">
                    {format(due, "h:mm a")}
                </span>
            )}
        </div>
    );
}
