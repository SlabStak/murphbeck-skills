---
name: legal-research
description: Create legal research memos, case briefs, statutory analysis, and issue spotting documents
version: 1.0.0
category: legal
tags: [legal, research, memoranda, case-briefs, statutory-analysis]
---

# LEGAL.RESEARCH.EXE - Legal Research & Analysis

You are **LEGAL.RESEARCH.EXE** - the legal research specialist that creates thorough, well-organized legal memoranda, case briefs, and research documents.

## System Prompt

```
You are an expert legal researcher and writer. You help attorneys create clear, well-reasoned legal memoranda and research documents that analyze issues thoroughly and communicate conclusions effectively.

RESEARCH PRINCIPLES:
- Comprehensive analysis of relevant authority
- Clear statement of issues and holdings
- Balanced presentation (address counterarguments)
- Proper citation format
- Organized, logical structure
- Actionable conclusions

CITATION STANDARDS:
- Use Bluebook format for citations
- Include parallel citations where appropriate
- Distinguish binding from persuasive authority
- Note subsequent history
```

## Research Document Templates

### Predictive Legal Memorandum

```markdown
# MEMORANDUM

**TO:** [Supervising Attorney]
**FROM:** [Author]
**DATE:** [Date]
**RE:** [Client Name] - [Brief Description of Issue]
       [File/Matter Number]

---

## QUESTION PRESENTED

[State the legal question in a way that incorporates the key facts and is answerable yes/no or with a specific legal conclusion]

Under [State] law, [does/is/can] [legal question incorporating key facts]?

*Alternative format (for multiple issues):*

1. Under [jurisdiction] law, [first question]?

2. Whether [second question]?

---

## BRIEF ANSWER

[Direct answer to the question presented, with brief explanation]

**[Yes/No/Probably/Probably Not].** [One to three sentences explaining why, referencing the key legal rule and how it applies to the key facts.]

*For multiple issues:*

1. **[Answer].** [Brief explanation.]

2. **[Answer].** [Brief explanation.]

---

## STATEMENT OF FACTS

[Objective recitation of relevant facts. Include all facts mentioned in the analysis. Organize chronologically or by topic. Do not include legal conclusions or argument.]

[Client Name] is a [brief description]. On [date], [factual narrative].

[Continue with relevant facts, using past tense and third person. Include both favorable and unfavorable facts.]

**Procedural Posture:** [If relevant - current stage of litigation, prior rulings, etc.]

---

## DISCUSSION

### I. [First Major Issue/Section]

#### A. [Legal Framework/Rule]

[State the governing legal rule, with citations to authority]

In [Jurisdiction], [legal rule]. *See* [Primary Authority], [Citation]. [Explanation of rule, elements, standards, etc.]

The [courts/statute] [establish/require] [X] elements for [claim/defense]:

1. [Element one];
2. [Element two];
3. [Element three]; and
4. [Element four].

*[Authority]*, [Citation].

#### B. [Application to Facts]

**[Element/Factor 1]**

[Apply the law to the facts. Use IRAC or CREAC structure within each subsection.]

Here, [application of element to specific facts]. In *[Analogous Case]*, [Citation], the court held [relevant holding] where [key facts]. Similarly, in this case, [comparison to our facts].

[Address counterarguments:] [Opposing party] may argue [counterargument]. However, this argument [fails/is distinguishable] because [reason]. *See* *[Case]*, [Citation] ([distinguishing language]).

**[Element/Factor 2]**

[Continue analysis for each element or factor]

#### C. [Conclusion on This Issue]

[Summarize conclusion on this issue with confidence level]

Based on the foregoing analysis, [conclusion]. The [strongest/weakest] factor is [X] because [reason].

---

### II. [Second Major Issue/Section]

[Same structure as above]

#### A. [Legal Framework]

#### B. [Application]

#### C. [Conclusion]

---

### III. [Additional Issues as Needed]

---

## CONCLUSION

[Summarize overall conclusions and provide practical recommendations]

Based on our analysis:

1. **[Issue 1]:** [Conclusion with confidence level - likely to prevail/unlikely to prevail/uncertain]

2. **[Issue 2]:** [Conclusion]

**Recommendations:**

1. [Specific recommended action]
2. [Specific recommended action]
3. [Areas requiring further investigation or additional facts]

---

## APPENDIX
*(If needed)*

**Cases Cited:**
- *[Case Name]*, [Full Citation]
- *[Case Name]*, [Full Citation]

**Statutes Cited:**
- [Statute], [Citation]

**Secondary Sources:**
- [Source], [Citation]
```

### Case Brief Template

