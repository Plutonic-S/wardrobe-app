// src/app/(main)/calendar/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useAuthGuard } from '@/features/auth/components/authGuard';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { startOfMonth, endOfMonth } from 'date-fns';
import { Check } from 'lucide-react';
import Image from 'next/image';
import { TodayCard } from '@/features/calendar/components/TodayCard';
import { OutfitSelectorModal } from '@/features/calendar/components/OutfitSelectorModal';
import type { OutfitAssignment } from '@/features/calendar/types/calendar.types';

// Calendar value type
type CalendarValue = Date | null;
type CalendarChangeValue = Date | null | [Date | null, Date | null];

export default function CalendarPage() {
  const { user, isChecking } = useAuthGuard({
    requireAuth: true,
    redirectTo: '/login',
  });

  // Detect mobile
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // State
  const [selectedDate, setSelectedDate] = useState<CalendarValue>(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [assignments, setAssignments] = useState<OutfitAssignment[]>([]);
  const [todayAssignment, setTodayAssignment] = useState<OutfitAssignment | null>(null);
  const [tomorrowAssignment, setTomorrowAssignment] = useState<OutfitAssignment | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDateForAssign, setSelectedDateForAssign] = useState<Date | null>(null);

  // Fetch assignments when month changes
  useEffect(() => {
    if (!user) return;
    fetchAssignments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, currentMonth]);

  // Fetch assignments for current view
  const fetchAssignments = async () => {
    try {
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);

      const response = await fetch(
        `/api/calendar/assignments?start=${start.toISOString()}&end=${end.toISOString()}`,
        { credentials: 'include' }
      );

      if (response.ok) {
        const data = await response.json();
        setAssignments(data.data.assignments || []);
      }

      // Fetch today/tomorrow for sidebar
      const quickResponse = await fetch('/api/calendar/quick-view', {
        credentials: 'include',
      });

      if (quickResponse.ok) {
        const data = await quickResponse.json();
        setTodayAssignment(data.data.today);
        setTomorrowAssignment(data.data.tomorrow);
      }
    } catch (error) {
      console.error('Failed to fetch assignments:', error);
    }
  };

  // Handle date selection change
  const handleDateChange = (value: CalendarChangeValue) => {
    if (Array.isArray(value)) {
      setSelectedDate(value[0]);
    } else {
      setSelectedDate(value);
    }
  };

  // Handle date click
  const handleDateClick = (date: CalendarValue) => {
    if (!date) return;

    // Prevent selecting dates in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) {
      return; // Don't open modal for past dates
    }

    setSelectedDateForAssign(date);
    setIsModalOpen(true);
  };

  // Helper to format date as local date string (YYYY-MM-DD)
  const formatLocalDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Handle outfit assignment with optimistic update
  const handleAssignOutfit = async (outfitId: string, occasion?: string) => {
    if (!selectedDateForAssign) return;

    // Close modal immediately
    setIsModalOpen(false);

    // Make API call and refresh
    try {
      await fetch('/api/calendar/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          outfitId,
          assignedDate: formatLocalDate(selectedDateForAssign),
          occasion,
        }),
      });

      await fetchAssignments();
    } catch (error) {
      console.error('Failed to assign outfit:', error);
      await fetchAssignments();
    }
  };

  // Mark as worn
  const handleMarkWorn = async (assignmentId: string) => {
    try {
      await fetch(`/api/calendar/assignments/${assignmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isWorn: true }),
      });

      await fetchAssignments();
    } catch (error) {
      console.error('Failed to mark as worn:', error);
    }
  };

  // Remove assignment
  const handleRemoveAssignment = async (assignmentId: string) => {
    // Close modal immediately
    setIsModalOpen(false);

    try {
      await fetch(`/api/calendar/assignments/${assignmentId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      await fetchAssignments();
    } catch (error) {
      console.error('Failed to remove assignment:', error);
    }
  };

  // Custom tile content for calendar
  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view !== 'month') return null;

    const assignment = assignments.find(
      (a) =>
        new Date(a.assignedDate).toDateString() === date.toDateString()
    );

    if (!assignment) return null;

    return (
      <div className="flex flex-col items-center mt-1">
        {assignment.outfitId?.previewImage?.url ? (
          <div className="relative w-8 h-8">
            <Image
              src={assignment.outfitId.previewImage.url}
              alt="Outfit"
              fill
              className="rounded-sm object-cover"
              unoptimized
            />
          </div>
        ) : (
          <div className="w-2 h-2 bg-blue-600 rounded-full" />
        )}
        {assignment.isWorn && (
          <Check className="w-3 h-3 text-green-500 mt-0.5" />
        )}
      </div>
    );
  };

  // Custom tile className
  const tileClassName = ({ date, view }: { date: Date; view: string }) => {
    if (view !== 'month') return '';

    const classes: string[] = [];

    // Check if date has assignment
    const hasAssignment = assignments.some(
      (a) =>
        new Date(a.assignedDate).toDateString() === date.toDateString()
    );
    if (hasAssignment) {
      classes.push('has-assignment');
    }

    // Check if date is in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) {
      classes.push('past-date');
    }

    return classes.join(' ');
  };

  if (isChecking) return <div>Loading...</div>;
  if (!user) return null;

  // Mobile View - Compact calendar with quick access
  if (isMobile) {
    return (
      <div className="min-h-[calc(100vh-3.75rem)] bg-background p-4">
        <h1 className="text-2xl font-bold mb-4">Outfit Planner</h1>

        {/* Quick Access Cards */}
        <div className="space-y-3 mb-4">
          <TodayCard
            assignment={todayAssignment}
            onMarkWorn={handleMarkWorn}
            onRemove={handleRemoveAssignment}
            onAssign={() => {
              setSelectedDateForAssign(new Date());
              setIsModalOpen(true);
            }}
          />

          <TodayCard
            assignment={tomorrowAssignment}
            title="Tomorrow's Outfit"
            onMarkWorn={handleMarkWorn}
            onRemove={handleRemoveAssignment}
            onAssign={() => {
              const tomorrow = new Date();
              tomorrow.setDate(tomorrow.getDate() + 1);
              setSelectedDateForAssign(tomorrow);
              setIsModalOpen(true);
            }}
          />
        </div>

        {/* Compact Calendar */}
        <div className="bg-card border border-border rounded-lg p-3">
          <Calendar
            value={selectedDate}
            onChange={handleDateChange}
            onClickDay={handleDateClick}
            onActiveStartDateChange={({ activeStartDate }) =>
              setCurrentMonth(activeStartDate || new Date())
            }
            tileContent={({ date, view }) => {
              if (view !== 'month') return null;

              const assignment = assignments.find(
                (a) => new Date(a.assignedDate).toDateString() === date.toDateString()
              );

              if (!assignment) return null;

              return (
                <div className="flex justify-center mt-0.5">
                  {assignment.outfitId?.previewImage?.url ? (
                    <div className="relative w-4 h-4 rounded-full overflow-hidden">
                      <Image
                        src={assignment.outfitId.previewImage.url}
                        alt="Outfit"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="w-2 h-2 bg-primary rounded-full" />
                  )}
                </div>
              );
            }}
            tileClassName={tileClassName}
            className="outfit-calendar-mobile w-full"
            locale="en-US"
          />

          {/* Legend */}
          <div className="flex items-center justify-center gap-3 mt-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-primary rounded-full" />
              <span>Planned</span>
            </div>
            <div className="flex items-center gap-1">
              <Check className="w-3 h-3 text-green-500" />
              <span>Worn</span>
            </div>
          </div>
        </div>

        {/* Month Stats */}
        <div className="mt-4 bg-card border border-border rounded-lg p-3">
          <h3 className="font-semibold text-sm mb-2">This Month</h3>
          <div className="flex gap-4 text-sm">
            <div className="flex-1">
              <span className="text-muted-foreground">Planned</span>
              <p className="font-medium text-lg">{assignments.length}</p>
            </div>
            <div className="flex-1">
              <span className="text-muted-foreground">Worn</span>
              <p className="font-medium text-lg">
                {assignments.filter((a) => a.isWorn).length}
              </p>
            </div>
          </div>
        </div>

        <OutfitSelectorModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSelect={handleAssignOutfit}
          onRemove={handleRemoveAssignment}
          selectedDate={selectedDateForAssign}
          currentAssignment={
            selectedDateForAssign
              ? assignments.find(
                  (a) =>
                    new Date(a.assignedDate).toDateString() ===
                    selectedDateForAssign.toDateString()
                )
              : undefined
          }
        />
      </div>
    );
  }

  // Desktop View - Full Calendar
  return (
    <div className="min-h-[calc(100vh-3.75rem)] bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Outfit Calendar</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Calendar */}
          <div className="lg:col-span-2">
            <div className="bg-card border border-border rounded-lg p-6">
              <Calendar
                value={selectedDate}
                onChange={handleDateChange}
                onClickDay={handleDateClick}
                onActiveStartDateChange={({ activeStartDate }) =>
                  setCurrentMonth(activeStartDate || new Date())
                }
                tileContent={tileContent}
                tileClassName={tileClassName}
                className="outfit-calendar w-full"
                locale="en-US"
              />

              {/* Legend */}
              <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                  <span>Has outfit</span>
                </div>
                <div className="flex items-center gap-1">
                  <Check className="w-3 h-3 text-green-500" />
                  <span>Worn</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <TodayCard
              assignment={todayAssignment}
              onMarkWorn={handleMarkWorn}
              onRemove={handleRemoveAssignment}
              onAssign={() => {
                setSelectedDateForAssign(new Date());
                setIsModalOpen(true);
              }}
            />

            <TodayCard
              assignment={tomorrowAssignment}
              title="Tomorrow's Outfit"
              onMarkWorn={handleMarkWorn}
              onRemove={handleRemoveAssignment}
              onAssign={() => {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                setSelectedDateForAssign(tomorrow);
                setIsModalOpen(true);
              }}
            />

            {/* Quick Stats */}
            <div className="bg-card border border-border rounded-lg p-4">
              <h3 className="font-semibold mb-2">This Month</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Planned</span>
                  <span className="font-medium">{assignments.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Worn</span>
                  <span className="font-medium">
                    {assignments.filter((a) => a.isWorn).length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Outfit Selector Modal */}
      <OutfitSelectorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={handleAssignOutfit}
        onRemove={handleRemoveAssignment}
        selectedDate={selectedDateForAssign}
        currentAssignment={
          selectedDateForAssign
            ? assignments.find(
                (a) =>
                  new Date(a.assignedDate).toDateString() ===
                  selectedDateForAssign.toDateString()
              )
            : undefined
        }
      />
    </div>
  );
}
