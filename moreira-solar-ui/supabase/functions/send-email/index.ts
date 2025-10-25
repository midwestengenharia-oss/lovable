// Função Edge Supabase: Envio de convite por e-mail
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  try {
    const { to, subject, html } = await req.json();

    if (!to || !subject || !html) {
      return new Response("Campos inválidos", { status: 400 });
    }

    // Envia o e-mail via API interna do Supabase (SMTP configurado em Auth → Email)
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("RESEND_API_KEY")}`, // ou SMTP_KEY se quiser usar outro serviço
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Moreira Solar <no-reply@moreirasolar.com.br>",
        to: [to],
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return new Response(`Erro ao enviar: ${err}`, { status: 500 });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
