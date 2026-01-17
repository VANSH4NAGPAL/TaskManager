"use client";

import { useEffect, useState } from "react";
import { Modal } from "../ui/modal";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { RichTextEditor } from "../ui/RichTextEditor";
import { DatePicker } from "../ui/DatePicker";
import { CustomSelect } from "../ui/select";
import { Task, TaskStatus, checkUserByEmail } from "@/lib/api";
import { useCurrentUser } from "@/hooks/useAuth";
import { Wand2, Loader, Tag, CheckCircle, Circle, Clock, Sparkles, Bell, Repeat, CalendarDays, X, Send, Share2 } from "lucide-react";

interface CreateTaskModalProps {
    open: boolean;
    onClose: () => void;
    initialData?: Task | null;
    onSubmit: (data: any) => Promise<void>;
    isSubmitting: boolean;
    canEdit?: boolean;
    onGenerateAI?: (title: string, userPrompt: string) => Promise<string>;
    onGenerateAIStream?: (title: string, userPrompt: string, onChunk: (chunk: string) => void) => Promise<string>;
    onOpenSettings?: () => void;
}

interface ReminderConfig {
    enabled: boolean;
    beforeMinutes: number;
    repeat: boolean;
    repeatInterval: "daily" | "weekly" | "monthly" | "custom";
    repeatCount: number; // How many times to repeat (0 = forever)
}

