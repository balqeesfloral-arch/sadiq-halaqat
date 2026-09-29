import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2.112.3";

type WebhookPayload = {
  type?: string;
  table?: string;
  schema?: string;
  record?: Record<string, unknown>;
  old_record?: Record<string, unknown> | null;
};

type PushSubscriptionRow = {
  id: number;
  endpoint: string;
  p256dh: string;
  auth: string;
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

function secretKey() {
  const legacy = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (legacy) return legacy;

  const modern = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (!modern) return "";

  try {
    const parsed = JSON.parse(modern);
    return parsed?.default || Object.values(parsed || {})[0] || "";
  } catch {
    return "";
  }
}

function isAuthorized(req: Request) {
  const configuredSecret = Deno.env.get("PUSH_WEBHOOK_SECRET");
  const requestSecret = req.headers.get("x-sadiq-push-secret");

  if (
    configuredSecret &&
    requestSecret &&
    cryptoSafeEqual(configuredSecret, requestSecret)
  ) {
    return true;
  }

  const serviceKey = secretKey();
  const authorization = req.headers.get("authorization") || "";
  const bearer = authorization.replace(/^Bearer\s+/i, "");

  return Boolean(
    serviceKey &&
    bearer &&
    cryptoSafeEqual(serviceKey, bearer)
  );
}

function cryptoSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;

  let result = 0;
  for (let i = 0; i < a.length; i += 1) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

function isUuid(value: unknown) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value || "")
  );
}

function profileRecipientId(table: string, record: Record<string, unknown>) {
  if (table === "student_notifications") {
    return Number(record.student_id || 0) || null;
  }

  if (table === "internal_messages") {
    return Number(record.recipient_id || 0) || null;
  }

  if (table === "notification_recipients") {
    const candidate =
      record.recipient_id ??
      record.profile_id ??
      record.user_id;

    if (isUuid(candidate)) return null;
    return Number(candidate || 0) || null;
  }

  return null;
}

async function resolveAuthUserId(
  supabase: ReturnType<typeof createClient>,
  table: string,
  record: Record<string, unknown>
) {
  const direct =
    record.auth_user_id ??
    (isUuid(record.user_id) ? record.user_id : null);

  if (direct && isUuid(direct)) {
    return String(direct);
  }

  const profileId = profileRecipientId(table, record);
  if (!profileId) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("auth_user_id")
    .eq("id", profileId)
    .maybeSingle();

  if (error) {
    console.error("Push recipient profile lookup failed:", error);
    return null;
  }

  return data?.auth_user_id || null;
}

async function hydrateNotification(
  supabase: ReturnType<typeof createClient>,
  table: string,
  record: Record<string, unknown>
) {
  if (table !== "notification_recipients" || !record.notification_id) {
    return record;
  }

  const { data, error } = await supabase
    .from("notifications")
    .select("id, title, message, severity, action_url, action_label, created_at")
    .eq("id", record.notification_id)
    .maybeSingle();

  if (error) {
    console.warn("Push notification hydration failed:", error);
    return record;
  }

  return {
    ...record,
    notification: data || null,
  };
}

function pushContent(
  table: string,
  row: Record<string, unknown>
) {
  const notification =
    row.notification && typeof row.notification === "object"
      ? row.notification as Record<string, unknown>
      : null;

  if (table === "student_notifications") {
    return {
      title: String(row.title || "إشعار جديد من الصديق"),
      body: String(row.body || "لديك تحديث جديد في حساب الطالب."),
      url: String(row.action_path || "/student/notifications"),
      tag: `student-${row.id || Date.now()}`,
    };
  }

  if (table === "internal_messages") {
    return {
      title: String(row.subject || "رسالة جديدة في الصديق"),
      body: String(row.body || "لديك رسالة جديدة."),
      url: "/admin/notifications",
      tag: `message-${row.id || Date.now()}`,
    };
  }

  if (table === "notification_recipients") {
    return {
      title: String(
        notification?.title ||
        row.title ||
        "إشعار جديد من الصديق"
      ),
      body: String(
        notification?.message ||
        row.message ||
        "لديك إشعار جديد."
      ),
      url: String(
        notification?.action_url ||
        row.action_url ||
        "/"
      ),
      tag: `notification-${row.notification_id || row.id || Date.now()}`,
    };
  }

  return {
    title: "الصديق",
    body: "لديك تحديث جديد.",
    url: "/",
    tag: `sadiq-${Date.now()}`,
  };
}

