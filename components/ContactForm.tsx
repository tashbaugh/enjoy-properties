'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { captureUtmParams, buildSourceDetail, resolveContactSource } from '@/lib/utm';
import { trackLeadConversion } from '@/lib/analytics';

type ContactType = 'buyer' | 'seller' | 'investor' | 'past_client';

type Props = {
  source: 'content' | 'ad' | 'referral' | 'public_record'; // fallback if no UTM present
  contactType?: ContactType; // required unless showReasonSelect is true
  sourceDetail: string; // e.g. "landing-page", "lease-tenant", "lease-landlord"
  tags?: string[]; // e.g. ["lease"]
  // General /contact page only: adds a "what are you looking for?"
  // select that determines contactType/tags itself, instead of the
  // caller passing a single fixed contactType like every other
  // ContactForm placement does.
  showReasonSelect?: boolean;
};

const REASON_OPTIONS: { value: string; label: string; contactType: ContactType; tags?: string[] }[] = [
  { value: 'buying', label: 'Buying', contactType: 'buyer' },
  { value: 'renting', label: 'Renting', contactType: 'buyer', tags: ['lease'] },
  { value: 'listing', label: 'Listing a rental', contactType: 'seller', tags: ['lease'] },
  // No signal either way -- defaults to the most common/neutral lead
  // type rather than leaving contact_type unset, since the column is
  // NOT NULL and a schema change wasn't worth it for this.
  { value: 'not-sure', label: 'Not sure yet', contactType: 'buyer' },
];

export default function ContactForm({ source, contactType, sourceDetail, tags, showReasonSelect }: Props) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', reason: '' });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle');

  useEffect(() => {
    captureUtmParams();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('submitting');

    const selectedReason = REASON_OPTIONS.find((r) => r.value === form.reason);
    const effectiveContactType = showReasonSelect ? selectedReason!.contactType : contactType!;
    const effectiveTags = showReasonSelect ? (selectedReason!.tags ?? null) : (tags ?? null);

    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .insert({
        name: form.name,
        email: form.email,
        phone: form.phone,
        source: resolveContactSource(source),
        contact_type: effectiveContactType,
        tags: effectiveTags,
      })
      .select('id')
      .single();

    if (contactError || !contact) {
      setStatus('error');
      return;
    }

    const { error: leadError } = await supabase.from('leads').insert({
      contact_id: contact.id,
      stage: 'new',
      source_detail: buildSourceDetail(sourceDetail),
    });

    setStatus(leadError ? 'error' : 'done');
    if (!leadError) {
      trackLeadConversion(effectiveContactType);
      // Fire-and-forget -- convenience notification to the agent, must
      // never block or fail the visitor's own success state.
      fetch('/api/notify-new-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId: contact.id }),
      }).catch(() => {});
    }
  }

  const inputClasses =
    'w-full rounded-lg border border-line bg-white px-4 py-2.5 text-ink placeholder:text-ink-soft/50 outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/30';
  const labelClasses = 'text-xs font-semibold uppercase tracking-wide text-ink-soft';

  if (status === 'done') {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-green-800">
        <p className="font-medium">Thanks — I&apos;ll be in touch shortly.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {showReasonSelect && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="reason" className={labelClasses}>What are you looking for?</label>
          <select
            id="reason"
            required
            className={inputClasses}
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
          >
            <option value="" disabled>Select one</option>
            {REASON_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
      )}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className={labelClasses}>Name</label>
        <input
          id="name"
          required
          placeholder="Jane Doe"
          className={inputClasses}
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className={labelClasses}>Email</label>
        <input
          id="email"
          required
          type="email"
          placeholder="jane@email.com"
          className={inputClasses}
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="phone" className={labelClasses}>Phone (optional)</label>
        <input
          id="phone"
          placeholder="(210) 555-0100"
          className={inputClasses}
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />
      </div>
      <button
        disabled={status === 'submitting'}
        className="mt-2 w-full rounded-lg bg-ink px-5 py-3 text-sm font-semibold text-paper transition hover:bg-gold disabled:cursor-not-allowed disabled:opacity-50"
      >
        {status === 'submitting' ? 'Sending...' : 'Get in touch'}
      </button>
      {status === 'error' && (
        <p className="text-sm text-red-600">Something went wrong — try again.</p>
      )}
    </form>
  );
}
