# Klean by Geerho Privacy Policy

*Effective date: October 19, 2026. Version 2.0.*

**Geerho Tech LLC**, which owns and operates **Klean by Geerho** ("Klean", "we"), is the personal information controller
for the Klean apps and web app. Laundromat businesses on Klean ("Operators") also receive limited customer information, as described below,
and act as controllers for their own use of it.

**Data Protection Officer:** Tracy Jon Miranda, for Geerho Tech LLC · info@klean.ph · (619) 796-1115 · 2108 N St, Ste N, Sacramento, CA 95816, USA

## 1. What we collect

| Category | What | Source |
|---|---|---|
| Account | Display name, email (as verified by your sign-in provider), profile photo, member code, sign-in provider identifiers; your **mobile number** and **address** if you choose to save them | You; Apple/Google/GitHub |
| Identity verification | **Collected by Didit, not by us:** ID document images, a live selfie and the biometric face template derived from it. **What we keep:** verification status; your verified legal name and the issuing country of your ID; and *keyed one-way hashes* of your document details and of your name + date of birth, used only to detect duplicate accounts. We do **not** store your ID number, ID images or selfie. | You, via Didit |
| Payments | Payment amount, currency, method type (e.g. "GCash", "card"), payment status, provider references; refunds (amount, loads, the reason the laundromat gave, status). **We never receive full card numbers or e-wallet credentials.** | PayMongo, Stripe |
| In-app purchases | For the verification fee bought in the app: the store transaction ID, product, price, currency and date. Apple or Google handle the payment itself; we don't receive your payment details. | Apple (App Store), Google (Play) |
| Laundry activity | Machines scanned, orders, loads, weight at intake (typed, or read from the laundromat's Klean Scale: each weighing is kept with its time and, once you use it, your order), cycle start/finish times, points earned and redeemed, branches visited | Your use of the Service |
| Staff and business | Your role, which branches you're assigned to, who hired you; for Operators, business details and payout account status. **Each branch's name, address, map location, phone and email are public** (shown to customers). | You; Operators; Stripe/PayMongo |
| Messages | Messages you exchange with a laundromat (text, time), and announcements Operators post. | You; Operators |
| Location (optional) | If you allow it, your device's approximate location is sent to show laundromats nearest you. **We don't store it.** A laundromat's own location (set by its Super Admin) is public. | Your device |
| Technical | Device type, app version, IP address, sign-in times, error logs | Your device |
| Wallet card (optional) | If you add your Klean card to Apple Wallet or Google Wallet, it holds your name, member code (as a QR), points and laundromat. Apple keeps it on your device (and in iCloud if you use it); for Google Wallet, Klean sends those details to Google, which stores the card in your Google account. Remove it in Wallet any time. To keep the points on it current, Klean stores a random code for your card and, for Apple Wallet, an identifier for each device that has the card and its push token (deleted when you remove the card). | You; Google |
| On your device only | The Home Screen widget's summary (points, paid loads, your laundromat) and the Lock Screen countdown are kept on your phone; reading an NFC sticker happens on your phone. On klean.ph, the machine you scanned is remembered in your browser for up to 2 hours (so you can sign in and verify first), and forgotten once you pay. | Your device |

## 2. Why we use it, and our legal basis

| Purpose | Legal basis |
|---|---|
| Create and run your account; process payments; activate machines; keep your wallet and points | Performance of our contract with you |
| Verify identity and enforce **one person, one account**; prevent fraud and points abuse | Your **consent** for biometric processing (sensitive personal information), and our legitimate interest in fraud prevention |
| Show Operators the information they need to run their laundromat (see section 3) | Contract; legitimate interest |
| Keep transaction and tax records | Legal obligation |
| Security, troubleshooting, improving the Service | Legitimate interest |
| Service messages (receipts, verification results, staff invitations) | Contract |
| Marketing messages, if offered | Your consent, which you can withdraw at any time |

## 3. Who sees your information

- **Messages** you send to a laundromat are seen by that business's staff (Super Admins and attendants), and their
  replies by you. Klean staff read a message only when someone reports it, to decide whether to remove it.
  Messages are kept while your account exists and are deleted with it.

- **Operators** where you do laundry see your **display name**, a **masked email** (e.g. `j***@gmail.com`), your
  points with them, your visits and spend with them, and the times you used their machines. They **don't** see your
  ID, legal name, date of birth, or activity at other businesses.
- **Your employer** (if you're staff) sees your display name, **verified legal name** and verification status, so
  they know who works for them.
- **Service providers** acting on our instructions: Didit (identity verification), PayMongo and Stripe
  (payments; when you pay, we send them your verified name, your email and, if you saved one, your mobile number, so
  their payment page is filled in for you), Apple and Google (sign-in, in-app purchases, push notifications), GitHub (sign-in), and our hosting,
  database and messaging providers (Supabase, Google Firebase).
- **Klean Support** (the Platform Owner, Geerho Tech LLC): to run the Service and help you, Klean can see your account
  details: name (and the name on your verified ID), profile photo, member code, email, saved mobile number and address,
  sign-in methods, when you joined and were last active, and your points and visits at each laundromat. Each time a
  member's profile is opened it is recorded in an audit log. Your address is never shown to laundromats.
- **Authorities**, when required by law or to protect rights and safety.
- We **don't sell** personal information.

## 4. International transfers

Some providers (e.g. Stripe, Didit, cloud hosting) may process data outside your country. We use contractual and
technical safeguards required by applicable law for these transfers. [List provider regions.]

## 5. How long we keep it

| Data | Retention |
|---|---|
| Account data | While your account exists; anonymized on deletion (a saved mobile number and address are deleted, and you can remove them any time in Account) |
| Transaction and tax records | As long as tax and accounting laws require, with personal identifiers removed after account deletion |
| Duplicate-detection hashes | While your account exists; deleted when you delete your account, **except** for accounts suspended for fraud or abuse, where they're kept for 5 years to stop re-registration |
| ID images and selfies | Held by Didit under its retention policy (see didit.me/privacy); never stored by Klean |
| Technical logs | 90 days |

## 6. Your rights

Under the Data Privacy Act you have the right to be informed, to access, to object, to erasure or blocking, to
rectification, to data portability, and to damages, and to file a complaint with the **National Privacy
Commission** (privacy.gov.ph). If you're in the EU/UK or another jurisdiction with similar laws, you have the
equivalent rights there. You can:

- see and correct most information in the app;
- **delete your account** in the app (Account → Delete account), which also revokes Sign in with Apple;
- withdraw consent for biometric verification. Since verification is required to use Klean, this means closing
  your account;
- contact our DPO at info@klean.ph for anything else.

We'll respond within the period required by law.

## 7. Security

Data is encrypted in transit; sensitive tokens are encrypted at rest; identity attributes are stored only as keyed
hashes; access by staff and Operators is limited by role and branch. No system is perfectly secure; we'll notify
you and the NPC of personal data breaches as required by law.

## 8. Children

Klean isn't intended for anyone under 18, and we don't knowingly collect their information.

## 9. Changes

We'll notify you in the app before material changes take effect.

## 10. Contact

Klean by Geerho, a business of Geerho Tech LLC · 2108 N St, Ste N, Sacramento, CA 95816, USA · (619) 796-1115 · DPO: info@klean.ph
