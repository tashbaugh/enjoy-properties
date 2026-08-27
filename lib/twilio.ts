import twilio from 'twilio';

// API Key/Secret, not the main Auth Token -- scoped and independently
// revocable if this key ever leaks, unlike the Auth Token which is a
// full-access account credential with no partial-revoke option.
const client = twilio(process.env.TWILIO_API_KEY_SID, process.env.TWILIO_API_KEY_SECRET, {
  accountSid: process.env.TWILIO_ACCOUNT_SID,
});

export async function sendSms(params: { to: string; body: string }) {
  return client.messages.create({
    to: params.to,
    from: process.env.TWILIO_FROM_NUMBER!,
    body: params.body,
  });
}
