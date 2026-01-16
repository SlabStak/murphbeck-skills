---
name: client-intake
description: Generate client intake questionnaires, conflict checks, and new matter opening procedures
version: 1.0.0
category: legal
tags: [legal, intake, conflict-check, client-onboarding, matter-opening]
---

# CLIENT.INTAKE.EXE - Legal Client Intake System

You are **CLIENT.INTAKE.EXE** - the legal client intake specialist that creates comprehensive intake questionnaires, conflict checks, and new matter procedures.

## System Prompt

```
You are an expert in legal practice management and client intake procedures. You help law firms create thorough, compliant intake processes that gather necessary information while screening for conflicts and assessing matter viability.

INTAKE PRINCIPLES:
- Comprehensive information gathering
- Conflict identification
- Matter assessment and viability
- Fee discussion framework
- Ethical compliance
- Client experience optimization

ETHICAL REQUIREMENTS:
- Conflict of interest screening (current and former clients)
- Competence assessment
- Fee disclosure requirements
- Confidentiality from first contact
- Clear communication about representation status
```

## Intake Form Templates

### General Client Intake Questionnaire

```markdown
# NEW CLIENT INTAKE FORM

**Date:** _______________
**Intake Completed By:** _______________
**Referred By:** _______________

---

## SECTION 1: CONTACT INFORMATION

### Client Information

**Full Legal Name:** _________________________________
**Preferred Name:** _________________________________
**Date of Birth:** _______________
**SSN (last 4 digits):** ___________ *(for conflict check only)*

**Home Address:**
Street: _________________________________
City: _______________ State: _____ ZIP: __________

**Mailing Address (if different):**
_________________________________

**Contact Numbers:**
- Cell: _______________  ☐ OK to leave voicemail?  ☐ OK to text?
- Home: _______________  ☐ OK to leave voicemail?
- Work: _______________  ☐ OK to leave voicemail?

**Email:** _________________________________
☐ OK to send correspondence via email?

**Preferred Contact Method:** ☐ Phone ☐ Email ☐ Text ☐ Mail

**Best Time to Reach You:** _________________________________

### Emergency Contact

**Name:** _________________________________
**Relationship:** _________________________________
**Phone:** _________________________________

---

## SECTION 2: EMPLOYMENT & FINANCIAL INFORMATION

**Current Employment Status:**
☐ Employed Full-Time  ☐ Employed Part-Time  ☐ Self-Employed
☐ Unemployed  ☐ Retired  ☐ Disabled  ☐ Student

**Employer Name:** _________________________________
**Position/Title:** _________________________________
**Employer Address:** _________________________________
**Work Phone:** _________________________________
**Length of Employment:** _________________________________

**Annual Household Income:**
☐ Under $25,000  ☐ $25,000-$50,000  ☐ $50,000-$75,000
☐ $75,000-$100,000  ☐ $100,000-$150,000  ☐ Over $150,000

---

## SECTION 3: MATTER INFORMATION

### Type of Legal Matter

☐ Family Law (divorce, custody, support)
☐ Personal Injury / Accident
☐ Criminal Defense
☐ Business / Corporate
☐ Real Estate
☐ Estate Planning (wills, trusts)
☐ Probate / Estate Administration
☐ Employment Law
☐ Bankruptcy
☐ Immigration
☐ Other: _________________________________

### Brief Description of Your Legal Matter

*Please describe your situation in your own words:*

________________________________________________________________
________________________________________________________________
________________________________________________________________
________________________________________________________________

### Key Dates

**Date incident occurred / matter arose:** _______________
**Statute of limitations concern?** ☐ Yes ☐ No ☐ Unknown
**Upcoming deadlines:** _________________________________
**Court dates (if any):** _________________________________

### Adverse Parties

**List all persons/companies on the other side of this matter:**

| Name | Relationship | Address/Contact |
|------|--------------|-----------------|
| 1. | | |
| 2. | | |
| 3. | | |

**Does any adverse party have an attorney?**
☐ Yes → Attorney Name: _________________________________
        Firm: _________________________________
☐ No  ☐ Unknown

### Related Parties

**List other persons/entities involved (witnesses, insurers, etc.):**

| Name | Role | Contact Info |
|------|------|--------------|
| 1. | | |
| 2. | | |

---

## SECTION 4: PRIOR LEGAL HISTORY

**Have you ever been represented by this firm before?**
☐ Yes → When: ___________ Matter: ___________________
☐ No

**Have you consulted with any other attorneys about this matter?**
☐ Yes → Attorney Name: _________________________________
        Outcome: _________________________________
☐ No

**Do you have any pending legal matters?**
☐ Yes → Describe: _________________________________
☐ No

**Have you ever filed for bankruptcy?**
☐ Yes → When: ___________ Chapter: _____
☐ No

**Do you have any criminal history relevant to this matter?**
☐ Yes → Describe: _________________________________
☐ No

---

## SECTION 5: INSURANCE INFORMATION

**Do you have insurance that may cover this matter?**
☐ Yes  ☐ No  ☐ Unknown

**Insurance Company:** _________________________________
**Policy Number:** _________________________________
**Claim Number (if filed):** _________________________________
**Adjuster Name/Phone:** _________________________________

**Have you made a claim?** ☐ Yes ☐ No
**Has the claim been denied?** ☐ Yes ☐ No

---

## SECTION 6: DOCUMENTS

**Please bring or provide copies of the following (if applicable):**

☐ Government-issued ID
☐ Relevant contracts or agreements
☐ Court documents / pleadings
☐ Correspondence related to matter
☐ Police reports
☐ Medical records
☐ Insurance policies
☐ Photographs
☐ Financial documents
☐ Other: _________________________________

---

## SECTION 7: FEE DISCUSSION

**How do you intend to pay for legal services?**
☐ Self-pay
☐ Payment plan needed
☐ Insurance coverage
☐ Third party paying (Name: _____________)
☐ Contingency arrangement

**Have attorney's fees been explained to you?** ☐ Yes ☐ No

---

## SECTION 8: HOW DID YOU HEAR ABOUT US?

☐ Referral from: _________________________________
☐ Internet search
☐ Social media
☐ Advertisement
☐ Bar referral service
☐ Former client
☐ Other: _________________________________

---

## ACKNOWLEDGMENTS

**Please read and initial each statement:**

_____ I understand that completing this form does not create an attorney-client relationship.

_____ I have provided accurate and complete information to the best of my knowledge.

_____ I understand that I should not discuss my legal matter with others, as it may affect my case.

_____ I understand the firm must complete a conflict check before accepting representation.

_____ I authorize the firm to obtain records necessary to evaluate and handle my matter.

**Signature:** ___________________________ Date: _______________

**Print Name:** ___________________________

---

*FOR OFFICE USE ONLY*

| Item | Date | Initials |
|------|------|----------|
| Conflict Check Completed | | |
| Matter Opened | | |
| Engagement Letter Sent | | |
| Retainer Received | | |
| File Created | | |
```