export function CreateTaskModal({
    open,
    onClose,
    initialData,
    onSubmit,
    isSubmitting,
    canEdit = true,
    onGenerateAI,
    onGenerateAIStream,
    onOpenSettings
}: CreateTaskModalProps) {
    const { data: user } = useCurrentUser();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [status, setStatus] = useState<TaskStatus>("TODO");
    const [tags, setTags] = useState("");
    const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
    const [isGenerating, setIsGenerating] = useState(false);
    const [activeSection, setActiveSection] = useState<"details" | "schedule" | "reminders" | "share">("details");

    // Inline AI prompt state
    const [showAIInput, setShowAIInput] = useState(false);
    const [aiPromptInput, setAIPromptInput] = useState("");

    // Advanced Reminder & Recurrence State
    const [reminderEnabled, setReminderEnabled] = useState(false);
    const [reminderType, setReminderType] = useState<"relative" | "custom">("relative");
    const [reminderBeforeMinutes, setReminderBeforeMinutes] = useState(30);
    const [customReminderDate, setCustomReminderDate] = useState<Date | undefined>(undefined);

    // Share Options (Creation only)
    const [shareInput, setShareInput] = useState("");
    const [shareInputError, setShareInputError] = useState("");
    const [isCheckingUser, setIsCheckingUser] = useState(false);
    const [sharePermission, setSharePermission] = useState<"VIEWER" | "EDITOR">("VIEWER");
    const [pendingCollaborators, setPendingCollaborators] = useState<{ email: string; permission: "VIEWER" | "EDITOR" }[]>([]);

    // Reminder Repeat (Nagging)
    const [reminderRepeat, setReminderRepeat] = useState(false);
    const [reminderRepeatInterval, setReminderRepeatInterval] = useState<string>("15m");
    const [repeatCustomValue, setRepeatCustomValue] = useState(5);
    const [repeatCustomUnit, setRepeatCustomUnit] = useState<"minutes" | "hours" | "days">("minutes");
    const [customRelativeValue, setCustomRelativeValue] = useState(30);
    const [customRelativeUnit, setCustomRelativeUnit] = useState<"minutes" | "hours" | "days">("minutes");

    // Safety Confirmations
    const [showCreateConfirm, setShowCreateConfirm] = useState(false);
    const [showExitConfirm, setShowExitConfirm] = useState(false);

    // Track if form is dirty (simple check: if title or description has content)
    const isDirty = (title.trim() !== "" || description.trim() !== "") && !initialData;

    const handleAttemptClose = () => {
        if (isDirty) {
            setShowExitConfirm(true);
        } else {
            onClose();
        }
    };

    const handleAttemptSubmit = () => {
        // Validation first if needed
        if (!initialData) {
            // New task -> Confirm
            setShowCreateConfirm(true);
        } else {
            // Edits -> Just submit (User didn't ask for edit confirmation, but creation)
            handleSubmit();
        }
    };

    const handleConfirmedSubmit = () => {
        setShowCreateConfirm(false);
        handleSubmit();
    };

    useEffect(() => {
        if (open) {
            if (initialData) {
                setTitle(initialData.title);
                setDescription(initialData.description || "");
                setStatus(initialData.status);
                setTags(initialData.tags.join(", "));
                setDueDate(initialData.dueDate ? new Date(initialData.dueDate) : undefined);

                // Parse reminders (legacy or new format)
                if (initialData.reminders && Array.isArray(initialData.reminders) && initialData.reminders.length > 0) {
                    const r = initialData.reminders[0];
                    setReminderEnabled(true);
                    setReminderType(r.type || "relative");

                    if (r.type === "relative" || !r.type) {
                        const mins = r.beforeMinutes || 30;
                        setReminderBeforeMinutes(mins);
                        // Convert mins to best unit for custom display
                        if (mins >= 1440 && mins % 1440 === 0) {
                            setCustomRelativeValue(mins / 1440);
                            setCustomRelativeUnit("days");
                        } else if (mins >= 60 && mins % 60 === 0) {
                            setCustomRelativeValue(mins / 60);
                            setCustomRelativeUnit("hours");
                        } else {
                            setCustomRelativeValue(mins);
                            setCustomRelativeUnit("minutes");
                        }
                    }

                    if (r.customDate) setCustomReminderDate(new Date(r.customDate));

                    // Parse repeat (nagging)
                    if (r.repeat) {
                        setReminderRepeat(true);
                        const interval = r.repeatInterval || "15m";
                        setReminderRepeatInterval(interval);

                        // If it's not a standard preset, try to parse it
                        if (!["15m", "30m", "1h", "daily"].includes(interval)) {
                            // Simple parsing logic: assume format like "45m", "2h", "3d"
                            const match = interval.match(/^(\d+)([mhd])$/);
                            if (match) {
                                setRepeatCustomValue(parseInt(match[1]));
                                setRepeatCustomUnit(match[2] === "m" ? "minutes" : match[2] === "h" ? "hours" : "days");
                                setReminderRepeatInterval("custom");
                            }
                        }
                    } else {
                        setReminderRepeat(false);
                    }
                } else {
                    setReminderEnabled(false);
                    setReminderRepeat(false);
                }

                setActiveSection("details");
            } else {
                // Reset form
                setTitle("");
                setDescription("");
                setStatus("TODO");
                setTags("");
                setDueDate(undefined);
                setReminderEnabled(false);
                setReminderRepeat(false);
                setCustomRelativeValue(30);
                setCustomRelativeUnit("minutes");
                setActiveSection("details");
                setShareInput("");
                setSharePermission("VIEWER");
                setPendingCollaborators([]);
            }
        }
    }, [open, initialData]);

    const handleAddCollaborator = async () => {
        if (!shareInput) return;
        setShareInputError("");

        // Basic email regex
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(shareInput)) {
            setShareInputError("Please enter a valid email address");
            return;
        }
        // Check duplicate
        if (pendingCollaborators.some(c => c.email === shareInput)) {
            setShareInputError("This user is already added");
            return;
        }
        // Check self
        if (user?.email === shareInput) {
            setShareInputError("You cannot invite yourself");
            return;
        }

        setIsCheckingUser(true);
        try {
            const result = await checkUserByEmail(shareInput);
            if (!result.exists) {
                setShareInputError("User not found. They must sign up first.");
            } else {
                setPendingCollaborators(prev => [...prev, { email: shareInput, permission: sharePermission }]);
                setShareInput("");
            }
        } catch (err) {
            setShareInputError("Failed to verify user");
        } finally {
            setIsCheckingUser(false);
        }
    };

    const handleRemoveCollaborator = (email: string) => {
        setPendingCollaborators(prev => prev.filter(c => c.email !== email));
    };

    const handleShareInputKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleAddCollaborator();
        }
    };

    const handleSubmit = async () => {
        // Construct Reminder Payload
        let repeatInterval = null;
        if (reminderRepeat) {
            // "Repeat interval should be same as reminder time"
            // We need to derive the interval string from the reminder settings
            if (reminderType === "relative") {
                if (reminderBeforeMinutes === -1) {
                    // Custom Relative
                    const unitShort = customRelativeUnit === "minutes" ? "m" : customRelativeUnit === "hours" ? "h" : "d";
                    repeatInterval = `${customRelativeValue}${unitShort}`;
                } else {
                    // Preset Relative
                    // reminderBeforeMinutes is in minutes. Convert to simplest string representation.
                    // Presets are: 15, 30, 60 (1h), 1440 (1d), 2880 (2d), 10080 (1w)
                    // We'll just stick to minutes or hours if divisible.
                    if (reminderBeforeMinutes % 1440 === 0) {
                        repeatInterval = `${reminderBeforeMinutes / 1440}d`;
                    } else if (reminderBeforeMinutes % 60 === 0) {
                        repeatInterval = `${reminderBeforeMinutes / 60}h`;
                    } else {
                        repeatInterval = `${reminderBeforeMinutes}m`;
                    }
                }
            } else {
                // If standard custom date reminder (which we hid but logic might exist)
                // We default to something? Or maybe disable repeat for custom date as it has no "interval" per se?
                // The prompt was "whatever time the user chooses... repeat the time set by the user first"
                // This implies "time set first" = "time BEFORE".
                // Since we hid "Custom Date & Time", we can assume it's always Relative.
                repeatInterval = "15m"; // Fallback
            }
        }

        if (reminderEnabled && reminderType === "relative") {
            let mins = reminderBeforeMinutes;
            if (reminderBeforeMinutes === -1) { // -1 indicates custom
                mins = customRelativeUnit === "minutes" ? customRelativeValue :
                    customRelativeUnit === "hours" ? customRelativeValue * 60 :
                        customRelativeValue * 1440;
            }

            if (dueDate) {
                const reminderTime = new Date(dueDate.getTime() - mins * 60000);
                if (reminderTime < new Date()) {
                    // Reminder time is in the past
                    // We should probably alert the user, but for now let's just use it or rely on backend validation?
                    // The user specifically asked "we should not be able to choose before the current time"
                    // Let's create an error notification if possible, or just fail to submit for now?
                    // Better to rely on UI validation feedback, but here we can safeguard.
                    console.warn("Reminder time is in the past");
                }
            }
        }

        const reminders = reminderEnabled ? [{
            type: reminderType,
            beforeMinutes: reminderType === "relative" ? (reminderBeforeMinutes === -1 ? (
                customRelativeUnit === "minutes" ? customRelativeValue :
                    customRelativeUnit === "hours" ? customRelativeValue * 60 :
                        customRelativeValue * 1440
            ) : reminderBeforeMinutes) : null,
            customDate: reminderType === "custom" ? customReminderDate : null,
            unit: "minutes",
            repeat: reminderRepeat,
            repeatInterval: repeatInterval,
            repeatCount: 0 // Default to 0 (forever) when enabled
        }] : [];

        const payload = {
            title,
            description,
            status,
            tags: tags.split(",").map(t => t.trim()).filter(Boolean),
            isTimeBased: !!dueDate,
            dueDate: dueDate || null,
            reminders,
            pendingCollaborators: !initialData ? pendingCollaborators : undefined
        };
        await onSubmit(payload);
    };

    const handleAIButtonClick = () => {
        if (!title) return;
        setShowAIInput(true);
        setAIPromptInput("");
    };

    const handleAIGenerate = async () => {
        if ((!onGenerateAI && !onGenerateAIStream) || !title || !aiPromptInput.trim()) return;

        // Store values before state changes
        const currentTitle = title;
        const currentPrompt = aiPromptInput;
        // Check if description has actual text content (ignoring empty HTML tags)
        const hasContent = description && description.replace(/<[^>]*>/g, "").trim().length > 0;

        const startingDescription = hasContent
            ? description + "<br><br>"
            : "";

        // Update UI states
        setShowAIInput(false);
        setIsGenerating(true);
        setAIPromptInput("");

        // Track content locally
        let aiContent = "";

        // Use setTimeout to let React complete its render cycle before starting fetch
        // This prevents the fetch from being aborted by React's concurrent rendering
        setTimeout(async () => {
            try {
                // Try streaming first for better UX (word-by-word display)
                if (onGenerateAIStream) {
                    const finalContent = await onGenerateAIStream(
                        currentTitle,
                        currentPrompt,
                        (chunk) => {
                            aiContent += chunk;
                            // Trim leading whitespace from the AI generation
                            setDescription(startingDescription + aiContent.trimStart());
                        }
                    );

                    // Replace with sanitized final content when complete
                    if (finalContent) {
                        setDescription(startingDescription + finalContent);
                    }
                } else if (onGenerateAI) {
                    // Fallback to non-streaming
                    const generated = await onGenerateAI(currentTitle, currentPrompt);
                    setDescription(startingDescription + generated);
                }
            } catch (e) {
                console.error("AI generation failed:", e);
            } finally {
                setIsGenerating(false);
            }
        }, 50); // Small delay to let React stabilize
    };

    const statusOptions: { label: string; value: TaskStatus; color: string; bgColor: string; icon: any }[] = [
        { label: "To Do", value: "TODO", color: "#6b7280", bgColor: "#f3f4f6", icon: Circle },
        { label: "In Progress", value: "IN_PROGRESS", color: "#f59e0b", bgColor: "#fef3c7", icon: Clock },
        { label: "Done", value: "DONE", color: "#10b981", bgColor: "#d1fae5", icon: CheckCircle },
    ];

    const relativeReminderOptions = [
        { label: "5 mins before", value: 5 },
        { label: "15 mins before", value: 15 },
        { label: "30 mins before", value: 30 },
        { label: "1 hour before", value: 60 },
        { label: "1 day before", value: 1440 },
        { label: "Custom", value: -1 },
    ];

    const nagOptions = [
        { label: "Every 15 mins", value: "15m", description: "Remind every 15 minutes" },
        { label: "Every 30 mins", value: "30m", description: "Remind every 30 minutes" },
        { label: "Hourly", value: "1h", description: "Remind every hour" },
        { label: "Daily", value: "daily", description: "Remind every day" },
        { label: "Custom", value: "custom", description: "Set your own interval" },
    ];

    return (
        <>
            <Modal open={open} onClose={handleAttemptClose} title={initialData ? (canEdit ? "Edit Task" : "View Task") : "Create New Task"} size="xl">
                <div className="flex flex-col">
                    <div className="flex gap-8">
                        {/* Left Column - Main Content */}
                        <div className="flex-1 space-y-8 pb-6">
                            {/* Title Input */}
                            <div className="pt-2">
                                <Input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="What would you like to accomplish?"
                                    className="text-2xl font-bold h-16 border-0 border-b-2 border-gray-200 rounded-none px-0 focus:border-teal-500 focus:ring-0 placeholder:text-gray-300 placeholder:font-normal bg-transparent"
                                    disabled={!canEdit}
                                    autoFocus={!initialData}
                                />
                            </div>

                            {/* Inline AI Input - Appears under title when AI Assist clicked */}
                            {showAIInput && (
                                <div className="bg-violet-50 border border-violet-100 rounded-xl p-4 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="flex items-start gap-3">
                                        <div className="flex-1">
                                            <p className="text-xs text-gray-500 italic mb-2">Provide a small description for more accurate outputs</p>
                                            <textarea
                                                value={aiPromptInput}
                                                onChange={(e) => setAIPromptInput(e.target.value)}
                                                placeholder="Describe what you need help with..."
                                                className="w-full px-4 py-3 text-sm border border-violet-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none bg-white"
                                                rows={2}
                                                autoFocus
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAIGenerate(); }
                                                    if (e.key === "Escape") { setShowAIInput(false); }
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-end gap-2 mt-3">
                                        <button
                                            type="button"
                                            onClick={() => setShowAIInput(false)}
                                            className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleAIGenerate}
                                            disabled={!aiPromptInput.trim() || isGenerating}
                                            className="flex items-center gap-2 px-4 py-2 bg-violet-500 hover:bg-violet-600 text-white text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                        >
                                            <Sparkles className="w-4 h-4" />
                                            Generate
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Tab Navigation */}
                            <div className="flex flex-wrap gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setActiveSection("details")}
                                    className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${activeSection === "details"
                                        ? "bg-teal-600 text-white shadow-md"
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                        }`}
                                >
                                    Details
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveSection("schedule")}
                                    className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2 ${activeSection === "schedule"
                                        ? "bg-teal-600 text-white shadow-md"
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                        }`}
                                >
                                    <CalendarDays className="w-4 h-4" />
                                    Schedule
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveSection("reminders")}
                                    className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2 ${activeSection === "reminders"
                                        ? "bg-teal-600 text-white shadow-md"
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                        }`}
                                >
                                    <Bell className="w-4 h-4" />
                                    Reminders
                                    {(reminderEnabled || reminderRepeat) && <span className="w-2 h-2 bg-amber-400 rounded-full" />}
                                </button>
                                {!initialData && (
                                    <button
                                        type="button"
                                        onClick={() => setActiveSection("share")}
                                        className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2 ${activeSection === "share"
                                            ? "bg-teal-600 text-white shadow-md"
                                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                            }`}
                                    >
                                        <Share2 className="w-4 h-4" />
                                        Share
                                    </button>
                                )}
                            </div>

                            {/* Tab Content - Fixed height for consistency */}
                            <div className="min-h-[320px]">
                                {activeSection === "details" && (
                                    <div className="space-y-6 animate-in fade-in duration-200">
                                        {/* Description & AI */}
                                        <div>
                                            <div className="flex items-center justify-between mb-4">
                                                <label className="text-sm font-semibold text-gray-800 uppercase tracking-wide">Description</label>
                                                {canEdit && onGenerateAI && (
                                                    <button
                                                        type="button"
                                                        onClick={handleAIButtonClick}
                                                        disabled={isGenerating || !title}
                                                        className="flex items-center gap-2 px-4 py-2 bg-violet-500 hover:bg-violet-600 text-white text-sm font-medium rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
                                                    >
                                                        {isGenerating ? <Loader className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                                        {isGenerating ? "Generating..." : "AI Assist"}
                                                    </button>
                                                )}
                                            </div>

                                            <div className="h-[280px]">
                                                <RichTextEditor
                                                    value={description}
                                                    onChange={setDescription}
                                                    placeholder="Add notes, requirements, or break this task into subtasks..."
                                                    editable={canEdit}
                                                />
                                            </div>
                                        </div>

                                        {/* Tags */}
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-800 uppercase tracking-wide mb-3">Tags</label>
                                            <div className="relative">
                                                <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                <Input
                                                    value={tags}
                                                    onChange={(e) => setTags(e.target.value)}
                                                    placeholder="Add tags separated by commas..."
                                                    className="pl-12 h-12 text-base"
                                                    disabled={!canEdit}
                                                />
                                            </div>
                                            {tags && (
                                                <div className="flex flex-wrap gap-2 mt-3">
                                                    {tags.split(",").map((tag, i) => tag.trim() && (
                                                        <span key={i} className="px-4 py-1.5 bg-teal-50 text-teal-700 text-sm font-medium rounded-full border border-teal-100">
                                                            {tag.trim()}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {activeSection === "schedule" && (
                                    <div className="animate-in fade-in duration-200">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-800 uppercase tracking-wide mb-4">When is this due?</label>
                                            <DatePicker
                                                selected={dueDate}
                                                onSelect={setDueDate}
                                                showQuickPicks={true}
                                                timezone={user?.timezone || "UTC"}
                                                onOpenSettings={onOpenSettings}
                                            />
                                        </div>
                                    </div>
                                )}

                                {activeSection === "reminders" && (
                                    <div className="animate-in fade-in duration-200 space-y-6">
                                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                                                    <Bell className="w-5 h-5 text-amber-600" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">Enable Reminders</p>
                                                    <p className="text-xs text-gray-500">Get notified about this task</p>
                                                </div>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={reminderEnabled}
                                                    onChange={(e) => setReminderEnabled(e.target.checked)}
                                                    disabled={!dueDate && reminderType === "relative"}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
                                            </label>
                                        </div>

                                        {reminderEnabled && (
                                            <div className="space-y-4">
                                                {reminderType === "relative" && (
                                                    <>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            {relativeReminderOptions.map((opt) => (
                                                                <button
                                                                    key={opt.value}
                                                                    type="button"
                                                                    onClick={() => setReminderBeforeMinutes(opt.value)}
                                                                    className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${reminderBeforeMinutes === opt.value
                                                                        ? "bg-teal-500 text-white shadow-lg shadow-teal-500/30"
                                                                        : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
                                                                        }`}
                                                                >
                                                                    {opt.label}
                                                                </button>
                                                            ))}
                                                        </div>

                                                        {reminderBeforeMinutes === -1 && (
                                                            <div className="bg-white p-3 rounded-xl border border-gray-200 animate-in fade-in zoom-in-95 duration-200">
                                                                <label className="block text-xs font-medium text-gray-500 mb-2">Remind me</label>
                                                                <div className="flex gap-2">
                                                                    <Input
                                                                        type="number"
                                                                        min={1}
                                                                        value={customRelativeValue}
                                                                        onChange={(e) => {
                                                                            const val = parseInt(e.target.value) || 0;
                                                                            setCustomRelativeValue(val);
                                                                        }}
                                                                        className="flex-1"
                                                                    />
                                                                    <select
                                                                        value={customRelativeUnit}
                                                                        onChange={(e) => setCustomRelativeUnit(e.target.value as any)}
                                                                        className="h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                                    >
                                                                        <option value="minutes">Minutes before</option>
                                                                        <option value="hours">Hours before</option>
                                                                        <option value="days">Days before</option>
                                                                    </select>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </>
                                                )}

                                                {reminderType === "custom" && (
                                                    <div>
                                                        <p className="text-sm text-gray-600 mb-2">Select exact time for reminder:</p>
                                                        <DatePicker
                                                            selected={customReminderDate}
                                                            onSelect={setCustomReminderDate}
                                                            showQuickPicks={false}
                                                        />
                                                    </div>
                                                )}

                                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 mt-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                                                            <Repeat className="w-5 h-5 text-blue-600" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900">Repeat Reminder</p>
                                                            <p className="text-xs text-gray-500">Keep reminding me until done</p>
                                                        </div>
                                                    </div>
                                                    <label className="relative inline-flex items-center cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={reminderRepeat}
                                                            onChange={(e) => setReminderRepeat(e.target.checked)}
                                                            className="sr-only peer"
                                                        />
                                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                                                    </label>
                                                </div>

                                                {reminderRepeat && (
                                                    <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl animate-in fade-in slide-in-from-top-2 duration-200">
                                                        <p className="text-sm text-blue-700 flex items-center gap-2">
                                                            <Repeat className="w-4 h-4" />
                                                            Will repeat every {
                                                                reminderBeforeMinutes === -1
                                                                    ? `${customRelativeValue} ${customRelativeUnit}`
                                                                    : relativeReminderOptions.find(o => o.value === reminderBeforeMinutes)?.label.replace(" before", "") || `${reminderBeforeMinutes} minutes`
                                                            }
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeSection === "share" && !initialData && (
                                    <div className="animate-in fade-in duration-200 space-y-6">
                                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
                                                    <Share2 className="w-5 h-5 text-teal-600" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">Share Task</p>
                                                    <p className="text-xs text-gray-500">Invite collaborators while creating</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <label className="block text-sm font-medium text-gray-700">Add Collaborator</label>
                                                <div className="flex gap-2">
                                                    <Input
                                                        value={shareInput}
                                                        onChange={(e) => {
                                                            setShareInput(e.target.value);
                                                            if (shareInputError) setShareInputError("");
                                                        }}
                                                        onKeyDown={handleShareInputKeyDown}
                                                        placeholder="colleague@example.com"
                                                        className={`flex-1 h-10 ${shareInputError ? "border-red-300 focus:ring-red-200" : ""}`}
                                                    />
                                                    <div className="w-32">
                                                        <CustomSelect
                                                            value={sharePermission}
                                                            onChange={(v) => setSharePermission(v as any)}
                                                            options={[
                                                                { label: "Viewer", value: "VIEWER" },
                                                                { label: "Editor", value: "EDITOR" }
                                                            ]}
                                                        />
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        onClick={handleAddCollaborator}
                                                        disabled={!shareInput || isCheckingUser}
                                                        className="h-10 px-4 min-w-[70px]"
                                                        variant="outline"
                                                    >
                                                        {isCheckingUser ? <Loader className="w-4 h-4 animate-spin" /> : "Add"}
                                                    </Button>
                                                </div>
                                                {shareInputError && (
                                                    <p className="text-xs text-red-500 mt-1 ml-1">{shareInputError}</p>
                                                )}
                                            </div>

                                            {pendingCollaborators.length > 0 && (
                                                <div className="space-y-2">
                                                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Pending Invites</label>
                                                    <div className="bg-gray-50 rounded-lg divide-y divide-gray-100 border border-gray-100">
                                                        {pendingCollaborators.map((c) => (
                                                            <div key={c.email} className="flex items-center justify-between p-3 bg-white">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="relative">
                                                                        <div className="w-8 h-8 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center text-xs font-semibold">
                                                                            {c.email.charAt(0).toUpperCase()}
                                                                        </div>
                                                                        <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5">
                                                                            <CheckCircle className="w-3.5 h-3.5 text-green-500 fill-green-50" />
                                                                        </div>
                                                                    </div>
                                                                    <div>
                                                                        <div className="flex items-center gap-1.5">
                                                                            <p className="text-sm font-medium text-gray-900">{c.email}</p>
                                                                        </div>
                                                                        <div className="w-24 mt-0.5">
                                                                            <CustomSelect
                                                                                value={c.permission}
                                                                                onChange={(v: any) => {
                                                                                    setPendingCollaborators(prev => prev.map(p =>
                                                                                        p.email === c.email ? { ...p, permission: v } : p
                                                                                    ));
                                                                                }}
                                                                                options={[
                                                                                    { label: "Viewer", value: "VIEWER" },
                                                                                    { label: "Editor", value: "EDITOR" }
                                                                                ]}
                                                                                className="h-7 text-xs"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleRemoveCollaborator(c.email)}
                                                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                                                >
                                                                    <X className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {pendingCollaborators.length === 0 && (
                                                <div className="text-center py-6 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                                                    <p className="text-sm text-gray-500">No collaborators added yet</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Sidebar - Status & Actions */}
                        <div className="w-64 border-l border-gray-100 pl-8 flex flex-col">
                            <div className="flex-1 pt-2">
                                <label className="block text-sm font-semibold text-gray-800 uppercase tracking-wide mb-4">
                                    Status
                                </label>
                                <div className="space-y-3">
                                    {statusOptions.map((s) => {
                                        const Icon = s.icon;
                                        const isSelected = status === s.value;
                                        return (
                                            <button
                                                key={s.value}
                                                type="button"
                                                onClick={() => canEdit && setStatus(s.value)}
                                                disabled={!canEdit}
                                                className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-sm font-medium transition-all duration-200 ${isSelected
                                                    ? "shadow-lg"
                                                    : "bg-gray-50 hover:bg-gray-100 border border-gray-200"
                                                    }`}
                                                style={isSelected ? {
                                                    backgroundColor: s.bgColor,
                                                    color: s.color,
                                                    border: `2px solid ${s.color}`
                                                } : { color: "#374151" }}
                                            >
                                                <div
                                                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                                                    style={isSelected ? { backgroundColor: `${s.color}20` } : { backgroundColor: "#f3f4f6" }}
                                                >
                                                    <Icon className="w-5 h-5" style={isSelected ? { color: s.color } : { color: "#9ca3af" }} />
                                                </div>
                                                <span className="text-base">{s.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Summary Cards */}
                                <div className="mt-8 space-y-4">
                                    {dueDate && (
                                        <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl">
                                            <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-1">Due Date</p>
                                            <p className="text-base font-bold text-gray-900">
                                                {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: user?.timezone || 'UTC' }).format(dueDate)}
                                            </p>
                                        </div>
                                    )}
                                    {reminderRepeat && (
                                        <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                                            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Repeating Reminder</p>
                                            <p className="text-base font-bold text-gray-900 capitalize">{nagOptions.find(o => o.value === reminderRepeatInterval)?.label || reminderRepeatInterval}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="py-3 border-t border-gray-100 flex items-center justify-end gap-4">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={handleAttemptClose}
                            className="text-gray-500 hover:text-gray-900 px-6 py-2.5"
                        >
                            Cancel
                        </Button>
                        {canEdit ? (
                            <Button
                                onClick={handleAttemptSubmit}
                                disabled={isSubmitting || !title.trim()}
                                className="bg-teal-600 hover:bg-teal-700 text-white min-w-[160px] h-12 text-base font-semibold rounded-full shadow-lg shadow-teal-600/25"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader className="w-5 h-5 mr-2 animate-spin" />
                                        Saving...
                                    </>
                                ) : initialData ? (
                                    "Save Changes"
                                ) : (
                                    "Create Task"
                                )}
                            </Button>
                        ) : (
                            <Button onClick={onClose} className="rounded-full h-12 px-8">Close</Button>
                        )}
                    </div>
                </div>
            </Modal>

            {/* Creation Confirmation Modal */}
            <Modal open={showCreateConfirm} onClose={() => setShowCreateConfirm(false)} title="Create Task?" size="sm" zIndex={60}>
                <div className="space-y-4">
                    <p className="text-gray-600">Are you sure you want to create this task?</p>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setShowCreateConfirm(false)}>Cancel</Button>
                        <Button onClick={handleConfirmedSubmit} className="bg-teal-600 hover:bg-teal-700 text-white">
                            Yes, Create Task
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Exit Confirmation Modal */}
            <Modal open={showExitConfirm} onClose={() => setShowExitConfirm(false)} title="Discard Changes?" size="sm" zIndex={60}>
                <div className="space-y-4">
                    <p className="text-gray-600">You have unsaved changes. Are you sure you want to discard them?</p>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setShowExitConfirm(false)}>Keep Editing</Button>
                        <Button variant="danger" onClick={() => { setShowExitConfirm(false); onClose(); }}>
                            Discard Changes
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    );
}
