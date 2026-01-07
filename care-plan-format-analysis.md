# Care Plan Format Analysis

## Problem Identified

The current audit system is only detecting 1 section ("MEDICATION COLLECTION") from a care plan that actually contains multiple visit types and care areas.

## Access Care Planning Format (Non-Nourish)

This care plan is structured by **visit type** rather than by care domain:
- Breakfast Visit
- Sitting
- Lunch Visit
- Other
- Cleaning
- Medication
- Teatime Calls
- Bedtime Visit
- PRN Medications

Each visit contains task items like:
- Door (access instructions)
- Personal Care
- Cloth change
- Curtains
- Domestic - Make Bed
- Breakfast/Lunch/Dinner
- Check / Ensure Pendant is being worn
- Prompt medication administration
- Hydration
- Wellness
- Mood
- Secure (key security)
- Pad Check
- Meal Preparation
- Support Leg to Bed
- APPLIANCES

## What's MISSING from this care plan (compared to Nourish comprehensive sections)

### Core Care Plan Sections Missing:
1. **Personal Background / Life History** - No "About Me" section
2. **Communication & Senses** - No detailed communication needs
3. **Breathing** - No respiratory assessment
4. **Eating & Drinking / Nutrition** - Only task-based "Breakfast/Lunch/Dinner" with no nutritional assessment
5. **Skin Integrity / Pressure Care** - No skin assessment despite pad checks
6. **Mobility** - No mobility assessment despite mentions of support
7. **Continence** - Only "Pad Check" with no continence assessment
8. **Mental Health / Emotional Wellbeing** - Only "Mood: observe and document"
9. **Sleep & Rest** - No sleep assessment
10. **Pain Management** - No pain assessment despite multiple pain medications
11. **Social & Relationships** - No social needs assessment
12. **End of Life / Advance Care Planning** - Not addressed
13. **Falls Risk** - Not assessed
14. **Moving & Handling** - No manual handling assessment
15. **Infection Control** - Not addressed
16. **Safeguarding** - Not addressed
17. **Capacity / Mental Capacity Assessment** - Not addressed
18. **Emergency Procedures** - Not documented

### Required Fields Missing Per Section:
For each care domain, a CQC-compliant care plan should have:
1. **Identified Need** - First person, explaining WHY support is needed
2. **Planned Outcomes** - SMART goals
3. **How to Achieve** - Step-by-step instructions (WHO, WHAT, WHEN, WHERE, HOW)
4. **Risk Assessment** - Likelihood, Impact, Score, Mitigations
5. **Review Date** - When to review
6. **Responsible Person** - Who is accountable

## Comprehensive Care Plan Sections (Nourish-based + CQC Requirements)

### 1. Needs Assessing (Pre-Assessment)
- Dependency Assessment
- Physical Risk Assessment
- Pre-Assessment Information

### 2. Core Care Plan Domains
1. Accommodation Cleanliness and Comfort
2. Breathing
3. Communication and Senses
4. Continence
5. Eating and Drinking / Nutrition and Hydration
6. Emotional and Mental Wellbeing
7. End of Life Care / Advance Care Planning
8. Falls Prevention
9. Infection Control
10. Medication Management
11. Mobility and Moving & Handling
12. Pain Management
13. Personal Care and Hygiene
14. Personal Safety and Safeguarding
15. Skin Integrity and Pressure Care
16. Sleep and Rest
17. Social Needs and Relationships
18. Spiritual and Cultural Needs

### 3. Additional Required Sections
- About Me / Personal Profile / Life History
- Emergency Contacts and Procedures
- Key Safe / Access Information
- Equipment and Aids
- Healthcare Professionals Involved
- Capacity Assessment / Best Interests
- Consent Documentation
- Risk Assessments Summary

## Audit Improvement Required

The audit should:
1. Parse whatever sections ARE present in the care plan
2. Check against the comprehensive list of expected sections
3. Flag any MISSING sections as critical gaps
4. For each present section, analyse the quality
5. Generate a "Missing Sections" report at the end showing what's not covered
