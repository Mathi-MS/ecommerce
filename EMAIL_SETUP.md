# Email Setup Guide

## Gmail Configuration (Recommended)

### Step 1: Enable 2-Factor Authentication
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable 2-Step Verification if not already enabled

### Step 2: Generate App Password
1. Go to [App Passwords](https://myaccount.google.com/apppasswords)
2. Select "Mail" and your device
3. Copy the 16-character password (format: xxxx xxxx xxxx xxxx)

### Step 3: Update .env file
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-character-app-password
SMTP_FROM_EMAIL=your-email@gmail.com
```

## Other Email Providers

### Outlook/Hotmail
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
SMTP_FROM_EMAIL=your-email@outlook.com
```

### Yahoo Mail
```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_USER=your-email@yahoo.com
SMTP_PASS=your-app-password
SMTP_FROM_EMAIL=your-email@yahoo.com
```

## Testing
After configuration, OTP emails will be sent automatically when users:
- Sign up with email
- Request password reset
- Verify Google SSO accounts

## Troubleshooting
- **"Invalid login"**: Make sure you're using App Password, not regular password
- **"Connection refused"**: Check SMTP_HOST and SMTP_PORT
- **"Authentication failed"**: Verify SMTP_USER and SMTP_PASS are correct
- **Emails not received**: Check spam folder, verify SMTP_FROM_EMAIL