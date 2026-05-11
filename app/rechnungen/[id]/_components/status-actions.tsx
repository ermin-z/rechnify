"use client";

import { useState } from "react";
import { markAsVersendet, markAsBezahlt } from "../../actions";

function isoToday() {
  return new Date().toISOString().split("T")[0];
}

interface Props {
  id: string;
  status: string;
}

export function StatusActions({ id, status }: Props) {
  const [showBezahlt, setShowBezahlt] = useState(false);
  const [paidAt, setPaidAt] = useState(isoToday());
  const [loading, setLoading] = useState(false);

  const markVersendetAction = markAsVersendet.bind(null, id);
  const markBezahltAction = markAsBezahlt.bind(null, id);

  if (status === "entwurf") {
    return (
      <form
        action={async () => {
          setLoading(true);
          await markVersendetAction();
        }}
      >
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg border border-blue-300 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Wird gespeichert…" : "Als versendet markieren"}
        </button>
      </form>
    );
  }

  if (status === "versendet") {
    if (!showBezahlt) {
      return (
        <button
          onClick={() => setShowBezahlt(true)}
          className="rounded-lg border border-green-300 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-50 transition-colors"
        >
          Als bezahlt markieren
        </button>
      );
    }

    return (
      <form
        action={async (fd) => {
          setLoading(true);
          await markBezahltAction(fd);
        }}
        className="flex items-center gap-2"
      >
        <input
          name="paid_at"
          type="date"
          value={paidAt}
          onChange={(e) => setPaidAt(e.target.value)}
          required
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Wird gespeichert…" : "Bestätigen"}
        </button>
        <button
          type="button"
          onClick={() => setShowBezahlt(false)}
          className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          Abbrechen
        </button>
      </form>
    );
  }

  return null;
}
