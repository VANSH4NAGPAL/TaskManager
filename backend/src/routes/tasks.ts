import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { HttpError } from "../utils/errors";
import { createNotification } from "./notifications";
import PDFDocument from "pdfkit";

export const taskRouter = Router();

const statusEnum = z.enum(["TODO", "IN_PROGRESS", "DONE"]);

const querySchema = z.object({
  q: z.string().optional(),
  status: statusEnum.optional(),
  tag: z.string().optional(),
  due: z.string().datetime().optional(),
  archived: z.enum(["true", "false"]).optional(),
});

const createSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional().default(""),
  status: statusEnum.optional(),
  tags: z.array(z.string()).optional().default([]),
  dueDate: z.string().datetime().optional().nullable(),
  reminders: z.array(z.object({
    type: z.enum(["relative", "custom"]),
    beforeMinutes: z.number().optional(),
    customDate: z.string().datetime().optional().nullable(),
    value: z.number().optional(),
    unit: z.enum(["minutes", "hours", "days"]).optional(),
    repeat: z.boolean().optional(),
    repeatInterval: z.string().optional(),
    repeatCount: z.number().optional(),
  })).optional(),
  isTimeBased: z.boolean().optional(),
});

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: statusEnum.optional(),
  tags: z.array(z.string()).optional(),
  dueDate: z.string().datetime().optional().nullable(),
  reminders: z.array(z.object({
    type: z.enum(["relative", "custom"]),
    beforeMinutes: z.number().optional(),
    customDate: z.string().datetime().optional().nullable(),
    value: z.number().optional(),
    unit: z.enum(["minutes", "hours", "days"]).optional(),
    repeat: z.boolean().optional(),
    repeatInterval: z.string().optional(),
    repeatCount: z.number().optional(),
  })).optional(),
  isTimeBased: z.boolean().optional(),
});



// Helper to check if user has access to a task
async function getTaskWithAccess(taskId: string, userId: string, requiredPermission?: "EDITOR" | "VIEWER") {
  const ownedTask = await prisma.task.findFirst({
    where: { id: taskId, userId },
    include: {
      user: { select: { id: true, name: true, email: true } },
      sharedWith: { include: { user: { select: { id: true, name: true, email: true } } } }
    }
  });

  if (ownedTask) {
    return { task: ownedTask, role: "OWNER" as const };
  }

  const share = await prisma.taskShare.findFirst({
    where: { taskId, userId },
    include: {
      task: {
        include: {
          user: { select: { id: true, name: true, email: true } },
          sharedWith: { include: { user: { select: { id: true, name: true, email: true } } } }
        }
      }
    }
  });

  if (!share) return null;

  if (requiredPermission === "EDITOR" && share.permission !== "EDITOR") {
    return null;
  }

  return { task: share.task, role: share.permission };
}


// Strip HTML tags for export
function stripHtml(html: string) {
  if (!html) return "";
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .trim();
}

// Format status for display
function formatStatus(status: string): string {
  switch (status) {
    case "TODO": return "To Do";
    case "IN_PROGRESS": return "In Progress";
    case "DONE": return "Done";
    default: return status;
  }
}

