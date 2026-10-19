# Klean by Geerho Super Admin Manual

For laundromat business owners and managers. A Super Admin runs one Klean business ("operator"): prices,
branches, machines, staff, reports and customers.

## 1. Switch on operator mode

Your business runs on your personal, verified Klean account. There's no separate business login.

1. Sign in and complete identity verification.
2. **Account → Start a laundromat business** in the app, or on **klean.ph/account.html**. Enter the business name
   and country, and pick the time zone from the menu (or tap **📍 Locate me** to use where you are now). Reports and
   daily payouts follow it. Currency is set automatically for the Philippines (PHP) and fixed once created.
3. A **Business** tab appears. You're the Super Admin.

## 1a. Beta testing (on until you go live)

Every business starts with **Business → Setup → Beta testing** switched **on**:

- Payments use **test money**: nobody is charged and nothing is paid out.
- Simulated machines from Klean HQ work, so you can try every step with your phone.
- **Delete beta test data…** clears test orders, test customers and their points. Branches, machines, staff and
  settings stay.

To take real payments, switch Beta **off**. You need: Klean launched (Klean switches real payments on), your payout
account set up, and at least one real washer or dryer connected with a Klean controller and online. Going live deletes
all beta data and switches simulated machines off. You can turn Beta back on later; your real sales records are kept.

## 2. Get paid: connect payouts

**Business → Setup → Payments.** You can't take payments until your payout account is ready.

- **Philippines:** choose your GCash, Maya or bank account and enter the account number. The account must be **in
  your own verified name** (the name on the ID you verified with). Payments switch on immediately.
- **Everywhere else (Stripe):** tap **Connect payouts** and finish Stripe's short sign-up. Payments switch on as soon
  as Stripe confirms your account.

### How the money flows

Customers pay Klean (through PayMongo or Stripe). Every day around 2:00 a.m. (Manila time), Klean automatically
pays your business its share of the previous day's payments:

> **your payout = sales − Klean commission − payment-processor fees − transfer fee**

