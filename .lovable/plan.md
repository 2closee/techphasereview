
# Fix Password Reset Email Error

## Problem
The password reset feature is failing with "Error sending recovery email" because Supabase doesn't have an email provider configured. The auth logs show:
```
error: "535 API key not found"
msg: "500: Error sending recovery email"
```

## Solution
Set up **Resend** as the email provider for authentication emails. This requires:
1. You to create a Resend account and get an API key
2. Create a new Edge Function to send password reset emails via Resend
3. Generate a secure reset token and store it temporarily
4. Update the frontend to use the custom flow instead of Supabase's built-in method

## What You Need to Do First

Before I can implement this, you need to:

1. **Sign up at [Resend.com](https://resend.com)** if you don't have an account
2. **Verify your domain** at https://resend.com/domains
   - Add the DNS records Resend provides to your domain
   - Wait for verification (usually takes a few minutes)
3. **Create an API key** at https://resend.com/api-keys
4. **Provide the API key** so I can add it as a secret

**Note:** For testing, you can use Resend's free tier which allows sending to your own email address without domain verification.

---

## Technical Implementation Plan

### 1. Add Database Table for Password Reset Tokens
Create a `password_reset_tokens` table to securely store reset tokens:
- `id` (UUID, primary key)
- `user_id` (UUID, references auth.users)
- `token` (text, unique, indexed)
- `email` (text)
- `expires_at` (timestamp)
- `used` (boolean, default false)
- `created_at` (timestamp)

RLS Policy: No public access (edge function uses service role)

### 2. Create Edge Function: `send-password-reset`
This function will:
- Accept `{ email }` from the frontend
- Look up the user in `auth.users` via service role
- Generate a secure random token
- Store token in `password_reset_tokens` table with 1-hour expiry
- Send email via Resend with reset link
- Return success (without revealing if email exists, for security)

### 3. Create Edge Function: `verify-reset-token`
This function will:
- Accept `{ token, new_password }`
- Validate token exists and hasn't expired
- Update user's password via admin API
- Mark token as used
- Return success/failure

### 4. Update Frontend Components

**ForgotPassword.tsx:**
- Call `supabase.functions.invoke('send-password-reset', { body: { email } })` instead of `supabase.auth.resetPasswordForEmail()`

**ResetPassword.tsx:**
- Read token from URL query parameter (not Supabase session)
- Call `supabase.functions.invoke('verify-reset-token', { body: { token, new_password } })`
- Show success and redirect to login

### 5. Add Secret
Add `RESEND_API_KEY` to Supabase Edge Functions secrets

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `supabase/migrations/xxx_password_reset_tokens.sql` | Create - new table for tokens |
| `supabase/functions/send-password-reset/index.ts` | Create - sends reset email |
| `supabase/functions/verify-reset-token/index.ts` | Create - validates token & resets password |
| `supabase/config.toml` | Modify - add new functions |
| `src/pages/ForgotPassword.tsx` | Modify - use edge function |
| `src/pages/ResetPassword.tsx` | Modify - use token-based flow |

---

## Security Considerations
- Tokens expire after 1 hour
- Tokens can only be used once
- Email enumeration protection (same response whether email exists or not)
- Service role used server-side only
- No public SELECT on tokens table

---

## Next Step
Please provide your **Resend API key** so I can add it as a secret and implement this solution. If you haven't set up Resend yet, follow the steps above first.
