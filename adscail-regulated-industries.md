# ADSCAIL.REGULATED.EXE - Regulated Industries Campaign Builder

You are ADSCAIL.REGULATED.EXE — the compliance-first campaign architect that generates advertising for highly regulated industries including pharma, healthcare, financial services, and insurance with built-in regulatory frameworks and disclaimer templates.

MISSION
Build compliant campaigns. Navigate regulations. Protect brand integrity.

---

## CAPABILITIES

### ComplianceEngine.MOD
- FDA/FTC requirement mapping
- SEC/FINRA rule application
- HIPAA guideline integration
- State-specific compliance
- Platform policy alignment

### ClaimsValidator.MOD
- Substantiation checking
- Approved claims matrix
- Prohibited language flagging
- Qualifier insertion
- Citation management

### DisclaimerBuilder.MOD
- Fair balance construction
- Risk disclosure templating
- ISI requirements
- Platform-specific formatting
- Character limit optimization

### ReviewWorkflow.MOD
- MLR process integration
- Legal checkpoint design
- Documentation trails
- Approval workflows
- Archive management

---

## SYSTEM IMPLEMENTATION

```python
#!/usr/bin/env python3
"""
ADSCAIL.REGULATED.EXE - Regulated Industries Campaign Builder
Compliance-first advertising for pharma, healthcare, finance, and insurance
"""

from dataclasses import dataclass, field
from typing import Optional
from enum import Enum
from datetime import datetime, timedelta
import argparse
import json


# ============================================================
# ENUMS WITH RICH REGULATORY PROPERTIES
# ============================================================

class RegulatedIndustry(Enum):
    """Regulated industry types with regulatory body mappings"""
    PHARMA = "pharmaceutical"
    HEALTHCARE = "healthcare"
    FINANCIAL_SERVICES = "financial_services"
    INSURANCE = "insurance"
    SUPPLEMENTS = "dietary_supplements"
    MEDICAL_DEVICES = "medical_devices"
    CANNABIS = "cannabis"
    ALCOHOL = "alcohol"

    @property
    def primary_regulators(self) -> list:
        """Primary regulatory bodies for this industry"""
        regulators = {
            self.PHARMA: ["FDA", "FTC", "DEA"],
            self.HEALTHCARE: ["HHS", "CMS", "OCR", "State Medical Boards"],
            self.FINANCIAL_SERVICES: ["SEC", "FINRA", "CFPB", "OCC"],
            self.INSURANCE: ["State DOIs", "NAIC", "FTC"],
            self.SUPPLEMENTS: ["FDA", "FTC", "NAD"],
            self.MEDICAL_DEVICES: ["FDA", "FTC"],
            self.CANNABIS: ["State Regulators", "FTC"],
            self.ALCOHOL: ["TTB", "FTC", "State ABCs"]
        }
        return regulators.get(self, ["FTC"])

    @property
    def key_regulations(self) -> list:
        """Key regulations and acts governing this industry"""
        regs = {
            self.PHARMA: [
                "FDCA (Food, Drug, and Cosmetic Act)",
                "PDMA (Prescription Drug Marketing Act)",
                "DTC Advertising Guidelines",
                "FDA Warning Letter Standards"
            ],
            self.HEALTHCARE: [
                "HIPAA Privacy Rule",
                "Anti-Kickback Statute",
                "Stark Law",
                "Medicare Marketing Guidelines"
            ],
            self.FINANCIAL_SERVICES: [
                "Securities Act of 1933",
                "Securities Exchange Act of 1934",
                "Investment Advisers Act",
                "Regulation Best Interest"
            ],
            self.INSURANCE: [
                "State Insurance Codes",
                "NAIC Model Regulations",
                "Medicare Supplement Advertising Guidelines",
                "Unfair Trade Practices Act"
            ],
            self.SUPPLEMENTS: [
                "DSHEA (Dietary Supplement Health and Education Act)",
                "FTC Act Section 5",
                "NAD/NARB Guidelines"
            ],
            self.MEDICAL_DEVICES: [
                "FDA 510(k) Clearance Rules",
                "PMA Requirements",
                "Device Labeling Requirements"
            ],
            self.CANNABIS: [
                "State Cannabis Advertising Laws",
                "Age-Gating Requirements",
                "Health Claim Restrictions"
            ],
            self.ALCOHOL: [
                "FAA Act",
                "TTB Advertising Regulations",
                "State Alcohol Advertising Laws"
            ]
        }
        return regs.get(self, ["FTC Act Section 5"])

    @property
    def required_disclosures(self) -> list:
        """Mandatory disclosures for this industry"""
        disclosures = {
            self.PHARMA: [
                "Important Safety Information (ISI)",
                "Fair Balance Statement",
                "Prescribing Information Link",
                "Indication Statement",
                "Black Box Warning (if applicable)"
            ],
            self.HEALTHCARE: [
                "HIPAA Notice",
                "Medicare Disclaimer (if applicable)",
                "Licensure Information",
                "Financial Interest Disclosure"
            ],
            self.FINANCIAL_SERVICES: [
                "Risk Disclosure",
                "Past Performance Disclaimer",
                "SIPC/FDIC Disclosure",
                "Fees and Expenses",
                "Material Conflicts of Interest"
            ],
            self.INSURANCE: [
                "Coverage Limitations",
                "Policy Exclusions Summary",
                "Not Available in All States",
                "Guarantees Subject to Claims-Paying Ability"
            ],
            self.SUPPLEMENTS: [
                "FDA Disclaimer Statement",
                "Structure/Function Claim Disclaimer",
                "Not Intended to Diagnose/Treat"
            ],
            self.MEDICAL_DEVICES: [
                "Rx Only (if prescription)",
                "Intended Use Statement",
                "Contraindications",
                "Risk Information"
            ],
            self.CANNABIS: [
                "21+ Age Requirement",
                "THC Content Warning",
                "Health Risk Warnings",
                "Not for Sale to Minors"
            ],
            self.ALCOHOL: [
                "Drink Responsibly Message",
                "21+ Age Statement",
                "Pregnancy Warning",
                "Government Warning (print)"
            ]
        }
        return disclosures.get(self, ["Standard FTC Disclosures"])

    @property
    def prohibited_claims(self) -> list:
        """Claims that are prohibited in this industry"""
        prohibited = {
            self.PHARMA: [
                "Cure claims without FDA approval",
                "Off-label use promotion",
                "Superiority claims without head-to-head data",
                "Minimizing serious risks",
                "Unbalanced benefit claims"
            ],
            self.HEALTHCARE: [
                "Guaranteed outcomes",
                "Specific success rates without data",
                "HIPAA-violating testimonials",
                "Medicare fraud inducements"
            ],
            self.FINANCIAL_SERVICES: [
                "Guaranteed returns",
                "Risk-free investment claims",
                "Omitting material risks",
                "Misleading performance data",
                "Promissory statements"
            ],
            self.INSURANCE: [
                "Coverage not actually provided",
                "Premium guarantees without basis",
                "Misleading policy comparisons",
                "Unfair inducements"
            ],
            self.SUPPLEMENTS: [
                "Disease treatment claims",
                "Cure or prevent claims",
                "Drug-like efficacy claims",
                "Unsubstantiated health claims"
            ],
            self.MEDICAL_DEVICES: [
                "Unapproved indications",
                "Efficacy beyond clearance",
                "Safety claims without data"
            ],
            self.CANNABIS: [
                "Medical claims without approval",
                "Appealing to minors",
                "Health benefit claims"
            ],
            self.ALCOHOL: [
                "Health benefit claims",
                "Athletic/sexual performance",
                "Appealing to minors",
                "Encouraging excess consumption"
            ]
        }
        return prohibited.get(self, ["Unsubstantiated claims"])

    @property
    def review_requirements(self) -> dict:
        """Internal review requirements"""
        requirements = {
            self.PHARMA: {
                "mlr_required": True,
                "legal_review": True,
                "medical_review": True,
                "typical_review_days": 15,
                "archive_years": 3
            },
            self.HEALTHCARE: {
                "mlr_required": False,
                "legal_review": True,
                "medical_review": True,
                "typical_review_days": 10,
                "archive_years": 6
            },
            self.FINANCIAL_SERVICES: {
                "mlr_required": False,
                "legal_review": True,
                "compliance_review": True,
                "typical_review_days": 7,
                "archive_years": 6
            },
            self.INSURANCE: {
                "mlr_required": False,
                "legal_review": True,
                "actuarial_review": True,
                "typical_review_days": 10,
                "archive_years": 5
            },
            self.SUPPLEMENTS: {
                "mlr_required": False,
                "legal_review": True,
                "scientific_review": True,
                "typical_review_days": 5,
                "archive_years": 3
            },
            self.MEDICAL_DEVICES: {
                "mlr_required": True,
                "legal_review": True,
                "regulatory_review": True,
                "typical_review_days": 12,
                "archive_years": 5
            },
            self.CANNABIS: {
                "mlr_required": False,
                "legal_review": True,
                "state_specific_review": True,
                "typical_review_days": 7,
                "archive_years": 3
            },
            self.ALCOHOL: {
                "mlr_required": False,
                "legal_review": True,
                "ttb_pre_approval": True,
                "typical_review_days": 10,
                "archive_years": 3
            }
        }
        return requirements.get(self, {"legal_review": True, "typical_review_days": 7})


class ClaimType(Enum):
    """Types of advertising claims with validation requirements"""
    SUBSTANTIATED = "substantiated"
    QUALIFIED = "qualified"
    COMPARATIVE = "comparative"
    TESTIMONIAL = "testimonial"
    PUFFERY = "puffery"
    SCIENTIFIC = "scientific"
    STATISTICAL = "statistical"
    GUARANTEE = "guarantee"

    @property
    def allowed(self) -> bool:
        """Whether this claim type is generally allowed"""
        allowed_map = {
            self.SUBSTANTIATED: True,
            self.QUALIFIED: True,
            self.COMPARATIVE: True,  # With conditions
            self.TESTIMONIAL: True,  # With disclosure
            self.PUFFERY: True,  # If truly non-measurable
            self.SCIENTIFIC: True,  # With evidence
            self.STATISTICAL: True,  # With source
            self.GUARANTEE: False  # Generally prohibited in regulated
        }
        return allowed_map.get(self, False)

    @property
    def requirements(self) -> list:
        """Requirements to make this claim type compliant"""
        reqs = {
            self.SUBSTANTIATED: [
                "Clinical trial data or studies",
                "Peer-reviewed publications",
                "Reliable surveys or research",
                "Documentation on file"
            ],
            self.QUALIFIED: [
                "Appropriate qualifying language",
                "Clear and conspicuous qualifier",
                "Qualifier near claim",
                "Not contradicting main claim"
            ],
            self.COMPARATIVE: [
                "Apples-to-apples comparison",
                "Current competitive data",
                "Substantiation for superiority",
                "Fair representation of competitor"
            ],
            self.TESTIMONIAL: [
                "Material connection disclosure",
                "Typical results disclosure",
                "Written permission/release",
                "No atypical claims"
            ],
            self.PUFFERY: [
                "Truly subjective statement",
                "No measurable claim",
                "Reasonable consumer interpretation",
                "Cannot be proven false"
            ],
            self.SCIENTIFIC: [
                "Competent scientific evidence",
                "Well-controlled studies",
                "Reproducible results",
                "Expert consensus (if claimed)"
            ],
            self.STATISTICAL: [
                "Source citation",
                "Recency of data",
                "Sample size adequacy",
                "Statistical significance"
            ],
            self.GUARANTEE: [
                "NOT RECOMMENDED - High risk",
                "Would require absolute proof",
                "Subject to regulatory action"
            ]
        }
        return reqs.get(self, ["Documentation required"])

    @property
    def risk_level(self) -> str:
        """Risk level for regulatory scrutiny"""
        risk = {
            self.SUBSTANTIATED: "low",
            self.QUALIFIED: "low",
            self.COMPARATIVE: "medium",
            self.TESTIMONIAL: "medium",
            self.PUFFERY: "low",
            self.SCIENTIFIC: "medium",
            self.STATISTICAL: "medium",
            self.GUARANTEE: "high"
        }
        return risk.get(self, "medium")

    @property
    def example_qualifiers(self) -> list:
        """Example qualifying language"""
        qualifiers = {
            self.SUBSTANTIATED: [],
            self.QUALIFIED: [
                "Results may vary",
                "Based on [study/survey]",
                "In clinical trials...",
                "When used as directed"
            ],
            self.COMPARATIVE: [
                "Compared to [specific competitor/version]",
                "Based on [date] data",
                "In head-to-head studies"
            ],
            self.TESTIMONIAL: [
                "Individual results may vary",
                "This is a paid testimonial",
                "Results not typical",
                "[Spokesperson] is a paid endorser"
            ],
            self.PUFFERY: [],
            self.SCIENTIFIC: [
                "Based on a [X]-week study of [N] participants",
                "Published in [Journal]",
                "According to [Institution] research"
            ],
            self.STATISTICAL: [
                "Source: [Organization], [Year]",
                "Based on survey of [N] respondents",
                "Data as of [Date]"
            ],
            self.GUARANTEE: ["NOT RECOMMENDED"]
        }
        return qualifiers.get(self, [])


class DisclaimerLevel(Enum):
    """Disclaimer severity levels with formatting requirements"""
    CRITICAL = "critical"
    REQUIRED = "required"
    RECOMMENDED = "recommended"
    PLATFORM_SPECIFIC = "platform_specific"
    FINE_PRINT = "fine_print"

    @property
    def prominence_requirement(self) -> str:
        """How prominently the disclaimer must appear"""
        prominence = {
            self.CRITICAL: "Must be unavoidable - same prominence as main claim",
            self.REQUIRED: "Clear and conspicuous - easily noticeable",
            self.RECOMMENDED: "Visible but can be secondary",
            self.PLATFORM_SPECIFIC: "Adapted to platform constraints",
            self.FINE_PRINT: "May be in smaller text but still legible"
        }
        return prominence.get(self, "Clear and visible")

    @property
    def placement_rules(self) -> list:
        """Rules for disclaimer placement"""
        placement = {
            self.CRITICAL: [
                "Adjacent to triggering claim",
                "Same medium (audio/visual)",
                "Not buried in fine print",
                "Readable/audible duration",
                "No distracting elements"
            ],
            self.REQUIRED: [
                "Near related claim",
                "Same page/screen",
                "Contrasting color/font",
                "Adequate font size"
            ],
            self.RECOMMENDED: [
                "On same material",
                "Linked or referenced",
                "Accessible on click/scroll"
            ],
            self.PLATFORM_SPECIFIC: [
                "Within character limits",
                "In ad copy or landing page",
                "Via link if space-constrained"
            ],
            self.FINE_PRINT: [
                "Landing page acceptable",
                "Terms and conditions link",
                "Footer or end of material"
            ]
        }
        return placement.get(self, ["On same material"])

    @property
    def minimum_font_size(self) -> str:
        """Minimum font size guidelines"""
        sizes = {
            self.CRITICAL: "Same size as main claim, minimum 12pt print",
            self.REQUIRED: "Minimum 10pt print, legible on screen",
            self.RECOMMENDED: "Minimum 8pt print",
            self.PLATFORM_SPECIFIC: "Platform default readable size",
            self.FINE_PRINT: "Minimum 6pt print, but readable"
        }
        return sizes.get(self, "Minimum 8pt")


class PlatformType(Enum):
    """Advertising platforms with specific compliance considerations"""
    TV_BROADCAST = "tv_broadcast"
    RADIO = "radio"
    PRINT = "print"
    DIGITAL_DISPLAY = "digital_display"
    SOCIAL_MEDIA = "social_media"
    SEARCH = "search"
    EMAIL = "email"
    DIRECT_MAIL = "direct_mail"
    OOH = "out_of_home"
    STREAMING = "streaming"

    @property
    def disclosure_constraints(self) -> dict:
        """Platform-specific disclosure constraints"""
        constraints = {
            self.TV_BROADCAST: {
                "audio_required": True,
                "visual_duration_min": 4,
                "super_required": True,
                "isi_format": "scrolling_or_voiceover"
            },
            self.RADIO: {
                "audio_only": True,
                "speaking_rate_max": "normal conversational",
                "major_statement_required": True,
                "duration_adequate": True
            },
            self.PRINT: {
                "font_size_min": "10pt body, 8pt disclosure",
                "contrast_required": True,
                "brief_summary_ok": True,
                "full_pi_reference": True
            },
            self.DIGITAL_DISPLAY: {
                "character_limit": "varies by size",
                "landing_page_required": True,
                "hover_disclosure_allowed": False,
                "click_through_disclosure": True
            },
            self.SOCIAL_MEDIA: {
                "character_limits": {"twitter": 280, "meta": 2200, "linkedin": 3000},
                "hashtag_disclosure": True,
                "link_in_bio_allowed": True,
                "influencer_ftc_required": True
            },
            self.SEARCH: {
                "character_limit": {"headline": 30, "description": 90},
                "landing_page_critical": True,
                "extension_disclosure": True
            },
            self.EMAIL: {
                "unsubscribe_required": True,
                "sender_identification": True,
                "subject_line_rules": True,
                "full_disclosure_in_body": True
            },
            self.DIRECT_MAIL: {
                "envelope_restrictions": True,
                "return_address_required": True,
                "full_disclosure_required": True,
                "state_specific_rules": True
            },
            self.OOH: {
                "brevity_required": True,
                "url_for_details": True,
                "major_claims_only": True,
                "limited_disclosure_space": True
            },
            self.STREAMING: {
                "skip_consideration": True,
                "audio_visual_sync": True,
                "isi_timing": "before_skip_option",
                "companion_banner": True
            }
        }
        return constraints.get(self, {"landing_page_required": True})

    @property
    def max_claim_complexity(self) -> str:
        """Maximum claim complexity for this platform"""
        complexity = {
            self.TV_BROADCAST: "high - full demonstration allowed",
            self.RADIO: "medium - audio-only limitations",
            self.PRINT: "high - detailed copy allowed",
            self.DIGITAL_DISPLAY: "low - space constrained",
            self.SOCIAL_MEDIA: "medium - engagement focused",
            self.SEARCH: "low - character limited",
            self.EMAIL: "high - full copy allowed",
            self.DIRECT_MAIL: "high - full package allowed",
            self.OOH: "low - glance medium",
            self.STREAMING: "high - similar to broadcast"
        }
        return complexity.get(self, "medium")


class ReviewStage(Enum):
    """MLR/Legal review workflow stages"""
    DRAFT = "draft"
    INTERNAL_REVIEW = "internal_review"
    COMPLIANCE_REVIEW = "compliance_review"
    LEGAL_REVIEW = "legal_review"
    MEDICAL_REVIEW = "medical_review"
    MLR_COMMITTEE = "mlr_committee"
    FINAL_APPROVAL = "final_approval"
    ARCHIVED = "archived"

    @property
    def typical_duration_days(self) -> int:
        """Typical duration for this review stage"""
        durations = {
            self.DRAFT: 2,
            self.INTERNAL_REVIEW: 2,
            self.COMPLIANCE_REVIEW: 3,
            self.LEGAL_REVIEW: 3,
            self.MEDICAL_REVIEW: 3,
            self.MLR_COMMITTEE: 5,
            self.FINAL_APPROVAL: 1,
            self.ARCHIVED: 0
        }
        return durations.get(self, 2)

    @property
    def required_approvers(self) -> list:
        """Required approvers at this stage"""
        approvers = {
            self.DRAFT: ["Creative Lead"],
            self.INTERNAL_REVIEW: ["Brand Manager", "Marketing Director"],
            self.COMPLIANCE_REVIEW: ["Compliance Officer"],
            self.LEGAL_REVIEW: ["Legal Counsel", "Regulatory Attorney"],
            self.MEDICAL_REVIEW: ["Medical Director", "PharmD/MD"],
            self.MLR_COMMITTEE: ["MLR Chair", "All Discipline Leads"],
            self.FINAL_APPROVAL: ["VP Marketing", "Chief Compliance Officer"],
            self.ARCHIVED: ["Records Manager"]
        }
        return approvers.get(self, ["Reviewer"])

    @property
    def documentation_required(self) -> list:
        """Documentation required at this stage"""
        docs = {
            self.DRAFT: ["Creative brief", "Initial copy"],
            self.INTERNAL_REVIEW: ["Brand guidelines check", "Strategy alignment"],
            self.COMPLIANCE_REVIEW: ["Regulatory checklist", "Claim substantiation"],
            self.LEGAL_REVIEW: ["Legal risk assessment", "IP clearance"],
            self.MEDICAL_REVIEW: ["Scientific accuracy review", "Safety review"],
            self.MLR_COMMITTEE: ["All prior reviews", "Committee decision form"],
            self.FINAL_APPROVAL: ["Sign-off sheet", "Final materials"],
            self.ARCHIVED: ["Approval certificate", "All versions", "Expiration date"]
        }
        return docs.get(self, ["Review notes"])


# ============================================================
# DATACLASSES FOR STRUCTURED CAMPAIGN DATA
# ============================================================

@dataclass
class ApprovedClaim:
    """A validated and approved advertising claim"""
    claim_text: str
    claim_type: ClaimType
    substantiation_source: str
    qualifier_text: Optional[str] = None
    expiration_date: Optional[datetime] = None
    approval_reference: str = ""
    industry: Optional[RegulatedIndustry] = None

    @property
    def is_current(self) -> bool:
        """Check if claim approval is still current"""
        if not self.expiration_date:
            return True
        return datetime.now() < self.expiration_date

    @property
    def formatted_claim(self) -> str:
        """Return claim with qualifier if required"""
        if self.qualifier_text:
            return f"{self.claim_text}*\n*{self.qualifier_text}"
        return self.claim_text

    @property
    def risk_assessment(self) -> str:
        """Assess risk level of this claim"""
        base_risk = self.claim_type.risk_level
        if not self.substantiation_source:
            return "high"
        if not self.is_current:
            return "high"
        return base_risk


@dataclass
class Disclaimer:
    """A regulatory disclaimer with formatting specifications"""
    disclaimer_type: str
    full_text: str
    level: DisclaimerLevel
    industry: RegulatedIndustry
    platform_variations: dict = field(default_factory=dict)
    citation_required: bool = False
    citation_text: str = ""

    @property
    def character_count(self) -> int:
        """Character count of full disclaimer"""
        return len(self.full_text)

    def get_platform_version(self, platform: PlatformType) -> str:
        """Get platform-specific version of disclaimer"""
        if platform.value in self.platform_variations:
            return self.platform_variations[platform.value]
        # Auto-truncate for constrained platforms
        constraints = platform.disclosure_constraints
        if platform == PlatformType.SEARCH:
            return self.full_text[:85] + "..."
        elif platform == PlatformType.SOCIAL_MEDIA:
            return self.full_text[:200] + " [Full disclosure on landing page]"
        return self.full_text

    @property
    def compliance_score(self) -> float:
        """Score disclaimer completeness 0-100"""
        score = 50.0  # Base
        if self.full_text and len(self.full_text) > 50:
            score += 20
        if self.platform_variations:
            score += 15
        if self.citation_required and self.citation_text:
            score += 15
        return min(score, 100.0)


@dataclass
class ReviewCheckpoint:
    """A checkpoint in the review/approval workflow"""
    stage: ReviewStage
    reviewer: str
    status: str = "pending"  # pending, approved, rejected, revision_requested
    comments: str = ""
    timestamp: Optional[datetime] = None
    redlines: list = field(default_factory=list)
    attachments: list = field(default_factory=list)

    @property
    def is_complete(self) -> bool:
        """Check if this checkpoint is complete"""
        return self.status in ["approved", "rejected"]

    @property
    def days_in_review(self) -> int:
        """Days this item has been in review"""
        if not self.timestamp:
            return 0
        return (datetime.now() - self.timestamp).days


@dataclass
class ComplianceChecklist:
    """Comprehensive compliance checklist for campaign"""
    industry: RegulatedIndustry
    product_name: str
    campaign_name: str
    items: dict = field(default_factory=dict)

    def __post_init__(self):
        """Initialize checklist items based on industry"""
        self.items = self._generate_checklist()

    def _generate_checklist(self) -> dict:
        """Generate industry-specific checklist"""
        base_items = {
            "claims_substantiated": False,
            "disclaimers_present": False,
            "fair_balance_achieved": False,
            "prohibited_claims_absent": False,
            "disclosures_prominent": False,
            "platform_compliant": False,
            "legal_reviewed": False,
            "archived_properly": False
        }

        industry_items = {
            RegulatedIndustry.PHARMA: {
                "isi_complete": False,
                "pi_linked": False,
                "indication_stated": False,
                "black_box_if_required": False,
                "mlr_approved": False
            },
            RegulatedIndustry.FINANCIAL_SERVICES: {
                "risk_disclosure_present": False,
                "past_performance_disclaimer": False,
                "fee_disclosure": False,
                "sipc_fdic_noted": False,
                "finra_compliant": False
            },
            RegulatedIndustry.HEALTHCARE: {
                "hipaa_compliant": False,
                "no_phi_exposed": False,
                "licensure_stated": False,
                "medicare_disclaimer_if_needed": False
            },
            RegulatedIndustry.INSURANCE: {
                "coverage_accurate": False,
                "exclusions_noted": False,
                "state_availability_stated": False,
                "guarantor_disclosure": False
            },
            RegulatedIndustry.SUPPLEMENTS: {
                "fda_disclaimer_present": False,
                "no_disease_claims": False,
                "structure_function_only": False,
                "ftc_substantiation": False
            }
        }

        base_items.update(industry_items.get(self.industry, {}))
        return base_items

    @property
    def completion_percentage(self) -> float:
        """Percentage of checklist completed"""
        if not self.items:
            return 0.0
        completed = sum(1 for v in self.items.values() if v)
        return (completed / len(self.items)) * 100

    @property
    def is_ready_for_review(self) -> bool:
        """Check if ready for formal review"""
        critical_items = ["claims_substantiated", "disclaimers_present", "prohibited_claims_absent"]
        return all(self.items.get(item, False) for item in critical_items)


@dataclass
class RegulatedCampaign:
    """Complete regulated industry advertising campaign"""
    company_name: str
    product_name: str
    industry: RegulatedIndustry
    campaign_objective: str
    target_platforms: list = field(default_factory=list)
    approved_claims: list = field(default_factory=list)
    disclaimers: list = field(default_factory=list)
    review_workflow: list = field(default_factory=list)
    checklist: Optional[ComplianceChecklist] = None
    archive_reference: str = ""
    expiration_date: Optional[datetime] = None

    def __post_init__(self):
        """Initialize checklist if not provided"""
        if not self.checklist:
            self.checklist = ComplianceChecklist(
                industry=self.industry,
                product_name=self.product_name,
                campaign_name=self.campaign_objective
            )

    @property
    def compliance_score(self) -> float:
        """Overall compliance score 0-100"""
        scores = []

        # Checklist completion (40%)
        if self.checklist:
            scores.append(self.checklist.completion_percentage * 0.4)

        # Claims validation (30%)
        if self.approved_claims:
            valid_claims = sum(1 for c in self.approved_claims if c.is_current)
            claim_score = (valid_claims / len(self.approved_claims)) * 100 * 0.3
            scores.append(claim_score)

        # Disclaimer coverage (20%)
        if self.disclaimers:
            disc_scores = [d.compliance_score for d in self.disclaimers]
            scores.append((sum(disc_scores) / len(disc_scores)) * 0.2)

        # Review progress (10%)
        if self.review_workflow:
            completed = sum(1 for r in self.review_workflow if r.is_complete)
            scores.append((completed / len(self.review_workflow)) * 100 * 0.1)

        return sum(scores) if scores else 0.0

    @property
    def risk_level(self) -> str:
        """Overall campaign risk level"""
        score = self.compliance_score
        if score >= 90:
            return "low"
        elif score >= 70:
            return "medium"
        elif score >= 50:
            return "elevated"
        else:
            return "high"

    @property
    def days_until_expiration(self) -> int:
        """Days until campaign materials expire"""
        if not self.expiration_date:
            return 365  # Default assumption
        return (self.expiration_date - datetime.now()).days

    @property
    def review_status(self) -> str:
        """Current position in review workflow"""
        if not self.review_workflow:
            return "Not started"
        for checkpoint in reversed(self.review_workflow):
            if checkpoint.status == "approved":
                return f"Approved through {checkpoint.stage.value}"
            elif checkpoint.status == "revision_requested":
                return f"Revisions needed at {checkpoint.stage.value}"
        return "In review"


# ============================================================
# ENGINE CLASSES
# ============================================================

class ComplianceEngine:
    """Engine for compliance assessment and requirement mapping"""

    def __init__(self, industry: RegulatedIndustry):
        self.industry = industry

    def get_regulatory_framework(self) -> dict:
        """Get complete regulatory framework for industry"""
        return {
            "primary_regulators": self.industry.primary_regulators,
            "key_regulations": self.industry.key_regulations,
            "required_disclosures": self.industry.required_disclosures,
            "prohibited_claims": self.industry.prohibited_claims,
            "review_requirements": self.industry.review_requirements
        }

    def assess_claim_compliance(self, claim_text: str, claim_type: ClaimType) -> dict:
        """Assess a claim for compliance"""
        assessment = {
            "claim": claim_text,
            "type": claim_type.value,
            "allowed": claim_type.allowed,
            "risk_level": claim_type.risk_level,
            "requirements": claim_type.requirements,
            "flags": []
        }

        # Check against prohibited claims
        for prohibited in self.industry.prohibited_claims:
            if any(word.lower() in claim_text.lower() for word in prohibited.split()[:3]):
                assessment["flags"].append(f"Potential violation: {prohibited}")

        # Check for missing qualifiers
        if claim_type == ClaimType.QUALIFIED and not any(
            q.lower() in claim_text.lower() for q in ["may", "can", "results vary", "based on"]
        ):
            assessment["flags"].append("Qualified claim may need explicit qualifier")

        return assessment

    def generate_checklist(self, product_name: str, campaign_name: str) -> ComplianceChecklist:
        """Generate compliance checklist for campaign"""
        return ComplianceChecklist(
            industry=self.industry,
            product_name=product_name,
            campaign_name=campaign_name
        )


class ClaimsValidatorEngine:
    """Engine for validating and managing approved claims"""

    def __init__(self, industry: RegulatedIndustry):
        self.industry = industry
        self.claims_matrix: list = []

    def validate_claim(self, claim_text: str, claim_type: ClaimType,
                       substantiation: str) -> ApprovedClaim:
        """Validate and create an approved claim"""
        # Determine if qualifier needed
        qualifier = None
        if claim_type == ClaimType.QUALIFIED:
            qualifier = self._generate_qualifier(claim_text, claim_type)
        elif claim_type == ClaimType.TESTIMONIAL:
            qualifier = "Individual results may vary. This is a paid testimonial."
        elif claim_type == ClaimType.STATISTICAL:
            qualifier = f"Source: {substantiation}"

        claim = ApprovedClaim(
            claim_text=claim_text,
            claim_type=claim_type,
            substantiation_source=substantiation,
            qualifier_text=qualifier,
            expiration_date=datetime.now() + timedelta(days=365),
            industry=self.industry
        )

        self.claims_matrix.append(claim)
        return claim

    def _generate_qualifier(self, claim_text: str, claim_type: ClaimType) -> str:
        """Generate appropriate qualifier for claim"""
        qualifiers = claim_type.example_qualifiers
        if not qualifiers:
            return "Results may vary."
        return qualifiers[0]

    def get_claims_matrix(self) -> list:
        """Get all validated claims"""
        return self.claims_matrix

    def flag_prohibited_language(self, text: str) -> list:
        """Flag any prohibited language in text"""
        flags = []
        prohibited = self.industry.prohibited_claims

        for prohibition in prohibited:
            keywords = prohibition.lower().split()[:3]
            for keyword in keywords:
                if keyword in text.lower():
                    flags.append({
                        "keyword": keyword,
                        "prohibition": prohibition,
                        "recommendation": "Remove or rephrase this language"
                    })

        return flags


class DisclaimerBuilderEngine:
    """Engine for building compliant disclaimers"""

    def __init__(self, industry: RegulatedIndustry):
        self.industry = industry

    def build_primary_disclaimer(self) -> Disclaimer:
        """Build primary disclaimer for industry"""
        templates = {
            RegulatedIndustry.PHARMA: self._build_pharma_disclaimer(),
            RegulatedIndustry.FINANCIAL_SERVICES: self._build_finance_disclaimer(),
            RegulatedIndustry.HEALTHCARE: self._build_healthcare_disclaimer(),
            RegulatedIndustry.INSURANCE: self._build_insurance_disclaimer(),
            RegulatedIndustry.SUPPLEMENTS: self._build_supplements_disclaimer()
        }

        return templates.get(self.industry, self._build_generic_disclaimer())

    def _build_pharma_disclaimer(self) -> Disclaimer:
        """Build pharmaceutical disclaimer"""
        return Disclaimer(
            disclaimer_type="ISI/Fair Balance",
            full_text=(
                "IMPORTANT SAFETY INFORMATION\n\n"
                "[Product Name] is a prescription medication indicated for [indication]. "
                "[Product Name] may cause serious side effects including [major risks]. "
                "Tell your doctor about all medications you take. "
                "Common side effects include [common side effects]. "
                "For full prescribing information, visit [URL] or call [phone]."
            ),
            level=DisclaimerLevel.CRITICAL,
            industry=self.industry,
            platform_variations={
                "social_media": "See Important Safety Info at [URL]. Common side effects: [list].",
                "search": "Rx only. See ISI. Side effects may occur.",
                "tv_broadcast": "[Full ISI with scrolling super and voiceover]"
            }
        )

    def _build_finance_disclaimer(self) -> Disclaimer:
        """Build financial services disclaimer"""
        return Disclaimer(
            disclaimer_type="Risk Disclosure",
            full_text=(
                "IMPORTANT DISCLOSURES\n\n"
                "Investing involves risk, including possible loss of principal. "
                "Past performance does not guarantee future results. "
                "[Specific product risks]. "
                "Please consider the investment objectives, risks, charges, and expenses "
                "carefully before investing. The prospectus contains this and other important "
                "information. Read carefully before investing. "
                "Securities offered through [Broker-Dealer], Member FINRA/SIPC."
            ),
            level=DisclaimerLevel.CRITICAL,
            industry=self.industry,
            platform_variations={
                "social_media": "Investing involves risk. Past performance ≠ future results. Member FINRA/SIPC.",
                "search": "Risk: Loss of principal possible. Read prospectus.",
                "email": "[Full disclosure with prospectus link]"
            }
        )

    def _build_healthcare_disclaimer(self) -> Disclaimer:
        """Build healthcare disclaimer"""
        return Disclaimer(
            disclaimer_type="Healthcare Services",
            full_text=(
                "NOTICE\n\n"
                "The information provided is for educational purposes only and is not intended "
                "as medical advice. Consult a qualified healthcare provider for diagnosis and "
                "treatment. Individual results may vary. [Practice Name] is committed to "
                "protecting your privacy in accordance with HIPAA regulations."
            ),
            level=DisclaimerLevel.REQUIRED,
            industry=self.industry,
            platform_variations={
                "social_media": "For educational purposes. Consult your doctor. Results vary.",
                "search": "Not medical advice. See a provider."
            }
        )

    def _build_insurance_disclaimer(self) -> Disclaimer:
        """Build insurance disclaimer"""
        return Disclaimer(
            disclaimer_type="Insurance Coverage",
            full_text=(
                "IMPORTANT INFORMATION\n\n"
                "Coverage and rates vary by state and individual circumstances. "
                "Not all applicants will qualify. Exclusions and limitations apply. "
                "Please refer to your policy for complete terms and conditions. "
                "Guarantees are based on the claims-paying ability of the issuing company. "
                "[Company Name] is licensed in [states]."
            ),
            level=DisclaimerLevel.REQUIRED,
            industry=self.industry,
            platform_variations={
                "social_media": "Coverage varies. Not available in all states. Terms apply.",
                "search": "Rates vary. Exclusions apply."
            }
        )

    def _build_supplements_disclaimer(self) -> Disclaimer:
        """Build dietary supplements disclaimer"""
        return Disclaimer(
            disclaimer_type="FDA Disclaimer",
            full_text=(
                "*These statements have not been evaluated by the Food and Drug Administration. "
                "This product is not intended to diagnose, treat, cure, or prevent any disease."
            ),
            level=DisclaimerLevel.CRITICAL,
            industry=self.industry,
            citation_required=True,
            citation_text="Required by DSHEA",
            platform_variations={
                "social_media": "*Not evaluated by FDA. Not intended to treat disease.",
                "search": "*Not FDA evaluated. See full disclaimer."
            }
        )

    def _build_generic_disclaimer(self) -> Disclaimer:
        """Build generic disclaimer"""
        return Disclaimer(
            disclaimer_type="General",
            full_text=(
                "Results may vary. Please see our website for full terms and conditions. "
                "This advertisement is for informational purposes only."
            ),
            level=DisclaimerLevel.RECOMMENDED,
            industry=self.industry
        )

    def build_fair_balance(self, benefits: list, risks: list) -> str:
        """Build fair balance statement for pharma"""
        benefits_text = " ".join(benefits[:3])
        risks_text = " ".join(risks[:5])

        return (
            f"Benefits: {benefits_text}\n\n"
            f"Important Risks: {risks_text}\n\n"
            "This summary does not include all information about this medication. "
            "Please see full Prescribing Information."
        )

    def optimize_for_platform(self, disclaimer: Disclaimer,
                              platform: PlatformType) -> str:
        """Optimize disclaimer for specific platform"""
        return disclaimer.get_platform_version(platform)


class ReviewWorkflowEngine:
    """Engine for managing MLR/Legal review workflows"""

    def __init__(self, industry: RegulatedIndustry):
        self.industry = industry
        self.requirements = industry.review_requirements

    def generate_workflow(self) -> list:
        """Generate review workflow for industry"""
        stages = [ReviewStage.DRAFT, ReviewStage.INTERNAL_REVIEW]

        if self.requirements.get("compliance_review", True):
            stages.append(ReviewStage.COMPLIANCE_REVIEW)

        if self.requirements.get("legal_review", True):
            stages.append(ReviewStage.LEGAL_REVIEW)

        if self.requirements.get("medical_review", False):
            stages.append(ReviewStage.MEDICAL_REVIEW)

        if self.requirements.get("mlr_required", False):
            stages.append(ReviewStage.MLR_COMMITTEE)

        stages.extend([ReviewStage.FINAL_APPROVAL, ReviewStage.ARCHIVED])

        workflow = []
        for stage in stages:
            checkpoint = ReviewCheckpoint(
                stage=stage,
                reviewer=stage.required_approvers[0] if stage.required_approvers else "TBD",
                status="pending"
            )
            workflow.append(checkpoint)

        return workflow

    def calculate_timeline(self, workflow: list) -> dict:
        """Calculate expected review timeline"""
        total_days = sum(cp.stage.typical_duration_days for cp in workflow)

        return {
            "total_estimated_days": total_days,
            "start_date": datetime.now().strftime("%Y-%m-%d"),
            "estimated_completion": (datetime.now() + timedelta(days=total_days)).strftime("%Y-%m-%d"),
            "stages": [
                {
                    "stage": cp.stage.value,
                    "duration_days": cp.stage.typical_duration_days,
                    "approvers": cp.stage.required_approvers
                }
                for cp in workflow
            ]
        }

    def advance_stage(self, workflow: list, current_stage: ReviewStage,
                      status: str, comments: str = "") -> list:
        """Advance workflow to next stage"""
        for i, checkpoint in enumerate(workflow):
            if checkpoint.stage == current_stage:
                checkpoint.status = status
                checkpoint.comments = comments
                checkpoint.timestamp = datetime.now()

                # If approved, set next stage to pending
                if status == "approved" and i + 1 < len(workflow):
                    workflow[i + 1].status = "pending"
                break

        return workflow


class RegulatedCampaignBuilder:
    """Main orchestrator for building regulated campaigns"""

    def __init__(self, company_name: str, product_name: str,
                 industry: RegulatedIndustry):
        self.company_name = company_name
        self.product_name = product_name
        self.industry = industry

        # Initialize engines
        self.compliance_engine = ComplianceEngine(industry)
        self.claims_engine = ClaimsValidatorEngine(industry)
        self.disclaimer_engine = DisclaimerBuilderEngine(industry)
        self.workflow_engine = ReviewWorkflowEngine(industry)

    def build_campaign(self, campaign_objective: str,
                       platforms: list = None) -> RegulatedCampaign:
        """Build complete regulated campaign"""
        if platforms is None:
            platforms = [PlatformType.DIGITAL_DISPLAY, PlatformType.SOCIAL_MEDIA]

        # Generate workflow
        workflow = self.workflow_engine.generate_workflow()

        # Build primary disclaimer
        primary_disclaimer = self.disclaimer_engine.build_primary_disclaimer()

        # Create campaign
        campaign = RegulatedCampaign(
            company_name=self.company_name,
            product_name=self.product_name,
            industry=self.industry,
            campaign_objective=campaign_objective,
            target_platforms=[p.value for p in platforms],
            disclaimers=[primary_disclaimer],
            review_workflow=workflow,
            expiration_date=datetime.now() + timedelta(days=365)
        )

        return campaign

    def add_claim(self, campaign: RegulatedCampaign, claim_text: str,
                  claim_type: ClaimType, substantiation: str) -> RegulatedCampaign:
        """Add validated claim to campaign"""
        # Validate and create claim
        approved_claim = self.claims_engine.validate_claim(
            claim_text, claim_type, substantiation
        )

        campaign.approved_claims.append(approved_claim)

        # Update checklist
        if campaign.checklist:
            campaign.checklist.items["claims_substantiated"] = True

        return campaign

    def get_regulatory_framework(self) -> dict:
        """Get regulatory framework for campaign industry"""
        return self.compliance_engine.get_regulatory_framework()

    def get_timeline(self, campaign: RegulatedCampaign) -> dict:
        """Get review timeline for campaign"""
        return self.workflow_engine.calculate_timeline(campaign.review_workflow)


# ============================================================
# REPORTER CLASS
# ============================================================

class RegulatedCampaignReporter:
    """Generate ASCII dashboard reports for regulated campaigns"""

    @staticmethod
    def generate_report(campaign: RegulatedCampaign) -> str:
        """Generate comprehensive campaign report"""

        # Build compliance bar
        score = campaign.compliance_score
        filled = int(score / 10)
        compliance_bar = "█" * filled + "░" * (10 - filled)

        # Risk indicator
        risk_indicators = {
            "low": "🟢",
            "medium": "🟡",
            "elevated": "🟠",
            "high": "🔴"
        }
        risk_icon = risk_indicators.get(campaign.risk_level, "⚪")

        report = f"""
REGULATED CAMPAIGN
═══════════════════════════════════════
Company: {campaign.company_name}
Industry: {campaign.industry.value}
Time: {datetime.now().strftime("%Y-%m-%d %H:%M")}
═══════════════════════════════════════

CAMPAIGN OVERVIEW
────────────────────────────────────────
┌─────────────────────────────────────┐
│       COMPLIANCE SUMMARY            │
│                                     │
│  Industry: {campaign.industry.value:<22}│
│  Regulators: {', '.join(campaign.industry.primary_regulators[:2]):<20}│
│  Product: {campaign.product_name:<24}│
│                                     │
│  Review Status: {campaign.review_status:<18}│
│  Risk Level: {risk_icon} {campaign.risk_level:<18}│
│                                     │
│  Compliance: {compliance_bar} {score:.0f}%│
│  Status: {'●' if score >= 70 else '○'} {'Ready' if score >= 70 else 'Needs Work'}│
└─────────────────────────────────────┘

REGULATORY FRAMEWORK
────────────────────────────────────────
"""
        # Add regulations table
        regulations = campaign.industry.key_regulations[:4]
        for i, reg in enumerate(regulations):
            status = "●" if i < 2 else "○"
            report += f"│ {status} {reg[:40]:<40}│\n"

        report += """
APPROVED CLAIMS MATRIX
────────────────────────────────────────
┌─────────────────────────────────────┐
│  SUBSTANTIATED CLAIMS               │
"""
        # Add claims
        substantiated = [c for c in campaign.approved_claims
                        if c.claim_type == ClaimType.SUBSTANTIATED]
        if substantiated:
            for claim in substantiated[:3]:
                report += f"│  • {claim.claim_text[:35]:<35}│\n"
        else:
            report += "│  • No substantiated claims added    │\n"

        report += """│                                     │
│  QUALIFIED CLAIMS                   │
"""
        qualified = [c for c in campaign.approved_claims
                    if c.claim_type == ClaimType.QUALIFIED]
        if qualified:
            for claim in qualified[:3]:
                report += f"│  • {claim.claim_text[:30]} + qualifier│\n"
        else:
            report += "│  • No qualified claims added        │\n"

        report += """│                                     │
│  PROHIBITED CLAIMS                  │
"""
        for prohibited in campaign.industry.prohibited_claims[:3]:
            report += f"│  ✗ {prohibited[:35]:<35}│\n"

        report += "└─────────────────────────────────────┘\n"

        # Add disclaimers section
        report += """
DISCLAIMERS
────────────────────────────────────────
"""
        if campaign.disclaimers:
            for disc in campaign.disclaimers[:2]:
                report += f"**{disc.disclaimer_type}:**\n"
                report += f"{disc.full_text[:200]}...\n\n"

        # Add review workflow
        report += """
REVIEW WORKFLOW
────────────────────────────────────────
| Stage | Reviewer | Status |
|-------|----------|--------|
"""
        for checkpoint in campaign.review_workflow[:6]:
            status_icon = {"pending": "○", "approved": "●",
                          "rejected": "✗", "revision_requested": "↻"}
            icon = status_icon.get(checkpoint.status, "○")
            report += f"| {checkpoint.stage.value[:15]:<15} | {checkpoint.reviewer[:10]:<10} | {icon} |\n"

        # Add timeline
        timeline = ReviewWorkflowEngine(campaign.industry).calculate_timeline(
            campaign.review_workflow
        )

        report += f"""
TIMELINE
────────────────────────────────────────
• Total review days: {timeline['total_estimated_days']}
• Start date: {timeline['start_date']}
• Est. completion: {timeline['estimated_completion']}
• Archive expiration: {campaign.days_until_expiration} days

Campaign Status: {'●' if campaign.compliance_score >= 70 else '○'} {'Pending MLR Review' if campaign.compliance_score >= 70 else 'Compliance Work Needed'}
"""

        return report

    @staticmethod
    def generate_claims_report(campaign: RegulatedCampaign) -> str:
        """Generate detailed claims analysis report"""
        report = f"""
CLAIMS ANALYSIS REPORT
═══════════════════════════════════════
Product: {campaign.product_name}
Industry: {campaign.industry.value}
═══════════════════════════════════════

CLAIMS INVENTORY
────────────────────────────────────────
"""
        for i, claim in enumerate(campaign.approved_claims, 1):
            report += f"""
Claim #{i}
────────────────────────────────────────
Text: {claim.claim_text}
Type: {claim.claim_type.value}
Risk: {claim.risk_assessment}
Substantiation: {claim.substantiation_source}
"""
            if claim.qualifier_text:
                report += f"Qualifier: {claim.qualifier_text}\n"
            report += f"Current: {'Yes' if claim.is_current else 'EXPIRED'}\n"

        return report

    @staticmethod
    def generate_disclaimer_report(campaign: RegulatedCampaign) -> str:
        """Generate disclaimer coverage report"""
        report = f"""
DISCLAIMER COVERAGE REPORT
═══════════════════════════════════════
Industry: {campaign.industry.value}
Required Disclosures: {len(campaign.industry.required_disclosures)}
═══════════════════════════════════════

REQUIRED DISCLOSURES
────────────────────────────────────────
"""
        for disc in campaign.industry.required_disclosures:
            covered = any(d.disclaimer_type.lower() in disc.lower()
                         for d in campaign.disclaimers)
            status = "●" if covered else "○"
            report += f"{status} {disc}\n"

        report += """
DISCLAIMER DETAILS
────────────────────────────────────────
"""
        for disc in campaign.disclaimers:
            report += f"""
{disc.disclaimer_type} ({disc.level.value})
────────────────────────────────────────
{disc.full_text}

Platform Variations:
"""
            for platform, text in disc.platform_variations.items():
                report += f"  • {platform}: {text[:60]}...\n"

        return report


# ============================================================
# CLI INTERFACE
# ============================================================

def main():
    """CLI entry point"""
    parser = argparse.ArgumentParser(
        description="ADSCAIL.REGULATED.EXE - Regulated Industries Campaign Builder"
    )

    subparsers = parser.add_subparsers(dest="command", help="Commands")

    # Build command
    build_parser = subparsers.add_parser("build", help="Build regulated campaign")
    build_parser.add_argument("--company", required=True, help="Company name")
    build_parser.add_argument("--product", required=True, help="Product name")
    build_parser.add_argument("--industry", required=True,
                             choices=[i.value for i in RegulatedIndustry],
                             help="Regulated industry")
    build_parser.add_argument("--objective", required=True, help="Campaign objective")

    # Framework command
    framework_parser = subparsers.add_parser("framework", help="Get regulatory framework")
    framework_parser.add_argument("--industry", required=True,
                                 choices=[i.value for i in RegulatedIndustry],
                                 help="Industry to analyze")

    # Claims command
    claims_parser = subparsers.add_parser("claims", help="Build claims matrix")
    claims_parser.add_argument("--industry", required=True,
                              choices=[i.value for i in RegulatedIndustry])
    claims_parser.add_argument("--product", required=True, help="Product name")

    # Disclaimer command
    disc_parser = subparsers.add_parser("disclaimer", help="Generate disclaimers")
    disc_parser.add_argument("--industry", required=True,
                            choices=[i.value for i in RegulatedIndustry])
    disc_parser.add_argument("--type", choices=["primary", "fair_balance", "all"],
                            default="primary")

    # Workflow command
    workflow_parser = subparsers.add_parser("workflow", help="Generate review workflow")
    workflow_parser.add_argument("--industry", required=True,
                                choices=[i.value for i in RegulatedIndustry])

    # Demo command
    demo_parser = subparsers.add_parser("demo", help="Run demo campaign")
    demo_parser.add_argument("--industry", default="pharmaceutical",
                            choices=[i.value for i in RegulatedIndustry])

    args = parser.parse_args()

    if args.command == "build":
        industry = RegulatedIndustry(args.industry)
        builder = RegulatedCampaignBuilder(args.company, args.product, industry)
        campaign = builder.build_campaign(args.objective)
        print(RegulatedCampaignReporter.generate_report(campaign))

    elif args.command == "framework":
        industry = RegulatedIndustry(args.industry)
        engine = ComplianceEngine(industry)
        framework = engine.get_regulatory_framework()
        print(json.dumps(framework, indent=2))

    elif args.command == "claims":
        industry = RegulatedIndustry(args.industry)
        print(f"\nClaims Matrix for {industry.value}")
        print("=" * 50)
        print("\nAllowed Claim Types:")
        for ct in ClaimType:
            status = "✓" if ct.allowed else "✗"
            print(f"  {status} {ct.value}: Risk={ct.risk_level}")
        print("\nProhibited Claims:")
        for pc in industry.prohibited_claims:
            print(f"  ✗ {pc}")

    elif args.command == "disclaimer":
        industry = RegulatedIndustry(args.industry)
        engine = DisclaimerBuilderEngine(industry)
        disclaimer = engine.build_primary_disclaimer()
        print(f"\n{disclaimer.disclaimer_type}")
        print("=" * 50)
        print(disclaimer.full_text)
        print("\nPlatform Variations:")
        for platform, text in disclaimer.platform_variations.items():
            print(f"\n{platform}:\n{text}")

    elif args.command == "workflow":
        industry = RegulatedIndustry(args.industry)
        engine = ReviewWorkflowEngine(industry)
        workflow = engine.generate_workflow()
        timeline = engine.calculate_timeline(workflow)
        print(f"\nReview Workflow for {industry.value}")
        print("=" * 50)
        print(f"Total Days: {timeline['total_estimated_days']}")
        print(f"Est. Completion: {timeline['estimated_completion']}")
        print("\nStages:")
        for stage in timeline['stages']:
            print(f"  • {stage['stage']}: {stage['duration_days']} days")
            print(f"    Approvers: {', '.join(stage['approvers'])}")

    elif args.command == "demo":
        industry = RegulatedIndustry(args.industry)

        # Build demo campaign
        builder = RegulatedCampaignBuilder(
            company_name="PharmaCorp Inc.",
            product_name="Healix",
            industry=industry
        )

        campaign = builder.build_campaign(
            campaign_objective="DTC awareness campaign for chronic condition treatment"
        )

        # Add sample claims
        builder.add_claim(
            campaign,
            "Clinically proven to reduce symptoms by 40%",
            ClaimType.SUBSTANTIATED,
            "Phase 3 clinical trial, n=500, p<0.001"
        )

        builder.add_claim(
            campaign,
            "Most patients see improvement within 2 weeks",
            ClaimType.QUALIFIED,
            "Internal study data"
        )

        # Generate reports
        print(RegulatedCampaignReporter.generate_report(campaign))
        print("\n" + "=" * 50)
        print(RegulatedCampaignReporter.generate_claims_report(campaign))

    else:
        parser.print_help()


if __name__ == "__main__":
    main()
```

---

## WORKFLOW

### Phase 1: ASSESS
1. Identify regulatory bodies
2. Map applicable rules
3. Review platform policies
4. Document restrictions
5. Catalog approved claims

### Phase 2: CREATE
1. Draft compliant copy
2. Build claims matrix
3. Write disclaimers
4. Design safe creative
5. Flag review items

### Phase 3: REVIEW
1. Run compliance check
2. Submit to MLR/legal
3. Address redlines
4. Document approvals
5. Finalize assets

### Phase 4: MONITOR
1. Track adverse events
2. Monitor complaints
3. Update disclaimers
4. Archive materials
5. Maintain documentation

---

## QUICK COMMANDS

- `/adscail-regulated-industries [industry]` - Full compliant campaign
- `/adscail-regulated-industries pharma` - Pharma campaign with ISI
- `/adscail-regulated-industries finance` - Finance with risk disclosure
- `/adscail-regulated-industries disclaimer [type]` - Generate disclaimers
- `/adscail-regulated-industries claims [product]` - Build claims matrix

$ARGUMENTS
