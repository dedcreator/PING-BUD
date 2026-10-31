# Telegram Alert Bot Integration (@SentiroAlertBot)

Sentiro provides official out-of-the-box Telegram alert dispatch via **`@SentiroAlertBot`** with **zero per-message fees**, avoiding WhatsApp and SMS carrier markups.

---

## 1. Why Telegram Alerts?
- **Zero Cost**: Unlike Twilio or Termii which charge per message or per recipient, Telegram Bot API is 100% free with unlimited messages.
- **Sub-Second Delivery**: Notifications arrive in under 350ms worldwide.
- **Rich Formatting**: Supports HTML formatting, status badges, incident root causes, and direct links to incident resolution views.

---

## 2. Setting Up Alerts with @SentiroAlertBot

Users do **not** need to create their own bot via `@BotFather`. You only need your **Telegram Chat ID**:

### Step 1: Start the Bot
1. Open Telegram on your phone or desktop.
2. Search for [`@SentiroAlertBot`](https://t.me/SentiroAlertBot) (or click [t.me/SentiroAlertBot](https://t.me/SentiroAlertBot)).
3. Click **Start** to initiate the bot session.

### Step 2: For Team / Incident Rooms (Optional)
If you want alerts sent to a team group or dedicated channel:
1. Create a Telegram group with your DevOps / SRE team (e.g. `Prod Outage Alerts`).
2. Add `@SentiroAlertBot` as a member (and grant admin permissions if it is a broadcast channel).

### Step 3: Find Your Chat ID
- For direct messages: Open [`@userinfobot`](https://t.me/userinfobot) to view your personal Chat ID (e.g. `123456789`).
- For groups: Use `@userinfobot` inside the group or use your public channel handle (e.g. `@my_sre_alerts`).

### Step 4: Configure in Sentiro
1. Navigate to **Alert Channels** in the Sentiro dashboard.
2. Click **Configure New Channel** → select **Telegram**.
3. Enter a friendly name (e.g. `SRE Incident Group`).
4. Enter your **Chat ID** (e.g. `123456789` or `-1001234567890`).
5. Click **Test Ping**. A test notification will arrive immediately!

---

## 3. Custom Bot Token Override (Optional for Enterprise)
For organizations requiring a white-labeled custom bot name:
1. Create a bot using [`@BotFather`](https://t.me/BotFather) (`/newbot`).
2. In Sentiro, click **+ Use Custom Bot Token (Optional)**.
3. Paste your private HTTP API Token. Sentiro will route alerts through your private bot.
