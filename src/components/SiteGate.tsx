import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import { LockKeyhole, Monitor, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getGateStatus, lockSite, unlockSite } from "@/lib/site-gate.functions";

type GateState = "checking" | "locked" | "unlocked" | "error";

export function SiteGate({ children }: { children: ReactNode }) {
  const getStatus = useServerFn(getGateStatus);
  const unlock = useServerFn(unlockSite);
  const lock = useServerFn(lockSite);
  const [state, setState] = useState<GateState>("checking");
  const [passcode, setPasscode] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    void getStatus()
      .then((result) => { if (active) setState(result.unlocked ? "unlocked" : "locked"); })
      .catch(() => { if (active) { setMessage("Could not verify access. Try again."); setState("error"); } });
    return () => { active = false; };
  }, [getStatus]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      const result = await unlock({ data: { passcode } });
      if (result.ok) {
        setPasscode("");
        setState("unlocked");
      } else {
        setMessage("That passcode didn’t match. Try again.");
      }
    } catch {
      setMessage("Could not verify access. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function lockApp() {
    setBusy(true);
    try {
      await lock();
      setState("locked");
      setMessage("");
    } catch {
      setMessage("Could not lock the app. Try again.");
    } finally {
      setBusy(false);
    }
  }

  if (state === "unlocked") {
    return (
      <>
        {children}
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label="Lock app"
          title="Lock app"
          disabled={busy}
          onClick={() => void lockApp()}
          className="fixed right-4 top-4 z-50"
        >
          <LockKeyhole />
          Lock
        </Button>
      </>
    );
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-5 py-10">
      <section className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-md border bg-card text-accent">
            <Monitor className="size-5" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">ScreenCast</p>
            <h1 className="text-xl font-semibold">Private access</h1>
          </div>
        </div>
        <div className="border-t pt-6">
          <div className="mb-5 flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="size-4 text-ok" />
            Enter your passcode to continue.
          </div>
          {state === "checking" ? (
            <p role="status" className="text-sm text-muted-foreground">Checking access…</p>
          ) : (
            <form onSubmit={(event) => void submit(event)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="site-passcode">Passcode</Label>
                <Input
                  id="site-passcode"
                  type="password"
                  autoComplete="current-password"
                  autoFocus
                  required
                  value={passcode}
                  onChange={(event) => setPasscode(event.target.value)}
                  placeholder="Enter passcode"
                  disabled={busy}
                />
              </div>
              {message && <p role="alert" className="text-sm text-destructive">{message}</p>}
              <Button type="submit" className="w-full" disabled={busy || passcode.length === 0}>
                <LockKeyhole />
                {busy ? "Checking…" : "Unlock"}
              </Button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}