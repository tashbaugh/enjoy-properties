-- Removes the contacts/leads created while verifying the new-lead
-- notification feature: one direct API test, plus two real browser
-- submissions (ContactForm, CashFlowCalculator) used to confirm the
-- fire-and-forget notify call is genuinely non-blocking at runtime.
-- Delete by exact email match, so this is a no-op (and safe to re-run)
-- on any database that never had these rows, e.g. the preview project.

delete from leads where contact_id in (
  select id from contacts where email in (
    'notify-test@example.com',
    'timing-test@example.com',
    'calc-notify-timing@example.com'
  )
);
delete from contacts where email in (
  'notify-test@example.com',
  'timing-test@example.com',
  'calc-notify-timing@example.com'
);
