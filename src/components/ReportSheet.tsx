import { motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import { reportReasons } from "../data/reportReasons";
import type { ReportReason } from "../types/confession";
import { Sheet } from "./Sheet";

interface ReportSheetProps {
  open: boolean;
  postNumber: number | null;
  onClose: () => void;
  onSubmit: (reason: ReportReason, details: string) => void;
}

const ease = [0.23, 1, 0.32, 1] as const;

export function ReportSheet({
  open,
  postNumber,
  onClose,
  onSubmit,
}: ReportSheetProps) {
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState("");

  useEffect(() => {
    if (!open) {
      setReason(null);
      setDetails("");
    }
  }, [open]);

  const needsDetails = reason === "other";
  const canSubmit =
    reason !== null && (!needsDetails || details.trim().length > 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason || !canSubmit) return;
    onSubmit(reason, details.trim());
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      titleId="report-title"
      title={`Report Anonymous #${postNumber ?? ""}`}
      description="Admins review every report and remove posts that break the rules. The poster won’t know who reported it."
      footer={
        <div className="flex items-center justify-end gap-2 border-t border-dashed border-line px-6 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-[6px] px-4 py-2.5 text-sm font-medium text-ink transition-colors duration-150 hover:bg-ink/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
          >
            Cancel
          </button>
          <motion.button
            type="submit"
            form="report-form"
            disabled={!canSubmit}
            whileTap={canSubmit ? { scale: 0.96 } : undefined}
            transition={{ duration: 0.12, ease }}
            className="rounded-[6px] bg-heart px-5 py-2.5 text-sm font-semibold text-card transition-opacity duration-150 disabled:cursor-not-allowed disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-heart focus-visible:ring-offset-2"
          >
            Send report
          </motion.button>
        </div>
      }
    >
      <form id="report-form" onSubmit={handleSubmit} className="pb-4">
        <fieldset>
          <legend className="mb-2 text-xs font-medium text-muted">
            What’s wrong with this post?
          </legend>
          <div className="divide-y divide-line">
            {reportReasons.map((r) => {
              const checked = reason === r.id;
              return (
                <label
                  key={r.id}
                  className="flex cursor-pointer items-start gap-3 py-3"
                >
                  <input
                    type="radio"
                    name="report-reason"
                    value={r.id}
                    checked={checked}
                    onChange={() => setReason(r.id)}
                    className="peer sr-only"
                  />
                  <span
                    aria-hidden="true"
                    className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-[6px] border-2 transition-colors duration-150 peer-focus-visible:ring-2 peer-focus-visible:ring-ink peer-focus-visible:ring-offset-2 ${checked ? "border-ink" : "border-line"}`}
                  >
                    {checked && (
                      <span className="h-2 w-2 rounded-[6px] bg-ink" />
                    )}
                  </span>
                  <span>
                    <span className="block text-sm font-medium text-ink">
                      {r.label}
                    </span>
                    <span className="block text-xs leading-relaxed text-muted">
                      {r.description}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        {reason && (
          <div className="mt-3">
            <label
              htmlFor="report-details"
              className="mb-1.5 block text-xs font-medium text-muted"
            >
              {needsDetails
                ? "Tell us more"
                : "Anything else admins should know? (optional)"}
            </label>
            <textarea
              id="report-details"
              rows={3}
              maxLength={300}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="w-full resize-none rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink placeholder:text-muted transition-colors duration-150 focus:border-ink focus:outline-none"
              placeholder="Add context for the admins…"
            />
          </div>
        )}
      </form>
    </Sheet>
  );
}
