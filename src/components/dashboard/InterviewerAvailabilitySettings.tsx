"use client";

import React, { useState, useEffect } from "react";
import {
  Clock,
  Globe,
  Calendar,
  Plus,
  Trash2,
  Check,
  AlertCircle,
  X,
  Info,
} from "lucide-react";
import { toast } from "react-toastify";
import { apiFetch } from "@/lib/api";

const DAYS_OF_WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const COMMON_TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Dubai",
  "Asia/Dhaka",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
];

interface DayConfig {
  dayOfWeek: number;
  enabled: boolean;
  startTime: string;
  endTime: string;
}

interface DateException {
  date: string;
  unavailable: boolean;
  startTime?: string;
  endTime?: string;
  reason?: string;
}

interface InterviewerAvailabilitySettingsProps {
  onClose?: () => void;
  onSaved?: () => void;
}

export default function InterviewerAvailabilitySettings({
  onClose,
  onSaved,
}: InterviewerAvailabilitySettingsProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [timezone, setTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
  );

  const [days, setDays] = useState<DayConfig[]>(
    DAYS_OF_WEEK.map((_, i) => ({
      dayOfWeek: i,
      enabled: i >= 1 && i <= 5, // Mon-Fri enabled by default
      startTime: "09:00",
      endTime: "17:00",
    }))
  );

  const [exceptions, setExceptions] = useState<DateException[]>([]);
  const [newDate, setNewDate] = useState("");
  const [newUnavailable, setNewUnavailable] = useState(true);
  const [newReason, setNewReason] = useState("");
  const [newStartTime, setNewStartTime] = useState("13:00");
  const [newEndTime, setNewEndTime] = useState("17:00");

  useEffect(() => {
    async function loadAvailability() {
      try {
        setLoading(true);
        const res = await apiFetch("/api/availability/mine");
        if (res && res.availability) {
          const { availability } = res;
          if (availability.timezone) setTimezone(availability.timezone);

          if (Array.isArray(availability.weeklyHours) && availability.weeklyHours.length > 0) {
            setDays((prev) =>
              prev.map((d) => {
                const match = availability.weeklyHours.find(
                  (w: any) => w.dayOfWeek === d.dayOfWeek
                );
                if (match) {
                  return {
                    dayOfWeek: d.dayOfWeek,
                    enabled: true,
                    startTime: match.startTime,
                    endTime: match.endTime,
                  };
                }
                return { ...d, enabled: false };
              })
            );
          }

          if (Array.isArray(availability.exceptions)) {
            setExceptions(availability.exceptions);
          }
        }
      } catch (err: any) {
        console.warn("Could not load existing availability:", err.message);
      } finally {
        setLoading(false);
      }
    }

    loadAvailability();
  }, []);

  const handleToggleDay = (idx: number) => {
    setDays((prev) =>
      prev.map((d, i) => (i === idx ? { ...d, enabled: !d.enabled } : d))
    );
  };

  const handleTimeChange = (
    idx: number,
    field: "startTime" | "endTime",
    val: string
  ) => {
    setDays((prev) =>
      prev.map((d, i) => (i === idx ? { ...d, [field]: val } : d))
    );
  };

  const handleAddException = () => {
    if (!newDate) {
      toast.error("Please pick a date for the exception.");
      return;
    }

    if (exceptions.some((e) => e.date === newDate)) {
      toast.error("An exception for this date already exists.");
      return;
    }

    if (!newUnavailable && newStartTime >= newEndTime) {
      toast.error("Start time must be earlier than end time.");
      return;
    }

    const exc: DateException = {
      date: newDate,
      unavailable: newUnavailable,
      reason: newReason.trim() || undefined,
      startTime: !newUnavailable ? newStartTime : undefined,
      endTime: !newUnavailable ? newEndTime : undefined,
    };

    setExceptions((prev) => [...prev, exc]);
    setNewDate("");
    setNewReason("");
    toast.success("Date override added.");
  };

  const handleRemoveException = (date: string) => {
    setExceptions((prev) => prev.filter((e) => e.date !== date));
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const activeWeeklyHours = days
        .filter((d) => d.enabled)
        .map((d) => ({
          dayOfWeek: d.dayOfWeek,
          startTime: d.startTime,
          endTime: d.endTime,
        }));

      // Validate startTime < endTime
      for (const w of activeWeeklyHours) {
        if (w.startTime >= w.endTime) {
          toast.error(
            `On ${DAYS_OF_WEEK[w.dayOfWeek]}, start time (${w.startTime}) must be earlier than end time (${w.endTime}).`
          );
          setSaving(false);
          return;
        }
      }

      await apiFetch("/api/availability/mine", {
        method: "PUT",
        body: JSON.stringify({
          timezone,
          weeklyHours: activeWeeklyHours,
          exceptions,
        }),
      });

      toast.success("Availability preferences saved successfully!");
      if (onSaved) onSaved();
      if (onClose) onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to save availability.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-zinc-950 p-6 md:p-8 text-white shadow-2xl">
      <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
            <Clock size={20} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">
              Interviewer Availability & Working Hours
            </h2>
            <p className="text-xs text-zinc-400">
              Set your weekly working windows and date overrides to prevent double-booking.
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/5 hover:text-white transition"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-zinc-500">
          Loading availability preferences...
        </div>
      ) : (
        <div className="space-y-6">
          {/* Timezone Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-1.5">
              <Globe size={14} className="text-indigo-400" />
              Primary Time Zone
            </label>
            <div className="flex gap-2">
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/60 px-3.5 py-2.5 text-xs text-white outline-none focus:border-indigo-500"
              >
                {!COMMON_TIMEZONES.includes(timezone) && (
                  <option value={timezone}>{timezone} (Current Device)</option>
                )}
                {COMMON_TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </div>
            <p className="mt-1 text-[11px] text-zinc-500">
              Coordinated panel schedules will automatically be evaluated in this timezone.
            </p>
          </div>

          {/* Weekly Hours */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-1.5">
              <Calendar size={14} className="text-indigo-400" />
              Recurring Weekly Working Hours
            </label>
            <div className="space-y-2.5">
              {days.map((day, idx) => (
                <div
                  key={day.dayOfWeek}
                  className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3 transition ${
                    day.enabled
                      ? "border-white/10 bg-white/[0.02]"
                      : "border-white/5 bg-transparent opacity-50"
                  }`}
                >
                  <div className="flex items-center gap-3 w-32">
                    <input
                      type="checkbox"
                      id={`day-${day.dayOfWeek}`}
                      checked={day.enabled}
                      onChange={() => handleToggleDay(idx)}
                      className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-indigo-600 focus:ring-0 cursor-pointer"
                    />
                    <label
                      htmlFor={`day-${day.dayOfWeek}`}
                      className="text-xs font-medium text-white cursor-pointer select-none"
                    >
                      {DAYS_OF_WEEK[day.dayOfWeek]}
                    </label>
                  </div>

                  {day.enabled ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={day.startTime}
                        onChange={(e) =>
                          handleTimeChange(idx, "startTime", e.target.value)
                        }
                        className="rounded-lg border border-white/10 bg-black px-2.5 py-1 text-xs text-white outline-none focus:border-indigo-500"
                      />
                      <span className="text-xs text-zinc-500">to</span>
                      <input
                        type="time"
                        value={day.endTime}
                        onChange={(e) =>
                          handleTimeChange(idx, "endTime", e.target.value)
                        }
                        className="rounded-lg border border-white/10 bg-black px-2.5 py-1 text-xs text-white outline-none focus:border-indigo-500"
                      />
                    </div>
                  ) : (
                    <span className="text-xs text-zinc-500 italic">
                      Unavailable / Day Off
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Date-Specific Overrides / Exceptions */}
          <div className="border-t border-white/10 pt-5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-1.5">
              <Info size={14} className="text-indigo-400" />
              Date Overrides & Time Off
            </label>
            <p className="text-[11px] text-zinc-400 mb-3">
              Add specific dates where you are completely unavailable (vacations, holidays) or have custom hours.
            </p>

            {/* Existing Overrides */}
            {exceptions.length > 0 ? (
              <div className="space-y-2 mb-4">
                {exceptions.map((exc) => (
                  <div
                    key={exc.date}
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-3.5 py-2.5 text-xs"
                  >
                    <div>
                      <span className="font-semibold text-white mr-2">
                        {exc.date}
                      </span>
                      {exc.unavailable ? (
                        <span className="inline-flex items-center rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-medium text-rose-400 border border-rose-500/20">
                          Unavailable All Day
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400 border border-emerald-500/20">
                          Custom: {exc.startTime} - {exc.endTime}
                        </span>
                      )}
                      {exc.reason && (
                        <span className="ml-2 text-zinc-400 text-[11px]">
                          ({exc.reason})
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveException(exc.date)}
                      className="text-zinc-500 hover:text-rose-400 transition"
                      title="Remove override"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-zinc-500 italic mb-3">
                No date overrides configured.
              </p>
            )}

            {/* Add New Exception Form */}
            <div className="rounded-xl border border-dashed border-white/15 bg-black/40 p-3.5 space-y-3">
              <span className="text-[11px] font-medium text-zinc-300 block">
                Add Date Override
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="rounded-lg border border-white/10 bg-black px-3 py-1.5 text-xs text-white outline-none focus:border-indigo-500"
                />
                <input
                  type="text"
                  placeholder="Reason (e.g. Holiday, Conference)"
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  className="rounded-lg border border-white/10 bg-black px-3 py-1.5 text-xs text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newUnavailable}
                    onChange={(e) => setNewUnavailable(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-zinc-700 bg-zinc-900 text-indigo-600 focus:ring-0"
                  />
                  Mark as completely unavailable
                </label>

                {!newUnavailable && (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="time"
                      value={newStartTime}
                      onChange={(e) => setNewStartTime(e.target.value)}
                      className="rounded border border-white/10 bg-black px-2 py-1 text-xs text-white"
                    />
                    <span className="text-xs text-zinc-500">to</span>
                    <input
                      type="time"
                      value={newEndTime}
                      onChange={(e) => setNewEndTime(e.target.value)}
                      className="rounded border border-white/10 bg-black px-2 py-1 text-xs text-white"
                    />
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleAddException}
                  className="flex items-center gap-1 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/20 transition cursor-pointer"
                >
                  <Plus size={13} /> Add Override
                </button>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-white/10 pt-4">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-white/10 px-4 py-2 text-xs font-medium text-zinc-400 hover:bg-white/5 transition"
              >
                Cancel
              </button>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition disabled:opacity-50 cursor-pointer"
            >
              <Check size={14} />
              {saving ? "Saving Changes..." : "Save Availability"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

