# Healthcare Industry Skill Pack

A comprehensive collection of AI-powered skills for healthcare professionals. Create patient communications, clinical documentation, educational materials, and practice management documents.

## Included Skills

| Skill | Description | Use Case |
|-------|-------------|----------|
| `patient-communication.md` | HIPAA-mindful patient communications | Appointments, follow-ups, reminders |
| `clinical-documentation.md` | Structured clinical notes and templates | SOAP notes, procedures, referrals |
| `patient-education.md` | Patient-friendly health education | Conditions, medications, procedures |
| `practice-management.md` | Policies, staff comms, operations | HR policies, training, QI |

## Quick Start

### Installation

Copy skills to your Claude commands directory:

```bash
cp *.md ~/.claude/commands/
```

### Usage

```bash
/patient-communication
/clinical-documentation
/patient-education
/practice-management
```

## Skill Details

### Patient Communication

Generate clear, empathetic, HIPAA-mindful communications.

**Templates Include:**
- Appointment confirmations & reminders
- Post-visit follow-ups
- Test result notifications
- Prescription alerts
- Preventive care reminders
- Chronic care check-ins
- New patient welcome

**Channels:**
- Email (secure and standard)
- SMS text messages
- Patient portal messages
- Phone scripts

---

### Clinical Documentation

Create structured, compliant clinical documentation.

**Templates Include:**
- SOAP notes (full and focused)
- Chronic care visit notes
- Procedure notes
- Discharge summaries
- Referral letters
- MDM documentation

**Features:**
- ICD-10 code placeholders
- MDM level tracking
- E/M coding support
- Specialty-specific formats

---

### Patient Education

Create clear, accessible health information materials.

**Templates Include:**
- Condition overviews (Teach-Back format)
- Medication guides
- Procedure preparation guides
- Self-management action plans
- Discharge instructions

**Health Literacy:**
- 6th-8th grade reading level
- Plain language guidelines
- Visual formatting
- Actionable checklists

---

### Practice Management

Develop operational and HR documents.

**Templates Include:**
- Policy documents (standard format)
- Staff announcements
- Meeting agendas
- Training modules
- Incident reports
- Patient satisfaction surveys

**Policy Examples:**
- No-show policy
- Social media policy
- HIPAA procedures
- Safety protocols

## Compliance Considerations

### HIPAA

All patient communication templates follow HIPAA guidelines:
- No PHI in unsecured channels
- Minimum necessary principle
- Secure portal recommendations
- Consent reminders

### Clinical Documentation

Documentation templates support:
- Accurate coding
- Medical-legal requirements
- Payer documentation needs
- Regulatory compliance

## Customization

Each skill supports customization:

```bash
# Patient communication
/patient-communication --type appointment_reminder --channel sms

# Clinical documentation
/clinical-documentation --type soap --visit routine

# Patient education
/patient-education --type condition --name "Hypertension"

# Practice management
/practice-management --type policy --topic "cancellation"
```

## Integration Suggestions

| Skill | Integrates With |
|-------|-----------------|
| Patient Communication | EHR systems, patient portals, SMS platforms |
| Clinical Documentation | Epic, Cerner, Athena, other EHRs |
| Patient Education | Patient portals, print materials |
| Practice Management | HR systems, policy management |

## Important Notes

1. **Review Required**: All AI-generated content should be reviewed by qualified healthcare professionals before use
2. **Customization Needed**: Templates require customization for specific practice needs
3. **Not Medical Advice**: These tools assist documentation but do not provide medical advice
4. **Compliance**: Verify all content meets your organization's policies and applicable regulations
5. **Local Requirements**: Adapt for state-specific regulations and payer requirements

## Reading Level Guidelines

| Audience | Target Level |
|----------|--------------|
| General Patients | 6th-8th grade |
| Patient Education | 6th-8th grade |
| Clinical Staff | Professional |
| Administrative | Business |

## Support

- Issues: Create a GitHub issue
- Updates: Check for new versions quarterly
- Requests: Submit feature requests

## License

MIT - Free for personal and commercial use.

---

*Part of the Murphbeck AI Skills Library*
