# Legal Industry Skill Pack

A comprehensive collection of AI-powered skills for legal professionals. Create contracts, correspondence, research memos, client intake forms, and document summaries.

## Included Skills

| Skill | Description | Use Case |
|-------|-------------|----------|
| `contract-drafting.md` | Contract templates, review checklists, plain language summaries | Agreements, NDAs, amendments |
| `legal-correspondence.md` | Professional legal letters and communications | Demand letters, engagement letters, court filings |
| `client-intake.md` | Client intake forms and conflict checks | New matter opening, screening |
| `document-summary.md` | Summarize legal documents for efficient review | Contract review, deposition digests |
| `legal-research.md` | Research memos, case briefs, statutory analysis | Legal memoranda, case preparation |

## Quick Start

### Installation

Copy skills to your Claude commands directory:

```bash
cp *.md ~/.claude/commands/
```

### Usage

```bash
/contract-drafting
/legal-correspondence
/client-intake
/document-summary
/legal-research
```

## Skill Details

### Contract Drafting

Generate, review, and summarize contracts and agreements.

**Templates Include:**
- Standard contract framework (9 articles)
- NDA (mutual and one-way)
- Service agreements
- Employment agreements
- Amendment templates
- Contract review checklists

**Features:**
- Boilerplate clause library
- Risk assessment frameworks
- Plain language client summaries
- Negotiation tracking

---

### Legal Correspondence

Create professional legal letters for any situation.

**Templates Include:**
- Engagement letters (new client)
- Demand letters (general and specific)
- Cease and desist letters
- Response to demand letters
- Settlement offer letters
- Court filing cover letters
- Opinion letters to clients

**Features:**
- Multiple delivery method formatting
- Reservation of rights language
- FRE 408 settlement protection
- Confidentiality notices

---

### Client Intake

Comprehensive intake system for new clients and matters.

**Templates Include:**
- General client intake questionnaire
- Family law addendum
- Personal injury addendum
- Conflict check form
- New matter opening checklist

**Features:**
- Contact and employment information
- Matter-specific questions
- Insurance information capture
- Document checklist
- Acknowledgment sections

---

### Document Summary

Create clear, structured summaries of complex legal documents.

**Templates Include:**
- Contract summary (full analysis)
- Deposition summary (digest format)
- Pleading summary
- Case opinion summary
- Executive summary (one-page)
- Document comparison summary

**Features:**
- Risk assessment matrices
- Key term extraction
- Quote and citation tracking
- Action item generation

---

### Legal Research

Thorough research memos and analysis documents.

**Templates Include:**
- Predictive legal memorandum
- Case brief
- Statutory analysis
- Issue spotting checklist

**Features:**
- IRAC/CREAC structure
- Bluebook citation format
- Legislative history analysis
- Application sections

## Document Types by Practice Area

### Corporate/Business
- Shareholder agreements
- Operating agreements
- Stock purchase agreements
- Asset purchase agreements
- Commercial leases

### Litigation
- Demand letters
- Settlement correspondence
- Pleading summaries
- Deposition digests
- Case briefs

### Employment
- Employment agreements
- Non-compete agreements
- Severance agreements
- Offer letters

### Intellectual Property
- NDA/Confidentiality agreements
- License agreements
- Cease and desist letters
- IP assignment agreements

### Real Estate
- Purchase agreements
- Lease agreements
- Easement agreements

## Compliance Considerations

### Ethical Rules
All templates consider:
- Attorney-client privilege
- Conflict of interest rules
- Competence requirements
- Communication obligations
- Fee disclosure requirements

### Jurisdictional Notes
- Templates are jurisdiction-neutral
- Customize for state-specific requirements
- Verify local court rules for filings
- Check state bar fee agreement rules

## Customization

Each skill supports customization:

```bash
# Contract drafting
/contract-drafting --type nda --parties mutual

# Legal correspondence
/legal-correspondence --type demand --claim "breach of contract"

# Client intake
/client-intake --type personal-injury

# Document summary
/document-summary --type deposition --witness "John Smith"

# Legal research
/legal-research --type memo --issue "statute of limitations"
```

## Integration Suggestions

| Skill | Integrates With |
|-------|-----------------|
| Contract Drafting | Document management, e-signature platforms |
| Legal Correspondence | Practice management, email systems |
| Client Intake | CRM, practice management, conflict databases |
| Document Summary | Document review platforms, case management |
| Legal Research | Legal research databases, brief banks |

## Important Disclaimers

1. **Not Legal Advice**: These tools assist documentation but do not constitute legal advice
2. **Attorney Review Required**: All AI-generated content must be reviewed by a licensed attorney
3. **Jurisdiction Specific**: Templates must be adapted for specific jurisdictional requirements
4. **Client Specific**: All documents require customization for specific client matters
5. **Currency**: Verify all legal citations and authorities are current
6. **Ethical Compliance**: Ensure use complies with your jurisdiction's Rules of Professional Conduct

## Citation Standards

All research documents follow Bluebook citation format:
- Cases: *Party v. Party*, Volume Reporter Page (Court Year)
- Statutes: Title U.S.C. § Section (Year)
- Regulations: Title C.F.R. § Section (Year)

## Support

- Issues: Create a GitHub issue
- Updates: Check for new versions quarterly
- Requests: Submit feature requests for additional practice areas

## License

MIT - Free for personal and commercial use.

---

*Part of the Murphbeck AI Skills Library*
