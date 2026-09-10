import { MailtrapClient } from 'mailtrap';

// ── Client (singleton) ────────────────────────────────────────────────────────

const TOKEN       = process.env.MAILTRAP_TOKEN ?? '';
const INBOX_ID    = Number(process.env.MAILTRAP_INBOX_ID);
const FROM_EMAIL  = process.env.EMAIL_FROM_ADDRESS ?? 'noreply@steadyvitality.com';
const FROM_NAME   = process.env.EMAIL_FROM_NAME    ?? 'Steady Vitality';
let configurationWarningShown = false;

const client = new MailtrapClient({
  token: TOKEN,
  sandbox: true,
  testInboxId: INBOX_ID,
});

function hasMailtrapConfiguration(): boolean {
  return TOKEN.trim().length > 0 && Number.isInteger(INBOX_ID) && INBOX_ID > 0;
}

function ensureMailtrapConfiguration(): boolean {
  if (hasMailtrapConfiguration()) return true;

  if (!configurationWarningShown) {
    configurationWarningShown = true;
    console.error(
      '[mailer] Mailtrap is not configured. Set MAILTRAP_TOKEN and MAILTRAP_INBOX_ID in apps/api/.env; email was not sent.'
    );
  }
  return false;
}

// ── Shared HTML shell ─────────────────────────────────────────────────────────

function buildEmail(opts: {
  preheader:   string;
  heading:     string;
  body:        string;
  buttonLabel: string;
  buttonUrl:   string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${opts.heading}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Arial,sans-serif;">
  <span style="display:none;max-height:0;overflow:hidden;">${opts.preheader}</span>

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0"
               style="background:#ffffff;border-radius:12px;overflow:hidden;
                      box-shadow:0 2px 8px rgba(0,0,0,0.08);max-width:600px;width:100%;">

          <!-- Header bar -->
          <tr>
            <td style="background:#1B4332;padding:28px 40px;">
              <p style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.3px;">
                Steady Vitality
              </p>
              <p style="margin:4px 0 0;color:#a0c4b0;font-size:13px;">
                Coaching Platform
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <h1 style="margin:0 0 16px;color:#1a1a2e;font-size:24px;font-weight:700;line-height:1.3;">
                ${opts.heading}
              </h1>
              <div style="color:#4a4a6a;font-size:15px;line-height:1.7;">
                ${opts.body}
              </div>

              <!-- CTA button -->
              <table cellpadding="0" cellspacing="0" style="margin:32px 0 0;">
                <tr>
                  <td style="border-radius:8px;background:#1B4332;">
                    <a href="${opts.buttonUrl}"
                       style="display:inline-block;padding:14px 32px;color:#ffffff;
                              font-size:15px;font-weight:600;text-decoration:none;
                              border-radius:8px;letter-spacing:0.2px;">
                      ${opts.buttonLabel}
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Fallback link -->
              <p style="margin:24px 0 0;color:#8080a0;font-size:12px;line-height:1.6;">
                If the button doesn't work, copy and paste this link into your browser:<br />
                <a href="${opts.buttonUrl}"
                   style="color:#1B4332;word-break:break-all;">${opts.buttonUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8f8fc;padding:20px 40px;border-top:1px solid #e8e8f0;">
              <p style="margin:0;color:#a0a0c0;font-size:12px;line-height:1.6;">
                This invite link expires in <strong>7 days</strong>. If you didn't expect this
                email, you can safely ignore it.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ── Public send functions ─────────────────────────────────────────────────────

/**
 * Send a coach invite email (triggered by admin).
 * Fire-and-forget — errors are caught and logged; they never bubble up.
 */
export async function sendCoachInviteEmail(to: string, inviteUrl: string): Promise<void> {
  if (!ensureMailtrapConfiguration()) return;

  try {
    const html = buildEmail({
      preheader:   'You have been invited to join Steady Vitality as a coach.',
      heading:     "You're invited to join as a Coach",
      body: `
        <p>You've been selected to join the <strong>Steady Vitality</strong> coaching platform.</p>
        <p>Click the button below to create your account and complete your coach profile. Your invite link is valid for <strong>7 days</strong>.</p>
      `,
      buttonLabel: 'Accept Invite & Create Account',
      buttonUrl:   inviteUrl,
    });

    await client.send({
      from:     { email: FROM_EMAIL, name: FROM_NAME },
      to:       [{ email: to }],
      subject:  "You're invited to join as a Coach",
      html,
      category: 'Coach Invite',
    });

    console.log(`[mailer] Coach invite sent → ${to}`);
  } catch (err) {
    console.error(`[mailer] Failed to send coach invite to ${to}:`, err);
  }
}

/**
 * Send a client invite email (triggered by a coach).
 * Fire-and-forget — errors are caught and logged; they never bubble up.
 */
export async function sendClientInviteEmail(
    to:        string,
    inviteUrl: string,
    coachName: string,
): Promise<void> {
  if (!ensureMailtrapConfiguration()) return;

  try {
    const html = buildEmail({
      preheader:   `${coachName} has invited you to their coaching platform.`,
      heading:     `${coachName} invited you`,
      body: `
        <p><strong>${coachName}</strong> has invited you to join their coaching programme on
        <strong>Steady Vitality</strong>.</p>
        <p>Click the button below to create your account and get started. Your invite link is
        valid for <strong>7 days</strong>.</p>
      `,
      buttonLabel: 'Accept Invite & Create Account',
      buttonUrl:   inviteUrl,
    });

    await client.send({
      from:     { email: FROM_EMAIL, name: FROM_NAME },
      to:       [{ email: to }],
      subject:  `${coachName} invited you to their coaching platform`,
      html,
      category: 'Client Invite',
    });

    console.log(`[mailer] Client invite sent → ${to}`);
  } catch (err) {
    console.error(`[mailer] Failed to send client invite to ${to}:`, err);
  }
}
/** Send an account email-verification link. */
export async function sendEmailVerificationEmail(to: string, verificationUrl: string): Promise<boolean> {
  if (!ensureMailtrapConfiguration()) return false;

  try {
    const html = buildEmail({
      preheader: 'Confirm your Steady Vitality email address.',
      heading: 'Confirm your email address',
      body: '<p>Confirm your email address to finish setting up your Steady Vitality account.</p>',
      buttonLabel: 'Confirm email',
      buttonUrl: verificationUrl,
    });
    await client.send({
      from: { email: FROM_EMAIL, name: FROM_NAME },
      to: [{ email: to }],
      subject: 'Confirm your Steady Vitality email',
      html,
      category: 'Email verification',
    });
    return true;
  } catch (err) {
    console.error('[mailer] Failed to send email verification message:', err);
    return false;
  }
}

/** Send a password-reset link without exposing whether an account exists. */
export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  if (!ensureMailtrapConfiguration()) return;

  try {
    const html = buildEmail({
      preheader: 'Reset your Steady Vitality password.',
      heading: 'Reset your password',
      body: '<p>Use this link to choose a new password. If you did not request it, you can safely ignore this email.</p>',
      buttonLabel: 'Reset password',
      buttonUrl: resetUrl,
    });
    await client.send({
      from: { email: FROM_EMAIL, name: FROM_NAME },
      to: [{ email: to }],
      subject: 'Reset your Steady Vitality password',
      html,
      category: 'Password reset',
    });
  } catch (err) {
    console.error('[mailer] Failed to send password reset message:', err);
  }
}
