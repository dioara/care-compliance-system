import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface ScheduleAuditFormProps {
  locationId: number;
  prefilledDate: Date | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ScheduleAuditForm({ locationId, prefilledDate, onSuccess, onCancel }: ScheduleAuditFormProps) {
  const [auditTypeId, setAuditTypeId] = useState<string>('');
  const [scheduledDate, setScheduledDate] = useState<string>(
    prefilledDate ? format(prefilledDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')
  );
  const [auditorId, setAuditorId] = useState<string>('');
  const [serviceUserId, setServiceUserId] = useState<string>('');
  const [staffMemberId, setStaffMemberId] = useState<string>('');
  const [validationError, setValidationError] = useState<string>('');

  // Update date when prefilledDate changes
  useEffect(() => {
    if (prefilledDate) {
      setScheduledDate(format(prefilledDate, 'yyyy-MM-dd'));
    }
  }, [prefilledDate]);

  // Fetch audit types
  const { data: auditTypes } = trpc.audits.listTypes.useQuery();

  // Get selected audit type details
  const selectedAuditType = auditTypes?.find(t => t.id.toString() === auditTypeId);

  // Fetch staff members (auditors)
  const { data: staff } = trpc.staff.list.useQuery({ locationId });

  // Fetch service users
  const { data: serviceUsers } = trpc.serviceUsers.list.useQuery({ locationId });

  // Get utils for invalidation
  const utils = trpc.useUtils();

  // Schedule mutation
  const scheduleMutation = trpc.audits.scheduleAudit.useMutation({
    onSuccess: () => {
      // Invalidate audit list to refresh calendar
      utils.audits.list.invalidate();
      utils.audits.listTypes.invalidate();
      onSuccess();
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (!auditTypeId || !scheduledDate) {
      return;
    }

    // Validate staff member is selected for staff-specific audits
    if (selectedAuditType?.targetType === 'staff' && (!staffMemberId || staffMemberId === 'none')) {
      setValidationError('This audit requires a staff member to be selected');
      return;
    }

    // Validate service user is selected for service-user-specific audits
    if (selectedAuditType?.targetType === 'serviceUser' && (!serviceUserId || serviceUserId === 'none')) {
      setValidationError('This audit requires a service user to be selected');
      return;
    }

    await scheduleMutation.mutateAsync({
      auditTypeId: parseInt(auditTypeId),
      locationId,
      scheduledDate: new Date(scheduledDate).toISOString(),
      auditorId: auditorId && auditorId !== 'none' ? parseInt(auditorId) : undefined,
      serviceUserId: serviceUserId && serviceUserId !== 'none' ? parseInt(serviceUserId) : undefined,
      staffMemberId: staffMemberId && staffMemberId !== 'none' ? parseInt(staffMemberId) : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Audit Type */}
      <div>
        <label className="text-sm font-medium mb-2 block">
          Audit Type <span className="text-destructive">*</span>
        </label>
        <Select value={auditTypeId} onValueChange={setAuditTypeId}>
          <SelectTrigger>
            <SelectValue placeholder="Select audit type" />
          </SelectTrigger>
          <SelectContent>
            {(auditTypes || []).map((type) => (
              <SelectItem key={type.id} value={type.id.toString()}>
                {type.auditName || type.auditName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Scheduled Date */}
      <div>
        <label className="text-sm font-medium mb-2 block">
          Scheduled Date <span className="text-destructive">*</span>
        </label>
        <input
          type="date"
          value={scheduledDate}
          onChange={(e) => setScheduledDate(e.target.value)}
          min={new Date().toISOString().split('T')[0]}
          className="w-full px-3 py-2 border rounded-md"
          required
        />
      </div>

      {/* Auditor */}
      <div>
        <label className="text-sm font-medium mb-2 block">
          Assigned Auditor (Optional)
        </label>
        <Select value={auditorId} onValueChange={setAuditorId}>
          <SelectTrigger>
            <SelectValue placeholder="Select auditor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            {(staff || []).map((member) => (
              <SelectItem key={member.id} value={member.id.toString()}>
                {member.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Staff Member (for staff-specific audits) */}
      {selectedAuditType?.targetType === 'staff' && (
        <div>
          <label className="text-sm font-medium mb-2 block">
            Staff Member <span className="text-destructive">*</span>
          </label>
          <Select value={staffMemberId} onValueChange={setStaffMemberId}>
            <SelectTrigger>
              <SelectValue placeholder="Select staff member" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {(staff || []).map((member) => (
                <SelectItem key={member.id} value={member.id.toString()}>
                  {member.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Service User (for service-user-specific audits) */}
      {selectedAuditType?.targetType === 'serviceUser' && (
        <div>
          <label className="text-sm font-medium mb-2 block">
            Service User <span className="text-destructive">*</span>
          </label>
          <Select value={serviceUserId} onValueChange={setServiceUserId}>
            <SelectTrigger>
              <SelectValue placeholder="Select service user" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {(serviceUsers || []).map((user) => (
                <SelectItem key={user.id} value={user.id.toString()}>
                  {user.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Validation Error */}
      {validationError && (
        <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
          {validationError}
        </div>
      )}

      {/* Form Actions */}
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!auditTypeId || !scheduledDate || scheduleMutation.isPending}>
          {scheduleMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Schedule Audit
        </Button>
      </div>
    </form>
  );
}
