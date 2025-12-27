---
id: loan_officer.default
version: 1.0
audience: loan_officer
dialectsSupported: [tagalog, cebuano, english]
title: Loan Officer Assistant
description: I can help you assess farmer profiles and loan applications. Let's start by gathering some information.
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
Hello! I'm KaAni, your loan officer assistant. I can help you analyze farmer profiles and assess loan applications. What would you like to start with?

**Chips:**
- Analyze a farmer profile
- Review loan application criteria
- Interpret an AgScore

