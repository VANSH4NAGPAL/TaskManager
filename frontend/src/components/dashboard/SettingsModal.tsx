import { useState, useEffect } from "react";
import { Modal } from "../ui/modal";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProfile, updateProfile } from "../../lib/api";
import { Loader2, User, Settings, LayoutList, KanbanSquare } from "lucide-react";
import { toast } from "sonner";
import { CustomSelect } from "../ui/select";

const TIMEZONE_OPTIONS = [
    { value: "UTC", label: "UTC (Coordinated Universal Time)" },
    { value: "America/New_York", label: "Eastern Time (US & Canada)" },
    { value: "America/Chicago", label: "Central Time (US & Canada)" },
    { value: "America/Denver", label: "Mountain Time (US & Canada)" },
    { value: "America/Los_Angeles", label: "Pacific Time (US & Canada)" },
    { value: "Europe/London", label: "Europe: London" },
    { value: "Europe/Paris", label: "Europe: Paris" },
    { value: "Europe/Berlin", label: "Europe: Berlin" },
    { value: "Asia/Kolkata", label: "Asia: India Standard Time (IST)" },
    { value: "Asia/Dubai", label: "Asia: Dubai" },
    { value: "Asia/Singapore", label: "Asia: Singapore" },
    { value: "Asia/Tokyo", label: "Asia: Tokyo" },
    { value: "Australia/Sydney", label: "Australia: Sydney" },
];

interface SettingsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    defaultTab?: "profile" | "preferences";
}

export function SettingsModal({ open, onOpenChange, defaultTab = "profile" }: SettingsModalProps) {
    const queryClient = useQueryClient();
    const { data: user, isLoading } = useQuery({
        queryKey: ["profile"],
        queryFn: getProfile,
        enabled: open,
    });

    const [name, setName] = useState("");
    const [defaultView, setDefaultView] = useState<"LIST" | "BOARD">("LIST");
    const [timezone, setTimezone] = useState("UTC");
    const [activeTab, setActiveTab] = useState<"profile" | "preferences">(defaultTab);

    useEffect(() => {
        if (open) {
            setActiveTab(defaultTab);
        }
    }, [open, defaultTab]);

    useEffect(() => {
        if (user) {
            setName(user.name);
            setDefaultView(user.defaultView || "LIST");
            setTimezone(user.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
        }
    }, [user]);

    const updateMutation = useMutation({
        mutationFn: updateProfile,
        onSuccess: (data) => {
            queryClient.setQueryData(["profile"], data);
            queryClient.setQueryData(["me"], data); // Optimistic update for other components
            queryClient.invalidateQueries({ queryKey: ["me"] });
            toast.success("Settings updated");
            onOpenChange(false);
        },
        onError: () => {
            toast.error("Failed to update settings");
        },
    });

    const handleSave = () => {
        updateMutation.mutate({
            name,
            defaultView,
            timezone,
        });
    };

    if (isLoading && !user) return null;

    return (
        <Modal open={open} title="Settings" onClose={() => onOpenChange(false)}>
            <div className="flex gap-4 min-h-[300px]">
                {/* Sidebar */}
                <div className="w-1/3 border-r pr-4 space-y-1">
                    <button
                        onClick={() => setActiveTab("profile")}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 ${activeTab === "profile" ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:bg-gray-50"
                            }`}
                    >
                        <User className="w-4 h-4" />
                        Profile
                    </button>
                    <button
                        onClick={() => setActiveTab("preferences")}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 ${activeTab === "preferences" ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:bg-gray-50"
                            }`}
                    >
                        <Settings className="w-4 h-4" />
                        Preferences
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 space-y-6">
                    {activeTab === "profile" && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Name</label>
                                <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Your name"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Email</label>
                                <Input
                                    value={user?.email}
                                    disabled
                                    className="bg-gray-50 text-gray-500"
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === "preferences" && (
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-sm font-medium text-gray-700">Default View</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => setDefaultView("LIST")}
                                        className={`p-3 rounded-lg border flex flex-col items-center gap-2 transition-all ${defaultView === "LIST"
                                            ? "border-teal-500 bg-teal-50 text-teal-700 ring-1 ring-teal-500"
                                            : "border-gray-200 hover:border-gray-300 text-gray-600"
                                            }`}
                                    >
                                        <LayoutList className="w-5 h-5" />
                                        <span className="text-xs font-medium">List View</span>
                                    </button>
                                    <button
                                        onClick={() => setDefaultView("BOARD")}
                                        className={`p-3 rounded-lg border flex flex-col items-center gap-2 transition-all ${defaultView === "BOARD"
                                            ? "border-teal-500 bg-teal-50 text-teal-700 ring-1 ring-teal-500"
                                            : "border-gray-200 hover:border-gray-300 text-gray-600"
                                            }`}
                                    >
                                        <KanbanSquare className="w-5 h-5" />
                                        <span className="text-xs font-medium">Board View</span>
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500">
                                    This view will be selected automatically when you login.
                                </p>
                            </div>

                            <div className="space-y-3">
                                <label className="text-sm font-medium text-gray-700">Timezone</label>
                                <div className="w-full">
                                    <CustomSelect
                                        value={timezone}
                                        onChange={setTimezone}
                                        options={TIMEZONE_OPTIONS}
                                    />
                                </div>
                                <p className="text-xs text-gray-500">
                                    Used for task scheduling and reminders.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button onClick={handleSave} disabled={updateMutation.isPending}>
                    {updateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Save Changes
                </Button>
            </div>
        </Modal>
    );
}
