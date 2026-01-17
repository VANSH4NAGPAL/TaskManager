import { useState, useMemo } from "react";
import {
    format, addDays, isToday, isTomorrow, eachMinuteOfInterval,
    startOfDay, endOfDay, startOfMonth, endOfMonth, eachDayOfInterval,
    addMonths, subMonths, isSameMonth, isSameDay, getDay, isBefore,
    setHours, setMinutes
} from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";
import { Calendar, Clock, ChevronLeft, ChevronRight, X, Sun, CalendarDays, CalendarRange } from "lucide-react";
import { CustomSelect } from "./select";

interface DatePickerProps {
    selected?: Date;
    onSelect: (date: Date | undefined) => void;
    className?: string;
    showQuickPicks?: boolean;
    timezone?: string;
    onOpenSettings?: () => void;
}

export function DatePicker({ selected, onSelect, className, showQuickPicks = true, timezone = "UTC", onOpenSettings }: DatePickerProps) {
    const [showCalendar, setShowCalendar] = useState(false);
    const [viewDate, setViewDate] = useState(new Date());

    // Calculate current time in user's timezone for defaults
    const getZonedNow = () => toZonedTime(new Date(), timezone);
    const zonedSelected = selected ? toZonedTime(selected, timezone) : getZonedNow();

    // Generate and filter time options
    const timeOptions = useMemo(() => {
        const times = eachMinuteOfInterval({
            start: startOfDay(new Date()),
            end: endOfDay(new Date())
        }, { step: 15 });

        const allOptions = times.map(t => ({
            value: format(t, "HH:mm"),
            label: format(t, "h:mm aa"),
            date: t
        }));

        const nowZoned = getZonedNow();
        if (isSameDay(zonedSelected, nowZoned)) {
            const currentMinutes = nowZoned.getHours() * 60 + nowZoned.getMinutes();
            return allOptions.filter(t => {
                const [h, m] = t.value.split(':').map(Number);
                return (h * 60 + m) > currentMinutes;
            });
        }
        return allOptions;
    }, [zonedSelected, timezone]);

    // Helper to get current time string from date
    const currentTime = selected ? format(selected, "HH:mm") : "09:00";

    const quickPicks = [
        { label: "Today", date: new Date(), icon: Sun },
        { label: "Tomorrow", date: addDays(new Date(), 1), icon: Calendar },
        { label: "Next Week", date: addDays(new Date(), 7), icon: CalendarDays },
        { label: "In 2 Weeks", date: addDays(new Date(), 14), icon: CalendarRange },
    ];

    const handleDateSelect = (date: Date | undefined) => {
        if (date) {
            // Preserve time from current selection or default to now (zoned)
            const currentZoned = selected ? toZonedTime(selected, timezone) : getZonedNow();

            // Allow user to pick date, but keep the time they see in UI
            // However, date is a native Date object (UTC/Local based on runtime).
            // We need to construct a new Date that represents the selected YYYY-MM-DD
            // combined with the HH:mm from the UI (which we assume is in 'timezone').

            // Simply: take the date, set hours/mins from currentZoned.
            // But we need to be careful with native setHours vs timezone.
            // Simplified approach: treat 'date' as base, assuming it was picked as "start of day" in local time?
            // Actually 'date' from quickPicks or calendar is usually 'startOfDay(local)'.

            // Let's just update the time components of the date object
            const h = parseInt(format(currentZoned, "H"));
            const m = parseInt(format(currentZoned, "m"));
            date.setHours(h, m, 0, 0);
        }
        onSelect(date);
    };

    const handleTimeChange = (timeString: string) => {
        const [h, m] = timeString.split(':').map(Number);
        const hours = isNaN(h) ? 0 : h;
        const minutes = isNaN(m) ? 0 : m;

        const newZoned = new Date(zonedSelected);
        newZoned.setHours(hours, minutes, 0, 0);

        const newDate = fromZonedTime(newZoned, timezone);
        onSelect(newDate);
    };

    const formatHour = (h: number) => {
        const val = h % 12;
        return val === 0 ? "12" : val.toString();
    };

    const getDateLabel = (date: Date) => {
        if (isToday(date)) return "Today";
        if (isTomorrow(date)) return "Tomorrow";
        return format(date, "EEE, MMM d");
    };

    // --- Custom Calendar Logic ---
    const daysInMonth = eachDayOfInterval({
        start: startOfMonth(viewDate),
        end: endOfMonth(viewDate)
    });

    // Calculate padding days for start of month
    const startDay = getDay(startOfMonth(viewDate));
    const paddingDays = Array.from({ length: startDay });

    const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

    return (
        <div className={`relative ${className}`}>
            {/* Quick Pick Buttons */}
            {showQuickPicks && !selected && (
                <div className="grid grid-cols-2 gap-2 mb-3">
                    {quickPicks.map((pick) => {
                        const Icon = pick.icon;
                        return (
                            <button
                                key={pick.label}
                                type="button"
                                onClick={() => handleDateSelect(pick.date)}
                                className="flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-gray-300 rounded-xl text-sm font-medium text-gray-700 transition-all text-left"
                            >
                                <Icon className="w-4 h-4 text-gray-400" />
                                <span>{pick.label}</span>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Selected Date Display / Calendar Toggle */}
            {selected ? (
                <div className="bg-teal-50 border border-teal-200 rounded-xl p-4">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-teal-500 rounded-xl flex items-center justify-center text-white">
                                <Calendar className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-lg font-semibold text-gray-900">{getDateLabel(selected)}</p>
                                <p className="text-sm text-gray-500">{format(selected, "MMMM d, yyyy")}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => onSelect(undefined)}
                            className="p-1.5 hover:bg-teal-100 rounded-lg transition-colors"
                        >
                            <X className="w-4 h-4 text-gray-400" />
                        </button>
                    </div>

                    {/* Time Picker */}
                    <div className="mt-4 pt-4 border-t border-teal-200/50">
                        <div className="flex items-center justify-between mb-2">
                            <label className="flex items-center gap-2 text-xs font-medium text-gray-600">
                                <Clock className="w-3.5 h-3.5" />
                                Time & Zone
                            </label>
                            {timezone && (
                                <div className="flex items-center gap-1">
                                    <span className="text-xs text-gray-500">{timezone.replace(/_/g, " ")}</span>
                                    {onOpenSettings && (
                                        <button
                                            onClick={onOpenSettings}
                                            className="text-[10px] font-medium text-teal-600 hover:text-teal-700 hover:underline"
                                        >
                                            (Change)
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="w-full">
                            <CustomSelect
                                value={format(zonedSelected, "HH:mm")}
                                onChange={(val) => handleTimeChange(val)}
                                options={timeOptions}
                                size="sm"
                            />
                        </div>

                        <button
                            type="button"
                            onClick={() => setShowCalendar(!showCalendar)}
                            className="ml-auto px-3 py-2 bg-white border border-teal-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-teal-50 transition-colors whitespace-nowrap h-[38px]"
                        >
                            Change Date
                        </button>
                    </div>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => setShowCalendar(!showCalendar)}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-gray-300 rounded-xl text-sm text-gray-600 transition-all text-left"
                >
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <span>Pick a specific date...</span>
                </button>
            )}

            {/* Custom Calendar Popup */}
            {showCalendar && (
                <div className="absolute z-50 left-0 top-full mt-2 bg-white border border-gray-200 rounded-2xl shadow-xl p-4 animate-in fade-in slide-in-from-top-2 duration-200 min-w-[300px]">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900">
                            {format(viewDate, "MMMM yyyy")}
                        </h3>
                        <div className="flex gap-1">
                            <button
                                onClick={() => setViewDate(subMonths(viewDate, 1))}
                                className="p-1 hover:bg-gray-100 rounded-lg text-gray-600"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setViewDate(addMonths(viewDate, 1))}
                                className="p-1 hover:bg-gray-100 rounded-lg text-gray-600"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Week Days */}
                    <div className="grid grid-cols-7 mb-2">
                        {weekDays.map(day => (
                            <div key={day} className="text-center text-xs font-medium text-gray-400 py-1">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Days Grid */}
                    <div className="grid grid-cols-7 gap-1">
                        {paddingDays.map((_, i) => (
                            <div key={`padding-${i}`} />
                        ))}
                        {daysInMonth.map(date => {
                            const isSelected = selected && isSameDay(date, selected);
                            const isTodayDate = isToday(date);
                            const isPast = isBefore(date, startOfDay(new Date()));

                            return (
                                <button
                                    key={date.toString()}
                                    disabled={isPast}
                                    onClick={() => {
                                        handleDateSelect(date);
                                        setShowCalendar(false);
                                    }}
                                    className={`
                                        h-9 w-9 rounded-lg text-sm flex items-center justify-center transition-all
                                        ${isPast
                                            ? "text-gray-300 cursor-not-allowed bg-transparent"
                                            : "hover:bg-gray-100 text-gray-700"
                                        }
                                        ${isSelected ? "bg-teal-500 text-white font-semibold shadow-md shadow-teal-500/20 hover:bg-teal-600" : ""}
                                        ${isTodayDate && !isSelected && !isPast ? "text-teal-600 font-semibold bg-teal-50" : ""}
                                    `}
                                >
                                    {format(date, "d")}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )
            }
        </div >
    );
}