- The commission rate is shown on the Setup screen. Processor fees (PayMongo's fee for each GCash/Maya/card payment,
  or Stripe's) are passed on at cost. In the Philippines the transfer to your account costs ₱10 per daily payout.
- Payouts under ₱100 (US$5) wait until the next day. A failed payout (e.g. a closed account) is retried after you
  fix the account; you'll get a notification.
- Free loads redeemed with points carry no commission and no payout.

The commission rate is set by Klean, not by you, and isn't editable from your dashboard. Every order records
the rate it was charged at, so a future change never affects past orders.

Klean is free to download and free to set up. There's no subscription. Klean earns only when you do.

## 3. Prices, loads and loyalty

**Business → Setup → Pricing & loyalty.**

| Setting | Default | Notes |
|---|---|---|
| Price per load (wash + dry) | ₱250 (PH) | New orders only; orders in progress keep their price |
| Wash only | ₱175 (PH) | Leave blank to not offer it |
| Dry only | ₱199 (PH) | Leave blank to not offer it |
| Max kg per load | 8 kg | Loads = weight ÷ max, rounded up |
| 1 point per | price ÷ 10 (₱25) | So customers earn 10 points per paid load |
| Points for a free wash + dry | 100 | "Buy 10, get the 11th free" |
| Welcome bonus | 10 | On a customer's first paid visit to your business |
| Points expire after | 12 months | |

Customers choose **wash + dry**, **wash only** or **dry only** (only the services you price). A dry-only load is what
a customer gets when they scan a dryer with nothing saved. Every service shows on your public laundromat page.

Customers scanning a machine can pay for **up to 5 loads at once** (never more than the branch's washers): the
scanned washer starts and the rest are saved in their wallet for 30 days. It's one order and one payment in your
reports, with the loads counted; points and commission follow the amount paid.

The screen previews the effect ("free load after about 10 paid loads"). **Points belong to your business**: earned
at any of your branches, redeemable at any of your branches, never anywhere else. You fund the free loads, so set
these numbers deliberately.

**Welcome load** (off by default): switch it on and brand-new Klean members get their **first wash + dry free** at
your laundromat: people verified in the last 30 days who haven't done laundry anywhere on Klean yet. Each person gets
one welcome load across all of Klean, at the first participating laundromat they scan; their machine starts without
payment and they get a "Welcome to …" notification. It's your promotion: no payment, no commission, no payout.

## 4. Branches and machines

**Add a branch:** Business → Setup → Branches → **+ Add a branch**. One form: the branch's name and address
(**📍 Use my current location** or **Find address** puts it on the map), a contact phone and email (shown to
customers), how many **washers** and **dryers** with their cycle minutes and brand/model, and whether a **weigh scale**
is connected. Klean creates the machines labelled W1, W2… and D1, D2…, each with its QR code.

**Manage a branch:** tap it to edit its details or map position, and to manage its machines: **+ Add washer** /
**+ Add dryer** (the next label, like W6), **Rename** a label, show a machine's **QR** code to print, or **Delete** a
machine. A machine that has never been used is deleted; one that has is **retired** (its QR stops working, it
disappears from lists, its history stays). Machines can't be deleted while paid, held or running.

**Deleting a branch:** Business → Setup → Branches → **Delete branch…**, type its name. Klean approves each request
(you'll get a notification). A branch that never had a sale is deleted with its machines; one with sales is **closed**
instead: its machines stop, customers no longer see it, and its sales stay in your reports. It can't happen while a
machine there is paid, held or running.

**Put each branch on the map** so customers find it: **Business → Setup → Branches**. Standing inside the laundromat,
tap **📍 Use my current location**; or tap **Find address on map** to use the branch's address. Customers then see it
under **Laundromats near you** with live free machines and directions. (Beta laundromats show only to their testers
until you go live.)

**Klean HQ** (on a computer) is the easiest way to set up a location: it asks how many washers and dryers you
have, creates them all with their QR codes, and shows each machine's live light (green available, white paid and
waiting for Start, blue in use, red error). Machines can be **Real** (a Klean controller is installed) or
**Simulated** (Klean HQ plays the machine, so you can try everything before installing hardware). Its
**Hardware** page lists what to buy or build, how it connects, and gives you the controller file to flash. Full
details: the Hardware Guide.

**Machines never start by themselves** (real or simulated). After paying, the customer taps **Start wash** /
**Start dry** in Klean (after confirming the laundry is in and the door is closed) or presses Start on the machine;
on a simulated machine you can also click **Press Start** in Klean HQ. If your machines start as soon as coins go
in, tick that box before downloading the controller file, so Klean holds the coins until the customer taps Start.

In the app:

1. **Setup → Branches → Add branch** for each location.
2. Install a Klean controller box for the machines (wired to the coin input; see the Hardware Guide).
3. **Setup → Add a machine:** choose the branch and type, and enter the label painted on the machine (W1, D3…).
   Leave **Controller ID** empty and Klean creates one; enter your own only if your controller box came with an ID.
4. A QR code appears. Print it and stick it on the machine at eye level. Customers scan it to pay.
5. If a sticker is ever copied or damaged, rotate the machine's QR (old stickers stop working).

## 5. Staff

**Business → Staff.**

### Hire

1. Your new hire installs Klean, signs in and **verifies their identity** (required; they pay their own fee).
2. They give you the **member code** from their Account screen.
3. Enter it under **Hire someone**, choose a role, and choose their branches:
   - **Attendant:** works the POS and machine dashboard. Assign **one, several, or all branches** ("all"
     includes branches you open later).
   - **Super Admin:** full access to your business, like you.
4. **Add to team.** Their own account gains staff access immediately.

### Reassign, promote, remove

Tap **Edit** next to a team member to move them between branches, change their role, or remove them from the team.
Changes apply on their next action. A business always needs at least one Super Admin.

You'll see each staff member's **verified legal name**, so you know exactly who works for you.

## 6. Sales reports

**Business → Sales.** Choose a period:

| Period | Covers |
|---|---|
| Daily | One calendar day (hourly chart) |
| Weekly | Monday to Sunday |
| Semi-monthly | 1st–15th, or 16th–end of month |
| Monthly | Calendar month |
| Quarterly | Jan–Mar, Apr–Jun, Jul–Sep, Oct–Dec |
| Semi-annual | Jan–Jun or Jul–Dec |
| Annual | Calendar year |

Use **‹ Prev / Next ›** to move between periods. Each report shows:

- **Gross sales**, with % change vs. the previous period
- **Net to you** (after Klean commission, before processor fees) and **Klean commission**
- Orders, average ticket, paid loads, free (points) loads, new customers, refunds
- Sales over time, by branch, and by payment method
- **Export CSV** for your accountant (amounts in centavos/cents)

All times are in your business's time zone.

## 7. Customers

**Business → Customers.**

- **New sign-ups**: people whose first visit to your business falls in the selected period, with a chart.
- **Active customers**: people who used your laundromats in the period.
- **When customers start machines**: a weekday × hour heatmap, useful for staffing and off-peak promos.
- **Loyalty ranking**: your top customers by lifetime points earned at your business.
- **All customers**: search by name or email; sort by last visit, newest, points or spend. Tap a customer for
  their **points history** (every earn, bonus, redemption and expiry) and **usage timeline** (scans, payments,
  cycle start/finish times).

For privacy, you see customers' display names and a masked email, never their ID documents or legal names.

## 8. Internet is required

Klean is online-only, on every device: phones, tablets and computers. Payments (and Klean's commission on them)
are processed live, so when a device loses internet the app locks until it reconnects, with instructions to join
Wi-Fi or turn on mobile data (or connect the laptop/PC to the internet). Plan for it:

- Give each branch reliable Wi-Fi, ideally with a mobile-data backup router.
- Machine controllers need Wi-Fi too. A controller that's offline shows red on the dashboard.

## 9. Your responsibilities

- Keep machines safe and working; respond to red machines promptly.
- Issue official receipts as required by your tax authority (in the Philippines, BIR).
- Honor free loads earned at your business.
- Use customer data only to run your laundromat, in line with the Privacy Policy and local law.
- Don't take payments for Klean machines outside Klean.

## 10. Closing or deleting your business

**Business → Setup**, at the bottom (or **klean.ph/account.html**). Type the business name to confirm.

- **Still in Beta:** **Delete business** removes it completely: branches, machines, staff, test orders and customers'
  points at your business. Everyone keeps their Klean account.
- **Taking real payments:** **Close business** switches off your machines, removes your staff's access and takes the
  business off Klean. Payment records are kept as the law requires. You can close once no customer has unused paid
  loads with you (they last 30 days, or ask Klean Support to help refund them), your last payout has arrived, and no
  payment is in progress. Customers' points and free loads at your business end.
