import { Resend } from 'resend';

// Lazily constructed -- the Resend SDK throws immediately if the key is
// missing, and this module gets imported during `next build`'s route
// analysis before any env vars are guaranteed to be set.
let resend: Resend | null = null;
function getClient(): Resend {
  if (!resend) resend = new Resend(process.env.RESEND_API_KEY);
  return resend;
}

const FROM = 'Tyler Ashbaugh <tyler@enjoyproperties.us>';

export async function sendEmail(params: { to: string; subject: string; html: string }) {
  return getClient().emails.send({
    from: FROM,
    to: params.to,
    subject: params.subject,
    html: params.html,
  });
}
