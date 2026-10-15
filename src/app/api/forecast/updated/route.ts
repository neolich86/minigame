// 스포츠 승부 예측 — 마지막 데이터 갱신 시각 (공개, 5분 캐시)
import { lastUpdated } from "@/lib/forecast/read";

export const revalidate = 300;

export async function GET() {
  const at = await lastUpdated().catch(() => null);
  return Response.json({ at }, { headers: { "cache-control": "public, max-age=60, s-maxage=300" } });
}
