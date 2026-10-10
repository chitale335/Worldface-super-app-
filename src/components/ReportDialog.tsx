import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Flag } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

type TargetType = 'post' | 'comment' | 'user' | 'message';

const REASONS = [
  'Spam',
  'Harassment or bullying',
  'Hate speech',
  'Violence or dangerous content',
  'Nudity or sexual content',
  'Misinformation',
  'Scam or fraud',
  'Intellectual property',
  'Other',
];

export function ReportDialog({
  targetType,
  targetId,
  trigger,
}: {
  targetType: TargetType;
  targetId: string;
  trigger?: React.ReactNode;
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(REASONS[0]);
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!user) return;
    setSubmitting(true);
    const { error } = await supabase.from('reports').insert({
      reporter_id: user.id,
      target_type: targetType,
      target_id: targetId,
      reason,
      details: details.trim() || null,
    });
    setSubmitting(false);
    if (error) {
      toast({ title: 'Could not submit report', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Report submitted', description: 'Our moderators will review it shortly.' });
      setOpen(false);
      setDetails('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-rose">
            <Flag className="h-4 w-4 mr-1.5" />Report
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report {targetType}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="mb-2 block">Reason</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {REASONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-2 block">Details (optional)</Label>
            <Textarea
              placeholder="Tell us more so we can act faster…"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              maxLength={500}
              rows={4}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit} disabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit report'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
