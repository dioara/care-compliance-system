/**
 * Error Report Dialog
 * 
 * Allows users to submit feedback when they encounter errors
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { WarningCircle } from "@phosphor-icons/react";

interface ErrorReportDialogProps {
  error?: Error | null;
  errorMessage?: string;
  trigger?: React.ReactNode;
}

export function ErrorReportDialog({ error, errorMessage, trigger }: ErrorReportDialogProps) {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [action, setAction] = useState("");

  const submitReportMutation = trpc.errorMonitoring.submitErrorReport.useMutation({
    onSuccess: () => {
      toast.success("Thank you for your feedback! We'll look into this issue.");
      setOpen(false);
      setDescription("");
      setAction("");
    },
    onError: (err) => {
      toast.error("Failed to submit report. Please try again.");
    },
  });

  const handleSubmit = () => {
    if (description.length < 10) {
      toast.error("Please provide more details about the issue");
      return;
    }

    submitReportMutation.mutate({
      userDescription: description,
      userAction: action || undefined,
      errorMessage: errorMessage || error?.message || undefined,
      url: window.location.href,
      browserInfo: navigator.userAgent,
    });
  };

  return (
    <Dialog open={open} onValueChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <WarningCircle className="h-4 w-4 mr-2" weight="bold" />
            Report Problem
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Report a Problem</DialogTitle>
          <DialogDescription>
            Help us improve by describing what went wrong. Your feedback is valuable.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="action">What were you trying to do?</Label>
            <Textarea
              id="action"
              placeholder="e.g., I was trying to export the calendar PDF..."
              value={action}
              onChange={(e) => setAction(e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">
              What happened? <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="description"
              placeholder="Please describe the problem in detail..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              required
            />
            <p className="text-xs text-muted-foreground">
              Minimum 10 characters required
            </p>
          </div>

          {errorMessage && (
            <div className="p-3 bg-muted rounded-md">
              <p className="text-xs font-medium mb-1">Error Message:</p>
              <p className="text-xs text-muted-foreground font-mono">{errorMessage}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={submitReportMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitReportMutation.isPending || description.length < 10}
          >
            {submitReportMutation.isPending ? "Submitting..." : "Submit Report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
