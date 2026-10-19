# Klean by Geerho Hardware Guide

How to connect coin-operated washers and dryers to Klean so customers can pay by scanning a QR code. Your machines
keep accepting coins as before.

> **Safety first.** The Klean controller connects only to the machine's **low-voltage coin signal**. Anything that
> touches the 220 V supply (fitting current sensors at the breaker panel) must be done by a **licensed electrician**.
> Unplug the machine before opening it, and check your machine's warranty first.

## How it works

1. A customer scans the machine's QR code in the Klean app and pays.
2. Klean tells the controller to add a credit. The controller clicks a relay wired across the coin acceptor's signal
   wire, once per coin, so the machine sees coins. The machine's light in Klean turns **white** (paid, press Start).
3. The customer presses Start on the machine, or taps **Start wash** / **Start dry** in Klean after confirming the
   laundry is in and the door is closed. **Klean never starts a machine by itself.** A current sensor on the machine's power line notices the motor running and the
   controller reports **started** (light **blue**).
4. When the machine has been stopped for 3 minutes, the controller reports **completed** (light **green**) and the
   customer gets a "laundry is done" notification.

**Start from the app.** When the customer taps Start in Klean, the controller gets a START command. It presses the
machine's Start button through an optional second relay wired across that button (set `START_PINS` in the
firmware), or, for machines that start as soon as coins go in, it holds the coins until START (tick "These machines
start as soon as coins go in" before downloading the controller file). Without either, START is ignored and the
customer presses Start on the machine. Controller files downloaded before October 18, 2026 need downloading again.

One controller box runs up to **4 machines**. A laundromat with 6 washers and 6 dryers needs 3 boxes.

## What to buy

### Option A: ready-made boards (easiest)

| Part | How many | Approx. price (PH) |
|---|---|---|
| ESP32 4-channel relay board, 7–30 V DC input (e.g. LILYGO T-Relay, or an "ESP32-WROOM 4CH relay module") | 1 per 4 machines | ₱700–1,500 |
| 12 V DC 1 A power adapter (or a 12/24 V DIN-rail supply) | 1 per box | ₱200–350 |
| AC current switch, split-core, adjustable trip (0.2–30 A), dry-contact output | 1 per machine | ₱500–1,200 |
| IP54 junction box, cable glands, 2-core 0.5 mm² signal cable, ferrules | 1 set per box | ₱400–800 |

### Option B: build it yourself

| Part | How many | Approx. price (PH) |
|---|---|---|
| ESP32 DevKit V1 (ESP32-WROOM-32) | 1 per box | ₱250–450 |
| 4-channel 5 V relay module, optocoupler-isolated | 1 per 4 machines | ₱150–300 |
| DC-DC buck converter 12 V → 5 V 2 A (or a 5 V 2 A USB supply) | 1 per box | ₱80–200 |
| AC current switch (as above), or SCT-013-030 clamp + comparator module | 1 per machine | ₱300–1,200 |
| Enclosure, terminal blocks, jumper wires | 1 set per box | ₱300–600 |

Prices are rough guides from local online shops (Lazada, Shopee) in October 2026.

## How to connect one machine

```
Coin acceptor ──┬── COIN signal ──► machine control board
                │
Relay  NO ──────┘        relay contact in parallel with the coin acceptor's output
Relay  COM ───────────── GND of the coin circuit
Relay  IN  ◄──────────── ESP32 pin (one per machine)

Current switch, clamped on the machine's LIVE wire at its breaker (electrician)
  output contact ──────── ESP32 input pin and GND
```

1. Find the coin acceptor's **signal** wire (often white, labelled COIN) and its **ground**. Set the acceptor to
   **pulse** output (most are by default).
2. Count how many coins one cycle costs on the machine (e.g. six ₱10 coins). That's the **pulses** number you
   enter when you download the controller file.
3. Connect the relay's **NO** and **COM** across COIN and GND, in parallel with the acceptor. The relay is a dry
   contact, so the controller never shares power with the machine.
4. Have an electrician clamp a current switch around each machine's **live** wire (one wire only, not the whole
   cable) and set it to close when the motor runs. Wire its contact to the controller's input for that machine.
5. Mount the box away from water, steam and dryer heat.

Default pins (LILYGO T-Relay): relays on 21, 19, 18, 5; current switch inputs on 32, 33, 25, 26. Change them at the
top of the firmware for other boards.

## Software

1. On a computer, open **Klean HQ**, choose the location, and set the machines with controllers to **Real**.
2. **Hardware → Download controller file**. Enter the coins per cycle. The file (`klean_config.h`) holds each
   machine's secret key: keep it private, and delete it after flashing. Downloading again issues new keys, so
   every box at that location must be flashed again.
3. Install the **Arduino IDE 2**, add the **esp32** boards package (Espressif) and the **ArduinoJson** library.
4. Open `klean-hub.ino`, put `klean_config.h` next to it, enter your Wi-Fi name and password in the file, set
   `KLEAN_BOX_NUMBER` (1 for the first box, 2 for the second…), connect the board by USB, and click **Upload**.
5. Power the box. Within a minute the machines turn **green** in Klean HQ and the app.

## NFC tap stickers (optional)

Next to each machine's QR sticker you can add an **NFC sticker**, so customers just tap their phone on it.

- **Buy:** NTAG213 (or NTAG215/216) NFC stickers, round 25–30 mm, about ₱15–30 each. On a metal machine use
  **anti-metal (on-metal)** NFC stickers, or the tag won't read through the steel.
- **Write:** in the Klean app, Business → Setup → Branches → the branch → the machine's menu → **Write NFC sticker**
  (Android: **NFC**). Hold the blank sticker against the phone; it gets the same link as the machine's QR.
- **Place:** right beside the QR, at a comfortable height. Optional: a small "Tap or scan to pay" label.
- **Customers:** iPhone (XS or newer) and most Android phones read it by just touching the sticker with the phone
  unlocked; Klean opens on that machine. iPhone users can also tap **Tap NFC sticker** on the Scan screen.

## Test before opening

Scan each machine's QR in the Klean app and pay. You should hear one relay click per coin and see the light turn
white; press Start (on the machine, or Start wash in the app) and it turns blue. Nothing should start before that. If a light is **red**:

| Red reason | Check |
|---|---|
| Controller offline (no heartbeat) | Wi-Fi name/password, power, signal strength at the machine |
| Controller did not confirm credit | Relay wiring, box number, the machine's controller ID in the file |
| Fault | Look at the machine; clear the error in the app (Work → machine → Clear) |

## Good to know

- Coins still work. A coin-paid cycle isn't shown in Klean (the light stays green while the machine runs).
- Klean only works online. If the internet drops, QR payments stop until it's back; coins keep working.
- Controllers check Klean's security certificate, so a box with the wrong date or a blocked network won't connect.
