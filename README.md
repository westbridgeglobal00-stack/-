# Westbridge Global — marketplace starter

This package contains a responsive public storefront, a restricted admin dashboard, Supabase browser configuration, and a PostgreSQL/RLS schema.

## Included files

- `index.html` — public storefront, account sign-in/sign-up, product browsing, cart and basic order-request flow.
- `admin.html` — restricted administration interface.
- `app.js` — storefront behaviour.
- `admin.js` — admin authentication, catalogue, category and order management.
- `styles.css` — responsive visual design.
- `supabase-config.js` — Supabase project connection placeholders.
- `schema.sql` — database tables, triggers, indexes and row-level security policies.

## 1. Create your Supabase project

1. Create a project in Supabase.
2. Open **Project Settings → API** (or API Keys).
3. Copy the Project URL and the publishable/anon key.
4. Open `supabase-config.js` and replace:
   - `https://YOUR-PROJECT-REF.supabase.co`
   - `YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY`
5. Never put a `service_role` or secret key in browser code or GitHub.

## 2. Create the database

1. In Supabase, open **SQL Editor → New query**.
2. Paste all of `schema.sql`.
3. Run the query and confirm it completes successfully.

## 3. Create the first administrator

1. Open the public `index.html` website.
2. Create an account using the Account button.
3. Confirm the email if Supabase email confirmation is enabled.
4. Sign in once, so the `profiles` row is created.
5. In Supabase SQL Editor, run the following command, replacing the email with the exact email used for your account:

```sql
update public.profiles
set role = 'admin'
where lower(email) = lower('YOUR-ADMIN-EMAIL@example.com');
```

6. Confirm exactly one row was updated. You can verify with:

```sql
select id, email, role
from public.profiles
where lower(email) = lower('YOUR-ADMIN-EMAIL@example.com');
```

7. Open `admin.html` and sign in with that account.

Do not give your admin login to other people. Add additional staff roles and permission rules before delegating access; this starter currently has customer and admin roles only.

## 4. Deploy on GitHub Pages

1. Upload all files in this folder to the same repository folder.
2. In GitHub, open **Settings → Pages**.
3. Select your deployment branch and root (or the folder containing these files).
4. Save and wait for the deployment.
5. Open the published `index.html` URL. The admin page is the same base URL followed by `/admin.html`.

If you use a repository subfolder, make sure all files remain together. These files use relative asset paths.

## 5. Test before launch

- Create a customer account.
- Add a product in Admin → Products.
- Confirm it appears on the public store.
- Add it to cart and submit an order request.
- Check Admin → Orders and change the order status.
- Test on mobile and desktop.
- Test access with a non-admin account; it must not enter the admin dashboard.

## Important launch limitations

This is a working MVP foundation, not a finished global marketplace or a payment-ready production system.

- Payment gateway is not connected. The current checkout creates an order request only; it does not collect money.
- Order totals and item prices are currently submitted by the browser. Before taking real orders or payments, move checkout/order creation into a trusted server-side Edge Function, re-read product prices and stock from the database, calculate totals server-side, reserve/decrement inventory safely, and verify payment webhooks server-side.
- Add seller accounts, seller verification, seller-specific product permissions, commission ledger, payouts, delivery integrations, returns/refunds, tax rules, legal pages, support workflows, audit logs, backups and monitoring before operating at scale.
- Product image URL is supported in this starter. For uploads, create a private or public Supabase Storage bucket and carefully scoped storage policies.
- Configure your production Site URL and allowed redirect URLs under Supabase Authentication settings.
- Use HTTPS, strong unique passwords, MFA for admins, and review RLS policies before launch.

## Recommended next build stage

After the storefront and admin connection are confirmed, extend this into a true multi-vendor marketplace: seller onboarding/dashboard, seller-owned inventory, commission and payout ledger, payment provider integration, delivery management, customer order tracking, product reviews, promotions and support centre.
