import nodemailer from 'nodemailer'

// ─── Transporter ─────────────────────────────────────────────────────────────
function createTransporter() {
  return nodemailer.createTransport({
    host:   process.env.SMTP_HOST   ?? 'smtp.hostinger.com',
    port:   Number(process.env.SMTP_PORT ?? 465),
    secure: Number(process.env.SMTP_PORT ?? 465) === 465,
    auth: {
      user: process.env.SMTP_USER     ?? '',
      pass: process.env.SMTP_PASSWORD ?? '',
    },
  })
}

const FROM = process.env.SMTP_FROM ?? '"Track Edge" <support@trackedge.com.au>'
const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://trackedge.com.au').replace(/\/$/, '')

// ─── Shared HTML wrapper ──────────────────────────────────────────────────────
function htmlWrapper(body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Track Edge</title>
  <style>
    body { margin:0; padding:0; background:#0e1117; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color:#f8fafc; }
    .wrapper { max-width:600px; margin:0 auto; padding:32px 16px; }
    .logo { text-align:center; margin-bottom:32px; }
    .logo span { font-size:22px; font-weight:900; color:#ff6600; letter-spacing:-0.5px; }
    .logo small { font-size:11px; font-weight:600; letter-spacing:3px; text-transform:uppercase; color:#64748b; display:block; margin-top:2px; }
    .card { background:#161b26; border:1px solid #1e2535; border-radius:12px; padding:32px; }
    h1 { margin:0 0 8px; font-size:22px; font-weight:800; color:#f8fafc; }
    p  { margin:12px 0; font-size:15px; line-height:1.6; color:#94a3b8; }
    .btn { display:inline-block; margin:20px 0; padding:14px 32px; background:#ff6600; color:#fff !important; font-weight:700; font-size:15px; border-radius:8px; text-decoration:none; }
    .divider { border:none; border-top:1px solid #1e2535; margin:24px 0; }
    .badge { display:inline-block; padding:4px 12px; border-radius:999px; font-size:12px; font-weight:700; }
    .badge-free    { background:#1e2535; color:#94a3b8; }
    .badge-premium { background:#ff6600; color:#fff; }
    .tip-row { display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px solid #1e2535; font-size:14px; }
    .tip-label { color:#64748b; }
    .tip-value { color:#f8fafc; font-weight:600; }
    .footer { margin-top:24px; text-align:center; font-size:12px; color:#475569; }
    .footer a { color:#ff6600; text-decoration:none; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="logo">
      <span>Track Edge</span>
      <small>Premium Racing Intelligence</small>
    </div>
    <div class="card">
      ${body}
    </div>
    <div class="footer">
      <p>Track Edge &mdash; <a href="${APP_URL}">${APP_URL.replace('https://', '')}</a></p>
      <p>You are receiving this email because you have an account with Track Edge.</p>
    </div>
  </div>
</body>
</html>`
}

// ─── Welcome Email ────────────────────────────────────────────────────────────
export async function sendWelcomeEmail(
  email:      string,
  membership: 'free' | 'premium'
): Promise<void> {
  const isPremium = membership === 'premium'

  const html = htmlWrapper(`
    <h1>Welcome to Track Edge!</h1>
    <p>Your account has been created successfully. You are now on the
      <span class="badge ${isPremium ? 'badge-premium' : 'badge-free'}">
        ${isPremium ? 'Premium' : 'Free'}
      </span>
      plan.
    </p>
    <hr class="divider"/>
    ${isPremium
      ? `<p>You have full access to all premium racing tips, AI-powered analytics, and high-confidence selections.</p>`
      : `<p>You have access to our free racing tips and results. Upgrade to Premium anytime for advanced tips and analytics.</p>`
    }
    <a class="btn" href="${APP_URL}/${isPremium ? 'premium-tips' : 'free-tips'}">
      View Today&apos;s Tips
    </a>
    <hr class="divider"/>
    <p style="font-size:13px;">
      Need help? Reply to this email or contact us at
      <a href="mailto:support@trackedge.com.au" style="color:#ff6600;">support@trackedge.com.au</a>
    </p>
  `)

  await createTransporter().sendMail({
    from:    FROM,
    to:      email,
    subject: `Welcome to Track Edge${isPremium ? ' Premium' : ''}!`,
    html,
  })
}

// ─── Password Reset Email ─────────────────────────────────────────────────────
export async function sendPasswordResetEmail(
  email: string,
  token: string
): Promise<void> {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`

  const html = htmlWrapper(`
    <h1>Reset Your Password</h1>
    <p>We received a request to reset your password. Click the button below to set a new password. This link expires in <strong style="color:#f8fafc;">1 hour</strong>.</p>
    <a class="btn" href="${resetUrl}">Reset Password</a>
    <hr class="divider"/>
    <p style="font-size:13px;">If you did not request this, you can safely ignore this email. Your password will not change.</p>
    <p style="font-size:12px; color:#475569;">Or copy and paste this link into your browser:<br/>
      <span style="color:#ff6600;">${resetUrl}</span>
    </p>
  `)

  await createTransporter().sendMail({
    from:    FROM,
    to:      email,
    subject: 'Track Edge — Password Reset Request',
    html,
  })
}

// ─── Tip Notification Email ───────────────────────────────────────────────────
export interface TipEmailData {
  venue:      string
  raceNumber: number
  horseName:  string
  trainer:    string
  jockey:     string
  tipType:    string
  units:      number
  confidence: string
  odds?:      string | null
  comments?:  string | null
  date:       string
}

export async function sendTipNotificationEmail(
  recipients: string[],
  tip:        TipEmailData
): Promise<{ sent: number; failed: number }> {
  const confidenceColor: Record<string, string> = {
    high:   '#22c55e',
    medium: '#ff6600',
    low:    '#94a3b8',
  }

  const tipsUrl = `${APP_URL}/${tip.tipType === 'premium' ? 'premium-tips' : 'free-tips'}`

  const html = htmlWrapper(`
    <h1>New Racing Tip Alert</h1>
    <p>A new <span class="badge ${tip.tipType === 'premium' ? 'badge-premium' : 'badge-free'}">${
      tip.tipType === 'premium' ? 'Premium' : 'Free'
    }</span> tip has just been posted for <strong style="color:#f8fafc;">${tip.date}</strong>.</p>

    <hr class="divider"/>

    <div class="tip-row">
      <span class="tip-label">Horse</span>
      <span class="tip-value" style="font-size:17px;color:#ff6600;">${tip.horseName}</span>
    </div>
    <div class="tip-row">
      <span class="tip-label">Venue</span>
      <span class="tip-value">${tip.venue}</span>
    </div>
    <div class="tip-row">
      <span class="tip-label">Race</span>
      <span class="tip-value">Race ${tip.raceNumber}</span>
    </div>
    <div class="tip-row">
      <span class="tip-label">Trainer</span>
      <span class="tip-value">${tip.trainer}</span>
    </div>
    <div class="tip-row">
      <span class="tip-label">Jockey</span>
      <span class="tip-value">${tip.jockey}</span>
    </div>
    <div class="tip-row">
      <span class="tip-label">Units</span>
      <span class="tip-value">${tip.units} unit${tip.units !== 1 ? 's' : ''}</span>
    </div>
    <div class="tip-row">
      <span class="tip-label">Confidence</span>
      <span class="tip-value" style="color:${confidenceColor[tip.confidence] ?? '#f8fafc'}; text-transform:capitalize;">
        ${tip.confidence}
      </span>
    </div>
    ${tip.odds ? `
    <div class="tip-row">
      <span class="tip-label">Odds</span>
      <span class="tip-value">${tip.odds}</span>
    </div>` : ''}
    ${tip.comments ? `
    <hr class="divider"/>
    <p style="font-style:italic;color:#94a3b8;">&ldquo;${tip.comments}&rdquo;</p>` : ''}

    <hr class="divider"/>
    <a class="btn" href="${tipsUrl}">View Full Tip</a>
  `)

  let sent   = 0
  let failed = 0

  // Send individually to avoid exposing other recipients
  const results = await Promise.allSettled(
    recipients.map(to =>
      createTransporter().sendMail({
        from:    FROM,
        to,
        subject: `Track Edge Tip: ${tip.horseName} — Race ${tip.raceNumber} at ${tip.venue}`,
        html,
      })
    )
  )

  for (const result of results) {
    if (result.status === 'fulfilled') sent++
    else {
      failed++
      console.error('[EMAIL] Send failed:', result.reason)
    }
  }

  return { sent, failed }
}
