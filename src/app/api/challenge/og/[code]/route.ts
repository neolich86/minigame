import { challengeImage } from "@/lib/challenge-image";
import { getChallengeServer } from "@/lib/challenge";
import { boardById } from "@/lib/games";

export async function GET(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  const c = await getChallengeServer((await params).code);
  const found = c ? boardById(c.game_id) : undefined;
  if (!c || !found) return new Response("not found", { status: 404 });
  const img = await challengeImage(c, found.game, found.board);
  img.headers.set("cache-control", "public, max-age=3600, s-maxage=86400");
  return img;
}
