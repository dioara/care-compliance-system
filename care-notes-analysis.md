# Care Notes Audit Analysis

## Expected Output Format (from David_Peter__Baldwin sample)

The detailed output should include for each note:

1. **Header Info**
   - Note number and date
   - Carer name
   - Overall Score (percentage)
   - CQC Compliant: Yes/No

2. **Original Note** - The raw text as written

3. **Score Breakdown** (5 categories, each scored 0-100%):
   - Length & Detail
   - Person-Centred
   - Professional Language
   - Outcome Focused
   - Evidence Based
   - Word Count

4. **CQC Language Issues Found**
   - Quote the problematic text
   - Explain why it's an issue
   - Provide "Use instead:" suggestion

5. **What's Missing** - Checklist of common elements:
   - Details on mood and engagement
   - Information on choices offered
   - Description of how dignity and respect were maintained
   - Details about hydration
   - Comfort measures taken
   - Safety observations
   - Outcome-focused information
   - Evidence of person-centred approach

6. **Positive Aspects** - What the note did well

7. **Improved Version (Ready to Copy)** - A fully rewritten CQC-compliant version

8. **Feedback for [Carer Name]** - Personalised feedback including:
   - What's good
   - Language issues to fix (numbered list with "Don't use" and "Instead say")
   - What to add
   - Reference to the rewritten example

## Input Format (Nourish Client Diary Export)

The Nourish export is a table with columns:
- Display from / Display until
- Entry occurred (date)
- Incident type
- Carers involved (staff names with links)
- Clients involved (service user names with links)
- Diary entry (the actual note text)
- Diary Link
- Assigned to / Assigned status / Assigned priority

Key observations:
- Notes are in a table format, one row per entry
- Date format: DD/MM/YYYY
- Time is embedded in the note text
- Staff names are linked
- Service user names are linked
- Notes can be quite long and detailed

## Sample Notes from Nourish

**Note 1 (Tyler D - 06/01/2026):**
Staff: Oluwaseun and A.O
Detailed note about:
- Arrival time (1:05pm)
- Housing Support Officer present
- Issues with internet, Universal Credit, heating
- Tyler's emotional response (unhappy aunt attended without notice)
- Decision to return to mother's house temporarily
- Mobility support (crutches, hip issues)
- Safety concerns (icy road conditions)

**Note 2 (Anne Holliday - 05/01/2026):**
Staff: Oluwaseun Loto
Brief note about:
- Awake at start of visit
- Had toast at 9:30
- Declined going to bed
- Pacing around room
- Emotional support given (confused and emotional)
- Slept at 3:30am
- Medication not administered

## Key Improvements Needed for AI Care Notes Audit

1. **Parse multiple formats**: PDF tables, Word docs, copy/paste text
2. **Extract individual notes** with date, time, carer, service user
3. **Score each note** on 5 CQC criteria
4. **Identify language issues** with specific quotes and suggestions
5. **Generate improved versions** that are ready to copy
6. **Personalised carer feedback** for training purposes
7. **British spelling** throughout
8. **Name anonymisation** (same as care plan audit)
9. **Summary statistics**: Total notes, average score, compliance rate
