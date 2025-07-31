# 📧 OTP Email Setup Guide

## 🚀 Quick Setup for Gmail

### Step 1: Enable 2-Factor Authentication

1. Go to your Google Account: https://myaccount.google.com/
2. Click "Security" in the left sidebar
3. Under "Signing in to Google", click "2-Step Verification"
4. Follow the prompts to enable 2FA

### Step 2: Generate App Password

1. After enabling 2FA, go back to Security settings
2. Under "Signing in to Google", click "App passwords"
3. Select "Mail" and "Other (custom name)"
4. Name it "RSSB Library" or similar
5. Copy the 16-character password (save it securely!)

### Step 3: Configure Environment Variables

Add these to your `backend/.env` file:

```env
EMAIL_USER="rssbsearch@gmail.com"
EMAIL_PASS="afeh vclg efgv gdyx"
```

### Step 4: Test the Setup

1. Restart your backend server
2. Visit `/admin/login`
3. Click "Send OTP"
4. Check the email inbox

## 🔧 Alternative: Use Different Email Service

### Option 1: SendGrid (Recommended for Production)

```env
EMAIL_SERVICE="sendgrid"
SENDGRID_API_KEY="your-sendgrid-api-key"
EMAIL_FROM="rssbsearch@gmail.com"
```

### Option 2: AWS SES

```env
EMAIL_SERVICE="ses"
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_REGION="us-east-1"
EMAIL_FROM="rssbsearch@gmail.com"
```

## 🐛 Troubleshooting

### Common Issues:

1. **"Invalid credentials"** → Use App Password, not regular password
2. **"Authentication failed"** → Ensure 2FA is enabled first
3. **"Less secure app access"** → This is disabled by Google, use App Password instead
4. **Still not working?** → Check spam folder, try different Gmail account

### Testing Without Email:

For development, you can check the console logs - the OTP will be printed there even if email fails.

## 🔐 Security Notes:

- Never commit `.env` file to version control
- App Passwords are specific to applications
- Revoke App Passwords when no longer needed
- Consider using dedicated email services for production
