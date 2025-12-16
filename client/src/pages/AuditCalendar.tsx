import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { useLocation } from '@/contexts/LocationContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, ChevronLeft, ChevronRight, Plus, Sparkles, Loader2, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday, isBefore, startOfDay, startOfWeek, endOfWeek, addWeeks, subWeeks, addDays, subDays } from 'date-fns';
import { ScheduleAuditForm } from '@/components/ScheduleAuditForm';

export default function AuditCalendar() {
  const { activeLocationId, setActiveLocationId } = useLocation();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showAutoScheduleDialog, setShowAutoScheduleDialog] = useState(false);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<number>>(new Set());
  const [scheduleStartDate, setScheduleStartDate] = useState<Date>(new Date());
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [scheduleFormDate, setScheduleFormDate] = useState<Date | null>(null);
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [calendarView, setCalendarView] = useState<'month' | 'week' | 'day'>(
    (localStorage.getItem('calendarView') as 'month' | 'week' | 'day') || 'month'
  );

  // Save view preference to localStorage
  const handleViewChange = (view: 'month' | 'week' | 'day') => {
    setCalendarView(view);
    localStorage.setItem('calendarView', view);
  };

  // Fetch locations for dropdown
  const { data: locations } = trpc.locations.list.useQuery();
  
  // Get current location details
  const activeLocation = locations?.find(l => l.id === activeLocationId);

  // Get date range based on view
  const getDateRange = () => {
    if (calendarView === 'month') {
      return {
        start: startOfMonth(currentMonth),
        end: endOfMonth(currentMonth),
      };
    } else if (calendarView === 'week') {
      return {
        start: startOfWeek(currentMonth),
        end: endOfWeek(currentMonth),
      };
    } else {
      return {
        start: startOfDay(currentMonth),
        end: startOfDay(currentMonth),
      };
    }
  };

  const dateRange = getDateRange();

  const { data: auditData, isLoading } = trpc.audits.list.useQuery({
    locationId: activeLocationId || 0,
    startDate: dateRange.start.toISOString(),
    endDate: dateRange.end.toISOString(),
  }, {
    enabled: !!activeLocationId,
  });
  
  // Extract audits array from the response
  const audits = auditData?.audits || [];

  const { data: auditTypes } = trpc.audits.listTypes.useQuery();

  // Auto-schedule mutations
  const generateSuggestions = trpc.audits.generateScheduleSuggestions.useMutation();
  const acceptSuggestions = trpc.audits.acceptScheduleSuggestions.useMutation();
  const scheduleAudit = trpc.audits.scheduleAudit.useMutation();
  const deleteAll = trpc.audits.deleteAll.useMutation();
  const utils = trpc.useUtils();

  // Get days to display based on view
  const daysToShow = eachDayOfInterval({ start: dateRange.start, end: dateRange.end });
  
  // For month view, get the day of week for the first day (0 = Sunday, 1 = Monday, etc.)
  const firstDayOfWeek = calendarView === 'month' ? dateRange.start.getDay() : 0;
  
  // Create empty cells for days before the month starts (month view only)
  const emptyDays = calendarView === 'month' ? Array(firstDayOfWeek).fill(null) : [];

  // Group audits by date
  const auditsByDate = (audits || []).reduce((acc, audit) => {
    const dateKey = format(new Date(audit.scheduledDate), 'yyyy-MM-dd');
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(audit);
    return acc;
  }, {} as Record<string, typeof audits>);

  const handlePrevious = () => {
    if (calendarView === 'month') {
      setCurrentMonth(subMonths(currentMonth, 1));
    } else if (calendarView === 'week') {
      setCurrentMonth(subWeeks(currentMonth, 1));
    } else {
      setCurrentMonth(subDays(currentMonth, 1));
    }
  };

  const handleNext = () => {
    if (calendarView === 'month') {
      setCurrentMonth(addMonths(currentMonth, 1));
    } else if (calendarView === 'week') {
      setCurrentMonth(addWeeks(currentMonth, 1));
    } else {
      setCurrentMonth(addDays(currentMonth, 1));
    }
  };

  const handleToday = () => {
    setCurrentMonth(new Date());
  };

  const exportPdf = trpc.audits.exportCalendarPdf.useMutation();

  const handlePrintCalendar = async () => {
    if (!activeLocationId) return;

    try {
      const result = await exportPdf.mutateAsync({
        locationId: activeLocationId,
        startDate: format(dateRange.start, 'yyyy-MM-dd'),
        endDate: format(dateRange.end, 'yyyy-MM-dd'),
        viewType: calendarView,
      });

      // Open PDF in new tab
      window.open(result.url, '_blank');
      toast.success('Calendar PDF generated successfully!');
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      toast.error('Failed to generate calendar PDF. Please try again.');
    }
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

  const handleAutoSchedule = async () => {
    if (!activeLocationId) {
      toast.error('Please select a location first');
      return;
    }
    
    setShowAutoScheduleDialog(true);
    setSelectedSuggestions(new Set());
    
    // Generate suggestions with the selected start date
    try {
      await generateSuggestions.mutateAsync({
        locationId: activeLocationId,
        startDate: scheduleStartDate.toISOString(),
      });
    } catch (error) {
      toast.error('Failed to generate schedule suggestions');
      setShowAutoScheduleDialog(false);
    }
  };
  
  const handleRegenerateSuggestions = async () => {
    if (!activeLocationId) return;
    
    setSelectedSuggestions(new Set());
    
    try {
      await generateSuggestions.mutateAsync({
        locationId: activeLocationId,
        startDate: scheduleStartDate.toISOString(),
      });
      toast.success('Suggestions regenerated');
    } catch (error) {
      toast.error('Failed to regenerate suggestions');
    }
  };

  const handleScheduleAuditClick = (date?: Date) => {
    if (!activeLocationId) {
      toast.error('Please select a location first');
      return;
    }
    setScheduleFormDate(date || null);
    setShowScheduleDialog(true);
  };

  const handleDeleteAllClick = () => {
    if (!activeLocationId) {
      toast.error('Please select a location first');
      return;
    }
    setShowDeleteAllDialog(true);
    setDeleteConfirmation('');
  };

  const handleDeleteAllConfirm = async () => {
    if (!activeLocationId) return;

    try {
      const result = await deleteAll.mutateAsync({
        locationId: activeLocationId,
        confirmation: deleteConfirmation,
      });
      
      toast.success(`Successfully deleted ${result.deletedCount} audits`);
      setShowDeleteAllDialog(false);
      setDeleteConfirmation('');
      utils.audits.list.invalidate();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete audits');
    }
  };

  const handleToggleSuggestion = (index: number) => {
    const newSelected = new Set(selectedSuggestions);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedSuggestions(newSelected);
  };

  const handleToggleAll = () => {
    if (selectedSuggestions.size === (generateSuggestions.data?.length || 0)) {
      setSelectedSuggestions(new Set());
    } else {
      setSelectedSuggestions(new Set(generateSuggestions.data?.map((_, i) => i) || []));
    }
  };

  const handleAcceptSelected = async () => {
    if (!activeLocationId || !generateSuggestions.data) return;
    
    const selectedItems = Array.from(selectedSuggestions)
      .map(index => generateSuggestions.data[index])
      .filter(Boolean)
      .map(suggestion => ({
        auditTypeId: suggestion.auditTypeId,
        suggestedDate: suggestion.suggestedDate.toISOString(),
      }));
    
    if (selectedItems.length === 0) {
      toast.error('Please select at least one suggestion');
      return;
    }
    
    try {
      const result = await acceptSuggestions.mutateAsync({
        locationId: activeLocationId,
        suggestions: selectedItems,
      });
      
      toast.success(`Successfully scheduled ${result.count} audits`);
      setShowAutoScheduleDialog(false);
      utils.audits.list.invalidate();
    } catch (error) {
      toast.error('Failed to schedule audits');
    }
  };

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Audit Calendar</h1>
          <p className="text-muted-foreground">
            {activeLocation ? `Schedule and track audits for ${activeLocation.locationName}` : 'Select a location to view audits'}
          </p>
        </div>
        <div className="flex gap-2">
          <Select
            value={activeLocationId?.toString() || ""}
            onValueChange={(value) => {
              setActiveLocationId(parseInt(value));
            }}
          >
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Select Location" />
            </SelectTrigger>
            <SelectContent>
              {(locations || []).map((location) => (
                <SelectItem key={location.id} value={location.id.toString()}>
                  {location.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {activeLocation && (
            <>
              <Button variant="outline" size="sm" onClick={handleAutoSchedule}>
                <Sparkles className="h-4 w-4 mr-2" />
                Auto-Schedule
              </Button>
              <Button size="sm" onClick={() => handleScheduleAuditClick()}>
                <Plus className="h-4 w-4 mr-2" />
                Schedule Audit
              </Button>
              <Button size="sm" variant="destructive" onClick={handleDeleteAllClick}>
                Delete All
              </Button>
            </>
          )}
        </div>
      </div>

      {!activeLocation ? (
        <Card>
          <CardHeader>
            <CardTitle>No Location Selected</CardTitle>
            <CardDescription>Please select a location from the dropdown above to view the audit calendar.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <>
          {/* Calendar Navigation */}
          <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" onClick={handlePrevious}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-2xl font-semibold min-w-[200px] text-center">
                {calendarView === 'month' && format(currentMonth, 'MMMM yyyy')}
                {calendarView === 'week' && `Week of ${format(startOfWeek(currentMonth), 'MMM d, yyyy')}`}
                {calendarView === 'day' && format(currentMonth, 'MMMM d, yyyy')}
              </h2>
              <Button variant="outline" size="icon" onClick={handleNext}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              {/* View Toggle */}
              <div className="flex border rounded-lg overflow-hidden">
                <Button
                  variant={calendarView === 'month' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => handleViewChange('month')}
                  className="rounded-none"
                >
                  Month
                </Button>
                <Button
                  variant={calendarView === 'week' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => handleViewChange('week')}
                  className="rounded-none border-x"
                >
                  Week
                </Button>
                <Button
                  variant={calendarView === 'day' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => handleViewChange('day')}
                  className="rounded-none"
                >
                  Day
                </Button>
              </div>
              <Button variant="outline" onClick={handleToday}>
                Today
              </Button>
              <Button variant="outline" onClick={handlePrintCalendar}>
                <Printer className="h-4 w-4 mr-2" />
                Print Calendar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Calendar Grid */}
          <div className={`grid gap-2 ${
            calendarView === 'month' ? 'grid-cols-7' : 
            calendarView === 'week' ? 'grid-cols-7' : 
            'grid-cols-1'
          }`}>
            {/* Day headers */}
            {calendarView !== 'day' && ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center font-semibold text-sm text-muted-foreground py-2">
                {day}
              </div>
            ))}
            
            {/* Empty cells for days before month starts */}
            {emptyDays.map((_, index) => (
              <div key={`empty-${index}`} className="min-h-[120px] border rounded-lg bg-muted/20" />
            ))}
            
            {/* Days to display */}
            {daysToShow.map((date) => {
              const dayAudits = getAuditsForDate(date);
              const isCurrentDay = isToday(date);
              const isPast = isBefore(date, startOfDay(new Date())) && !isToday(date);
              
              return (
                <div
                  key={date.toISOString()}
                  onClick={() => setSelectedDate(date)}
                  className={`min-h-[120px] border rounded-lg p-2 transition-colors cursor-pointer ${
                    isCurrentDay ? 'border-primary border-2 bg-primary/5' : 'hover:bg-muted/50'
                  } ${isPast ? 'opacity-60' : ''} ${
                    !isSameMonth(date, currentMonth) && calendarView === 'month' ? 'bg-muted/30' : ''
                  }`}
                >
                  <div className="text-sm font-medium mb-1">
                    {calendarView === 'day' ? format(date, 'EEEE, MMMM d') : format(date, 'd')}
                  </div>             <div className="space-y-1">
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

      {/* Auto-Schedule Dialog */}
      <Dialog open={showAutoScheduleDialog} onOpenChange={setShowAutoScheduleDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Auto-Schedule Audits</DialogTitle>
            <DialogDescription>
              Review and select suggested audit dates for the next 12 months. The system intelligently distributes audits based on recommended frequencies.
            </DialogDescription>
          </DialogHeader>
          
          {/* Start Date Picker */}
          <div className="mb-4 flex gap-3 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">When should the first audit begin?</label>
              <input
                type="date"
                value={format(scheduleStartDate, 'yyyy-MM-dd')}
                onChange={(e) => setScheduleStartDate(new Date(e.target.value))}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <Button 
              onClick={handleRegenerateSuggestions} 
              disabled={generateSuggestions.isPending}
              variant="outline"
            >
              {generateSuggestions.isPending ? 'Generating...' : 'Generate'}
            </Button>
          </div>
          
          {generateSuggestions.isPending && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">Generating schedule suggestions...</span>
            </div>
          )}
          
          {generateSuggestions.data && (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {generateSuggestions.data.length} suggestions generated
                </p>
                <Button variant="outline" size="sm" onClick={handleToggleAll}>
                  {selectedSuggestions.size === generateSuggestions.data.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Audit Type</TableHead>
                    <TableHead>Suggested Date</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {generateSuggestions.data.map((suggestion, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Checkbox
                          checked={selectedSuggestions.has(index)}
                          onCheckedChange={() => handleToggleSuggestion(index)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{suggestion.auditTypeName}</TableCell>
                      <TableCell>{format(suggestion.suggestedDate, 'MMM d, yyyy')}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{suggestion.frequency}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{suggestion.reason}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAutoScheduleDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAcceptSelected}
              disabled={selectedSuggestions.size === 0 || acceptSuggestions.isPending}
            >
              {acceptSuggestions.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Accept Selected ({selectedSuggestions.size})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Date Click Dialog - View/Create Audits */}
      <Dialog open={!!selectedDate} onOpenChange={(open) => !open && setSelectedDate(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedDate && format(selectedDate, 'MMMM d, yyyy')}
            </DialogTitle>
            <DialogDescription>
              View existing audits or schedule a new audit for this date
            </DialogDescription>
          </DialogHeader>
          
          {selectedDate && (
            <div className="space-y-4">
              {/* Existing Audits */}
              {getAuditsForDate(selectedDate).length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Scheduled Audits</h3>
                  <div className="space-y-2">
                    {getAuditsForDate(selectedDate).map((audit) => (
                      <div key={audit.id} className="p-3 border rounded-lg flex items-center justify-between">
                        <div>
                          <p className="font-medium">{audit.auditName}</p>
                          <p className="text-sm text-muted-foreground">
                            Status: <span className="capitalize">{audit.status}</span>
                          </p>
                        </div>
                        <Button size="sm" variant="outline" asChild>
                          <a href={`/audits/${audit.id}`}>View</a>
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Schedule New Audit */}
              <div>
                <h3 className="font-semibold mb-2">Schedule New Audit</h3>
                <Button onClick={() => {
                  setSelectedDate(null);
                  handleScheduleAuditClick(selectedDate);
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Schedule Audit for This Date
                </Button>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedDate(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Audit Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Schedule New Audit</DialogTitle>
            <DialogDescription>
              Schedule an audit for a specific date with assigned auditor and service user
            </DialogDescription>
          </DialogHeader>
          
          <ScheduleAuditForm
            locationId={activeLocationId!}
            prefilledDate={scheduleFormDate}
            onSuccess={() => {
              setShowScheduleDialog(false);
              utils.audits.list.invalidate();
              toast.success('Audit scheduled successfully');
            }}
            onCancel={() => setShowScheduleDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete All Audits Dialog */}
      <Dialog open={showDeleteAllDialog} onOpenChange={setShowDeleteAllDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete All Audits</DialogTitle>
            <DialogDescription>
              This will permanently delete all audits for the selected location. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm font-medium text-destructive">
                ⚠️ Warning: This will delete all audits for {activeLocation?.name}
              </p>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">
                Type <span className="font-mono bg-muted px-1 rounded">CONFIRM</span> to proceed:
              </label>
              <input
                type="text"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="Type CONFIRM"
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteAllDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteAllConfirm}
              disabled={deleteConfirmation !== 'CONFIRM' || deleteAll.isPending}
            >
              {deleteAll.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete All Audits
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
        </>
      )}
    </div>
  );
}