// List tasks (own)
taskRouter.get(
  "/",
  requireAuth,
  asyncHandler(async (req: AuthRequest, res) => {
    if (!req.userId) throw new HttpError(401, "Unauthorized");

    const parsedQuery = querySchema.safeParse({
      q: typeof req.query.q === "string" ? req.query.q : undefined,
      status: typeof req.query.status === "string" ? req.query.status : undefined,
      tag: typeof req.query.tag === "string" ? req.query.tag : undefined,
      due: typeof req.query.due === "string" ? req.query.due : undefined,
      archived: typeof req.query.archived === "string" ? req.query.archived : undefined,
    });

    if (!parsedQuery.success) {
      throw new HttpError(400, "Invalid query params", parsedQuery.error.flatten().fieldErrors);
    }

    const { q, status, tag, due, archived } = parsedQuery.data;
    const showArchived = archived === "true";

    const tasks = await prisma.task.findMany({
      where: {
        userId: req.userId,
        archived: showArchived,
        deletedAt: null, // Exclude soft-deleted tasks
        status,
        tags: tag ? { has: tag } : undefined,
        OR: q
          ? [
            { title: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
          ]
          : undefined,
        dueDate: due ? { lte: new Date(due) } : undefined,
      },
      include: {
        sharedWith: {
          include: { user: { select: { id: true, name: true, email: true } } }
        }
      },
      orderBy: { updatedAt: "desc" },
    });

    res.json({ tasks: tasks.map(t => ({ ...t, isOwner: true })) });
  })
);

// Get tasks shared with me
taskRouter.get(
  "/shared",
  requireAuth,
  asyncHandler(async (req: AuthRequest, res) => {
    if (!req.userId) throw new HttpError(401, "Unauthorized");

    const shares = await prisma.taskShare.findMany({
      where: { userId: req.userId },
      include: {
        task: {
          include: {
            user: { select: { id: true, name: true, email: true } },
            sharedWith: { include: { user: { select: { id: true, name: true, email: true } } } }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    const tasks = shares
      .filter(s => !s.task.archived)
      .map(s => ({
        ...s.task,
        myPermission: s.permission,
        isOwner: false,
        owner: s.task.user
      }));

    res.json({ tasks });
  })
);

// Export tasks as JSON, CSV, or PDF (without IDs)
taskRouter.get(
  "/export",
  requireAuth,
  asyncHandler(async (req: AuthRequest, res) => {
    if (!req.userId) throw new HttpError(401, "Unauthorized");

    const format = req.query.format as string || "json";

    const tasks = await prisma.task.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: "desc" },
    });

    // Clean tasks - remove IDs from export
    const cleanTasks = tasks.map(t => ({
      title: t.title,
      description: stripHtml(t.description),
      status: formatStatus(t.status),
      tags: t.tags,
      dueDate: t.dueDate?.toISOString().split('T')[0] || null,
      archived: t.archived,
      createdAt: t.createdAt.toISOString().split('T')[0],
      updatedAt: t.updatedAt.toISOString().split('T')[0],
    }));

    if (format === "csv") {
      const headers = ["title", "description", "status", "tags", "dueDate", "archived", "createdAt", "updatedAt"];
      const csvRows = [
        headers.join(","),
        ...cleanTasks.map(t => [
          `"${t.title.replace(/"/g, '""')}"`,
          `"${t.description.replace(/"/g, '""')}"`,
          t.status,
          `"${t.tags.join("; ")}"`,
          t.dueDate || "",
          t.archived,
          t.createdAt,
          t.updatedAt
        ].join(","))
      ];

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="tasks-${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csvRows.join("\n"));
    } else if (format === "pdf") {
      const doc = new PDFDocument({ margin: 50 });

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="tasks-${new Date().toISOString().split('T')[0]}.pdf"`);

      doc.pipe(res);

      // Title
      doc.fontSize(24).font('Helvetica-Bold').text('My Tasks', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica').fillColor('#666').text(`Exported on ${new Date().toLocaleDateString()}`, { align: 'center' });
      doc.moveDown(1.5);

      // Tasks
      cleanTasks.forEach((task, index) => {
        // Check if we need a new page
        if (doc.y > 700) {
          doc.addPage();
        }

        // Status color
        let statusColor = '#6b7280';
        if (task.status === 'Done') statusColor = '#10b981';
        else if (task.status === 'In Progress') statusColor = '#f59e0b';

        // Task title with status badge
        doc.fontSize(14).font('Helvetica-Bold').fillColor('#111827').text(task.title, { continued: false });

        // Status
        doc.fontSize(9).font('Helvetica').fillColor(statusColor).text(task.status);
        doc.moveDown(0.3);

        // Description
        doc.fontSize(10).font('Helvetica').fillColor('#4b5563').text(task.description);
        doc.moveDown(0.3);

        // Tags
        if (task.tags.length > 0) {
          doc.fontSize(9).fillColor('#6b7280').text(`Tags: ${task.tags.join(', ')}`);
        }

        // Due date
        if (task.dueDate) {
          doc.fontSize(9).fillColor('#6b7280').text(`Due: ${task.dueDate}`);
        }

        // Separator
        doc.moveDown(0.8);
        if (index < cleanTasks.length - 1) {
          doc.strokeColor('#e5e7eb').lineWidth(0.5).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
          doc.moveDown(0.8);
        }
      });

      // Footer
      doc.fontSize(8).fillColor('#9ca3af').text('Generated by TM Dashboard', 50, 750, { align: 'center' });

      doc.end();
    } else {
      // JSON
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", `attachment; filename="tasks-${new Date().toISOString().split('T')[0]}.json"`);
      res.send(JSON.stringify({ tasks: cleanTasks, exportedAt: new Date().toISOString() }, null, 2));
    }
  })
);

// Create task
taskRouter.post(
  "/",
  requireAuth,
  asyncHandler(async (req: AuthRequest, res) => {
    if (!req.userId) throw new HttpError(401, "Unauthorized");
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, "Invalid payload", parsed.error.flatten().fieldErrors);
    }

    const task = await prisma.task.create({
      data: {
        title: parsed.data.title,
        description: parsed.data.description,
        status: parsed.data.status ?? "TODO",
        tags: parsed.data.tags ?? [],
        dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
        reminders: parsed.data.reminders ?? [],
        isTimeBased: parsed.data.isTimeBased ?? false,
        userId: req.userId,
      },
    });

    res.status(201).json({ task });
  })
);

// Archive task
taskRouter.post(
  "/:id/archive",
  requireAuth,
  asyncHandler(async (req: AuthRequest, res) => {
    if (!req.userId) throw new HttpError(401, "Unauthorized");

    const access = await getTaskWithAccess(req.params.id, req.userId, "EDITOR");
    if (!access) throw new HttpError(404, "Task not found or no permission");

    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: { archived: true, archivedAt: new Date() },
    });

    // Notify owner if not the one archiving
    if (access.role !== "OWNER") {
      const actor = await prisma.user.findUnique({ where: { id: req.userId } });
      if (actor) {
        await createNotification({
          userId: access.task.userId,
          type: "TASK_ARCHIVED",
          taskId: task.id,
          taskTitle: task.title,
          actorId: req.userId,
          actorName: actor.name,
          message: `${actor.name} archived "${task.title}"`,
        });
      }
    }

    res.json({ task });
  })
);

// Unarchive task
taskRouter.post(
  "/:id/unarchive",
  requireAuth,
  asyncHandler(async (req: AuthRequest, res) => {
    if (!req.userId) throw new HttpError(401, "Unauthorized");

    const access = await getTaskWithAccess(req.params.id, req.userId, "EDITOR");
    if (!access) throw new HttpError(404, "Task not found or no permission");

    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: { archived: false, archivedAt: null },
    });

    res.json({ task });
  })
);

// Update task
taskRouter.patch(
  "/:id",
  requireAuth,
  asyncHandler(async (req: AuthRequest, res) => {
    if (!req.userId) throw new HttpError(401, "Unauthorized");
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, "Invalid payload", parsed.error.flatten().fieldErrors);
    }

    const access = await getTaskWithAccess(req.params.id, req.userId, "EDITOR");
    if (!access) throw new HttpError(404, "Task not found or no permission");

    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: {
        ...parsed.data,
        dueDate:
          parsed.data.dueDate === undefined
            ? access.task.dueDate
            : parsed.data.dueDate === null
              ? null
              : new Date(parsed.data.dueDate),
      },
    });

    // Notify all collaborators about the edit (except the person who made the edit)
    const actor = await prisma.user.findUnique({ where: { id: req.userId } });
    if (actor) {
      // Get all people to notify: owner + all shared users
      const usersToNotify: string[] = [];

      // Add owner (if not the one editing)
      if (access.task.userId !== req.userId) {
        usersToNotify.push(access.task.userId);
      }

      // Add all shared users (except the one editing)
      for (const share of access.task.sharedWith) {
        if (share.userId !== req.userId) {
          usersToNotify.push(share.userId);
        }
      }

      // Calculate what changed for the notification
      const changes: string[] = [];
      if (parsed.data.status && parsed.data.status !== access.task.status) {
        changes.push(`status to ${formatStatus(parsed.data.status)}`);
      }
      if (parsed.data.title && parsed.data.title !== access.task.title) {
        changes.push(`title`);
      }
      if (parsed.data.dueDate !== undefined) {
        const oldDue = access.task.dueDate ? access.task.dueDate.toISOString() : null;
        const newDue = parsed.data.dueDate ? new Date(parsed.data.dueDate).toISOString() : null;
        if (oldDue !== newDue) {
          changes.push("due date");
        }
      }
      if (parsed.data.description && parsed.data.description !== access.task.description) {
        changes.push("description");
      }

      let actionMessage = "edited";
      if (changes.length === 1) {
        if (changes[0].startsWith("status")) {
          actionMessage = `changed ${changes[0]} of`;
        } else {
          actionMessage = `updated ${changes[0]} for`;
        }
      } else if (changes.length > 0) {
        actionMessage = `updated details for`;
      }

      // Send notifications to all
      for (const userId of usersToNotify) {
        await createNotification({
          userId,
          type: "TASK_EDITED",
          taskId: task.id,
          taskTitle: task.title,
          actorId: req.userId,
          actorName: actor.name,
          message: `${actor.name} ${actionMessage} "${task.title}"`,
        });
      }
    }

    res.json({ task });
  })
);

// Soft delete task (owner only)
taskRouter.delete(
  "/:id",
  requireAuth,
  asyncHandler(async (req: AuthRequest, res) => {
    if (!req.userId) throw new HttpError(401, "Unauthorized");

    const existing = await prisma.task.findFirst({ where: { id: req.params.id, userId: req.userId } });
    if (!existing) throw new HttpError(404, "Task not found or no permission");

    await prisma.task.update({
      where: { id: req.params.id },
      data: { deletedAt: new Date() }
    });
    res.status(204).send();
  })
);

// Helper: Cleanup old trash (tasks deleted > 7 days ago)
async function cleanupOldTrash(userId: string) {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  await prisma.task.deleteMany({
    where: {
      userId,
      deletedAt: {
        not: null,
        lt: sevenDaysAgo
      }
    }
  });
}

// Get Trash (Soft deleted tasks)
taskRouter.get(
  "/trash/all", // using path segment to avoid collision if placed differently
  requireAuth,
  asyncHandler(async (req: AuthRequest, res) => {
    if (!req.userId) throw new HttpError(401, "Unauthorized");

    // Auto-cleanup on access
    await cleanupOldTrash(req.userId);

    const tasks = await prisma.task.findMany({
      where: {
        userId: req.userId,
        deletedAt: { not: null }
      },
      orderBy: { deletedAt: "desc" }
    });

    res.json({ tasks });
  })
);

// Empty Trash
taskRouter.delete(
  "/trash/empty",
  requireAuth,
  asyncHandler(async (req: AuthRequest, res) => {
    if (!req.userId) throw new HttpError(401, "Unauthorized");

    await prisma.task.deleteMany({
      where: {
        userId: req.userId,
        deletedAt: { not: null }
      }
    });

    res.status(204).send();
  })
);


// Restore task
taskRouter.post(
  "/:id/restore",
  requireAuth,
  asyncHandler(async (req: AuthRequest, res) => {
    if (!req.userId) throw new HttpError(401, "Unauthorized");

    // We only allow restoring if we are the owner
    const existing = await prisma.task.findFirst({ where: { id: req.params.id, userId: req.userId } });
    if (!existing) throw new HttpError(404, "Task not found or no permission");

    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: { deletedAt: null }
    });

    res.json({ task });
  })
);

// Permanent delete task
taskRouter.delete(
  "/:id/permanent",
  requireAuth,
  asyncHandler(async (req: AuthRequest, res) => {
    if (!req.userId) throw new HttpError(401, "Unauthorized");

    const existing = await prisma.task.findFirst({ where: { id: req.params.id, userId: req.userId } });
    if (!existing) throw new HttpError(404, "Task not found or no permission");

    await prisma.task.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);
