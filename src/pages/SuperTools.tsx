import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, ChevronRight } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { SUPER_TOOLS, STATUS_META, GROUP_TITLES, getDisabledTools, setDisabledTools, type ToolSection } from "@/lib/superTools";

const StatusPill = ({ status }: { status: keyof typeof STATUS_META }) => (
  <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
    <span className={`h-1.5 w-1.5 rounded-full ${STATUS_META[status].dot}`} />
    {STATUS_META[status].label}
  </span>
);

export default function SuperTools() {
  const [query, setQuery] = useState("");
  const [disabled, setDisabled] = useState<string[]>(getDisabledTools);

  const toggle = (id: string, on: boolean) => {
    const next = on ? disabled.filter((d) => d !== id) : [...disabled, id];
    setDisabled(next);
    setDisabledTools(next);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SUPER_TOOLS;
    return SUPER_TOOLS.map((s) => ({
      ...s,
      items: s.title.toLowerCase().includes(q) ? s.items : s.items.filter((i) => i.label.toLowerCase().includes(q)),
    })).filter((s) => s.items.length > 0);
  }, [query]);

  const all = SUPER_TOOLS.flatMap((s) => s.items);
  const liveCount = all.filter((i) => i.status === "live").length;

  const groups = (Object.keys(GROUP_TITLES) as ToolSection["group"][]).map((g) => ({
    g, sections: filtered.filter((s) => s.group === g),
  })).filter((x) => x.sections.length);

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl p-4 space-y-5">
        <header className="space-y-1">
          <h1 className="text-2xl font-heading font-bold gradient-text">WorldFace Super Tools</h1>
          <p className="text-sm text-muted-foreground">
            Every part of WorldFace in one place. {liveCount} of {all.length} features are live; the rest show their real status.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {(Object.keys(STATUS_META) as (keyof typeof STATUS_META)[]).map((s) => <StatusPill key={s} status={s} />)}
          </div>
        </header>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search tools… / Tafuta zana…" className="pl-9" />
        </div>

        {groups.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">No tools match “{query}”.</p>}

        {groups.map(({ g, sections }) => (
          <section key={g} className="space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{GROUP_TITLES[g]}</h2>
            <Accordion type="multiple" className="glass-elevated rounded-2xl px-3">
              {sections.map((s) => {
                const on = !disabled.includes(s.id);
                const live = s.items.filter((i) => i.status === "live").length;
                return (
                  <AccordionItem key={s.id} value={s.id}>
                    <AccordionTrigger className="hover:no-underline">
                      <span className={`flex items-center gap-2 text-left ${on ? "" : "opacity-50"}`}>
                        <span className="text-lg">{s.emoji}</span>
                        <span className="font-medium">{s.title}</span>
                        <span className="text-xs text-muted-foreground">{live}/{s.items.length} live</span>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="mb-2 flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-sm">
                        <span>{on ? "Enabled" : "Disabled"}</span>
                        <Switch checked={on} onCheckedChange={(v) => toggle(s.id, v)} aria-label={`Enable ${s.title}`} />
                      </div>
                      <ul className="divide-y divide-border/50">
                        {s.items.map((item) => {
                          const row = (
                            <span className="flex items-center justify-between gap-2 py-2.5 text-sm">
                              <span>{item.label}</span>
                              <span className="flex items-center gap-1">
                                <StatusPill status={item.status} />
                                {item.route && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                              </span>
                            </span>
                          );
                          return (
                            <li key={item.label}>
                              {item.route && on ? <Link to={item.route} className="block hover:text-primary">{row}</Link> : row}
                            </li>
                          );
                        })}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </section>
        ))}
      </div>
    </AppLayout>
  );
}
