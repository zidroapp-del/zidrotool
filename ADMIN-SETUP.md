# ZidroTool Admin — production setup

## 1. Configure Supabase
Add these environment variables locally and in Vercel:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Never expose `service_role` in the browser.

## 2. Run the database migration
Open Supabase SQL Editor and run `supabase/admin-schema.sql`.

## 3. Create your private admin account
Create your own user in Supabase Authentication. Then copy that user's UUID and run:

```sql
insert into public.admin_users(user_id) values ('YOUR-AUTH-USER-UUID');
```

The `/admin` page requires an authenticated user that is present in `admin_users` or has server-controlled `app_metadata.role = 'admin'`.

## 4. CMS
The Admin > Blog editor stores published/draft articles in `cms_articles`. Published CMS records override the matching built-in article on `/blog/:slug`.

Article fields include title, slug, excerpt, content, category, tags, focus keyword, secondary keywords, SEO title, meta description, canonical URL, cover image, alt text and status.

## 5. Media
The SQL migration creates a public `cms-media` bucket. Only admins can upload/update/delete objects. Public visitors can read published images.
