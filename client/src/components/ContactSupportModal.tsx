import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, Send, CheckCircle2 } from "lucide-react";

interface ContactSupportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ContactSupportModal({ open, onOpenChange }: ContactSupportModalProps) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
  const [category, setCategory] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const createTicket = trpc.helpCenter.createSupportTicket.useMutation({
    onSuccess: (ticket) => {
      setSubmitted(true);
      toast.success("Support ticket created successfully!", {
        description: `Ticket number: ${ticket.ticketNumber}`,
      });
      
      // Reset form after 2 seconds and close modal
      setTimeout(() => {
        setSubject("");
        setMessage("");
        setPriority("medium");
        setCategory("");
        setSubmitted(false);
        onOpenChange(false);
      }, 2000);
    },
    onError: (error) => {
      toast.error("Failed to create support ticket", {
        description: error.message,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!subject.trim() || subject.length < 5) {
      toast.error("Please enter a subject (at least 5 characters)");
      return;
    }
    
    if (!message.trim() || message.length < 20) {
      toast.error("Please enter a detailed message (at least 20 characters)");
      return;
    }

    createTicket.mutate({
      subject: subject.trim(),
      message: message.trim(),
      priority,
      category: category || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        {submitted ? (
          <div className="py-8 text-center">
            <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Ticket Created!</h3>
            <p className="text-gray-600">
              We've received your support request and will respond as soon as possible.
            </p>
            <p className="text-sm text-gray-500 mt-4">
              You'll receive a confirmation email with your ticket number.
            </p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Contact Support</DialogTitle>
              <DialogDescription className="text-base">
                Our support team is here to help. Please provide details about your issue and we'll get back to you as soon as possible.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-5 mt-4">
              <div className="space-y-2">
                <Label htmlFor="category" className="text-sm font-semibold">
                  Category <span className="text-gray-400 font-normal">(Optional)</span>
                </Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technical">Technical Issue</SelectItem>
                    <SelectItem value="billing">Billing & Subscription</SelectItem>
                    <SelectItem value="feature">Feature Request</SelectItem>
                    <SelectItem value="training">Training & Documentation</SelectItem>
                    <SelectItem value="compliance">Compliance Question</SelectItem>
                    <SelectItem value="general">General Enquiry</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority" className="text-sm font-semibold">
                  Priority
                </Label>
                <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low - General question</SelectItem>
                    <SelectItem value="medium">Medium - Need assistance</SelectItem>
                    <SelectItem value="high">High - Affecting work</SelectItem>
                    <SelectItem value="urgent">Urgent - Critical issue</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject" className="text-sm font-semibold">
                  Subject <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="subject"
                  placeholder="Brief description of your issue"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  maxLength={500}
                  required
                  className="text-base"
                />
                <p className="text-xs text-gray-500">
                  {subject.length}/500 characters (minimum 5)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message" className="text-sm font-semibold">
                  Message <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="message"
                  placeholder="Please provide detailed information about your issue, including any error messages or steps to reproduce the problem..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={6}
                  required
                  className="text-base resize-none"
                />
                <p className="text-xs text-gray-500">
                  {message.length} characters (minimum 20)
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  <strong>What happens next?</strong>
                </p>
                <ul className="text-sm text-blue-800 mt-2 space-y-1 list-disc list-inside">
                  <li>You'll receive a confirmation email with your ticket number</li>
                  <li>Our support team will review your request</li>
                  <li>We'll respond via email within 24-48 hours</li>
                  <li>You can track your ticket status in the Help Center</li>
                </ul>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="flex-1"
                  disabled={createTicket.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 gap-2"
                  disabled={createTicket.isPending || !subject.trim() || !message.trim()}
                >
                  {createTicket.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Submit Ticket
                    </>
                  )}
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
