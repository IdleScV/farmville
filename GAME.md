# Farmville — Game Design

## Overview

Farmville is a browser-based farming simulation game. Players manage an 8×8 plot of land,
planting and harvesting crops to earn coins and experience. As players level up, more
profitable crops become available and the farm grows more complex.

---

## Core Loop

```
Plant a crop → Wait for it to grow → Harvest it → Earn coins + XP → Level up → Unlock better crops → repeat
```

1. Click any empty plot on your farm
2. Choose a crop from the selection panel (costs coins)
3. Wait for the crop to grow (each crop has a fixed growth time)
4. Click the plot again once it's ready to harvest
5. Earn coins and XP — the profit is always greater than the seed cost

---

## The Farm

- **Grid size:** 8×8 (64 plots)
- All plots start unlocked and available
- Each plot can hold one crop at a time
- Plots cycle: empty → growing → ready → empty (after harvest)

---

## Crops

| Crop | Emoji | Grow Time | Seed Cost | Harvest Yield | XP | Min Level |
|------|-------|-----------|-----------|---------------|----|-----------|
| Wheat | 🌾 | 30s | 10 | 25 | 5 | 1 |
| Carrot | 🥕 | 1m | 15 | 40 | 8 | 1 |
| Tomato | 🍅 | 2m | 25 | 70 | 15 | 2 |
| Corn | 🌽 | 5m | 40 | 110 | 25 | 3 |
| Pumpkin | 🎃 | 10m | 60 | 160 | 40 | 4 |
| Strawberry | 🍓 | 15m | 90 | 250 | 60 | 5 |

Higher-level crops take longer to grow but provide a better return on investment.

---

## Economy

**Coins**
- Starting balance: 100 coins
- Earned by harvesting crops
- Spent on seeds when planting
- Net profit per harvest = Harvest Yield − Seed Cost

**XP & Leveling**
- Earned by harvesting crops
- XP threshold to level up: `current level × 100`
  - Level 1 → 2: 100 XP
  - Level 2 → 3: 200 XP
  - Level 3 → 4: 300 XP (and so on)
- Leveling up unlocks new crop types

---

## Accounts

- Players register with a username and password
- Farm state is persisted server-side — progress is saved across sessions and devices
- JWT-based authentication (7-day token)

---

## Current State

The following features are implemented and working:

- [x] User registration and login
- [x] Persistent 8×8 farm grid per user
- [x] Plant crops (deducts coins, enforces level requirement)
- [x] Real-time crop growth timers
- [x] Harvest crops (awards coins and XP)
- [x] Level-up detection on harvest
- [x] 6 crop types across 5 unlock levels
- [x] HUD showing coins, level, and XP progress

---

## Planned Features

- [ ] Farm expansion — unlock additional plots as you level up
- [ ] Decorations — spend coins on visual items (fences, trees, paths)
- [ ] Neighbour visits — view and interact with other players' farms
- [ ] Gifting — send seeds or coins to friends
- [ ] Seasonal events — limited-time crops and rewards
- [ ] Leaderboard — top farmers by coins or level
- [ ] Achievements — milestone rewards (first harvest, 100 harvests, etc.)
