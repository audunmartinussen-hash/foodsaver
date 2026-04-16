# FoodSaver launch checklist

Everything below is a manual step. Each section has the exact command or
click-path to follow — no guessing.

Status-summary up top: code is shipped, DB schema is current, RLS is tight,
2 admin users are already set up (Audun + Ryecah). What's left is **config
values, env vars, and one manual Supabase toggle.**

---

## 1. Set the real GCash details in `platform_config`

The seeded GCash number is a placeholder (`09171234567`). Before any buyer
can pay, update it to your real one.

### How
Open the Supabase SQL editor for project `oavgquwjvbzrgqpoufgx` and paste:

```sql
-- Replace with your real GCash details.
UPDATE platform_config SET value = '09XXYYYZZZZ'      WHERE key = 'gcash_account_number';
UPDATE platform_config SET value = 'Your Real Name'   WHERE key = 'gcash_account_name';

-- Optional: once you\u2019ve uploaded a QR code image to a public URL, set it:
UPDATE platform_config SET value = 'https://...example.com/gcash-qr.png' WHERE key = 'gcash_qr_image_url';
```

### How to host the QR image
The simplest path: upload to the existing `store-images` Supabase bucket
(it's already public). Any public URL works.
1. Supabase dashboard → Storage → `store-images` bucket → Upload file.
2. Click the file → "Get URL" → copy the public URL.
3. Paste into the `gcash_qr_image_url` row above.

### Verify
```sql
SELECT key, value FROM platform_config ORDER BY key;
```
Should show your real number + name. The reserve page reads these on every
load, so changes take effect immediately — no deploy needed.

---

## 2. Set Vercel environment variables

Open the Vercel project → Settings → Environment Variables. Add each of
these with scope `Production, Preview, Development` unless noted.

### Required (app won't work right without these)

| Var | Value / where to get it |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://foodsaver.ph` (no trailing slash). Used by robots.ts, sitemap.ts, OG tags, JSON-LD. |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://oavgquwjvbzrgqpoufgx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase dashboard → Project Settings → API → `anon public` key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase dashboard → Project Settings → API → `service_role` key. **Server-side only.** Do NOT add `NEXT_PUBLIC_` prefix. |
| `CRON_SECRET` | Generate a random 32+ char string. Example: `openssl rand -hex 32`. This is what Vercel Cron sends in the `Authorization: Bearer ...` header to `/api/admin/no-show-sweep`. |

### Recommended (graceful no-ops if unset, but you lose functionality)

| Var | Value |
|---|---|
| `SEMAPHORE_API_KEY` | Sign up at semaphore.co (PH SMS gateway). Paste the API key. Without it, buyers get no SMS on confirmation. |
| `SEMAPHORE_SENDER_NAME` | `FoodSaver` (or the sender ID Semaphore issues you). |
| `RESEND_API_KEY` | Sign up at resend.com. Without it, the "reservation confirmed" email doesn't send. |
| `NEXT_PUBLIC_POSTHOG_KEY` | Sign up at posthog.com. Without it, all `track()` calls are silent no-ops. |
| `NEXT_PUBLIC_POSTHOG_HOST` | `https://us.i.posthog.com` (or EU: `https://eu.i.posthog.com`). |

### How
For each: click "Add New", paste the name + value, select environments,
click Save. Then **redeploy** (Vercel → Deployments → latest → ⋯ →
Redeploy) — env var changes only take effect on a new build.

---

## 3. Connect the domain

Vercel → Project → Settings → Domains → Add `foodsaver.ph`. Follow the DNS
instructions Vercel gives you. Until this is done, `NEXT_PUBLIC_SITE_URL`
should be set to whatever your Vercel preview URL is (e.g.
`foodsaver.vercel.app`) — otherwise social share scrapers (Facebook,
Twitter) will try to fetch from a domain that doesn\u2019t resolve.

---

## 4. Enable leaked-password protection in Supabase

The only remaining security advisor that isn\u2019t fixable via SQL.

### How
Supabase dashboard → Authentication → Policies → "Password-based
authentication" section → toggle **"Check passwords against HaveIBeenPwned"** on.

That\u2019s it. Users signing up with a password that\u2019s appeared in any known
breach get a friendly "please use a stronger password" error.

---

## 5. Do one end-to-end test against production

Don\u2019t invite merchants before you\u2019ve done this at least once.

### Walkthrough
1. Open prod URL. Sign up as a **consumer** with a throwaway email.
2. Browse the seeded listings (5 approved stores have dummy listings).
3. Reserve one — should land you at `/reserve/<order-id>`.
4. The page shows the real GCash number from step 1. Take a screenshot of
   an actual ₱20 GCash transfer to yourself (or just a random image for
   the test).
5. Upload it → page moves to "awaiting verification".
6. Open a second tab, sign in as the admin (your existing admin account).
   Go to `/admin`. You should see the reservation in the Verifications tab.
7. Click Verify. The order should flip to confirmed; you should get an
   email + SMS if Resend/Semaphore are configured.
8. Go to `/orders` in the first tab. You should see the order with a
   4-digit pickup code.
9. In a third tab, sign in as a **merchant** (one of the seed store
   owners — you may need to temporarily elevate an account with
   `UPDATE profiles SET role = 'business' WHERE id = '...'` and set
   `stores.owner_id`). Hit `/dashboard/orders` → find the order → "Mark
   picked up".
10. The consumer tab's `/orders` should now show "Picked Up" with a "Leave
    a review" button.

If **any** step fails, the env vars or RLS are misconfigured. Fix before
onboarding real merchants.

---

## 6. Verify the cron will actually run

Vercel Cron is defined in `vercel.json` (`*/15 * * * *` → `/api/admin/no-show-sweep`).
It activates automatically on first prod deploy. Verify manually:

```bash
# Replace CRON_SECRET with the value you set in Vercel env vars.
curl -X POST "https://foodsaver.ph/api/admin/no-show-sweep" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Expected response:
```json
{
  "ok": true,
  "expired_pending": 0,
  "marked_no_show": 0,
  "paused_users": []
}
```

If you get 401, the `CRON_SECRET` env var isn\u2019t set (or the value you
pasted doesn\u2019t match the one sent).

Then: Vercel dashboard → Project → Cron → confirm the schedule says "every
15 minutes" and the last run is recent.

---

## 7. Promote or demote users

Your admin login is already set up. If you need to add/remove admins, or
set up your first real merchant partner:

```sql
-- Promote to admin.
UPDATE profiles SET role = 'admin' WHERE id = 'USER_UUID_HERE';

-- Make someone a merchant so they can create a store.
UPDATE profiles SET role = 'business' WHERE id = 'USER_UUID_HERE';

-- Demote (or reset after testing).
UPDATE profiles SET role = 'consumer' WHERE id = 'USER_UUID_HERE';
```

To find a user\u2019s UUID by email:
```sql
SELECT u.id, p.full_name, p.role, u.email
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
WHERE u.email = 'them@example.com';
```

---

## 8. Approve your first real merchant

RLS hides unapproved stores from the public feed. After you\u2019ve signed
the paper merchant agreement and the store is registered:

```sql
UPDATE stores
SET is_approved = true, is_active = true
WHERE id = 'STORE_UUID_HERE';
```

Find the UUID by name:
```sql
SELECT id, name, owner_id, is_approved, is_active FROM stores WHERE name ILIKE '%aling rosa%';
```

---

## 9. Useful ops queries

### Right now, how many orders are stuck awaiting verification?
```sql
SELECT
  o.id,
  o.reservation_fee_proof_url,
  o.reservation_fee_paid_at,
  p.full_name AS buyer,
  l.title      AS item,
  s.name       AS store
FROM orders o
LEFT JOIN profiles p ON p.id = o.consumer_id
LEFT JOIN listings l ON l.id = o.listing_id
LEFT JOIN stores   s ON s.id = o.store_id
WHERE o.status = 'pending_verification'
ORDER BY o.reservation_fee_paid_at ASC;
```

### Which buyers are close to the no-show pause threshold?
```sql
SELECT id, full_name, no_show_count_30d, account_paused_at
FROM profiles
WHERE no_show_count_30d >= 2
ORDER BY no_show_count_30d DESC;
```

### Manual cron trigger (useful if you want to test the sweep)
```bash
curl -X POST "https://foodsaver.ph/api/admin/no-show-sweep" \
  -H "Authorization: Bearer $CRON_SECRET"
```

### Tail the SMS log (why didn't my SMS go through?)
```sql
SELECT created_at, status, error, to_phone, LEFT(body, 60) AS preview
FROM sms_log
ORDER BY created_at DESC
LIMIT 20;
```
`status = 'skipped'` means `SEMAPHORE_API_KEY` isn't set. `status = 'sent'`
means Semaphore accepted the message.

---

## DB health fixed automatically this session

For reference, these were resolved without user action:

- 3× function `search_path` pinned (hardening against privilege escalation)
- `store-images` bucket listing policy removed (public URLs still work)
- 10 missing FK indexes added
- All RLS policies rewritten to use `(SELECT auth.uid())` for per-query
  caching instead of per-row evaluation
- Overlapping permissive policies consolidated on `stores`, `listings`,
  `orders`, `platform_config`

Remaining advisor items are INFO-level "unused index" on freshly-created
indexes. They\u2019ll activate once production traffic starts; leaving them.
