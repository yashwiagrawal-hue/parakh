"use client";

import { useCallback, useEffect, useState } from "react";
import { jeweller } from "./catalogue";
import type { Purity } from "./pricing";

export interface Rates {
  ratePerG: Record<Purity, number>;
  ibjaRatePerG: Record<Purity, number>;
  ibjaDate: string; // YYYY-MM-DD
  ibjaSession: "AM" | "PM";
  savedAt: string | null; // null until the jeweller confirms today's rates
}

const KEY = "parakh.rates.v1";

export function todayIso(): string {
  const d = new Date();
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

export function defaultRates(): Rates {
  return {
    ratePerG: { ...jeweller.defaultRates },
    ibjaRatePerG: { ...jeweller.defaultIbjaRates },
    ibjaDate: todayIso(),
    ibjaSession: "AM",
    savedAt: null,
  };
}

function read(): Rates {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) return { ...defaultRates(), ...(JSON.parse(raw) as Partial<Rates>) };
  } catch {
    // storage blocked or corrupt: fall back to defaults
  }
  return defaultRates();
}

export function useRates(): { rates: Rates; ready: boolean; save: (r: Rates) => void } {
  const [rates, setRates] = useState<Rates>(() => defaultRates());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setRates(read());
    setReady(true);
  }, []);

  const save = useCallback((next: Rates) => {
    const stamped = { ...next, savedAt: new Date().toISOString() };
    setRates(stamped);
    try {
      window.localStorage.setItem(KEY, JSON.stringify(stamped));
    } catch {
      // keep working in memory if storage is blocked
    }
  }, []);

  return { rates, ready, save };
}
