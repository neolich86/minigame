// 테스트용 가짜 Supabase (메모리 테이블). predict.ts 가 쓰는 쿼리만 흉내 낸다.
type Row = Record<string, unknown>;

export class FakeDb {
  tables: Record<string, Row[]> = {};
  keys: Record<string, string[]> = {};
  calls: string[] = [];
  constructor(init: Record<string, Row[]>, keys: Record<string, string[]>) {
    this.tables = init;
    this.keys = keys;
  }
  from(t: string) {
    this.tables[t] ??= [];
    return new Q(this, t);
  }
}

class Q {
  private filters: ((r: Row) => boolean)[] = [];
  private op: "select" | "update" | "upsert" | "insert" = "select";
  private payload: unknown;
  private head = false;
  private countMode = false;
  private orders: [string, boolean][] = [];
  private rng: [number, number] | null = null;
  private lim: number | null = null;
  constructor(private db: FakeDb, private t: string) {}
  select(_cols?: string, opts?: { count?: string; head?: boolean }) {
    if (this.op === "select") this.op = "select";
    this.head = !!opts?.head;
    this.countMode = !!opts?.count;
    return this;
  }
  update(v: Row) { this.op = "update"; this.payload = v; return this; }
  upsert(v: Row[] | Row) { this.op = "upsert"; this.payload = Array.isArray(v) ? v : [v]; return this; }
  insert(v: Row[] | Row) { this.op = "insert"; this.payload = Array.isArray(v) ? v : [v]; return this; }
  eq(c: string, v: unknown) { this.filters.push((r) => r[c] === v); return this; }
  in(c: string, vs: unknown[]) { const s = new Set(vs); this.filters.push((r) => s.has(r[c])); return this; }
  /** 테스트용: or 필터는 무시 (모든 행 통과) */
  or(_f: string) { void _f; return this; }
  is(c: string, v: null) { this.filters.push((r) => (r[c] ?? null) === v); return this; }
  order(c: string, o?: { ascending?: boolean }) { this.orders.push([c, o?.ascending !== false]); return this; }
  range(a: number, b: number) { this.rng = [a, b]; return this; }
  limit(n: number) { this.lim = n; return this; }
  private exec() {
    const tbl = this.db.tables[this.t];
    this.db.calls.push(`${this.op}:${this.t}`);
    if (this.op === "upsert" || this.op === "insert") {
      const keys = this.db.keys[this.t] ?? ["id"];
      for (const r of this.payload as Row[]) {
        const i = tbl.findIndex((x) => keys.every((k) => x[k] === r[k]));
        if (i >= 0) {
          if (this.t === "fc_predictions" && tbl[i].locked_at) throw new Error("locked");
          tbl[i] = { ...tbl[i], ...r };
        } else tbl.push({ ...r });
      }
      return { data: null, error: null };
    }
    let rows = tbl.filter((r) => this.filters.every((f) => f(r)));
    if (this.op === "update") {
      for (const r of rows) Object.assign(r, this.payload);
      return { data: null, error: null };
    }
    for (const [c, asc] of [...this.orders].reverse()) rows = [...rows].sort((a, b) => ((a[c] as number) > (b[c] as number) ? 1 : (a[c] as number) < (b[c] as number) ? -1 : 0) * (asc ? 1 : -1));
    if (this.rng) rows = rows.slice(this.rng[0], this.rng[1] + 1);
    if (this.lim !== null) rows = rows.slice(0, this.lim);
    if (this.head) return { data: null, error: null, count: rows.length };
    return { data: rows.map((r) => ({ ...r })), error: null, ...(this.countMode ? { count: rows.length } : {}) };
  }
  then<A, B>(ok?: (v: { data: unknown; error: null; count?: number }) => A, bad?: (e: unknown) => B): Promise<A | B> {
    try {
      return Promise.resolve(this.exec()).then(ok, bad);
    } catch (e) {
      return Promise.reject(e).then(ok, bad);
    }
  }
}
