import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const sendEmailMock = vi.fn().mockResolvedValue({});
const sendSmsMock = vi.fn().mockResolvedValue({});
const checkRateLimitMock = vi.fn().mockResolvedValue(true);

vi.mock('@/lib/resend', () => ({ sendEmail: sendEmailMock }));
vi.mock('@/lib/twilio', () => ({ sendSms: sendSmsMock }));
vi.mock('@/lib/rate-limit', () => ({ checkRateLimit: checkRateLimitMock }));

const LEAD_ROW = {
  contact_id: 'contact-1',
  source_detail: 'landing-page',
  raw_payload: null,
};

const CONTACT_ROW = {
  name: 'Jane Doe',
  email: 'jane@example.com',
  phone: '2104190000',
  source: 'content',
  contact_type: 'buyer',
};

// Chainable mock: every method returns the same object so
// .update().eq().is().select().maybeSingle() resolves regardless of
// call order, and a bare .eq()/.lt() tail (no .maybeSingle()) is
// itself awaitable via .then.
function chainMock(result: unknown) {
  const obj: Record<string, unknown> = {};
  const chain = ['update', 'select', 'eq', 'is', 'insert', 'upsert', 'delete', 'lt', 'gte', 'not', 'in'];
  for (const method of chain) {
    obj[method] = vi.fn(() => obj);
  }
  obj.maybeSingle = vi.fn(() => Promise.resolve(result));
  obj.single = vi.fn(() => Promise.resolve(result));
  obj.then = (resolve: (v: unknown) => unknown) => Promise.resolve(result).then(resolve);
  return obj;
}

const fromMock = vi.fn((table: string) => {
  if (table === 'contacts') return chainMock({ data: CONTACT_ROW });
  return chainMock({ data: LEAD_ROW }); // 'leads' claim + any deferral update
});

vi.mock('@/lib/supabase-admin', () => ({
  supabaseAdmin: { from: fromMock },
}));

// Import after mocks are registered.
const { notifyAgentOfNewLead } = await import('./notify-agent');

beforeEach(() => {
  sendEmailMock.mockClear();
  sendSmsMock.mockClear();
  checkRateLimitMock.mockClear().mockResolvedValue(true);
  fromMock.mockClear();
  vi.stubEnv('AGENT_NOTIFICATION_PHONE', '+12105551234');
  vi.stubEnv('AGENT_NOTIFICATION_EMAIL', 'tyler@enjoyproperties.us');
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('notifyAgentOfNewLead -- HTML escaping (B2)', () => {
  it('escapes a malicious name before building the email HTML', async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === 'contacts') {
        return chainMock({ data: { ...CONTACT_ROW, name: '<a href="https://evil.example">x</a>' } });
      }
      return chainMock({ data: LEAD_ROW });
    });

    await notifyAgentOfNewLead('lead-1');

    const html = sendEmailMock.mock.calls[0][0].html as string;
    expect(html).not.toContain('<a href="https://evil.example">');
    expect(html).toContain('&lt;a href=&quot;https://evil.example&quot;&gt;');
  });
});

describe('notifyAgentOfNewLead -- real DB error on the claim update is logged, not swallowed', () => {
  it('logs and returns without sending when the claim update itself errors', async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === 'contacts') return chainMock({ data: CONTACT_ROW });
      return chainMock({ data: null, error: { message: 'column leads.notified_at does not exist' } });
    });
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await notifyAgentOfNewLead('lead-1');

    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('claim update failed'),
      expect.objectContaining({ message: 'column leads.notified_at does not exist' })
    );
    expect(sendEmailMock).not.toHaveBeenCalled();
    expect(sendSmsMock).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});

describe('notifyAgentOfNewLead -- SMS name truncation (B2)', () => {
  it('truncates an oversized name in the SMS body but not the email HTML', async () => {
    const longName = 'A'.repeat(100);
    fromMock.mockImplementation((table: string) => {
      if (table === 'contacts') return chainMock({ data: { ...CONTACT_ROW, name: longName } });
      return chainMock({ data: LEAD_ROW });
    });

    await notifyAgentOfNewLead('lead-1');

    const smsBody = sendSmsMock.mock.calls[0][0].body as string;
    const emailHtml = sendEmailMock.mock.calls[0][0].html as string;
    expect(smsBody).not.toContain(longName);
    expect(smsBody.split('\n')[0].length).toBeLessThanOrEqual(50);
    expect(emailHtml).toContain(longName);
  });
});

describe('notifyAgentOfNewLead -- missing AGENT_NOTIFICATION_PHONE (B6)', () => {
  it('skips SMS and still sends email when the phone env var is unset', async () => {
    vi.stubEnv('AGENT_NOTIFICATION_PHONE', '');
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await notifyAgentOfNewLead('lead-1');

    expect(sendSmsMock).not.toHaveBeenCalled();
    expect(sendEmailMock).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('AGENT_NOTIFICATION_PHONE'));
    errorSpy.mockRestore();
  });
});

describe('notifyAgentOfNewLead -- global notification cap (B3)', () => {
  it('skips SMS but still sends email when only the SMS bucket is capped', async () => {
    checkRateLimitMock.mockImplementation((bucket: string) =>
      Promise.resolve(bucket !== 'notify:sms:global')
    );

    await notifyAgentOfNewLead('lead-1');

    expect(sendSmsMock).not.toHaveBeenCalled();
    expect(sendEmailMock).toHaveBeenCalledTimes(1);
  });

  it('skips email but still sends SMS when only the email bucket is capped', async () => {
    checkRateLimitMock.mockImplementation((bucket: string) =>
      Promise.resolve(bucket !== 'notify:email:global')
    );

    await notifyAgentOfNewLead('lead-1');

    expect(sendEmailMock).not.toHaveBeenCalled();
    expect(sendSmsMock).toHaveBeenCalledTimes(1);
  });

  it('sets next_follow_up_at on the lead when either channel is capped', async () => {
    checkRateLimitMock.mockResolvedValue(false);
    const updateMock = vi.fn((_update: Record<string, unknown>) => chainMock({ data: LEAD_ROW }));
    fromMock.mockImplementation((table: string) => {
      if (table === 'contacts') return chainMock({ data: CONTACT_ROW });
      // First 'leads' call is the notified_at claim; return the lead.
      // Record the deferral update call so we can assert on it.
      const mock = chainMock({ data: LEAD_ROW });
      mock.update = updateMock;
      return mock;
    });

    await notifyAgentOfNewLead('lead-1');

    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({ next_follow_up_at: expect.any(String) })
    );
  });

  it('does not defer when neither channel is capped', async () => {
    const updateMock = vi.fn((_update: Record<string, unknown>) => chainMock({ data: LEAD_ROW }));
    fromMock.mockImplementation((table: string) => {
      if (table === 'contacts') return chainMock({ data: CONTACT_ROW });
      const mock = chainMock({ data: LEAD_ROW });
      mock.update = updateMock;
      return mock;
    });

    await notifyAgentOfNewLead('lead-1');

    const deferCalls = updateMock.mock.calls.filter(
      (call) => (call[0] as Record<string, unknown>)?.next_follow_up_at
    );
    expect(deferCalls).toHaveLength(0);
  });
});
