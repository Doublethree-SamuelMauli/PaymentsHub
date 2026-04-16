import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER || "contato@doublethree.com.br",
    pass: process.env.SMTP_PASS || "lczo qral ctwg idpe",
  },
});

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, company, volume } = body;

    if (!name || !email || !company) {
      return NextResponse.json({ error: "Campos obrigatorios faltando" }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) {
      return NextResponse.json({ error: "Email invalido" }, { status: 400 });
    }

    await transporter.sendMail({
      from: '"PaymentsHub" <contato@doublethree.com.br>',
      to: "contato@doublethree.com.br",
      replyTo: email,
      subject: `[PaymentsHub Demo] ${company} — ${volume || "volume nao informado"}`,
      html: `
        <div style="font-family:Inter,system-ui,sans-serif;max-width:560px;margin:0 auto">
          <div style="background:#143573;padding:24px 32px;border-radius:8px 8px 0 0">
            <h2 style="color:#fff;margin:0;font-size:18px">Solicitacao de Demo - PaymentsHub</h2>
          </div>
          <div style="background:#fff;padding:24px 32px;border:1px solid #e4e4e7;border-top:none;border-radius:0 0 8px 8px">
            <table style="width:100%;font-size:14px;color:#3f3f46">
              <tr><td style="padding:8px 0;font-weight:600;width:140px">Nome</td><td>${name}</td></tr>
              <tr><td style="padding:8px 0;font-weight:600">Empresa</td><td>${company}</td></tr>
              <tr><td style="padding:8px 0;font-weight:600">Email</td><td><a href="mailto:${email}">${email}</a></td></tr>
              <tr><td style="padding:8px 0;font-weight:600">Volume mensal</td><td>${volume || "—"}</td></tr>
            </table>
            <p style="margin-top:16px;padding:12px 16px;background:#f4f6fb;border-left:3px solid #143573;font-size:13px;color:#4b5563;border-radius:4px">
              Lead qualificado — agendar demo de 20min em ate 4h uteis.
            </p>
          </div>
        </div>
      `,
    });

    await transporter.sendMail({
      from: '"PaymentsHub · doublethree" <contato@doublethree.com.br>',
      to: email,
      subject: "Demo agendada — PaymentsHub",
      html: `
        <div style="font-family:Inter,system-ui,sans-serif;max-width:560px;margin:0 auto">
          <div style="background:#143573;padding:24px 32px;border-radius:8px 8px 0 0">
            <h2 style="color:#fff;margin:0;font-size:18px">PaymentsHub</h2>
          </div>
          <div style="background:#fff;padding:24px 32px;border:1px solid #e4e4e7;border-top:none;border-radius:0 0 8px 8px">
            <p style="font-size:15px;color:#3f3f46;line-height:1.6">Ola ${name},</p>
            <p style="font-size:15px;color:#3f3f46;line-height:1.6">
              Recebemos sua solicitacao de demo do <strong>PaymentsHub</strong>. Em ate 4 horas uteis
              um especialista da doublethree entra em contato pelo seu e-mail para
              alinhar dia e horario. A demo dura 20 minutos e e ao vivo no nosso sandbox.
            </p>
            <p style="font-size:14px;color:#52525b;line-height:1.6">
              Se quiser adiantar, ja pode dar uma olhada na <a href="https://paymentshub.doublethree.com.br/docs" style="color:#143573">documentacao da API</a>
              ou no <a href="https://paymentshub.doublethree.com.br/login" style="color:#143573">ambiente demo</a>.
            </p>
            <p style="font-size:13px;color:#a1a1aa;margin-top:24px">
              doublethree Tecnologia<br>
              CNPJ 33.720.345/0001-79<br>
              contato@doublethree.com.br · (47) 99277-0701
            </p>
          </div>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("demo mail error", e);
    return NextResponse.json({ error: "Falha ao enviar" }, { status: 500 });
  }
}
