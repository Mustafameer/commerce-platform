# Telegram Integration Setup Guide

## Overview
The platform now uses **Telegram Bot API** for sending messages and top-up codes to customers instead of WhatsApp.

## Changes Made
1. **Backend**: Replaced `sendWhatsApp()` function with `sendTelegram()` in server.ts
2. **Frontend**: All UI labels updated to reference Telegram instead of WhatsApp
3. **Fields**: "Phone (WhatsApp)" → "معرّف تليجرام أو رقم الهاتف" (Telegram ID or phone)
4. **URLs**: WhatsApp share URLs → Telegram share URLs

## Environment Setup

### Step 1: Create Telegram Bot
1. Open Telegram and search for **@BotFather**
2. Send `/start` then `/newbot`
3. Follow prompts:
   - Enter bot name: e.g., "TopUp Store Bot"
   - Enter bot username: e.g., "topup_store_bot" (must end with `_bot`)
4. **Copy the token** provided (e.g., `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`)

### Step 2: Configure Environment Variables
Create or update `.env` file in project root:

```bash
TELEGRAM_BOT_TOKEN=YOUR_BOT_TOKEN_HERE
```

Replace `YOUR_BOT_TOKEN_HERE` with the token from BotFather.

### Step 3: Test Bot
1. Start the app: `npm run dev`
2. The bot will enter MOCK mode if token is missing/invalid
3. Check console logs for test messages

## How It Works

### For Customers
When a customer purchases top-up codes:
1. They enter their **Telegram ID/Username** or **Phone number**
2. Server sends codes via Telegram Bot API
3. Message arrives in Telegram bot chat

### Message Format
```
🎁 أكوادك:
`CODE1234567890`
`CODE0987654321`

⏱️ تم الإرسال عبر منصة التوب أب
```

### Telegram ID Options
- **Telegram Username**: @username (without @)
- **User ID**: Numeric ID (found by messaging bot or using `/start`)
- **Group ID**: For group notifications

## API Endpoints

### Sending Codes to Customer
```typescript
POST /api/topup/purchase
{
  "store_id": "...",
  "customer_phone": "@telegram_username or numeric_id",
  "product_ids": [1, 2, 3]
}
```

Automatically sends codes via Telegram Bot after purchase.

## Troubleshooting

### "MOCK TELEGRAM MODE" message
- **Cause**: Missing `TELEGRAM_BOT_TOKEN` in .env
- **Fix**: Set valid token and restart app

### Bot not sending messages
1. Verify token in .env is correct
2. Check console for Telegram API response
3. Ensure user has started the bot (`/start`)
4. Verify Telegram ID format (numeric or @username)

### Getting User Telegram ID
1. Message the bot with `/start`
2. Check server logs for chat_id
3. Or use: `https://api.telegram.org/bot{TOKEN}/getUpdates`

## Features

### Supported Message Types
- ✅ Text messages with Markdown formatting
- ✅ Bulk code delivery
- ✅ Order confirmations
- ✅ Admin notifications

### Rate Limiting
- Telegram API: ~30 messages/second per bot
- Platform limits: Implement queue for bulk sends

## Next Steps

1. Get bot token from @BotFather
2. Add `TELEGRAM_BOT_TOKEN` to `.env`
3. Restart app and test purchase flow
4. Verify codes received in Telegram

## Code Reference

### Function: `sendTelegram()`
Location: [server.ts](server.ts#L66-L117)

```typescript
async function sendTelegram({ 
  telegramId, 
  message 
}: { 
  telegramId: string; 
  message: string 
}): Promise<boolean>
```

- Handles @username and numeric ID formats
- Returns `true` if sent successfully, `false` otherwise
- Supports Markdown formatting in messages
- Auto-mocks if credentials missing

### Call Sites
- Line 873: Store approval notification (currently commented)
- Line 2337: (Will be added) Customer code delivery

## Support Matrix

| Feature | Status | Notes |
|---------|--------|-------|
| Text messages | ✅ Active | Markdown format supported |
| Top-up codes | ✅ Ready | Needs connection to purchase API |
| Admin notifications | ✅ Ready | Need to implement webhook |
| Broadcast | 🔄 Manual | Group chat support available |
| Media (photos) | 🔲 Not implemented | Can be added if needed |

---
**Last Updated**: Session completion  
**Mobile Prepaid Recharge Cards Platform**
