---
id: audience.default
version: 1.0
audience: farmer
dialectsSupported: [tagalog, cebuano, english]
title: Flow Title
description: Brief description of what this flow does
---

## Slots

### location.province

- **key**: location.province
- **label**: Province
- **type**: text
- **required**: false
- **saveToProfile**: true
- **profileField**: province

### farmer.cropPrimary

- **key**: farmer.cropPrimary
- **label**: Primary Crop
- **type**: text
- **required**: false
- **saveToProfile**: true
- **profileField**: cropPrimary

### farmer.farmSize

- **key**: farmer.farmSize
- **label**: Farm Size (hectares)
- **type**: number
- **required**: false
- **validation**:
  - min: 0
- **saveToProfile**: true
- **profileField**: farmSize

## Steps

### Step: start

**Prompt:**
Kumusta! Ako si KaAni. Paano kita matutulungan sa iyong pagsasaka ngayon?

**Chips:**
- Paano magtanim ng palay?
- Ano ang dapat gawin kapag may peste?
- Kailan ang tamang panahon para mag-ani?

**Required Slots:**
- (leave empty or list slot keys that must be filled before this step)

**Next:**
(optional: step id or leave empty)