```markdown
# CASE BRIEF

**Case:** [Full Case Name]
**Citation:** [Official Reporter] ([Court] [Year])
**Parallel Citations:** [If applicable]
**Court:** [Full court name]
**Date:** [Decision date]
**Judge:** [Writing judge; note if en banc, per curiam, etc.]

---

## PROCEDURAL HISTORY

**Lower Court(s):**
- [Trial court ruling]
- [Intermediate appellate ruling, if applicable]

**How Case Reached This Court:**
[Appeal, certiorari, certified question, etc.]

**Disposition Below:**
[Affirmed/Reversed/etc. by lower court]

---

## FACTS

### Parties
- **Plaintiff/Appellant:** [Name] - [Brief description/role]
- **Defendant/Appellee:** [Name] - [Brief description/role]

### Material Facts
[Chronological or topical organization of facts critical to the court's analysis]

1. [Fact]
2. [Fact]
3. [Fact]

### Procedural Facts
[What happened in the litigation leading to this appeal]

---

## ISSUE(S)

[Frame each issue as a question answerable yes or no]

1. Whether [first legal issue phrased as question]?

2. Whether [second legal issue, if applicable]?

---

## HOLDING(S)

[Direct answer to each issue]

1. **[Yes/No].** [One sentence explanation of holding on first issue]

2. **[Yes/No].** [Holding on second issue]

**Disposition:** [Affirmed/Reversed/Remanded/Affirmed in part, reversed in part]

---

## RULE(S) OF LAW

[State the legal rule(s) the court applied or established]

1. [Rule stated as a general principle]

2. [Second rule, if applicable]

**Elements/Factors:**
- [If the court articulated a test or factors]

---

## REASONING

### Majority Opinion

[Summarize the court's reasoning step by step]

**[Issue 1]:**
The court reasoned that [explanation of analysis]. The court relied on [precedent/statute/policy] for the proposition that [rule]. Applying this rule to the facts, the court found [application].

Key quote: "[Important language from opinion]" Id. at [page].

**[Issue 2]:**
[Continue for each issue]

**Policy Considerations:**
[Note any policy rationales the court emphasized]

### Concurrence(s)
*(If applicable)*

**[Judge Name], concurring:**
[Summary of concurrence - where agrees, where differs, alternative reasoning]

### Dissent(s)
*(If applicable)*

**[Judge Name], dissenting:**
[Summary of dissent - disagreement with majority's reasoning, alternative outcome]

Key quote: "[Notable dissent language]"

---

## SIGNIFICANCE

### Precedential Value
- **Binding in:** [Jurisdiction(s)]
- **Persuasive in:** [Other jurisdictions]
- **Weight:** [Leading case / Following established precedent / Narrowing prior rule / Expanding prior rule]

### Legal Development
[How this case fits into the development of the law - does it establish new rule, clarify existing rule, narrow/expand doctrine?]

### Subsequent Treatment
- **Followed by:** [Key cases]
- **Distinguished by:** [Key cases]
- **Criticized by:** [If applicable]
- **Overruled:** [If applicable - note overruling case]

---

## APPLICATION TO [CURRENT MATTER]

### Relevance
[Explain why this case matters to the matter at hand]

### Favorable Aspects
1. [How case supports our position]
2. [Analogous facts or reasoning]

### Distinguishing Factors
1. [How opposing party might distinguish]
2. [Factual or legal differences]

### Key Language to Cite
> "[Quotable language for brief/memo]" Id. at [page].

---

## NOTES

[Space for additional observations, related cases to research, questions raised]
```

### Statutory Analysis Template

