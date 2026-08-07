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
      .select()
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

  if (status === 'done') {
    return <p className="text-green-700 font-medium">Thanks — I'll be in touch shortly.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 max-w-sm">
      <input
        required
        placeholder="Name"
        className="border rounded px-3 py-2"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
      />
      <input
        required
        type="email"
        placeholder="Email"
        className="border rounded px-3 py-2"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
      />
      <input
        placeholder="Phone (optional)"
        className="border rounded px-3 py-2"
        value={form.phone}
        onChange={(e) => setForm({ ...form, phone: e.target.value })}
      />
      <button
        disabled={status === 'submitting'}
        className="bg-black text-white rounded px-4 py-2 disabled:opacity-50"
      >
        {status === 'submitting' ? 'Sending...' : 'Get in touch'}
      </button>
      {status === 'error' && <p className="text-red-600 text-sm">Something went wrong — try again.</p>}
    </form>
  );
}
