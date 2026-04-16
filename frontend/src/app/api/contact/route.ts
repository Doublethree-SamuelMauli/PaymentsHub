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
    const { name, company, email, phone, message } = body;

    if (!name || !email) {
      return NextResponse.json({ error: "Nome e email obrigatorios" }, { status: 400 });
    }

    // Email para o consultor
    await transporter.sendMail({
      from: '"PaymentsHub" <contato@doublethree.com.br>',
      to: "contato@doublethree.com.br",
      subject: `[PaymentsHub Lead] ${company || name}`,
      html: `
        <div style="font-family:Inter,system-ui,sans-serif;max-width:560px;margin:0 auto">
          <div style="background:#18181b;padding:24px 32px;border-radius:8px 8px 0 0">
            <h2 style="color:#fff;margin:0;font-size:18px">Novo Lead - PaymentsHub</h2>
          </div>
          <div style="background:#fff;padding:24px 32px;border:1px solid #e4e4e7;border-top:none;border-radius:0 0 8px 8px">
            <table style="width:100%;font-size:14px;color:#3f3f46">
              <tr><td style="padding:8px 0;font-weight:600;width:120px">Nome</td><td>${name}</td></tr>
              <tr><td style="padding:8px 0;font-weight:600">Empresa</td><td>${company || "-"}</td></tr>
              <tr><td style="padding:8px 0;font-weight:600">Email</td><td><a href="mailto:${email}">${email}</a></td></tr>
              <tr><td style="padding:8px 0;font-weight:600">Telefone</td><td>${phone || "-"}</td></tr>
            </table>
            ${message ? `<div style="margin-top:16px;padding:16px;background:#fafafa;border-radius:6px;font-size:14px;color:#52525b">${message}</div>` : ""}
          </div>
        </div>
      `,
    });

    // Email de confirmacao para o cliente
    await transporter.sendMail({
      from: '"PaymentsHub" <contato@doublethree.com.br>',
      to: email,
      subject: "Recebemos sua solicitacao - PaymentsHub",
      html: `
        <div style="font-family:Inter,system-ui,sans-serif;max-width:560px;margin:0 auto">
          <div style="background:#18181b;padding:24px 32px;border-radius:8px 8px 0 0">
            <h2 style="color:#fff;margin:0;font-size:18px">PaymentsHub</h2>
          </div>
          <div style="background:#fff;padding:24px 32px;border:1px solid #e4e4e7;border-top:none;border-radius:0 0 8px 8px">
            <p style="font-size:15px;color:#3f3f46;line-height:1.6">Ola ${name},</p>
            <p style="font-size:15px;color:#3f3f46;line-height:1.6">
              Recebemos sua solicitacao de contato. Um consultor da Double Three
              entrara em contato em ate 24 horas uteis para entender suas necessidades
              e apresentar como o PaymentsHub pode otimizar sua operacao de pagamentos.
            </p>
            <p style="font-size:13px;color:#a1a1aa;margin-top:24px">
              Double Three Tecnologia<br>
              contato@doublethree.com.br
            </p>
          </div>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact email error:", error);
    return NextResponse.json({ error: "Erro ao enviar email" }, { status: 500 });
  }
}
