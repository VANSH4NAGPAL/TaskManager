import { useState } from "react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday } from "date-fns";
import { ChevronLeft, ChevronRight, Clock, Calendar as CalendarIcon, ArrowLeft } from "lucide-react";
import { Task } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { DeadlineDisplay } from "../ui/UrgencyBadge";

interface CalendarViewProps {
    tasks: Task[];
    onTaskClick: (task: Task) => void;
}

export function CalendarView({ tasks, onTaskClick }: CalendarViewProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const days = eachDayOfInterval({
        start: startDate,
        end: endDate,
    });

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
    const today = () => setCurrentMonth(new Date());

    // Filter tasks with due dates
    const datedTasks = tasks.filter(t => t.dueDate || t.isTimeBased);

    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm h-full flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white relative z-10">
                <div className="flex items-center gap-3">
                    {selectedDate ? (
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setSelectedDate(null)}
                                className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5 text-gray-600" />
                            </button>
                            <h2 className="text-xl font-bold text-gray-900">
                                {format(selectedDate, "EEEE, MMMM d")}
                            </h2>
                        </div>
                    ) : (
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            {format(currentMonth, "MMMM yyyy")}
                        </h2>
                    )}

                    {!selectedDate && (
                        <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
                            <button onClick={prevMonth} className="p-1.5 hover:bg-white hover:shadow-sm rounded-md transition-all text-gray-600">
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button onClick={today} className="px-3 py-1 text-xs font-semibold text-gray-600 hover:text-gray-900 transition-colors border-x border-gray-200/50">
                                Today
                            </button>
                            <button onClick={nextMonth} className="p-1.5 hover:bg-white hover:shadow-sm rounded-md transition-all text-gray-600">
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden relative bg-gray-50">
                <AnimatePresence mode="wait">
                    {selectedDate ? (
                        <motion.div
                            key="day-view"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.2 }}
                            className="h-full overflow-y-auto p-6"
                        >
                            <div className="max-w-3xl mx-auto space-y-4">
                                {datedTasks.filter(t => t.dueDate && isSameDay(new Date(t.dueDate), selectedDate)).length === 0 ? (
                                    <div className="text-center py-12">
                                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <CalendarIcon className="w-8 h-8 text-gray-400" />
                                        </div>
                                        <h3 className="text-lg font-medium text-gray-900">No tasks for this day</h3>
                                        <p className="text-gray-500">Enjoy your free time!</p>
                                    </div>
                                ) : (
                                    datedTasks
                                        .filter(t => t.dueDate && isSameDay(new Date(t.dueDate), selectedDate))
                                        .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
                                        .map(task => (
                                            <motion.div
                                                key={task.id}
                                                layoutId={`task-${task.id}`}
                                                onClick={() => onTaskClick(task)}
                                                className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                                                whileHover={{ scale: 1.01 }}
                                            >
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex-1">
                                                        <h4 className="text-base font-semibold text-gray-900 mb-1 group-hover:text-teal-700 transition-colors">
                                                            {task.title}
                                                        </h4>
                                                        <p className="text-sm text-gray-500 line-clamp-2 mb-3">{task.description.replace(/<[^>]*>?/gm, '')}</p>
                                                        <div className="flex items-center gap-3 text-xs text-gray-500">
                                                            <DeadlineDisplay dueDate={task.dueDate} status={task.status} />
                                                        </div>
                                                    </div>
                                                    <div className={`w-1.5 self-stretch rounded-full ${task.status === "DONE" ? "bg-gray-200" :
                                                        task.status === "IN_PROGRESS" ? "bg-amber-400" : "bg-teal-500"
                                                        }`} />
                                                </div>
                                            </motion.div>
                                        ))
                                )}
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key={currentMonth.toString()}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="flex flex-col h-full"
                        >
                            {/* Grid Header */}
                            <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50/50 flex-shrink-0">
                                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                                    <div key={day} className="py-3 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                        {day}
                                    </div>
                                ))}
                            </div>

                            {/* Grid */}
                            <div className="grid grid-cols-7 flex-1 auto-rows-[minmax(120px,_1fr)] overflow-y-auto no-scrollbar gap-px bg-gray-200/50">
                                {days.map((day, dayIdx) => {
                                    const dayTasks = datedTasks.filter(t => t.dueDate && isSameDay(new Date(t.dueDate), day));
                                    const isCurrentMonth = isSameMonth(day, monthStart);

                                    return (
                                        <div
                                            key={day.toString()}
                                            onClick={() => setSelectedDate(day)}
                                            className={`bg-white p-2 flex flex-col gap-1 transition-colors cursor-pointer ${!isCurrentMonth ? "bg-gray-50/30 text-gray-400" : "hover:bg-gray-50"
                                                }`}
                                        >
                                            <div className="flex justify-between items-start pointer-events-none">
                                                <span className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${isToday(day)
                                                    ? "bg-teal-600 text-white shadow-sm ring-2 ring-teal-100"
                                                    : isCurrentMonth ? "text-gray-700" : "text-gray-400"
                                                    }`}>
                                                    {format(day, "d")}
                                                </span>
                                            </div>

                                            <div className="flex-1 flex flex-col gap-1.5 mt-1 overflow-hidden pointer-events-none">
                                                {dayTasks.slice(0, 4).map(task => (
                                                    <div
                                                        key={task.id}
                                                        className={`text-left text-xs p-1.5 rounded-lg border shadow-sm w-full relative overflow-hidden ${task.status === "DONE"
                                                            ? "bg-gray-50 text-gray-400 border-gray-100 opacity-60"
                                                            : "bg-white text-gray-700 border-gray-200"
                                                            }`}
                                                    >
                                                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${task.status === "DONE" ? "bg-gray-300" :
                                                            task.status === "IN_PROGRESS" ? "bg-amber-400" : "bg-teal-500"
                                                            }`} />
                                                        <div className="pl-2 truncate font-medium">{task.title}</div>
                                                    </div>
                                                ))}
                                                {dayTasks.length > 4 && (
                                                    <div className="text-[10px] text-gray-400 pl-1 font-medium">
                                                        + {dayTasks.length - 4} more
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
