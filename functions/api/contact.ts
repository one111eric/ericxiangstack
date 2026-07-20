/// <reference types="@cloudflare/workers-types" />

interface Env {
  // Optional: set these in Pages settings to actually deliver mail via Resend.
  RESEND_API_KEY?: string;
  CONTACT_TO?: string;
  CONTACT_FROM?: string;
}

interface ContactPayload {
  name?: string;
  email?: string;
  message?: string;
  // Honeypot: real users leave this empty.
  website?: string;
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let payload: ContactPayload;
  try {
    payload = (await request.json()) as ContactPayload;
  } catch {
    return json({ error: "Invalid request body." }, 400);
  }

  const name = (payload.name || "").trim();
  const email = (payload.email || "").trim();
  const message = (payload.message || "").trim();

  // Silently accept honeypot hits so bots think they succeeded.
  if (payload.website) return json({ ok: true });

  if (!name || !email || !message) {
    return json({ error: "Please fill in all fields." }, 400);
  }
  if (!EMAIL_RE.test(email)) {
    return json({ error: "Please enter a valid email address." }, 400);
  }
  if (message.length > 5000) {
    return json({ error: "Message is too long." }, 400);
  }

  // If Resend is configured, deliver the email. Otherwise, accept and log so
  // the form works out of the box before email is wired up.
  if (env.RESEND_API_KEY && env.CONTACT_TO && env.CONTACT_FROM) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${env.RESEND_API_KEY}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from: env.CONTACT_FROM,
        to: env.CONTACT_TO,
        reply_to: email,
        subject: `[ericxiangstack] Message from ${name}`,
        text: `From: ${name} <${email}>\n\n${message}`,
      }),
    });
    if (!res.ok) {
      return json({ error: "Could not send message right now." }, 502);
    }
  } else {
    console.log("Contact form submission:", { name, email, message });
  }

  return json({ ok: true });
};
