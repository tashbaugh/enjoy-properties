'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { captureUtmParams, buildSourceDetail, resolveContactSource } from '@/lib/utm';
import { trackLeadConversion } from '@/lib/analytics';

type Props = {
  source: 'content' | 'ad' | 'referral' | 'public_record'; // fallback if no UTM present
  contactType: 'buyer' | 'seller' | 'investor' | 'past_client';
  sourceDetail: string; // e.g. "landing-page", "lease-tenant", "lease-landlord"
  tags?: string[]; // e.g. ["lease"]
};

export default function ContactForm({ source, contactType, sourceDetail, tags }: Props) {
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle');

  useEffect(() => {
    captureUtmParams();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('submitting');

    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .insert({
        name: form.name,
        email: form.email,
        phone: form.phone,
        source: resolveContactSource(source),
        contact_type: contactType,
        tags: tags ?? null,
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
    if (!leadError) trackLeadConversion(contactType);
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
