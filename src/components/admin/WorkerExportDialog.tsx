import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { buildWorkersCsv, downloadWorkersCsv, type WorkerExportSource } from "@/lib/exportWorkersCsv";
import { WORKER_EXPORT_FIELDS, WORKER_EXPORT_GROUPS, fieldsInGroup } from "@/lib/workerExportFields";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workers: WorkerExportSource[];
}

export default function WorkerExportDialog({ open, onOpenChange, workers }: Props) {
  const [selected, setSelected] = useState<string[]>([]);
  const [exporting, setExporting] = useState(false);

  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const toggle = (id: string, next: boolean) => {
    setSelected((prev) => (next ? (prev.includes(id) ? prev : [...prev, id]) : prev.filter((item) => item !== id)));
  };

  const toggleGroup = (groupId: (typeof WORKER_EXPORT_GROUPS)[number]["id"], next: boolean) => {
    const ids = fieldsInGroup(groupId).map((field) => field.id);
    setSelected((prev) => {
      const without = prev.filter((id) => !ids.includes(id));
      return next ? [...without, ...ids] : without;
    });
  };

  const handleExport = async () => {
    if (selected.length === 0) {
      toast.error("Select at least one field");
      return;
    }
    setExporting(true);
    try {
      const csv = await buildWorkersCsv(workers, selected);
      downloadWorkersCsv(csv, workers);
      toast.success(`Exported ${workers.length} worker${workers.length === 1 ? "" : "s"}`);
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Export failed");
    } finally {
      setExporting(false);
    }
  };

  const subject =
    workers.length === 1
      ? workers[0].fullName || workers[0].phone || "this worker"
      : `${workers.length} workers in the current list`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Export worker data</DialogTitle>
          <DialogDescription>
            Choose the fields to include for {subject}, then download a spreadsheet. Photos, videos, and document scans are links that open the file. Those links work for 7 days.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">
            {selected.length} {selected.length === 1 ? "field" : "fields"} selected
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSelected(WORKER_EXPORT_FIELDS.map((field) => field.id))}
            >
              Select all
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setSelected([])} disabled={selected.length === 0}>
              Clear
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {WORKER_EXPORT_GROUPS.map((group) => {
            const fields = fieldsInGroup(group.id);
            const checkedCount = fields.filter((field) => selectedSet.has(field.id)).length;
            const groupChecked = checkedCount === 0 ? false : checkedCount === fields.length ? true : "indeterminate";
            return (
              <section key={group.id} className="rounded-lg border p-3">
                <label className="mb-2 flex items-center gap-2">
                  <Checkbox
                    checked={groupChecked}
                    onCheckedChange={(value) => toggleGroup(group.id, value === true)}
                  />
                  <span className="text-sm font-medium">{group.label}</span>
                </label>
                <div className="space-y-1.5 pl-6">
                  {fields.map((field) => (
                    <label key={field.id} className="flex items-center gap-2">
                      <Checkbox
                        checked={selectedSet.has(field.id)}
                        onCheckedChange={(value) => toggle(field.id, value === true)}
                      />
                      <span className="text-sm">{field.label}</span>
                    </label>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        <Button className="w-full" onClick={() => void handleExport()} disabled={exporting || selected.length === 0 || workers.length === 0}>
          {exporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
          {exporting ? "Preparing file…" : "Export CSV"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