### Practice-Specific Intake Addendum - Family Law

```markdown
# FAMILY LAW INTAKE ADDENDUM

**Client Name:** _________________________________
**Date:** _______________

---

## MARRIAGE INFORMATION

**Date of Marriage:** _______________
**Place of Marriage:** _________________________________
**Date of Separation:** _______________
**Is there a separation agreement?** ☐ Yes ☐ No

**Current Marital Status:**
☐ Married, living together
☐ Married, separated
☐ Domestic partnership
☐ Common law marriage

---

## SPOUSE INFORMATION

**Spouse's Full Legal Name:** _________________________________
**Date of Birth:** _______________
**Current Address:** _________________________________
**Employer:** _________________________________
**Annual Income (estimate):** _______________
**Attorney (if known):** _________________________________

---

## CHILDREN

**Are there minor children of this marriage/relationship?** ☐ Yes ☐ No

| Child's Name | DOB | Lives With | School |
|--------------|-----|------------|--------|
| 1. | | | |
| 2. | | | |
| 3. | | | |
| 4. | | | |

**Any children with special needs?** ☐ Yes (describe: ________________) ☐ No

**Current custody arrangement:**
☐ No arrangement  ☐ Informal agreement  ☐ Court order

**Are there any concerns about the children's safety?** ☐ Yes ☐ No
If yes, describe: _________________________________

---

## PROPERTY & DEBTS

### Real Property
| Property Address | Approx. Value | Mortgage Balance | Titled In |
|------------------|---------------|------------------|-----------|
| 1. | | | |
| 2. | | | |

### Vehicles
| Year/Make/Model | Value | Loan Balance | Titled In |
|-----------------|-------|--------------|-----------|
| 1. | | | |
| 2. | | | |

### Financial Accounts (Approximate Balances)
- Bank Accounts: $_______________
- Retirement Accounts: $_______________
- Investment Accounts: $_______________
- Other: $_______________

### Debts
| Creditor | Balance | Whose Name |
|----------|---------|------------|
| | | |
| | | |

---

## DOMESTIC VIOLENCE

**Has there been any domestic violence in this relationship?**
☐ No
☐ Yes → ☐ Against me  ☐ Against spouse  ☐ Against children

**Is there a protective order in place?** ☐ Yes ☐ No

**Do you feel safe?** ☐ Yes ☐ No

*If you are in danger, please tell us immediately.*

---

## GOALS

**What are your goals in this matter?** (Check all that apply)

☐ Divorce/Dissolution
☐ Legal Separation
☐ Annulment
☐ Child Custody
☐ Child Support
☐ Spousal Support/Alimony
☐ Property Division
☐ Protective Order
☐ Modification of Existing Order
☐ Other: _________________________________

**What is most important to you in this matter?**
________________________________________________________________
________________________________________________________________
```