async function sendToSubscription(
  row: PushSubscriptionRow,
  payload: string
) {
  return webpush.sendNotification(
    {
      endpoint: row.endpoint,
      keys: {
        p256dh: row.p256dh,
        auth: row.auth,
      },
    },
    payload,
    {
      TTL: 60 * 60,
      urgency: "high",
    }
  );
}

export default {
  async fetch(req: Request) {
    if (req.method !== "POST") {
      return json({ error: "METHOD_NOT_ALLOWED" }, 405);
    }

    if (!isAuthorized(req)) {
      return json({ error: "UNAUTHORIZED" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = secretKey();
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");
    const vapidSubject =
      Deno.env.get("VAPID_SUBJECT") ||
      "https://sadiqh.vercel.app";

    if (
      !supabaseUrl ||
      !serviceRoleKey ||
      !vapidPublicKey ||
      !vapidPrivateKey
    ) {
      return json(
        { error: "PUSH_SERVER_NOT_CONFIGURED" },
        500
      );
    }

    webpush.setVapidDetails(
      vapidSubject,
      vapidPublicKey,
      vapidPrivateKey
    );

    let payload: WebhookPayload;

    try {
      payload = await req.json();
    } catch {
      return json({ error: "INVALID_JSON" }, 400);
    }

    const table = String(payload.table || "");
    const record = payload.record || {};

    if (
      payload.type &&
      String(payload.type).toUpperCase() !== "INSERT"
    ) {
      return json({ ok: true, skipped: "event_type" });
    }

    if (
      ![
        "student_notifications",
        "internal_messages",
        "notification_recipients",
      ].includes(table)
    ) {
      return json({ ok: true, skipped: "table" });
    }

    const supabase = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    const authUserId = await resolveAuthUserId(
      supabase,
      table,
      record
    );

    if (!authUserId) {
      return json({
        ok: true,
        skipped: "recipient_not_resolved",
      });
    }

    const { data: subscriptions, error: subscriptionsError } =
      await supabase
        .from("push_subscriptions")
        .select("id, endpoint, p256dh, auth")
        .eq("auth_user_id", authUserId)
        .eq("is_active", true);

    if (subscriptionsError) {
      console.error(
        "Push subscription lookup failed:",
        subscriptionsError
      );
      return json({ error: "SUBSCRIPTION_LOOKUP_FAILED" }, 500);
    }

    if (!subscriptions?.length) {
      return json({ ok: true, sent: 0 });
    }

    const hydrated = await hydrateNotification(
      supabase,
      table,
      record
    );
    const content = pushContent(table, hydrated);

    const pushPayload = JSON.stringify({
      ...content,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data: {
        table,
        recipient: authUserId,
      },
    });

    let sent = 0;
    let expired = 0;
    const failures: Array<{ id: number; status: number | null }> = [];

    for (const subscription of subscriptions as PushSubscriptionRow[]) {
      try {
        await sendToSubscription(subscription, pushPayload);
        sent += 1;

        await supabase
          .from("push_subscriptions")
          .update({
            last_seen_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", subscription.id);
      } catch (error) {
        const statusCode = Number(
          (error as { statusCode?: number })?.statusCode || 0
        );

        if (statusCode === 404 || statusCode === 410) {
          expired += 1;
          await supabase
            .from("push_subscriptions")
            .delete()
            .eq("id", subscription.id);
        } else {
          failures.push({
            id: subscription.id,
            status: statusCode || null,
          });
          console.error("Web Push send failed:", error);
        }
      }
    }

    return json({
      ok: true,
      sent,
      expired,
      failed: failures.length,
      failures,
    });
  },
};
