import { prisma } from "../lib/prisma";

interface ReminderConfig {
    type: string;
    beforeMinutes?: number;
    repeat?: boolean;
    repeatInterval?: string;
    repeatCount?: number;
}

/**
 * Checks for tasks with upcoming reminders and creates notifications
 * Should be called periodically (e.g., every minute)
 */
export async function checkReminders() {
    const now = new Date();

    // Get all tasks with due dates and reminders that haven't been notified
    const tasks = await prisma.task.findMany({
        where: {
            isTimeBased: true,
            dueDate: { not: null },
            archived: false,
            status: { not: "DONE" }
        },
        include: {
            user: { select: { id: true, email: true, name: true } }
        }
    });

    for (const task of tasks) {
        if (!task.dueDate || !task.reminders) continue;

        // Safely parse reminders JSON
        let reminders: ReminderConfig[] = [];
        try {
            if (Array.isArray(task.reminders)) {
                reminders = task.reminders as unknown as ReminderConfig[];
            }
        } catch {
            continue;
        }

        if (reminders.length === 0) continue;

        for (const reminder of reminders) {
            const beforeMinutes = reminder.beforeMinutes || 30;
            const reminderTime = new Date(task.dueDate.getTime() - beforeMinutes * 60 * 1000);

            // Check if it's time to send this reminder (within 1 minute window)
            const timeDiff = Math.abs(now.getTime() - reminderTime.getTime());
            const withinWindow = timeDiff < 60 * 1000; // 1 minute window

            // Also check if reminder time is in the past but dueDate is still in future
            const isPastReminder = reminderTime <= now && task.dueDate > now;

            if (withinWindow || isPastReminder) {
                // Check if we already sent this reminder
                const existingNotification = await prisma.notification.findFirst({
                    where: {
                        userId: task.userId,
                        taskId: task.id,
                        type: "REMINDER",
                        createdAt: {
                            gte: new Date(now.getTime() - 5 * 60 * 1000) // Within last 5 minutes
                        }
                    }
                });

                if (!existingNotification) {
                    // Create the reminder notification
                    const timeUntilDue = Math.round((task.dueDate.getTime() - now.getTime()) / (60 * 1000));
                    let message = "";

                    if (timeUntilDue <= 0) {
                        message = `Task "${task.title}" is now due!`;
                    } else if (timeUntilDue < 60) {
                        message = `Task "${task.title}" is due in ${timeUntilDue} minute${timeUntilDue !== 1 ? 's' : ''}`;
                    } else if (timeUntilDue < 1440) {
                        const hours = Math.round(timeUntilDue / 60);
                        message = `Task "${task.title}" is due in ${hours} hour${hours !== 1 ? 's' : ''}`;
                    } else {
                        const days = Math.round(timeUntilDue / 1440);
                        message = `Task "${task.title}" is due in ${days} day${days !== 1 ? 's' : ''}`;
                    }

                    await prisma.notification.create({
                        data: {
                            userId: task.userId,
                            type: "REMINDER",
                            taskId: task.id,
                            taskTitle: task.title,
                            actorId: task.userId, // Self-triggered
                            actorName: "System",
                            message
                        }
                    });

                    console.log(`[Reminder] Sent notification: ${message}`);
                }
            }
        }
    }
}

// Start the reminder checker
let reminderInterval: NodeJS.Timeout | null = null;

export function startReminderScheduler() {
    if (reminderInterval) {
        clearInterval(reminderInterval);
    }

    // Check every minute
    reminderInterval = setInterval(async () => {
        try {
            await checkReminders();
        } catch (error) {
            console.error("[Reminder] Error checking reminders:", error);
        }
    }, 60 * 1000); // Every 60 seconds

    // Also run immediately on startup
    checkReminders().catch(console.error);

    console.log("[Reminder] Scheduler started - checking every minute");
}

export function stopReminderScheduler() {
    if (reminderInterval) {
        clearInterval(reminderInterval);
        reminderInterval = null;
        console.log("[Reminder] Scheduler stopped");
    }
}