### Practice-Specific Intake Addendum - Personal Injury

```markdown
# PERSONAL INJURY INTAKE ADDENDUM

**Client Name:** _________________________________
**Date:** _______________

---

## INCIDENT INFORMATION

**Date of Incident:** _______________
**Time of Incident:** _______________ AM / PM
**Location:** _________________________________

**Type of Incident:**
☐ Motor vehicle accident
☐ Slip and fall
☐ Work injury
☐ Medical malpractice
☐ Product liability
☐ Dog bite
☐ Other: _________________________________

---

## ACCIDENT DETAILS (if motor vehicle)

**Your Vehicle:**
- Year/Make/Model: _________________________________
- Owner: _________________________________
- Were you: ☐ Driver ☐ Passenger ☐ Pedestrian ☐ Cyclist

**Other Vehicle(s) Involved:**
| Driver Name | Insurance Co. | Policy # | Vehicle |
|-------------|---------------|----------|---------|
| 1. | | | |
| 2. | | | |

**Police Report Filed?** ☐ Yes → Report #: _____________ ☐ No
**Citations Issued?** ☐ Yes → To whom: _____________ ☐ No
**Description of How Accident Occurred:**
________________________________________________________________
________________________________________________________________

---

## INJURIES

**Were you injured?** ☐ Yes ☐ No

**Describe your injuries:**
________________________________________________________________
________________________________________________________________

**Body parts injured:** (check all that apply)
☐ Head  ☐ Neck  ☐ Back  ☐ Shoulder  ☐ Arm  ☐ Hand
☐ Chest  ☐ Abdomen  ☐ Hip  ☐ Leg  ☐ Knee  ☐ Foot
☐ Other: _________________________________

**Did you lose consciousness?** ☐ Yes ☐ No

**Were you taken to the hospital?**
☐ Yes → Hospital: _________________________________
        ☐ Ambulance ☐ Private vehicle
☐ No

**Have you seen any doctors since the incident?**
| Doctor/Facility | Specialty | Dates of Treatment |
|-----------------|-----------|-------------------|
| 1. | | |
| 2. | | |
| 3. | | |

**Are you still treating?** ☐ Yes ☐ No
**Current symptoms:** _________________________________

---

## PRIOR MEDICAL HISTORY

**Did you have any pre-existing conditions in the injured areas?**
☐ No
☐ Yes → Describe: _________________________________

**Prior accidents or injuries?**
☐ No
☐ Yes → When: ________ Describe: _________________

---

## LOST WAGES / ECONOMIC DAMAGES

**Did you miss work due to this incident?** ☐ Yes ☐ No
**Dates missed:** From _____________ to _____________
**Have you returned to work?** ☐ Yes ☐ No ☐ Part-time/Light duty

**Employer at time of incident:** _________________________________
**Hourly wage / Salary:** _________________________________

---

## INSURANCE INFORMATION

**Your Auto Insurance:**
- Company: _________________________________
- Policy #: _________________________________
- Coverage limits (if known): _________________________________

**Health Insurance:**
- Company: _________________________________
- Policy #: _________________________________

**Med Pay / PIP Coverage?** ☐ Yes ☐ No ☐ Unknown
**Uninsured/Underinsured Motorist?** ☐ Yes ☐ No ☐ Unknown

---

## WITNESSES

| Name | Phone | What Did They See? |
|------|-------|--------------------|
| 1. | | |
| 2. | | |

---

## EVIDENCE

**Do you have:**
☐ Photos of the accident scene
☐ Photos of vehicle damage
☐ Photos of your injuries
☐ Dash cam / surveillance footage
☐ Medical records
☐ Medical bills
☐ Wage loss documentation

---

## PRIOR REPRESENTATION

**Have you signed anything with another attorney?** ☐ Yes ☐ No
**Have you signed anything with an insurance company?** ☐ Yes ☐ No
**Have you given a recorded statement?** ☐ Yes ☐ No
**Has anyone offered you a settlement?** ☐ Yes → Amount: $_______ ☐ No
```

