import { getSession } from "@/lib/session";
import { apiOk } from "@/lib/api-helpers";

export async function POST() {
  const session = await getSession();
  session.destroy();
  return apiOk({ ok: true });
}