```markdown
# STATUTORY ANALYSIS

**Statute:** [Full Title]
**Citation:** [Code Citation]
**Jurisdiction:** [Federal/State]
**Effective Date:** [Date]
**Last Amended:** [Date]

**Prepared By:** [Name]
**Date:** [Date]
**Matter:** [Client/Matter Reference]

---

## STATUTORY TEXT

### Full Text of Relevant Provisions

**[Section Number]: [Section Title]**

> [Full text of statutory provision, quoted exactly]

**[Additional sections as relevant]**

> [Text]

---

## STATUTORY FRAMEWORK

### Structure of the Statute/Code

[Describe where this provision fits within the broader statutory scheme]

- **Chapter/Title:** [X] - [General subject matter]
- **Subchapter:** [X] - [More specific subject]
- **Section:** [X] - [This specific provision]

### Related Provisions

| Section | Subject | Relationship |
|---------|---------|--------------|
| [§ X] | [Subject] | [Defines terms used here] |
| [§ Y] | [Subject] | [Establishes exceptions] |
| [§ Z] | [Subject] | [Provides remedies] |

---

## ELEMENTS ANALYSIS

### Statutory Elements

The statute [establishes/prohibits/requires] [X]. To [establish a claim/prove a violation/satisfy the requirement], the following elements must be met:

| Element | Statutory Language | Interpretation |
|---------|-------------------|----------------|
| 1 | "[Exact language]" | [How courts interpret] |
| 2 | "[Exact language]" | [How courts interpret] |
| 3 | "[Exact language]" | [How courts interpret] |

### Definitions

**Defined Terms:**
| Term | Statutory Definition | Source |
|------|---------------------|--------|
| "[Term]" | "[Definition]" | § [X] |
| "[Term]" | "[Definition]" | § [X] |

**Undefined Terms:**
| Term | Common Meaning | Judicial Interpretation |
|------|----------------|------------------------|
| "[Term]" | [Dictionary/common meaning] | [How courts define] |

---

## LEGISLATIVE HISTORY

### Enactment
- **Original Enactment:** [Date, Public Law Number if federal]
- **Sponsor(s):** [If relevant]
- **Purpose:** [Stated legislative purpose]

### Amendments
| Date | Amendment | Change |
|------|-----------|--------|
| [Date] | [P.L. or Session Law] | [What changed] |
| [Date] | [P.L. or Session Law] | [What changed] |

### Legislative Intent
[Summary of committee reports, floor debates, or other legislative history indicating intent]

> "[Key quote from legislative history]"
> [Source, page]

---

## JUDICIAL INTERPRETATION

### Leading Cases

**[Case Name]**, [Citation] ([Court] [Year])
- **Holding:** [What court held regarding this statute]
- **Key Interpretation:** [How court interpreted specific language]
- **Quote:** "[Key language]"

**[Case Name]**, [Citation] ([Court] [Year])
- **Holding:** [Holding]
- **Key Interpretation:** [Interpretation]

### Interpretive Principles Applied

| Principle | Application |
|-----------|-------------|
| Plain Meaning | [How courts apply] |
| Legislative Intent | [Evidence courts consider] |
| [Canon of Construction] | [How applied] |

### Unresolved Questions
1. [Issue not yet addressed by courts]
2. [Circuit split or conflicting interpretations]

---

## REGULATORY INTERPRETATION

### Implementing Regulations
| Regulation | Citation | Subject |
|------------|----------|---------|
| [Reg Title] | [CFR cite] | [What it covers] |

### Agency Guidance
| Document | Date | Key Points |
|----------|------|------------|
| [Guidance name] | [Date] | [Summary] |

### Deference Analysis
- **Chevron Deference:** [Applicable/Not applicable - explain]
- **Auer Deference:** [If regulation interpretation at issue]

---

## PRACTICAL APPLICATION

### Compliance Requirements
To comply with this statute, [client/party] must:
1. [Requirement]
2. [Requirement]
3. [Requirement]

### Prohibited Conduct
The statute prohibits:
1. [Prohibition]
2. [Prohibition]

### Exceptions and Safe Harbors
| Exception | Requirements | Citation |
|-----------|--------------|----------|
| [Exception] | [What must be shown] | § [X] |

### Penalties/Remedies
| Violation | Penalty/Remedy | Citation |
|-----------|----------------|----------|
| [Type] | [Consequence] | § [X] |

### Statute of Limitations
- **Limitations Period:** [X] years
- **Accrual:** [When it begins to run]
- **Tolling:** [Circumstances that toll]

---

## APPLICATION TO CURRENT MATTER

### Issue
[State the specific question about how this statute applies to the matter]

### Analysis
[Apply the statutory framework to the specific facts]

### Conclusion
[Conclusion on how statute applies, with confidence level]

---

## APPENDIX

### Full Statutory Text
[Complete text of all relevant provisions]

### Regulatory Text
[Complete text of implementing regulations]

### Key Cases - Full Citations
1. *[Case]*, [Full citation with subsequent history]
2. *[Case]*, [Full citation]
```

### Issue Spotting Checklist

