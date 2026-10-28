import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

/** Sends through SMTP when SMTP_URL is set. In development it prints the message instead, so flows can be tested without a mail server. */
@Injectable()
export class MailService {
  private readonly log = new Logger(MailService.name);
  private readonly transport?: nodemailer.Transporter;
  private readonly from: string;
  readonly origin: string;
  private readonly prod: boolean;

  constructor(cfg: ConfigService) {
    const url = cfg.get<string>('SMTP_URL');
    this.transport = url ? nodemailer.createTransport(url) : undefined;
    this.from = cfg.get<string>('MAIL_FROM', 'Talent Scout AI <no-reply@talentscout.ai>');
    this.origin = cfg.get<string>('WEB_ORIGIN', 'http://localhost:3000').split(',')[0];
    this.prod = cfg.get('NODE_ENV') === 'production';
  }

  async send(to: string, subject: string, heading: string, lines: string[], cta?: { label: string; url: string }) {
    const text = [heading, '', ...lines, ...(cta ? ['', `${cta.label}: ${cta.url}`] : []), '', 'Talent Scout AI'].join('\n');
    const html = `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#1b1a17"><h2 style="margin:0 0 16px">${esc(heading)}</h2>${lines.map((l) => `<p style="line-height:1.6;margin:0 0 12px">${esc(l)}</p>`).join('')}${cta ? `<p style="margin:24px 0"><a href="${esc(cta.url)}" style="background:#0e7c66;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">${esc(cta.label)}</a></p>` : ''}<p style="color:#6b675f;font-size:13px">Talent Scout AI</p></div>`;
    if (!this.transport) {
      if (this.prod) this.log.warn(`SMTP_URL is not set, so the email "${subject}" to ${to} was not sent`);
      else this.log.log(`[dev email] To: ${to}\nSubject: ${subject}\n${text}`);
      return;
    }
    try { await this.transport.sendMail({ from: this.from, to, subject, text, html }); }
    catch (e) { this.log.error(`Email to ${to} failed: ${(e as Error).message}`); }
  }
}
