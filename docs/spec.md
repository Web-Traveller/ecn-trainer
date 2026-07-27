Build a modern web application called "ECN Execution Trainer".

Tech stack:

* React
* TypeScript
* Vite
* Tailwind CSS
* Zustand for state management
* LocalStorage for persistence
* No backend

Purpose:
Train ECN routing muscle memory used in US equity trading platforms like Takion and Hammer.

The application is NOT a trading simulator.
It is a training tool that:

1. Displays prompts.
2. Captures keyboard sequences.
3. Determines intended ECN.
4. Measures reaction time.
5. Tracks mistakes.
6. Provides adaptive learning based on weaknesses.

---

## ECN MAPPING

BUY GROUP A (key A)

1 press = NSDQ
2 presses = ARCA
3 presses = EDGX
4 presses = EDGA
5 presses = NSDQ (wrap around)

BUY GROUP S (key S)

1 press = NYSE
2 presses = NSEX
3 presses = IEX
4 presses = NYSE

BUY GROUP D (key D)

1 press = CHX
2 presses = PHLX
3 presses = CHX

BUY GROUP Z (key Z)

1 press = MEMX
2 presses = MIAX
3 presses = AMEX
4 presses = MEMX

BUY GROUP X (key X)

1 press = BATS
2 presses = BATY
3 presses = BOSX
4 presses = BATS

---

## SELL GROUPS

SELL GROUP A uses key L

1 press = NSDQ
2 presses = ARCA
3 presses = EDGX
4 presses = EDGA

SELL GROUP S uses key ;

1 press = NYSE
2 presses = NSEX
3 presses = IEX

SELL GROUP D uses key '

1 press = CHX
2 presses = PHLX

SELL GROUP Z uses key ,

1 press = MEMX
2 presses = MIAX
3 presses = AMEX

SELL GROUP X uses key .

1 press = BATS
2 presses = BATY
3 presses = BOSX

All routes wrap around.

Examples:

Shift+A+A = BUY ARCA

Shift+L+L = SELL ARCA

Shift+Z+Z = BUY MIAX

Shift+,+, = SELL MIAX

---

## INPUT RULES

User holds Shift while pressing route keys.

Trainer must track:

* exact sequence
* total key count
* overshoots
* wrap around loops
* recovery attempts

Press ENTER:
Submit answer.

Press SPACE:
Reset current route selection.

Press ESC:
Clear current answer.

---

## TRAINING MODES

Mode 1:
ECN Only

Prompt examples:

BUY ARCA
SELL MEMX
BUY EDGX

Mode 2:
ECN + Price

Prompt example:

BUY ARCA
Price Adjustment: +3 cents

Price controls:

Left Arrow = -0.01

Right Arrow = +0.01

Shift+Left = -0.05

Shift+Right = +0.05

Mode 3:
Mixed

Random BUY and SELL prompts.

Mode 4:
Weakness Mode

Prompts are weighted toward frequently missed ECNs.

---

## SESSION FLOW

1.

Display prompt.

2.

Start timer immediately.

3.

Capture keys.

4.

User presses ENTER.

5.

Evaluate.

6.

Show result for 500ms.

7.

Move to next prompt.

---

## ANALYTICS

Track:

Overall Accuracy

Average Reaction Time

Fastest Time

Slowest Time

Per-ECN Accuracy

Per-ECN Reaction Time

Most Common Mistakes

Example:

MEMX -> MIAX : 12

ARCA -> EDGX : 7

NSEX -> IEX : 5

Track:

Space Reset Count

Overshoot Count

Wrap Around Count

Recovery Count

---

## SMART LEARNING

Optional toggle.

Each ECN starts with weight 1.

Wrong answer:
weight += 2

Correct answer:
weight -= 0.5

Minimum weight = 1

Prompt selection uses weighted random.

Weak ECNs should appear more often.

---

## DATA STORAGE

Store every session in localStorage.

Store:

date
mode
accuracy
average_time
events

Each event:

{
prompt,
expected_ecn,
actual_ecn,
action,
reaction_time_ms,
used_space_reset,
key_sequence,
correct
}

---

## UI

Modern dark trading-style interface.

Center large prompt.

Live key sequence display.

Current timer.

Result panel.

Session stats panel.

Analytics page.

History page.

Weakness heatmap.

Responsive design.

---

## IMPORTANT

Build the project production-ready.

Use clean architecture.

Separate:

routing engine
analytics engine
adaptive learning engine
session storage

Create reusable hooks and components.

Generate all code needed to run locally with:

npm install
npm run dev

Provide complete implementation.