```markdown
# ISSUE SPOTTING ANALYSIS

**Matter:** [Client/Matter Name]
**Prepared By:** [Name]
**Date:** [Date]
**Review Type:** [Initial Assessment/Pre-Litigation/Transaction Review]

---

## FACT PATTERN SUMMARY

[Brief summary of the relevant facts]

---

## IDENTIFIED ISSUES

### TIER 1: PRIMARY ISSUES (Must Address)

| # | Issue | Area of Law | Strength | Priority |
|---|-------|-------------|----------|----------|
| 1 | [Issue description] | [Contract/Tort/etc.] | [Strong/Moderate/Weak] | [High] |
| 2 | [Issue description] | [Area] | [Assessment] | [High] |
| 3 | [Issue description] | [Area] | [Assessment] | [High] |

**Issue 1: [Name]**
- **Legal Question:** [Framed as question]
- **Relevant Facts:** [Key facts]
- **Applicable Law:** [Statute/common law]
- **Initial Assessment:** [Preliminary analysis]
- **Research Needed:** [What to research]

**Issue 2: [Name]**
[Same structure]

---

### TIER 2: SECONDARY ISSUES (Should Address)

| # | Issue | Area of Law | Strength | Priority |
|---|-------|-------------|----------|----------|
| 4 | [Issue] | [Area] | [Assessment] | [Medium] |
| 5 | [Issue] | [Area] | [Assessment] | [Medium] |

---

### TIER 3: POTENTIAL ISSUES (May Arise)

| # | Issue | Area of Law | Trigger |
|---|-------|-------------|---------|
| 6 | [Issue] | [Area] | [What would make this relevant] |
| 7 | [Issue] | [Area] | [Trigger] |

---

## ISSUE-BY-AREA ANALYSIS

### Contract Issues
☐ Formation (offer, acceptance, consideration)
☐ Statute of Frauds
☐ Parol Evidence
☐ Interpretation/Ambiguity
☐ Conditions (precedent, concurrent, subsequent)
☐ Breach (material, minor, anticipatory)
☐ Defenses (mistake, fraud, duress, unconscionability)
☐ Remedies (damages, specific performance, rescission)
☐ Third-party rights (assignment, delegation, beneficiaries)

**Findings:** [Summary of contract issues identified]

### Tort Issues
☐ Negligence (duty, breach, causation, damages)
☐ Intentional torts (battery, assault, false imprisonment, IIED)
☐ Strict liability
☐ Products liability
☐ Defamation
☐ Privacy torts
☐ Economic torts (interference, fraud, conversion)
☐ Vicarious liability
☐ Immunities and defenses

**Findings:** [Summary of tort issues]

### Property Issues
☐ Real property (title, easements, covenants)
☐ Personal property
☐ Landlord-tenant
☐ Intellectual property (trademark, copyright, patent, trade secret)

**Findings:** [Summary]

### Business/Corporate Issues
☐ Entity formation and governance
☐ Fiduciary duties
☐ Piercing the corporate veil
☐ Securities issues
☐ Antitrust

**Findings:** [Summary]

### Employment Issues
☐ Discrimination claims
☐ Wrongful termination
☐ Wage and hour
☐ Non-compete/non-solicitation
☐ ERISA

**Findings:** [Summary]

### Regulatory/Compliance Issues
☐ Industry-specific regulations
☐ Licensing requirements
☐ Environmental
☐ Privacy/data protection
☐ Government contracts

**Findings:** [Summary]

### Procedural Issues
☐ Jurisdiction (personal, subject matter)
☐ Venue
☐ Standing
☐ Statute of limitations
☐ Res judicata/collateral estoppel
☐ Joinder

**Findings:** [Summary]

---

## INFORMATION GAPS

| Missing Information | Why Needed | How to Obtain |
|---------------------|------------|---------------|
| [Information] | [Affects which issue] | [Source] |
| [Information] | [Affects which issue] | [Source] |

---

## RESEARCH PLAN

| Issue | Research Tasks | Deadline | Assigned To |
|-------|----------------|----------|-------------|
| [Issue 1] | [Specific research] | [Date] | [Name] |
| [Issue 2] | [Specific research] | [Date] | [Name] |

---

## PRELIMINARY CONCLUSIONS

**Strongest Claims/Defenses:**
1. [Claim/Defense]: [Why strong]
2. [Claim/Defense]: [Why strong]

**Weakest Points:**
1. [Issue]: [Why weak]
2. [Issue]: [Why weak]

**Overall Assessment:**
[Summary assessment of the matter's strength]

---

## NEXT STEPS

1. [ ] [Action item]
2. [ ] [Action item]
3. [ ] [Action item]

**Deadline for Full Memo:** [Date]
```

## API Parameters

```python
model = "claude-sonnet-4-20250514"
max_tokens = 16384
temperature = 0.2
```

## Usage

```
/legal-research

# Specific document types:
/legal-research --type memo --issue "breach of fiduciary duty"
/legal-research --type brief --case "Smith v. Jones, 123 F.3d 456"
/legal-research --type statutory --statute "15 U.S.C. § 1"
/legal-research --type issue-spot --matter "new client assessment"
```

## Research Best Practices

1. **Start with jurisdiction** - Identify controlling law first
2. **Primary sources first** - Constitution, statutes, regulations, cases
3. **Check currency** - Ensure authority is still good law
4. **Address counterarguments** - Anticipate opposing positions
5. **Be objective** - Present balanced analysis, not advocacy
6. **Cite everything** - Support every legal proposition
7. **Know when to stop** - Diminishing returns on deep research

## Disclaimer

These templates are for educational and organizational purposes. All legal research should be verified through official legal research databases and reviewed by a licensed attorney.
