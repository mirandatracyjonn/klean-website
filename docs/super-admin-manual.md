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

- **Philippines, personal account:** choose your GCash, Maya or bank account and enter the account number. The account
  must be **in your own verified name** (the name on the ID you verified with). Payments switch on immediately.
- **Philippines, business account:** tap **Business bank account (company name)…**. Enter the registered business name,
  whether it's registered with DTI, SEC or CDA, the registration number, the bank and account number (the account name
  must match the business name), and add a clear photo or PDF of the registration certificate. Klean checks it, usually
  within a day, and you get a notification. Until it's approved, payouts keep going to your current account (a new
  business can't take payments until one account is ready). If it's declined, the reason shows under Payments; fix it
  and send it again. Saving a personal account later switches payouts back to it.
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
- **Cash sales** (recorded at the counter) are already in your drawer, so they aren't paid out; their commission (same
  rate) comes off your next payout of digital payments instead. A cash refund you hand back gives you back that
  commission in the next payout.

The commission rate is set by Klean, not by you, and isn't editable from your dashboard. Every order records
the rate it was charged at, so a future change never affects past orders. Klean may give your business its own
rate: a lower rate starts with your next payment, and any increase starts at least 30 days after you're told. You get a
notification either way, and the Setup screen shows the date of a change that's coming.

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
machine, or **Write NFC sticker** (Android: **NFC**) to put a tap-to-pay sticker beside its QR (Hardware Guide → NFC
tap stickers). A machine that has never been used is deleted; one that has is **retired** (its QR stops working, it
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

### Klean Scale (optional)

A **Klean Scale** sends each settled weight to Klean, so customers don't type it (and can't under-weigh).
Business → Setup → Branches → the branch → **Klean Scale** → **+ Add a Klean Scale**. In Beta it's **simulated**: weigh
things in Klean HQ (klean.ph/hq → the branch → Klean Scale → type kilos → **Put on scale**). For a real scale, the app
shows its **Controller ID** and **Secret** once: put them in the scale's firmware (Hardware Guide → Klean Scale).

Customers tap **Use the Klean Scale** in Start laundry; the newest weighing from the last 2 minutes fills in, and each
weighing is used once. Attendants get the same **Use the Klean Scale** button in Work → Intake. **Require the scale
(whole business)** stops typed weights at every branch of your business (in Start laundry and at the counter)
(customers can still choose a number of loads only if Require is off). Each branch card shows the scale's last weight.
You're responsible for the scale's accuracy and, in the Philippines, for having it tested and sealed by your city or
municipal treasurer (Terms 4.4d).

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
- **Net to you** (after Klean commission and refunds, before processor fees) and **Klean commission**
- **Refunds** made in the period (counted on the day you refunded, like a bank statement), with **net sales** =
  gross − refunds; Klean's commission on a refund is given back, so Net to you only drops by the rest
- Orders, average ticket, paid loads, free (points) loads, new customers
- Sales over time, by branch, and by payment method
- **Export CSV** for your accountant (amounts in centavos/cents), including refunds, net sales and the commission
  returned, per time bucket and per branch

All times are in your business's time zone.

## 6a. Orders and refunds

Business → Sales → **Orders and refunds** (on klean.ph: Account → Orders and refunds) lists your paid orders, newest
first. Search by member code, customer name, or the order number (#1A2B3C4D).

To refund: tap **Refund…** on the order, choose how many loads (up to the loads not yet refunded), write a short
reason (the customer sees it), and confirm. Rules:

- Only Super Admins can refund; attendants send customers to you.
- Up to **90 days** after payment, some or all loads. A load running on a machine right now can't be cancelled
  (wait until it finishes); refunding a load that was used (for example after a machine fault) is allowed.
- The money goes back to the customer's payment method through PayMongo/Stripe. Most refunds finish at once; some
  show **processing** for a while.
- The refunded loads' unused washes/dries are cancelled, and the points that order earned are taken back in proportion.
- **Your payout:** the refund minus Klean's commission on it (Klean returns its commission) comes off your next payout.
  The processor's fee on the original payment isn't returned. Payout statements show the refunds.
- Beta (test) orders refund test money only.

**Chargebacks (bank disputes):** if a customer disputes a payment with their bank, you and Klean get a notification
("A customer disputed a payment") with the order number. Within 5 days, email Klean anything that shows the service
was given: photos, messages with the customer, the machine's start and finish times. Klean answers the bank. If the
bank sides with the customer, it's handled like a full refund of that order (its refund reason starts with
"Chargeback", and it counts as a refund in your reports), and you're told "Dispute lost"; if it sides with you, nothing changes ("Dispute won").

## 6b. Cash at the counter

