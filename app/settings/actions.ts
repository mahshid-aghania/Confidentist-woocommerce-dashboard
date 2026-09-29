"use server";

import { syncOrder, syncAll } from "@/lib/sync";

export async function runSyncOrder(orderNumber: string) {
  try {
    const result = await syncOrder(orderNumber.trim());
    return { ok: true as const, result };
  } catch (e: any) {
    return { ok: false as const, error: String(e?.message || e) };
  }
}

export async function runSyncAll() {
  try {
    const res = await syncAll();
    return { ok: true as const, ...res };
  } catch (e: any) {
    return { ok: false as const, error: String(e?.message || e) };
  }
}
