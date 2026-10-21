"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { type AuditLogResult, getAuditLogs } from "@/services/api";
import { PageHeader } from "@/components/admin/shared";
import {
  ACTION_FILTERS,
  type Tone,
  describeActor,
  describeEvent,
  metadataLines,
} from "@/features/admin/auditLabels";

const PAGE_SIZE = 25;

const toneClasses: Record<Tone, string> = {
  good: "bg-green-50 text-green-700",
  info: "bg-gray-100 text-gray-700",
  warn: "bg-amber-50 text-amber-700",
  bad: "bg-red-50 text-red-700",
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function AdminAuditLogPage() {
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [openId, setOpenId] = useState<string | null>(null);
  // The last finished request, tagged with the request it answered. "Loading" is derived
  // (the newest request has not been answered yet), so the effect below never has to set
  // state synchronously.
  const [loaded, setLoaded] = useState<{
    key: string;
    result: AuditLogResult | null;
    error: string;
  } | null>(null);

  const requestKey = `${page}|${filter}|${reloadKey}`;

  useEffect(() => {
    let cancelled = false;
    getAuditLogs({ page, limit: PAGE_SIZE, action: filter || undefined })
      .then((data) => {
        if (cancelled) return;
        setLoaded({ key: requestKey, result: data, error: "" });
        setOpenId(null);
      })
      .catch((reason) => {
        if (cancelled) return;
        setLoaded({
          key: requestKey,
          result: null,
          error: reason instanceof Error ? reason.message : "Could not load the audit log.",
        });
      });
    return () => {
      cancelled = true;
    };
  }, [page, filter, requestKey]);

  const loading = loaded?.key !== requestKey;
  const result = loaded?.result ?? null;
  const error = loaded && loaded.key === requestKey ? loaded.error : "";

  const items = result?.items ?? [];
  const total = result?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  return (
    <>
      <PageHeader
        eyebrow="Audit log"
        title="Security and admin activity"
        description="Sign-ins, role changes and other admin actions: who did what, and when. Entries can't be edited or deleted here."
      />
      <div className="p-6 sm:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            Show
            <select
              value={filter}
              onChange={(event) => {
                setFilter(event.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm font-normal text-gray-900"
            >
              {ACTION_FILTERS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => setReloadKey((key) => key + 1)}
            disabled={loading}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-bold disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : undefined} />
            Refresh
          </button>
        </div>

        {error && (
          <p role="alert" className="mt-4 text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="mt-6 overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-gray-200 text-xs font-bold text-gray-500">
              <tr>
                <th scope="col" className="px-4 py-3">When</th>
                <th scope="col" className="px-4 py-3">Who</th>
                <th scope="col" className="px-4 py-3">What happened</th>
                <th scope="col" className="px-4 py-3">
                  <span className="sr-only">Details</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {!result && loading && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-gray-500">
                    Loading the audit log…
                  </td>
                </tr>
              )}
              {result && items.length === 0 && !loading && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-gray-500">
                    No activity matches this filter yet.
                  </td>
                </tr>
              )}
              {items.map((entry) => {
                const event = describeEvent(entry);
                const actor = describeActor(entry);
                const extra = metadataLines(entry);
                const open = openId === entry.id;
                return (
                  <FragmentRow key={entry.id}>
                    <tr className="border-t border-gray-100 align-top">
                      <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                        {formatDateTime(entry.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-900">{actor.primary}</p>
                        {actor.secondary && (
                          <p className="text-xs text-gray-500">{actor.secondary}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-bold ${toneClasses[event.tone]}`}
                        >
                          {event.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          aria-expanded={open}
                          aria-controls={`audit-details-${entry.id}`}
                          onClick={() => setOpenId(open ? null : entry.id)}
                          className="text-xs font-bold text-primary hover:opacity-70"
                        >
                          {open ? "Hide details" : "Details"}
                        </button>
                      </td>
                    </tr>
                    {open && (
                      <tr id={`audit-details-${entry.id}`} className="bg-gray-50">
                        <td colSpan={4} className="px-4 py-3">
                          <dl className="grid gap-x-6 gap-y-2 text-xs sm:grid-cols-[auto_1fr]">
                            <dt className="font-bold text-gray-500">Event code</dt>
                            <dd className="break-all text-gray-800">{entry.action}</dd>
                            {entry.targetType && (
                              <>
                                <dt className="font-bold text-gray-500">Affected item</dt>
                                <dd className="break-all text-gray-800">
                                  {entry.targetType}
                                  {entry.targetId ? ` (${entry.targetId})` : ""}
                                </dd>
                              </>
                            )}
                            {extra.length > 0 && (
                              <>
                                <dt className="font-bold text-gray-500">Details</dt>
                                <dd className="break-all text-gray-800">{extra.join(", ")}</dd>
                              </>
                            )}
                            {entry.ip && (
                              <>
                                <dt className="font-bold text-gray-500">IP address</dt>
                                <dd className="text-gray-800">{entry.ip}</dd>
                              </>
                            )}
                            {entry.userAgent && (
                              <>
                                <dt className="font-bold text-gray-500">Browser</dt>
                                <dd className="break-all text-gray-800">{entry.userAgent}</dd>
                              </>
                            )}
                          </dl>
                        </td>
                      </tr>
                    )}
                  </FragmentRow>
                );
              })}
            </tbody>
          </table>
        </div>

        {total > 0 && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-gray-600">
            <p>
              Showing {from}–{to} of {total}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page <= 1 || loading}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 font-bold disabled:opacity-40"
              >
                <ChevronLeft size={15} />
                Previous
              </button>
              <span className="px-1">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={page >= totalPages || loading}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 font-bold disabled:opacity-40"
              >
                Next
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// A row plus its optional expanded-details row, grouped under one key.
function FragmentRow({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