Customers who don't use GCash, Maya or a card can pay cash at the counter. In Work → Intake, type the weight, then
tap **Cash** (or, after **Charge**, **Paying cash instead**); the attendant optionally types the amount handed over (Klean shows the change), and taps
**Cash received**. Only then do the loads become paid and machines can be assigned: **entering the sale in Klean is the
only way a cash load gets a machine**, so cash that isn't rung up can't run a wash.

**A counter computer or tablet.** Work is also on klean.ph → Account → **Work** (Machines, Intake with the payment QR
or cash, Pickup), so a laptop or tablet at the counter can be the till without the app.

**Starting a counter order's machines.** After tapping a free washer for the order, wait for its white light, then tap
**Start wash** on it (in Work → Intake, or on its tile in Work → Machines) and confirm the laundry is in and the door is
closed. Walk-ins have no app, so staff start counter orders; machines paid in a customer's own app are started by the
customer.

Every cash payment records who took it and when. **Business → Sales → Cash by person** (and klean.ph → Account →
Expenses and cash) shows cash taken per branch and person for the day, week, month or year: count the drawer against
it at the end of each shift. Attendants see their own cash for today in Work. Refunds of cash orders work like any
refund (6a), but you hand the money back in cash; Klean doesn't send it anywhere.

**End-of-shift count.** At the end of a shift, the attendant taps Work → Intake → **Count my cash and close my shift**,
counts the cash they took since their last count, and enters it. It's a blind count: they don't see what Klean expects
until they've entered it. Any difference notifies you ("Cash short at Main St"), and every count is listed under
Business → Sales → **Shift counts**.

**Commission on cash sales.** Cash stays in your drawer, so Klean's commission on it comes off your next payout of
GCash, Maya and card sales. Business → Sales → **Commission on cash sales** shows what's owed. If you take mostly cash,
tap **Pay** to pay it with GCash, Maya or card. If any of it is unpaid for 30 days, recording cash at the counter pauses
until it's paid (digital payments keep working); you're reminded 7 days before and on the day.

## 6c. Expenses and profit

**Business → Expenses** (or klean.ph → Account → Expenses and cash). Tap **Add an expense**: category (utilities,
detergent and soap, rent, repairs, wages, supplies, equipment, fees and permits, other), amount, date, optional branch
and note. Pick a period to see:

- **Expenses** by category and each item (delete a wrong one; Klean keeps a record of it). Add a photo or PDF of the
  receipt when you log it; tap **Receipt** on an item to see it. Only Super Admins can.
- **Net to you**: all sales, cash included, after Klean's commission and refunds.
- **Profit** = net to you − expenses.
- **Cash sales** in the period, for the drawer.

Only Super Admins see or log expenses. They're your own bookkeeping; Klean doesn't check them, and they aren't
official receipts or tax filings.

## 6d. Supplies

Work → **Supplies** (pick the branch). Tap **Add a supply**: name (Detergent, Softener, Bleach, Bags…), unit (L, kg,
pcs), how much you have, **Remind when down to**, and optionally how much one wash or one dry uses. When set, Klean takes
that off every time a cycle starts. Staff tap **Record…** to log a restock, what they used, or a fresh count. When a
supply reaches its level, the branch's staff and you get one reminder; the next one comes after it's restocked.

## 6e. Maintenance

Work → **Maintenance**. **Due now** lists each machine's routine tasks that are due; staff tap **Done**. Tap a machine to
**log a repair or note** or see its **history** (useful for warranty claims). Every business starts with three routine
tasks, which you can change under **Routine tasks**:

- Clean the lint filter: dryers, every 10 cycles
- Clean the drum and door seal: washers, every 7 days
- Check hoses, drains and vents: all machines, every 30 days

At 8 a.m. (your time zone), the staff of a branch with something due get one reminder.

## 6f. Receipts

Every paid order has a receipt. Customers find theirs in Account → Receipts. For a walk-in who wants one, open
Business → Sales → Orders and refunds → **Receipt** (or on klean.ph, Account → Orders and refunds → Receipt) and print or
share it. It isn't a BIR official receipt; issue official receipts as the law requires.

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

## 7a. Messages and announcements

- **Customer messages:** Business (and Work for attendants) → **Customer messages**. Customers write from your
  laundromat's page; every Super Admin and attendant is notified and can reply. Keep replies about laundry; never ask
  for passwords, card or ID numbers (Terms 6.1).
- **Laundry updates:** when a wash or dry finishes, or laundry is marked ready for pickup, Klean posts the update in the
  customer's chat with your business, so their reply ("I'm on my way") reaches your staff in Customer messages.
- **Announcements:** Business → **Announcements** → title and message → **Post**. Everyone who used your laundromat in
  the last 90 days gets a notification and sees it on Home for 30 days. Up to 3 a day; delete one any time.

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
