# Nourish Care Plan PDF Structure Analysis

## Document Structure

### Header Section (Page 1)
- Company name: "UK Health Kits LTD ukhealthkits NC"
- Nourish logo
- "Care Plan - norman (Norman Tindall)"
- Report run date: "07/12/2025 04:15 by UK Health Kits LTD Nourish Support"
- Service user profile: name, age, address, tags (ABILITIES, DIET, ReSPECT)

### Category 1: "1. Needs Assessing" (EXCLUDE from analysis)
These are assessment sections, NOT care plans:
- DEPENDENCY ASSESSMENT
- PHYSICAL RISK ASSESSMENT  
- PRE-ASSESSMENT

### Category 2: "2. Care Plans" (INCLUDE in analysis)
Each care plan has:
1. **Section Header** with icon showing "2. Care Plans" and title like "ACCOMMODATION CLEANLINESS AND COMFORT"
2. **Description** field (often empty "-")
3. **CARE PLAN box** with dark header showing "CARE PLAN" and "NORMAN TINDALL"
4. **Structured fields**:
   - Title (e.g., "Accommodation Cleanliness and Comfort")
   - Next review date (e.g., "07/01/2026")
   - Identified Need
   - Level of need (e.g., "2 - Moderate Need")
   - Planned Outcomes
   - How to Achieve Outcomes
   - Risk section with:
     - Risk title (e.g., "Pain or discomfort due to poor positioning")
     - Mitigation text
     - Likelihood (1-5 with label)
     - Impact (1-5 with label)
     - Risk score (calculated)
5. **Review note** section with:
   - Review note text
   - Reviewer name
   - Review date

### Footer (on every page)
- Service user name: "Norman Tindall"
- Page number: "Page X of 24"
- Created date: "Created 07/12/2025 - 04:15"
- Copyright: "by © Nourish Care Systems Ltd"

## Care Plan Sections Found (in order)
1. Accommodation Cleanliness and Comfort
2. Breathing
3. Communication and Senses
4. Companionship, Social Interaction and Recreation
5. Daily Routine
... (continues)

## Key Parsing Rules

1. **Identify Care Plans by**: "2. Care Plans" header followed by section title in ALL CAPS
2. **Section boundary**: Next "2. Care Plans" header OR "CARE PLAN" box
3. **Extract from CARE PLAN box**:
   - Title field
   - Next review date
   - Identified Need
   - Level of need
   - Planned Outcomes
   - How to Achieve Outcomes
   - Risk (with Likelihood, Impact, Score)
4. **EXCLUDE**:
   - "1. Needs Assessing" sections
   - Footer text (Page X of Y, Created date, Nourish copyright)
   - Header/profile information
5. **Clean up**:
   - Remove "Norman Tindall" from footer
   - Remove "Page X of 24"
   - Remove "Created DD/MM/YYYY - HH:MM"
   - Remove "by © Nourish Care Systems Ltd"
