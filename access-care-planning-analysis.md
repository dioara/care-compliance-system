# Access Care Planning Audit Analysis

## Issues Identified

### 1. Only 1 Section Detected (Should be Many More)
The audit only detected "MEDICATION COLLECTION" when the care plan actually has:
- Breakfast Visit (with Door, Personal Care, Cloth change, Curtains, Domestic, Breakfast, Pendant, Medication, Hydration, Wellness, Mood, Secure)
- Lunch Visit (with Door, Pad Check, Lunch, Pendant, Hydration, Medication, Domestic, Secure)
- Sitting (with Daily Task/Planning, Pendant)
- Other (with Door, Daily Task/Planning, Pendant)
- Bedtime Visit
- Medication Collection
- Tea Visit

### 2. Format is Visit-Based, Not Domain-Based
Access Care Planning organizes by **visit type** (Breakfast, Lunch, Bedtime) rather than **care domain** (Personal Care, Mobility, Nutrition).

The parser needs to:
1. Detect "Active Care Plans" as the start of care content
2. Recognize visit types as sections: Breakfast Visit, Lunch Visit, Tea Visit, Bedtime Visit, Sitting, Other, Medication Collection
3. Extract the tasks within each visit as subsections

### 3. Missing Sections Report Should Be More Prominent
The audit correctly identified that many CQC-required sections are missing, but this wasn't shown in the output.

## What the Care Plan Contains (Extracted from PDF)

### Breakfast Visit (09:50 - 11:20, Daily)
- Door: Please knock on the door before using the key to gain access
- Personal Care: I would like to have a well detailed personal care
- Cloth change: I would like to change from my night wear to a day wear of my choice
- Curtains: Open Curtains
- Domestic - Make Bed: I would need support with making my bed, and if soiled, i will need support with changing my bed sheet
- Breakfast: I would like to have a food of my choice for breakfast
- Check/Ensure Pendant is being worn: Please keep an EYE on my Pendant, i prefer to have it ON
- Prompt medication administration: I would like my carers to help prompt and administer my medication always
- Hydration: I would like to have a drink of my choice
- Wellness: Observe her overall well-being
- Mood: observe and document
- Secure: After use, the key must be returned to the safe immediately, and the code must be scrambled to maintain security

### Medications Listed
- Morphine Zomorph - TWO capsule TWICE a day at 10 am and 10pm (12 hours apart)
- Pregabalin - ONE capsule every MORNING and ONE capsule at NIGHT
- Folic acid 5mg Tabs - ONE tablet every MORNING
- Colecalciferol - ONE capsule every MORNING
- Modafinil - ONE tablet every MORNING
- Sodium Bicarbonate - ONE capsule Three times a day
- Lactulose - Take 10mls every MORNING and 10mls at TEA time
- NICORETTE INHALATOR 15MG - Insert CATRIDGE into plastic mouthpiece, Inhale through mouthpiece as required using MAXIMUM of SIX cartridges in 24HRS

### Lunch Visit (13:15 - 13:45, Daily)
- Door, Pad Check, Lunch, Pendant, Hydration, Medication, Domestic - Clean Up/Wash Dishes, Secure
- Modafinil - Take half tablet at LUNCHTIME
- Sodium Bicarbonate - Take ONE capsule Three times a day
- Diazepam - Take ONE tablet TWICE a day

### Sitting (12:55 - 14:55, Wed)
- Daily Task/Planning: 2 hours Wednesday mornings to support Sam with daily living tasks such as hospital appointments, GP appointments, shopping, prompt supervise her with household tasks, laundry/meal batch cooking etc.
- Pendant

### Other (13:25 - 15:25, Thu)
- Door
- Daily Task/Planning: 2 hours Wednesday mornings to support Sam with daily living tasks
- Pendant

## Required Parser Changes

1. **Detect Access Care Planning format** by looking for:
   - "access Care Planning" header
   - "Active Care Plans" section
   - Visit-type headers (Breakfast Visit, Lunch Visit, etc.)

2. **Extract visits as sections** with their tasks as content

3. **Map visit tasks to CQC domains** for the missing sections analysis:
   - Personal Care → Personal Care & Hygiene domain
   - Medication → Medication Management domain
   - Hydration/Breakfast/Lunch → Nutrition & Hydration domain
   - Pad Check → Continence Care domain
   - etc.

4. **Show missing CQC domains prominently** since this format doesn't have proper care assessments
