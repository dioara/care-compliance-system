import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { useLocation } from '@/contexts/LocationContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, ChevronLeft, ChevronRight, Plus, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday, isBefore, startOfDay } from 'date-fns';

export default function AuditCalendar() {
  const { activeLocation } = useLocation();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Fetch audits for the current month
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  
  const { data: audits, isLoading } = trpc.audits.list.useQuery({
    locationId: activeLocation?.id,
    startDate: monthStart.toISOString(),
    endDate: monthEnd.toISOString(),
  }, {
    enabled: !!activeLocation,
  });

  const { data: auditTypes } = trpc.audits.listTypes.useQuery();

  // Get days in the current month
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Get the day of week for the first day (0 = Sunday, 1 = Monday, etc.)
  const firstDayOfWeek = monthStart.getDay();
  
  // Create empty cells for days before the month starts
  const emptyDays = Array(firstDayOfWeek).fill(null);

  // Group audits by date
  const auditsByDate = (audits || []).reduce((acc, audit) => {
    const dateKey = format(new Date(audit.scheduledDate), 'yyyy-MM-dd');
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(audit);
    return acc;
  }, {} as Record<string, typeof audits>);

  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleToday = () => {
    setCurrentMonth(new Date());
  };

  const getAuditsForDate = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return auditsByDate[dateKey] || [];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'in_progress':
        return 'bg-blue-500';
      case 'scheduled':
        return 'bg-gray-400';
      case 'overdue':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'in_progress':
        return 'secondary';
      case 'overdue':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  if (!activeLocation) {
    return (
      <div className="container py-8">
        <Card>
          <CardHeader>
            <CardTitle>No Location Selected</CardTitle>
            <CardDescription>Please select a location to view the audit calendar.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Audit Calendar</h1>
          <p className="text-muted-foreground">Schedule and track audits for {activeLocation.locationName}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Sparkles className="h-4 w-4 mr-2" />
            Auto-Schedule
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Schedule Audit
          </Button>
        </div>
      </div>

      {/* Calendar Navigation */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-2xl font-semibold min-w-[200px] text-center">
                {format(currentMonth, 'MMMM yyyy')}
              </h2>
              <Button variant="outline" size="icon" onClick={handleNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Button variant="outline" onClick={handleToday}>
              Today
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* Day headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center font-semibold text-sm text-muted-foreground py-2">
                {day}
              </div>
            ))}
            
            {/* Empty cells for days before month starts */}
            {emptyDays.map((_, index) => (
              <div key={`empty-${index}`} className="min-h-[120px] border rounded-lg bg-muted/20" />
            ))}
            
            {/* Days of the month */}
            {daysInMonth.map((date) => {
              const dayAudits = getAuditsForDate(date);
              const isCurrentDay = isToday(date);
              const isPast = isBefore(date, startOfDay(new Date())) && !isToday(date);
              
              return (
                <div
                  key={date.toISOString()}
                  className={`min-h-[120px] border rounded-lg p-2 transition-colors ${
                    isCurrentDay ? 'border-primary border-2 bg-primary/5' : 'hover:bg-muted/50'
                  } ${isPast ? 'bg-muted/20' : 'bg-background'}`}
                >
                  <div className={`text-sm font-semibold mb-2 ${isCurrentDay ? 'text-primary' : isPast ? 'text-muted-foreground' : ''}`}>
                    {format(date, 'd')}
                  </div>
                  <div className="space-y-1">
                    {dayAudits.slice(0, 3).map((audit) => (
                      <div
                        key={audit.id}
                        className="text-xs p-1 rounded bg-primary/10 border border-primary/20 cursor-pointer hover:bg-primary/20 transition-colors"
                        onClick={() => setSelectedDate(date)}
                      >
                        <div className="font-medium truncate">{audit.auditName}</div>
                        <Badge variant={getStatusBadgeVariant(audit.status)} className="text-[10px] h-4 mt-0.5">
                          {audit.status}
                        </Badge>
                      </div>
                    ))}
                    {dayAudits.length > 3 && (
                      <div className="text-xs text-muted-foreground text-center py-1">
                        +{dayAudits.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Selected Date Details */}
      {selectedDate && (
        <Card>
          <CardHeader>
            <CardTitle>Audits on {format(selectedDate, 'MMMM d, yyyy')}</CardTitle>
            <CardDescription>
              {getAuditsForDate(selectedDate).length} audit(s) scheduled
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {getAuditsForDate(selectedDate).map((audit) => (
                <div key={audit.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-semibold">{audit.auditName}</div>
                    <div className="text-sm text-muted-foreground">
                      Auditor: {audit.auditorName || 'Not assigned'}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={getStatusBadgeVariant(audit.status)}>
                      {audit.status}
                    </Badge>
                    <Button size="sm" variant="outline">
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
              {getAuditsForDate(selectedDate).length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No audits scheduled for this date
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Legend */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Status Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-400" />
              <span className="text-sm">Scheduled</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-sm">In Progress</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-sm">Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-sm">Overdue</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
