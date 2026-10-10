import { useEffect, useState } from 'react';
import { Bell, BellRing, Volume2, Smartphone, Moon, TestTube2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { useNotificationPrefs, playNotificationSound, vibrate, isInQuietHours } from '@/hooks/useNotificationPrefs';
import { toast } from '@/hooks/use-toast';
import {
  enablePushNotifications,
  disablePushNotifications,
  pushEnabledOnThisDevice,
  pushSupported,
} from '@/lib/push';

export const NotificationSettings = ({ trigger }: { trigger?: React.ReactNode }) => {
  const { prefs, update } = useNotificationPrefs();
  const [open, setOpen] = useState(false);
  const [pushOn, setPushOn] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);

  useEffect(() => {
    pushEnabledOnThisDevice().then(setPushOn).catch(() => setPushOn(false));
  }, [open]);

  const togglePush = async (value: boolean) => {
    setPushBusy(true);
    try {
      if (value) {
        const res = await enablePushNotifications();
        setPushOn(res.ok);
        toast(
          res.ok
            ? { title: 'Push imewashwa', description: 'Utapata taarifa hata app ikiwa imefungwa.' }
            : { title: 'Haikuwezekana', description: `Push haijawashwa (${res.reason ?? 'error'}).`, variant: 'destructive' },
        );
      } else {
        await disablePushNotifications();
        setPushOn(false);
        toast({ title: 'Push imezimwa', description: 'Kifaa hiki hakitapata push notifications.' });
      }
    } finally {
      setPushBusy(false);
    }
  };


  const requestPermission = async () => {
    if (typeof Notification === 'undefined') return;
    const res = await Notification.requestPermission();
    toast({ title: 'Permission', description: `Notifications ${res}` });
  };

  const testNotification = () => {
    const quiet = isInQuietHours(prefs);
    if (!quiet) {
      if (prefs.sound) playNotificationSound();
      if (prefs.vibration) vibrate([60, 40, 60]);
    }
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      try {
        new Notification('WorldFace test', {
          body: quiet ? 'Quiet hours are on — silent test.' : 'Sound, vibration & badge are working!',
          silent: !prefs.sound || quiet,
        });
      } catch { /* ignore */ }
    } else {
      toast({ title: 'Test', description: 'In-app preview only (browser permission not granted).' });
    }
  };

  const permission = typeof Notification !== 'undefined' ? Notification.permission : 'unsupported';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm" className="gap-2">
            <Bell className="h-4 w-4" /> Notifications
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Bell className="h-5 w-5" /> Notification settings</DialogTitle>
          <DialogDescription>Control how WorldFace alerts you about new messages.</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Permission */}
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <p className="text-sm font-medium">Browser permission</p>
              <p className="text-xs text-muted-foreground capitalize">{permission}</p>
            </div>
            {permission !== 'granted' && (
              <Button size="sm" onClick={requestPermission}>Allow</Button>
            )}
          </div>

          {/* Push notifications (device) */}
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div className="pr-3">
              <p className="text-sm font-medium flex items-center gap-2">
                <BellRing className="h-4 w-4 text-muted-foreground" /> Push kwenye kifaa hiki
              </p>
              <p className="text-xs text-muted-foreground">
                Ujumbe mpya, zawadi na live za creators — hata app ikiwa imefungwa.
              </p>
            </div>
            <Switch
              id="notif-push"
              checked={pushOn}
              disabled={pushBusy || !pushSupported()}
              onCheckedChange={togglePush}
            />
          </div>


          {/* Master toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="notif-enabled">Enable notifications</Label>
            </div>
            <Switch id="notif-enabled" checked={prefs.enabled} onCheckedChange={(v) => update({ enabled: v })} />
          </div>

          {/* Sound */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Volume2 className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="notif-sound">Sound</Label>
            </div>
            <Switch id="notif-sound" checked={prefs.sound} onCheckedChange={(v) => update({ sound: v })} disabled={!prefs.enabled} />
          </div>

          {/* Vibration */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Smartphone className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="notif-vib">Vibration (mobile)</Label>
            </div>
            <Switch id="notif-vib" checked={prefs.vibration} onCheckedChange={(v) => update({ vibration: v })} disabled={!prefs.enabled} />
          </div>

          {/* Quiet hours */}
          <div className="rounded-lg border border-border p-3 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Moon className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="notif-quiet">Quiet hours</Label>
              </div>
              <Switch
                id="notif-quiet"
                checked={prefs.quietHoursEnabled}
                onCheckedChange={(v) => update({ quietHoursEnabled: v })}
                disabled={!prefs.enabled}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="quiet-start" className="text-xs text-muted-foreground">From</Label>
                <Input
                  id="quiet-start" type="time"
                  value={prefs.quietStart}
                  onChange={(e) => update({ quietStart: e.target.value })}
                  disabled={!prefs.quietHoursEnabled || !prefs.enabled}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="quiet-end" className="text-xs text-muted-foreground">To</Label>
                <Input
                  id="quiet-end" type="time"
                  value={prefs.quietEnd}
                  onChange={(e) => update({ quietEnd: e.target.value })}
                  disabled={!prefs.quietHoursEnabled || !prefs.enabled}
                />
              </div>
            </div>
            {prefs.quietHoursEnabled && (
              <p className="text-xs text-muted-foreground">
                {isInQuietHours(prefs) ? '🌙 Currently quiet — silent alerts only.' : 'Quiet hours scheduled.'}
              </p>
            )}
          </div>

          <Button variant="outline" className="w-full gap-2" onClick={testNotification}>
            <TestTube2 className="h-4 w-4" /> Send test notification
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
