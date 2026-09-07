// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore Deno resolves remote imports when the Edge Function is deployed.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.99.1";

// Kept inline so this function can also be deployed directly through the
// Supabase Dashboard editor without uploading additional source files.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const encoder = new TextEncoder();
const ITERATIONS = 210_000;

const normalizeAnswer = (answer: string) => answer.trim().toLocaleLowerCase("en-US").replace(/\s+/g, " ");
const toHex = (bytes: Uint8Array) => Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
const randomSalt = () => toHex(crypto.getRandomValues(new Uint8Array(16)));

async function hashAnswer(answer: string, salt: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", encoder.encode(normalizeAnswer(answer)), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: encoder.encode(salt), iterations: ITERATIONS },
    key,
    256,
  );
  return toHex(new Uint8Array(bits));
}

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, "Content-Type": "application/json" },
});

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const url = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!url || !serviceKey || !anonKey) return json({ error: "Server configuration is incomplete" }, 500);

    const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
    const body = await req.json();
    const action = String(body.action || "");

    if (action === "get-question") {
      const email = String(body.email || "").trim().toLowerCase();
      const { data: profile } = await admin.from("app_users").select("id,is_active").eq("email", email).maybeSingle();
      if (!profile?.is_active) return json({ error: "No recoverable account was found." }, 404);
      const { data: record } = await admin.from("user_security_questions").select("question").eq("user_id", profile.id).maybeSingle();
      if (!record) return json({ error: "This account has not configured password recovery. Contact the administrator." }, 404);
      return json({ question: record.question });
    }

    if (action === "set-question") {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) return json({ error: "You must be signed in." }, 401);
      const userClient = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } });
      const { data: authData, error: authError } = await userClient.auth.getUser();
      if (authError || !authData.user) return json({ error: "You must be signed in." }, 401);

      const question = String(body.question || "").trim();
      const answer = String(body.answer || "");
      if (question.length < 10 || question.length > 200) return json({ error: "Question must be 10–200 characters." }, 400);
      if (normalizeAnswer(answer).length < 2) return json({ error: "Answer must contain at least 2 characters." }, 400);

      const { data: profile } = await admin.from("app_users").select("id").eq("auth_user_id", authData.user.id).single();
      const salt = randomSalt();
      const answerHash = await hashAnswer(answer, salt);
      const { error } = await admin.from("user_security_questions").upsert({
        user_id: profile.id,
        question,
        answer_hash: answerHash,
        answer_salt: salt,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
      if (error) throw error;
      return json({ success: true });
    }

    if (action === "reset-password") {
      const email = String(body.email || "").trim().toLowerCase();
      const answer = String(body.answer || "");
      const password = String(body.password || "");
      if (password.length < 8) return json({ error: "New password must be at least 8 characters." }, 400);

      const { data: profile } = await admin.from("app_users").select("id,auth_user_id,is_active").eq("email", email).maybeSingle();
      if (!profile?.is_active) return json({ error: "The account or answer is incorrect." }, 400);
      const { data: record } = await admin.from("user_security_questions").select("id,answer_hash,answer_salt,failed_attempts,locked_until").eq("user_id", profile.id).maybeSingle();
      if (record?.locked_until && new Date(record.locked_until).getTime() > Date.now()) {
        return json({ error: "Too many incorrect attempts. Try again in 15 minutes." }, 429);
      }
      if (!record || await hashAnswer(answer, record.answer_salt) !== record.answer_hash) {
        if (record) {
          const failedAttempts = (record.failed_attempts || 0) + 1;
          await admin.from("user_security_questions").update({
            failed_attempts: failedAttempts >= 5 ? 0 : failedAttempts,
            locked_until: failedAttempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000).toISOString() : null,
          }).eq("id", record.id);
        }
        return json({ error: "The account or answer is incorrect." }, 400);
      }

      const { error } = await admin.auth.admin.updateUserById(profile.auth_user_id, { password });
      if (error) throw error;
      await admin.from("user_security_questions").update({ failed_attempts: 0, locked_until: null }).eq("id", record.id);
      return json({ success: true });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (error) {
    console.error(error);
    return json({ error: error instanceof Error ? error.message : "Request failed" }, 500);
  }
});