## Conflict Check Procedure

### Conflict Check Form

```markdown
# CONFLICT OF INTEREST CHECK

**Date:** _______________
**Performed By:** _______________
**New Matter:** _________________________________
**Prospective Client:** _________________________________

---

## PARTIES TO CHECK

Enter all names/variations to be checked:

### Prospective Client(s)
| Name | Variations/AKAs | SSN Last 4 | DOB |
|------|-----------------|------------|-----|
| 1. | | | |
| 2. | | | |

### Adverse Parties
| Name | Variations/AKAs | Known Identifiers |
|------|-----------------|-------------------|
| 1. | | |
| 2. | | |
| 3. | | |

### Related Parties (witnesses, co-parties, etc.)
| Name | Role | Known Identifiers |
|------|------|-------------------|
| 1. | | |
| 2. | | |

### Entities Involved
| Entity Name | Role | Related Individuals |
|-------------|------|---------------------|
| 1. | | |
| 2. | | |

---

## SEARCH RESULTS

### Database Search
**System Used:** _________________________________
**Date/Time of Search:** _________________________________

| Name Searched | Matches Found | Notes |
|---------------|---------------|-------|
| | ☐ Yes ☐ No | |
| | ☐ Yes ☐ No | |
| | ☐ Yes ☐ No | |

### Potential Conflicts Identified

| Match | Prior Matter | Relationship | Current Status |
|-------|--------------|--------------|----------------|
| | | | |
| | | | |

---

## CONFLICT ANALYSIS

### Conflict Type (if any)
☐ No conflict identified
☐ Direct adversity - current client
☐ Direct adversity - former client
☐ Material limitation - current client
☐ Material limitation - other interest
☐ Former government lawyer
☐ Imputed conflict from lateral hire
☐ Business transaction with client
☐ Other: _________________________________

### If Conflict Exists:

**Is the conflict waivable?** ☐ Yes ☐ No

**Waiver requirements:**
☐ Informed consent required from: _________________________________
☐ Written confirmation required
☐ Reasonable lawyer would conclude representation possible

**Conflict waiver obtained?**
☐ Yes → Date: _____________ From: _____________
☐ No
☐ Not applicable

---

## DETERMINATION

☐ **CLEARED** - No conflict; matter may be opened
☐ **CLEARED WITH WAIVER** - Waiver obtained; matter may be opened
☐ **CONFLICT** - Cannot proceed without waiver
☐ **NON-WAIVABLE CONFLICT** - Must decline representation
☐ **FURTHER REVIEW REQUIRED** - Escalate to: _____________

**Notes:**
________________________________________________________________
________________________________________________________________

---

## APPROVALS

**Conflict Check Performed By:**
Signature: ___________________________ Date: _______________
Print Name: ___________________________

**Reviewed By (if required):**
Signature: ___________________________ Date: _______________
Print Name: ___________________________

---

*Retain this form in the matter file and conflicts database.*
```

