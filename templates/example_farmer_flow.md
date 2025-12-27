---
id: farmer.default
version: 1.0
audience: farmer
dialectsSupported: [tagalog, cebuano, english]
title: Farmer Assistant
description: Ako si KaAni, ang iyong assistant para sa pagsasaka. Paano kita matutulungan ngayon?
---

## Slots

### location.province

- **key**: location.province
- **label**: Province
- **type**: text
- **required**: false
- **saveToProfile**: true
- **profileField**: province

### location.municipality

- **key**: location.municipality
- **label**: Municipality
- **type**: text
- **required**: false
- **saveToProfile**: true
- **profileField**: municipality

### location.barangay

- **key**: location.barangay
- **label**: Barangay
- **type**: text
- **required**: false
- **saveToProfile**: true
- **profileField**: barangay

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