### New Matter Opening Checklist

```markdown
# NEW MATTER OPENING CHECKLIST

**Client Name:** _________________________________
**Matter Name:** _________________________________
**Matter Number:** _________________________________
**Responsible Attorney:** _________________________________
**Date Opened:** _______________

---

## PRE-OPENING REQUIREMENTS

| Task | Completed | Date | Initials |
|------|-----------|------|----------|
| Client intake form completed | ☐ | | |
| Conflict check cleared | ☐ | | |
| Engagement letter signed | ☐ | | |
| Fee agreement signed | ☐ | | |
| Retainer received | ☐ | | |
| Retainer deposited to trust | ☐ | | |

---

## MATTER SETUP

| Task | Completed | Date | Initials |
|------|-----------|------|----------|
| Matter opened in billing system | ☐ | | |
| Matter opened in document management | ☐ | | |
| Physical file created | ☐ | | |
| File labels printed | ☐ | | |
| Team members assigned | ☐ | | |
| Calendar entries made | ☐ | | |
| Ticklers/reminders set | ☐ | | |

---

## CLIENT COMMUNICATION

| Task | Completed | Date | Initials |
|------|-----------|------|----------|
| Welcome letter/email sent | ☐ | | |
| Client portal access provided | ☐ | | |
| Initial documents requested | ☐ | | |
| Next steps communicated | ☐ | | |

---

## MATTER-SPECIFIC TASKS

| Task | Completed | Date | Initials |
|------|-----------|------|----------|
| Statute of limitations calendared | ☐ | | |
| Court deadlines identified | ☐ | | |
| Opposing counsel notified | ☐ | | |
| Insurance carrier notified | ☐ | | |
| Preservation letter sent | ☐ | | |
| Records requests sent | ☐ | | |

---

## FILE ORGANIZATION

Standard file sections created:
☐ Correspondence
☐ Pleadings
☐ Discovery
☐ Research/Memoranda
☐ Client Documents
☐ Billing
☐ Notes/Chronology

---

## SIGN-OFF

**Matter Ready for Work:**

Attorney Signature: ___________________________ Date: _______________

Paralegal/Staff Signature: ___________________________ Date: _______________
```

## API Parameters

```python
model = "claude-sonnet-4-20250514"
max_tokens = 8192
temperature = 0.3
```

## Usage

```
/client-intake

# Specific form types:
/client-intake --type general
/client-intake --type family-law
/client-intake --type personal-injury
/client-intake --type conflict-check
/client-intake --type matter-opening
```

## Important Notes

1. **Customize for Jurisdiction**: Intake forms should be customized for your state's specific requirements
2. **Update Regularly**: Review and update forms annually for legal and regulatory changes
3. **Confidentiality**: All intake information is confidential from first contact
4. **No Representation**: Clearly communicate that intake does not create attorney-client relationship
5. **Conflicts**: Always complete conflict check before accepting representation
