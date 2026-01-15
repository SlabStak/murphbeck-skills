# PRODUCT.ANALYZER.OS.EXE - Product Advertising Analysis System

You are PRODUCT.ANALYZER.OS.EXE — the AI vision system for product advertising analysis.

MISSION: Analyze product images in comprehensive detail to extract all advertising-relevant information for high-converting ad creation. Visual insight drives creative strategy.

---

## SYSTEM IMPLEMENTATION

```python
"""
PRODUCT.ANALYZER.OS.EXE - Product Advertising Analysis System
AI vision system for extracting advertising-relevant product information.
"""

from enum import Enum
from dataclasses import dataclass, field
from typing import Optional
from datetime import datetime


# ════════════════════════════════════════════════════════════════════════════════
# DOMAIN ENUMS - Product Categories, Tiers, and Attributes
# ════════════════════════════════════════════════════════════════════════════════

class ProductCategory(Enum):
    """Primary product categories with industry context."""
    FASHION_APPAREL = "fashion_apparel"
    BEAUTY_SKINCARE = "beauty_skincare"
    TECHNOLOGY_ELECTRONICS = "technology_electronics"
    HOME_DECOR = "home_decor"
    FOOD_BEVERAGE = "food_beverage"
    FITNESS_WELLNESS = "fitness_wellness"
    BABY_KIDS = "baby_kids"
    PET_SUPPLIES = "pet_supplies"
    OUTDOOR_SPORTS = "outdoor_sports"
    AUTOMOTIVE = "automotive"
    JEWELRY_ACCESSORIES = "jewelry_accessories"
    HEALTH_SUPPLEMENTS = "health_supplements"
    OFFICE_BUSINESS = "office_business"
    ARTS_CRAFTS = "arts_crafts"
    GARDEN_PLANTS = "garden_plants"

    @property
    def industry(self) -> str:
        """Returns the broader industry classification."""
        industry_map = {
            "fashion_apparel": "Fashion & Retail",
            "beauty_skincare": "Beauty & Personal Care",
            "technology_electronics": "Consumer Electronics",
            "home_decor": "Home & Living",
            "food_beverage": "Food & Beverage",
            "fitness_wellness": "Health & Fitness",
            "baby_kids": "Baby & Children",
            "pet_supplies": "Pet Care",
            "outdoor_sports": "Sports & Outdoors",
            "automotive": "Automotive",
            "jewelry_accessories": "Jewelry & Luxury",
            "health_supplements": "Health & Wellness",
            "office_business": "Business & Professional",
            "arts_crafts": "Arts & Hobbies",
            "garden_plants": "Garden & Home"
        }
        return industry_map.get(self.value, "General Retail")

    @property
    def typical_price_tiers(self) -> list:
        """Returns typical price tiers for this category."""
        tier_map = {
            "fashion_apparel": ["budget", "mid_range", "premium", "luxury"],
            "beauty_skincare": ["drugstore", "mid_range", "prestige", "luxury"],
            "technology_electronics": ["budget", "mid_range", "premium", "flagship"],
            "home_decor": ["budget", "mid_range", "designer", "artisan"],
            "food_beverage": ["value", "standard", "premium", "gourmet"],
            "fitness_wellness": ["budget", "mid_range", "premium", "professional"],
            "jewelry_accessories": ["fashion", "mid_range", "fine", "luxury"]
        }
        return tier_map.get(self.value, ["budget", "mid_range", "premium"])

    @property
    def primary_audience_ages(self) -> tuple:
        """Returns typical age range for category buyers."""
        age_map = {
            "fashion_apparel": (18, 45),
            "beauty_skincare": (18, 55),
            "technology_electronics": (18, 50),
            "home_decor": (25, 55),
            "food_beverage": (25, 65),
            "fitness_wellness": (18, 50),
            "baby_kids": (25, 40),
            "pet_supplies": (25, 55),
            "outdoor_sports": (20, 45),
            "jewelry_accessories": (25, 55),
            "health_supplements": (30, 65)
        }
        return age_map.get(self.value, (18, 65))

    @property
    def common_subcategories(self) -> list:
        """Returns common subcategories for this product type."""
        subcategory_map = {
            "fashion_apparel": ["dresses", "tops", "bottoms", "outerwear", "activewear", "accessories"],
            "beauty_skincare": ["cleansers", "moisturizers", "serums", "masks", "sunscreen", "makeup"],
            "technology_electronics": ["smartphones", "laptops", "tablets", "wearables", "audio", "smart home"],
            "home_decor": ["furniture", "lighting", "textiles", "wall art", "storage", "kitchenware"],
            "food_beverage": ["snacks", "beverages", "pantry", "frozen", "fresh", "specialty"],
            "fitness_wellness": ["equipment", "apparel", "supplements", "accessories", "recovery", "wearables"]
        }
        return subcategory_map.get(self.value, ["general"])


class PriceTier(Enum):
    """Product price tiers with positioning characteristics."""
    BUDGET = "budget"
    VALUE = "value"
    MID_RANGE = "mid_range"
    PREMIUM = "premium"
    LUXURY = "luxury"
    ULTRA_LUXURY = "ultra_luxury"

    @property
    def positioning(self) -> str:
        """Returns market positioning description."""
        positioning_map = {
            "budget": "Accessible, value-focused, mass market appeal",
            "value": "Quality at fair price, smart shopping choice",
            "mid_range": "Balanced quality and price, reliable choice",
            "premium": "Superior quality, enhanced features, aspirational",
            "luxury": "Exclusive, prestigious, exceptional craftsmanship",
            "ultra_luxury": "Elite, rare, uncompromising excellence"
        }
        return positioning_map.get(self.value, "Standard positioning")

    @property
    def messaging_tone(self) -> list:
        """Returns appropriate messaging tones for this tier."""
        tone_map = {
            "budget": ["practical", "smart", "accessible", "everyday"],
            "value": ["savvy", "quality", "reliable", "trustworthy"],
            "mid_range": ["quality", "dependable", "refined", "polished"],
            "premium": ["superior", "exceptional", "elevated", "distinguished"],
            "luxury": ["exclusive", "prestigious", "exquisite", "refined"],
            "ultra_luxury": ["rare", "bespoke", "incomparable", "legendary"]
        }
        return tone_map.get(self.value, ["quality"])

    @property
    def target_income_percentile(self) -> tuple:
        """Returns target income percentile range."""
        income_map = {
            "budget": (0, 40),
            "value": (20, 60),
            "mid_range": (40, 75),
            "premium": (60, 90),
            "luxury": (80, 98),
            "ultra_luxury": (95, 100)
        }
        return income_map.get(self.value, (30, 70))

    @property
    def proof_requirements(self) -> list:
        """Returns what proof points matter most at this tier."""
        proof_map = {
            "budget": ["price_comparison", "value_proposition", "reviews"],
            "value": ["quality_indicators", "durability", "warranty"],
            "mid_range": ["features", "reviews", "comparisons", "guarantees"],
            "premium": ["materials", "craftsmanship", "certifications", "testimonials"],
            "luxury": ["heritage", "exclusivity", "artisanship", "celebrity_endorsements"],
            "ultra_luxury": ["provenance", "limited_edition", "bespoke_options", "legacy"]
        }
        return proof_map.get(self.value, ["quality", "value"])


class QualityIndicator(Enum):
    """Visual quality indicators detectable in product images."""
    PREMIUM_MATERIALS = "premium_materials"
    FINE_CRAFTSMANSHIP = "fine_craftsmanship"
    PROFESSIONAL_PACKAGING = "professional_packaging"
    BRAND_HERITAGE = "brand_heritage"
    CERTIFICATION_SEALS = "certification_seals"
    ATTENTION_TO_DETAIL = "attention_to_detail"
    INNOVATIVE_DESIGN = "innovative_design"
    ECO_FRIENDLY = "eco_friendly"
    HANDMADE_ARTISAN = "handmade_artisan"
    TECHNOLOGY_ADVANCED = "technology_advanced"
    MINIMALIST_DESIGN = "minimalist_design"
    LUXURY_FINISH = "luxury_finish"

    @property
    def visual_cues(self) -> list:
        """Returns visual cues that indicate this quality marker."""
        cue_map = {
            "premium_materials": ["texture detail", "material sheen", "natural variations", "weight appearance"],
            "fine_craftsmanship": ["precise stitching", "clean edges", "alignment", "finish consistency"],
            "professional_packaging": ["custom boxes", "tissue paper", "branded elements", "protective materials"],
            "brand_heritage": ["logos", "established dates", "origin labels", "heritage imagery"],
            "certification_seals": ["organic badges", "safety certifications", "awards", "standards logos"],
            "attention_to_detail": ["hidden features", "interior finishing", "hardware quality", "label placement"],
            "innovative_design": ["unique shapes", "functional features", "modern aesthetics", "tech integration"],
            "eco_friendly": ["recycled materials", "minimal packaging", "natural materials", "green certifications"],
            "handmade_artisan": ["slight variations", "maker marks", "natural imperfections", "craft signatures"],
            "technology_advanced": ["displays", "interfaces", "connectivity indicators", "sleek forms"],
            "minimalist_design": ["clean lines", "negative space", "simple forms", "monochromatic"],
            "luxury_finish": ["high gloss", "metallic accents", "rich textures", "premium hardware"]
        }
        return cue_map.get(self.value, ["general quality"])

    @property
    def ad_copy_phrases(self) -> list:
        """Returns ad copy phrases that highlight this quality."""
        phrase_map = {
            "premium_materials": ["Crafted from the finest", "Premium quality", "Luxurious feel"],
            "fine_craftsmanship": ["Expertly crafted", "Meticulous attention to detail", "Master craftsmanship"],
            "professional_packaging": ["Arrives beautifully presented", "Gift-ready packaging", "Unboxing experience"],
            "brand_heritage": ["Trusted since", "Generations of expertise", "Time-honored tradition"],
            "certification_seals": ["Certified organic", "Award-winning", "Independently verified"],
            "attention_to_detail": ["Every detail matters", "Thoughtfully designed", "Nothing overlooked"],
            "innovative_design": ["Revolutionary design", "Innovation meets style", "Future-forward"],
            "eco_friendly": ["Sustainably made", "Earth-conscious", "Better for the planet"],
            "handmade_artisan": ["Handcrafted with care", "One-of-a-kind", "Artisan-made"],
            "technology_advanced": ["Cutting-edge technology", "Smart features", "Next-generation"],
            "minimalist_design": ["Elegantly simple", "Form meets function", "Refined simplicity"],
            "luxury_finish": ["Exquisite finish", "Impeccable quality", "Unmistakable luxury"]
        }
        return phrase_map.get(self.value, ["Quality assured"])


class LifestyleProfile(Enum):
    """Psychographic lifestyle profiles for audience targeting."""
    HEALTH_CONSCIOUS = "health_conscious"
    ECO_WARRIOR = "eco_warrior"
    TECH_ENTHUSIAST = "tech_enthusiast"
    FASHIONISTA = "fashionista"
    HOME_NESTER = "home_nester"
    ADVENTURE_SEEKER = "adventure_seeker"
    BUSY_PROFESSIONAL = "busy_professional"
    PARENT_FIRST = "parent_first"
    BUDGET_SAVVY = "budget_savvy"
    LUXURY_LOVER = "luxury_lover"
    MINIMALIST = "minimalist"
    CREATIVE_MAKER = "creative_maker"
    FITNESS_FANATIC = "fitness_fanatic"
    FOODIE = "foodie"
    PET_PARENT = "pet_parent"

    @property
    def values(self) -> list:
        """Returns core values for this lifestyle profile."""
        value_map = {
            "health_conscious": ["wellness", "natural", "clean", "balanced"],
            "eco_warrior": ["sustainability", "ethics", "environment", "responsibility"],
            "tech_enthusiast": ["innovation", "efficiency", "connectivity", "progress"],
            "fashionista": ["style", "trends", "self-expression", "aesthetics"],
            "home_nester": ["comfort", "family", "coziness", "sanctuary"],
            "adventure_seeker": ["freedom", "experience", "exploration", "thrill"],
            "busy_professional": ["efficiency", "quality", "time-saving", "success"],
            "parent_first": ["safety", "quality", "development", "family"],
            "budget_savvy": ["value", "savings", "smart choices", "practicality"],
            "luxury_lover": ["exclusivity", "quality", "status", "indulgence"],
            "minimalist": ["simplicity", "quality over quantity", "intentionality", "clarity"],
            "creative_maker": ["self-expression", "uniqueness", "craft", "imagination"],
            "fitness_fanatic": ["performance", "health", "achievement", "discipline"],
            "foodie": ["quality", "experience", "discovery", "authenticity"],
            "pet_parent": ["care", "quality", "health", "companionship"]
        }
        return value_map.get(self.value, ["quality"])

    @property
    def interests(self) -> list:
        """Returns common interests for this profile."""
        interest_map = {
            "health_conscious": ["yoga", "organic food", "meditation", "supplements", "clean beauty"],
            "eco_warrior": ["recycling", "sustainable brands", "nature", "climate", "ethical shopping"],
            "tech_enthusiast": ["gadgets", "apps", "smart home", "gaming", "early adoption"],
            "fashionista": ["trends", "designers", "style influencers", "shopping", "accessories"],
            "home_nester": ["interior design", "DIY", "cooking", "gardening", "organization"],
            "adventure_seeker": ["travel", "outdoor sports", "camping", "photography", "experiences"],
            "busy_professional": ["productivity", "career", "networking", "self-improvement", "convenience"],
            "parent_first": ["parenting tips", "education", "family activities", "child development"],
            "budget_savvy": ["deals", "coupons", "comparison shopping", "reviews", "value hunting"],
            "luxury_lover": ["fine dining", "travel", "designer brands", "exclusive experiences"],
            "minimalist": ["decluttering", "capsule wardrobes", "intentional living", "quality items"],
            "creative_maker": ["DIY", "crafts", "art", "design", "maker communities"],
            "fitness_fanatic": ["workouts", "nutrition", "sports", "competitions", "gear reviews"],
            "foodie": ["restaurants", "cooking", "food trends", "specialty ingredients", "culinary travel"],
            "pet_parent": ["pet health", "pet products", "pet communities", "training", "pet travel"]
        }
        return interest_map.get(self.value, ["general"])

    @property
    def messaging_hooks(self) -> list:
        """Returns effective messaging hooks for this profile."""
        hook_map = {
            "health_conscious": ["Feel your best", "Natural ingredients", "Clean formula", "Wellness starts here"],
            "eco_warrior": ["Sustainable choice", "Better for the planet", "Ethical production", "Reduce your footprint"],
            "tech_enthusiast": ["Smart technology", "Stay connected", "Future-ready", "Innovation you'll love"],
            "fashionista": ["Elevate your style", "On-trend", "Make a statement", "Fashion-forward"],
            "home_nester": ["Transform your space", "Create your sanctuary", "Cozy comfort", "Home is where"],
            "adventure_seeker": ["Ready for anything", "Explore more", "Your next adventure", "Built for discovery"],
            "busy_professional": ["Save time", "Streamline your life", "Professional quality", "Efficiency meets style"],
            "parent_first": ["Safe for your family", "Peace of mind", "Growing together", "Built for kids"],
            "budget_savvy": ["Smart value", "More for less", "Quality you can afford", "Savvy choice"],
            "luxury_lover": ["Indulge yourself", "Exclusive quality", "You deserve the best", "Refined luxury"],
            "minimalist": ["Less is more", "Essential quality", "Simplify beautifully", "Intentional design"],
            "creative_maker": ["Create your vision", "Express yourself", "Unique as you", "Make it yours"],
            "fitness_fanatic": ["Peak performance", "Train harder", "Fuel your goals", "Built for athletes"],
            "foodie": ["Taste the difference", "Culinary excellence", "Savor every bite", "Chef-approved"],
            "pet_parent": ["Love them better", "Happy, healthy pets", "They deserve the best", "Pet parent approved"]
        }
        return hook_map.get(self.value, ["Quality you'll love"])


class PainPointCategory(Enum):
    """Categories of pain points products can address."""
    TIME_SCARCITY = "time_scarcity"
    MONEY_CONCERNS = "money_concerns"
    CONVENIENCE_NEEDS = "convenience_needs"
    STATUS_DESIRE = "status_desire"
    HEALTH_WORRIES = "health_worries"
    SAFETY_CONCERNS = "safety_concerns"
    QUALITY_DISAPPOINTMENT = "quality_disappointment"
    COMPLEXITY_FRUSTRATION = "complexity_frustration"
    APPEARANCE_INSECURITY = "appearance_insecurity"
    SOCIAL_ACCEPTANCE = "social_acceptance"
    ENVIRONMENTAL_GUILT = "environmental_guilt"
    PERFORMANCE_ANXIETY = "performance_anxiety"

    @property
    def trigger_phrases(self) -> list:
        """Returns phrases that trigger this pain point."""
        phrase_map = {
            "time_scarcity": ["no time", "too busy", "takes too long", "wish it was faster"],
            "money_concerns": ["too expensive", "not worth it", "wasting money", "can't afford"],
            "convenience_needs": ["too complicated", "hard to use", "inconvenient", "hassle"],
            "status_desire": ["want to impress", "look successful", "stand out", "be recognized"],
            "health_worries": ["worried about health", "harmful ingredients", "side effects", "long-term effects"],
            "safety_concerns": ["is it safe", "worried about", "could go wrong", "protect myself"],
            "quality_disappointment": ["broke quickly", "poor quality", "didn't last", "waste of money"],
            "complexity_frustration": ["too confusing", "hard to figure out", "overwhelming", "complicated"],
            "appearance_insecurity": ["don't look good", "self-conscious", "want to look better", "aging"],
            "social_acceptance": ["what will people think", "fit in", "be accepted", "social pressure"],
            "environmental_guilt": ["bad for environment", "plastic waste", "carbon footprint", "sustainable options"],
            "performance_anxiety": ["not good enough", "falling behind", "underperforming", "competitive edge"]
        }
        return phrase_map.get(self.value, ["frustration"])

    @property
    def solution_framing(self) -> list:
        """Returns how to frame the solution for this pain point."""
        framing_map = {
            "time_scarcity": ["Save hours", "Quick and easy", "In just minutes", "Time back in your day"],
            "money_concerns": ["Worth every penny", "Investment that pays", "Affordable luxury", "Smart spending"],
            "convenience_needs": ["Effortless", "One-step solution", "Simple as 1-2-3", "No hassle"],
            "status_desire": ["Luxury you deserve", "Make an impression", "Stand out from the crowd", "Elite choice"],
            "health_worries": ["Safe and tested", "Clean ingredients", "Doctor-approved", "Your health first"],
            "safety_concerns": ["Tested and trusted", "Built to protect", "Safety guaranteed", "Peace of mind"],
            "quality_disappointment": ["Built to last", "Premium quality", "Satisfaction guaranteed", "Never settle"],
            "complexity_frustration": ["Beautifully simple", "Easy to use", "Intuitive design", "No learning curve"],
            "appearance_insecurity": ["Look your best", "Confidence boost", "Visible results", "Transform yourself"],
            "social_acceptance": ["Join thousands", "Trending now", "Celebrity choice", "Community approved"],
            "environmental_guilt": ["Guilt-free choice", "Eco-friendly", "Sustainable solution", "Planet positive"],
            "performance_anxiety": ["Outperform", "Competitive edge", "Level up", "Peak performance"]
        }
        return framing_map.get(self.value, ["The solution you need"])


class EmotionalBenefitLevel(Enum):
    """Hierarchy of benefits from functional to self-expressive."""
    FUNCTIONAL = "functional"
    EMOTIONAL = "emotional"
    SELF_EXPRESSIVE = "self_expressive"
    SOCIAL = "social"
    TRANSFORMATIONAL = "transformational"

    @property
    def description(self) -> str:
        """Returns description of this benefit level."""
        desc_map = {
            "functional": "What the product does - tangible features and capabilities",
            "emotional": "How the product makes you feel - internal emotional response",
            "self_expressive": "What the product says about you - identity and values",
            "social": "How others perceive you - social status and belonging",
            "transformational": "Who you become - life-changing impact"
        }
        return desc_map.get(self.value, "Product benefit")

    @property
    def example_benefits(self) -> dict:
        """Returns example benefits by product category."""
        example_map = {
            "functional": {
                "skincare": "Reduces wrinkles in 4 weeks",
                "tech": "12-hour battery life",
                "fashion": "Wrinkle-resistant fabric"
            },
            "emotional": {
                "skincare": "Feel confident without makeup",
                "tech": "Feel connected and in control",
                "fashion": "Feel put-together all day"
            },
            "self_expressive": {
                "skincare": "Show you care about self-care",
                "tech": "Express your modern lifestyle",
                "fashion": "Express your unique style"
            },
            "social": {
                "skincare": "Get compliments on your skin",
                "tech": "Be the go-to tech person",
                "fashion": "Turn heads wherever you go"
            },
            "transformational": {
                "skincare": "Become your most confident self",
                "tech": "Transform how you work and live",
                "fashion": "Reinvent your personal brand"
            }
        }
        return example_map.get(self.value, {})

    @property
    def messaging_intensity(self) -> int:
        """Returns messaging intensity score 1-10."""
        intensity_map = {
            "functional": 4,
            "emotional": 7,
            "self_expressive": 8,
            "social": 8,
            "transformational": 10
        }
        return intensity_map.get(self.value, 5)


class VisualMood(Enum):
    """Visual mood/atmosphere detected in product imagery."""
    ENERGETIC = "energetic"
    CALM = "calm"
    LUXURIOUS = "luxurious"
    PLAYFUL = "playful"
    PROFESSIONAL = "professional"
    NATURAL = "natural"
    BOLD = "bold"
    MINIMALIST = "minimalist"
    ROMANTIC = "romantic"
    EDGY = "edgy"
    COZY = "cozy"
    ASPIRATIONAL = "aspirational"

    @property
    def color_associations(self) -> list:
        """Returns colors typically associated with this mood."""
        color_map = {
            "energetic": ["bright red", "orange", "yellow", "electric blue"],
            "calm": ["soft blue", "sage green", "lavender", "cream"],
            "luxurious": ["gold", "black", "deep purple", "champagne"],
            "playful": ["pink", "bright green", "turquoise", "coral"],
            "professional": ["navy", "charcoal", "white", "burgundy"],
            "natural": ["earth tones", "forest green", "terracotta", "beige"],
            "bold": ["red", "black", "white contrast", "neon"],
            "minimalist": ["white", "grey", "black", "nude"],
            "romantic": ["blush pink", "rose", "dusty blue", "ivory"],
            "edgy": ["black", "silver", "neon accents", "dark purple"],
            "cozy": ["warm neutrals", "rust", "mustard", "deep burgundy"],
            "aspirational": ["white", "light blue", "gold accents", "soft grey"]
        }
        return color_map.get(self.value, ["neutral"])

    @property
    def typography_style(self) -> str:
        """Returns appropriate typography style for this mood."""
        style_map = {
            "energetic": "Bold sans-serif, dynamic angles",
            "calm": "Light serif, generous spacing",
            "luxurious": "Elegant serif, sophisticated script",
            "playful": "Rounded sans-serif, fun display",
            "professional": "Clean sans-serif, structured",
            "natural": "Organic shapes, handwritten touches",
            "bold": "Heavy weight, impactful display",
            "minimalist": "Thin sans-serif, lots of white space",
            "romantic": "Script, delicate serif",
            "edgy": "Industrial, distressed, angular",
            "cozy": "Warm serif, friendly rounded",
            "aspirational": "Modern sans-serif, clean and elevated"
        }
        return style_map.get(self.value, "Clean, readable")

    @property
    def target_platforms(self) -> list:
        """Returns best social platforms for this mood."""
        platform_map = {
            "energetic": ["TikTok", "Instagram Reels", "YouTube Shorts"],
            "calm": ["Pinterest", "Instagram Feed", "Facebook"],
            "luxurious": ["Instagram", "Facebook", "LinkedIn"],
            "playful": ["TikTok", "Instagram Stories", "Snapchat"],
            "professional": ["LinkedIn", "Google", "YouTube"],
            "natural": ["Pinterest", "Instagram", "Facebook"],
            "bold": ["TikTok", "Instagram", "YouTube"],
            "minimalist": ["Instagram", "Pinterest", "Google"],
            "romantic": ["Pinterest", "Instagram", "Facebook"],
            "edgy": ["TikTok", "Instagram", "YouTube"],
            "cozy": ["Pinterest", "Facebook", "Instagram"],
            "aspirational": ["Instagram", "YouTube", "TikTok"]
        }
        return platform_map.get(self.value, ["Instagram", "Facebook"])


class HeadlineAngle(Enum):
    """Strategic angles for ad headlines."""
    PROBLEM_SOLUTION = "problem_solution"
    TRANSFORMATION = "transformation"
    SOCIAL_PROOF = "social_proof"
    CURIOSITY = "curiosity"
    URGENCY = "urgency"
    VALUE_PROPOSITION = "value_proposition"
    BENEFIT_FOCUSED = "benefit_focused"
    FEAR_BASED = "fear_based"
    ASPIRATION = "aspiration"
    COMPARISON = "comparison"
    STORY = "story"
    QUESTION = "question"

    @property
    def template(self) -> str:
        """Returns headline template for this angle."""
        template_map = {
            "problem_solution": "Stop [problem]. Start [solution].",
            "transformation": "From [before] to [after] in [timeframe]",
            "social_proof": "[Number] [people] can't be wrong",
            "curiosity": "The secret to [desired outcome] that [experts] don't want you to know",
            "urgency": "[Time-limited offer] - [action] before [deadline]",
            "value_proposition": "Get [benefit] without [sacrifice]",
            "benefit_focused": "[Achieve goal] with [product feature]",
            "fear_based": "Don't let [fear] hold you back from [desire]",
            "aspiration": "Imagine [desired future state]",
            "comparison": "Why [product] beats [alternative] every time",
            "story": "How [person] finally [achieved outcome]",
            "question": "What if you could [achieve goal] by [simple action]?"
        }
        return template_map.get(self.value, "[Benefit-focused headline]")

    @property
    def best_for_funnel_stage(self) -> list:
        """Returns which funnel stages this angle works best for."""
        funnel_map = {
            "problem_solution": ["TOF", "MOF"],
            "transformation": ["MOF", "BOF"],
            "social_proof": ["MOF", "BOF"],
            "curiosity": ["TOF"],
            "urgency": ["BOF"],
            "value_proposition": ["MOF", "BOF"],
            "benefit_focused": ["TOF", "MOF"],
            "fear_based": ["MOF"],
            "aspiration": ["TOF", "MOF"],
            "comparison": ["MOF", "BOF"],
            "story": ["MOF"],
            "question": ["TOF"]
        }
        return funnel_map.get(self.value, ["MOF"])

    @property
    def effectiveness_score(self) -> dict:
        """Returns effectiveness by industry vertical."""
        score_map = {
            "problem_solution": {"beauty": 9, "tech": 8, "fitness": 9, "home": 7},
            "transformation": {"beauty": 10, "fitness": 10, "fashion": 8, "tech": 6},
            "social_proof": {"beauty": 9, "tech": 8, "food": 9, "fitness": 8},
            "curiosity": {"beauty": 7, "tech": 8, "health": 9, "finance": 8},
            "urgency": {"fashion": 9, "tech": 8, "food": 7, "beauty": 8},
            "value_proposition": {"tech": 9, "home": 8, "fitness": 7, "beauty": 7},
            "benefit_focused": {"tech": 9, "fitness": 8, "health": 9, "home": 8},
            "fear_based": {"health": 8, "finance": 9, "beauty": 7, "tech": 6},
            "aspiration": {"fashion": 10, "luxury": 10, "fitness": 9, "beauty": 9},
            "comparison": {"tech": 9, "home": 7, "beauty": 6, "fitness": 7},
            "story": {"beauty": 9, "fitness": 9, "health": 10, "food": 8},
            "question": {"beauty": 7, "tech": 8, "health": 8, "finance": 9}
        }
        return score_map.get(self.value, {"general": 7})


class AdPlatform(Enum):
    """Target advertising platforms for creative recommendations."""
    META_FEED = "meta_feed"
    META_STORIES = "meta_stories"
    META_REELS = "meta_reels"
    INSTAGRAM_FEED = "instagram_feed"
    INSTAGRAM_STORIES = "instagram_stories"
    INSTAGRAM_REELS = "instagram_reels"
    TIKTOK = "tiktok"
    YOUTUBE_SHORTS = "youtube_shorts"
    YOUTUBE_INSTREAM = "youtube_instream"
    PINTEREST = "pinterest"
    GOOGLE_DISPLAY = "google_display"
    GOOGLE_SHOPPING = "google_shopping"
    LINKEDIN = "linkedin"

    @property
    def aspect_ratio(self) -> str:
        """Returns recommended aspect ratio."""
        ratio_map = {
            "meta_feed": "1:1 or 4:5",
            "meta_stories": "9:16",
            "meta_reels": "9:16",
            "instagram_feed": "1:1 or 4:5",
            "instagram_stories": "9:16",
            "instagram_reels": "9:16",
            "tiktok": "9:16",
            "youtube_shorts": "9:16",
            "youtube_instream": "16:9",
            "pinterest": "2:3",
            "google_display": "varies",
            "google_shopping": "1:1",
            "linkedin": "1:1 or 16:9"
        }
        return ratio_map.get(self.value, "1:1")

    @property
    def text_guidelines(self) -> dict:
        """Returns text overlay guidelines."""
        guidelines_map = {
            "meta_feed": {"max_text_ratio": 0.20, "headline_length": 40, "has_text_overlay": True},
            "meta_stories": {"max_text_ratio": 0.25, "headline_length": 25, "has_text_overlay": True},
            "meta_reels": {"max_text_ratio": 0.20, "headline_length": 30, "has_text_overlay": True},
            "instagram_feed": {"max_text_ratio": 0.20, "headline_length": 40, "has_text_overlay": True},
            "instagram_stories": {"max_text_ratio": 0.25, "headline_length": 25, "has_text_overlay": True},
            "instagram_reels": {"max_text_ratio": 0.20, "headline_length": 30, "has_text_overlay": True},
            "tiktok": {"max_text_ratio": 0.25, "headline_length": 30, "has_text_overlay": True},
            "youtube_shorts": {"max_text_ratio": 0.20, "headline_length": 30, "has_text_overlay": True},
            "youtube_instream": {"max_text_ratio": 0.15, "headline_length": 50, "has_text_overlay": False},
            "pinterest": {"max_text_ratio": 0.30, "headline_length": 60, "has_text_overlay": True},
            "google_display": {"max_text_ratio": 0.20, "headline_length": 30, "has_text_overlay": True},
            "google_shopping": {"max_text_ratio": 0.10, "headline_length": 70, "has_text_overlay": False},
            "linkedin": {"max_text_ratio": 0.25, "headline_length": 70, "has_text_overlay": True}
        }
        return guidelines_map.get(self.value, {"max_text_ratio": 0.20, "headline_length": 40})

    @property
    def best_content_type(self) -> list:
        """Returns best performing content types."""
        content_map = {
            "meta_feed": ["lifestyle", "product_hero", "UGC", "carousel"],
            "meta_stories": ["behind_scenes", "quick_demo", "poll", "countdown"],
            "meta_reels": ["transformation", "tutorial", "trending_audio", "humor"],
            "instagram_feed": ["lifestyle", "flat_lay", "UGC", "carousel"],
            "instagram_stories": ["quick_tips", "poll", "countdown", "swipe_up"],
            "instagram_reels": ["transformation", "tutorial", "trending", "before_after"],
            "tiktok": ["trending", "challenge", "duet", "raw_authentic"],
            "youtube_shorts": ["quick_tips", "transformation", "reaction", "how_to"],
            "youtube_instream": ["story", "testimonial", "demonstration", "comparison"],
            "pinterest": ["lifestyle", "how_to", "inspiration", "infographic"],
            "google_display": ["product_focused", "benefit_highlight", "offer"],
            "google_shopping": ["clean_product", "white_background", "multiple_angles"],
            "linkedin": ["professional", "thought_leadership", "case_study", "statistics"]
        }
        return content_map.get(self.value, ["product_focused"])


# ════════════════════════════════════════════════════════════════════════════════
# DATA CLASSES - Structured Analysis Components
# ════════════════════════════════════════════════════════════════════════════════

@dataclass
class ProductIdentification:
    """Complete product identification from image analysis."""
    category: ProductCategory
    subcategory: str
    product_type: str
    brand_name: Optional[str] = None
    brand_visible: bool = False
    price_tier: PriceTier = PriceTier.MID_RANGE
    quality_indicators: list = field(default_factory=list)
    variants_detected: list = field(default_factory=list)
    product_stage: str = "established"  # new, established, mature
    confidence_score: float = 0.0

    def __post_init__(self):
        if not self.quality_indicators:
            self.quality_indicators = []
        if not self.variants_detected:
            self.variants_detected = []

    @property
    def industry(self) -> str:
        return self.category.industry

    @property
    def identification_summary(self) -> str:
        brand_str = f" by {self.brand_name}" if self.brand_name else ""
        return f"{self.price_tier.value.replace('_', ' ').title()} {self.product_type}{brand_str}"


@dataclass
class DemographicProfile:
    """Target demographic profile for the product."""
    age_range_primary: tuple = (25, 45)
    age_range_secondary: tuple = (18, 65)
    gender_primary: str = "all"  # female, male, all
    gender_skew: float = 0.5  # 0=male, 1=female
    income_level: str = "middle"  # low, lower_middle, middle, upper_middle, high
    location_type: str = "urban_suburban"  # urban, suburban, rural, urban_suburban
    education_level: str = "college"  # high_school, some_college, college, graduate

    @property
    def targeting_summary(self) -> str:
        age_str = f"{self.age_range_primary[0]}-{self.age_range_primary[1]}"
        return f"{self.gender_primary.title()}, {age_str}, {self.income_level.replace('_', ' ').title()} income"

    @property
    def meta_targeting_params(self) -> dict:
        """Returns Meta ads targeting parameters."""
        return {
            "age_min": self.age_range_primary[0],
            "age_max": self.age_range_primary[1],
            "genders": [1] if self.gender_primary == "female" else [2] if self.gender_primary == "male" else [1, 2],
            "geo_locations": {"location_types": [self.location_type]}
        }


@dataclass
class PsychographicProfile:
    """Psychographic profile for audience targeting."""
    lifestyle: LifestyleProfile = LifestyleProfile.BUSY_PROFESSIONAL
    secondary_lifestyles: list = field(default_factory=list)
    values: list = field(default_factory=list)
    interests: list = field(default_factory=list)
    behaviors: list = field(default_factory=list)

    def __post_init__(self):
        if not self.values:
            self.values = self.lifestyle.values[:3]
        if not self.interests:
            self.interests = self.lifestyle.interests[:5]
        if not self.behaviors:
            self.behaviors = ["online_shopper", "mobile_user"]

    @property
    def messaging_hooks(self) -> list:
        return self.lifestyle.messaging_hooks


@dataclass
class PainPoint:
    """Individual pain point the product addresses."""
    category: PainPointCategory
    description: str
    intensity: int = 5  # 1-10 scale
    solution_offered: str = ""

    @property
    def trigger_phrases(self) -> list:
        return self.category.trigger_phrases

    @property
    def solution_framing(self) -> list:
        return self.category.solution_framing

    @property
    def ad_hook(self) -> str:
        if self.solution_offered:
            return self.solution_offered
        return self.category.solution_framing[0] if self.category.solution_framing else "The solution"


@dataclass
class UseCase:
    """Product use case with priority and frequency."""
    description: str
    frequency: str = "regular"  # daily, regular, occasional, special_occasion
    priority: str = "primary"  # primary, secondary, tertiary
    context: str = ""

    @property
    def frequency_score(self) -> int:
        freq_scores = {"daily": 10, "regular": 7, "occasional": 4, "special_occasion": 2}
        return freq_scores.get(self.frequency, 5)


@dataclass
class EmotionalTrigger:
    """Emotional trigger for advertising messaging."""
    aspirations: list = field(default_factory=list)
    fears_solved: list = field(default_factory=list)
    transformation_from: str = ""
    transformation_to: str = ""

    def __post_init__(self):
        if not self.aspirations:
            self.aspirations = ["improved quality of life"]
        if not self.fears_solved:
            self.fears_solved = ["missing out", "settling for less"]

    @property
    def transformation_arc(self) -> str:
        if self.transformation_from and self.transformation_to:
            return f"FROM: {self.transformation_from} → TO: {self.transformation_to}"
        return "Transformation journey"


@dataclass
class BenefitHierarchy:
    """Hierarchy of product benefits from functional to transformational."""
    functional_benefits: list = field(default_factory=list)
    emotional_benefits: list = field(default_factory=list)
    self_expressive_benefits: list = field(default_factory=list)
    social_benefits: list = field(default_factory=list)
    transformational_benefit: str = ""

    def __post_init__(self):
        if not self.functional_benefits:
            self.functional_benefits = ["High quality", "Reliable performance"]
        if not self.emotional_benefits:
            self.emotional_benefits = ["Peace of mind", "Satisfaction"]

    @property
    def primary_benefit(self) -> str:
        """Returns the highest-level benefit available."""
        if self.transformational_benefit:
            return self.transformational_benefit
        if self.social_benefits:
            return self.social_benefits[0]
        if self.self_expressive_benefits:
            return self.self_expressive_benefits[0]
        if self.emotional_benefits:
            return self.emotional_benefits[0]
        return self.functional_benefits[0] if self.functional_benefits else "Quality product"

    def get_hooks_by_level(self) -> dict:
        """Returns ad hooks organized by benefit level."""
        return {
            "functional": self.functional_benefits,
            "emotional": self.emotional_benefits,
            "self_expressive": self.self_expressive_benefits,
            "social": self.social_benefits,
            "transformational": [self.transformational_benefit] if self.transformational_benefit else []
        }


@dataclass
class ColorPaletteEntry:
    """Individual color in the product's visual palette."""
    color_name: str
    hex_code: str
    role: str = "primary"  # primary, secondary, accent, background
    mood: str = ""
    usage: str = ""

    @property
    def rgb(self) -> tuple:
        """Convert hex to RGB tuple."""
        hex_clean = self.hex_code.lstrip('#')
        return tuple(int(hex_clean[i:i+2], 16) for i in (0, 2, 4))


@dataclass
class CompositionAnalysis:
    """Visual composition analysis of product imagery."""
    layout_type: str = "center_focused"
    focal_point: str = ""
    balance: str = "symmetric"  # symmetric, asymmetric, radial
    negative_space: str = "moderate"  # minimal, moderate, generous
    depth: str = "flat"  # flat, shallow, deep

    @property
    def composition_score(self) -> int:
        """Rate composition effectiveness 1-10."""
        score = 5
        if self.focal_point:
            score += 2
        if self.balance in ["symmetric", "radial"]:
            score += 1
        if self.negative_space == "moderate":
            score += 1
        return min(score, 10)


@dataclass
class MoodAssessment:
    """Visual mood/atmosphere assessment."""
    overall_mood: VisualMood = VisualMood.PROFESSIONAL
    energy_level: str = "medium"  # low, medium, high
    sophistication: str = "medium"  # low, medium, high
    warmth: str = "neutral"  # cool, neutral, warm
    approachability: str = "medium"  # low, medium, high

    @property
    def mood_profile(self) -> dict:
        return {
            "mood": self.overall_mood.value,
            "energy": self.energy_level,
            "sophistication": self.sophistication,
            "warmth": self.warmth,
            "approachability": self.approachability
        }

    @property
    def recommended_platforms(self) -> list:
        return self.overall_mood.target_platforms


@dataclass
class SettingContext:
    """Context of the product setting/environment."""
    environment: str = ""  # studio, lifestyle, outdoor, home, office
    time_of_day: str = ""  # morning, afternoon, evening, night
    season: str = ""  # spring, summer, fall, winter
    context_description: str = ""
    props_present: list = field(default_factory=list)

    def __post_init__(self):
        if not self.props_present:
            self.props_present = []

    @property
    def setting_summary(self) -> str:
        parts = []
        if self.environment:
            parts.append(self.environment)
        if self.time_of_day:
            parts.append(self.time_of_day)
        if self.season:
            parts.append(self.season)
        return ", ".join(parts) if parts else "Studio setting"


@dataclass
class Feature:
    """Product feature with benefit and proof point."""
    feature_name: str
    benefit: str
    proof_point: str = ""
    visibility: str = "visible"  # visible, implied, stated

    @property
    def feature_benefit_statement(self) -> str:
        return f"{self.feature_name}: {self.benefit}"


@dataclass
class UniqueValueProposition:
    """Unique value proposition with differentiation."""
    proposition: str
    differentiation: str
    priority: int = 1  # 1, 2, 3
    supporting_proof: str = ""

    @property
    def uvp_statement(self) -> str:
        return f"{self.proposition} - {self.differentiation}"


@dataclass
class AdCreativeRecommendation:
    """Complete ad creative recommendations."""
    headline_angle: HeadlineAngle = HeadlineAngle.BENEFIT_FOCUSED
    headline_examples: list = field(default_factory=list)
    primary_hook: str = ""
    hook_alternatives: list = field(default_factory=list)
    visual_style: str = ""
    cta_approach: str = ""
    cta_examples: list = field(default_factory=list)
    platform_recommendations: list = field(default_factory=list)

    def __post_init__(self):
        if not self.headline_examples:
            self.headline_examples = [self.headline_angle.template]
        if not self.cta_examples:
            self.cta_examples = ["Shop Now", "Learn More", "Get Yours"]
        if not self.platform_recommendations:
            self.platform_recommendations = [AdPlatform.META_FEED, AdPlatform.INSTAGRAM_FEED]

    @property
    def primary_recommendation(self) -> dict:
        return {
            "headline": self.headline_examples[0] if self.headline_examples else "",
            "hook": self.primary_hook,
            "cta": self.cta_examples[0] if self.cta_examples else "Shop Now",
            "platform": self.platform_recommendations[0].value if self.platform_recommendations else "meta_feed"
        }


@dataclass
class ProductAnalysis:
    """Complete product analysis result."""
    image_source: str
    analysis_date: str = field(default_factory=lambda: datetime.now().strftime("%Y-%m-%d"))

    # Core identification
    identification: ProductIdentification = None

    # Audience profiling
    demographics: DemographicProfile = None
    psychographics: PsychographicProfile = None
    pain_points: list = field(default_factory=list)
    use_cases: list = field(default_factory=list)

    # Emotional mapping
    emotional_triggers: EmotionalTrigger = None
    benefit_hierarchy: BenefitHierarchy = None

    # Visual analysis
    color_palette: list = field(default_factory=list)
    composition: CompositionAnalysis = None
    mood: MoodAssessment = None
    setting: SettingContext = None

    # Selling points
    features: list = field(default_factory=list)
    quality_indicators: list = field(default_factory=list)
    uvps: list = field(default_factory=list)

    # Creative recommendations
    creative_recommendations: AdCreativeRecommendation = None

    def __post_init__(self):
        if not self.identification:
            self.identification = ProductIdentification(
                category=ProductCategory.HOME_DECOR,
                subcategory="general",
                product_type="product"
            )
        if not self.demographics:
            self.demographics = DemographicProfile()
        if not self.psychographics:
            self.psychographics = PsychographicProfile()
        if not self.emotional_triggers:
            self.emotional_triggers = EmotionalTrigger()
        if not self.benefit_hierarchy:
            self.benefit_hierarchy = BenefitHierarchy()
        if not self.composition:
            self.composition = CompositionAnalysis()
        if not self.mood:
            self.mood = MoodAssessment()
        if not self.setting:
            self.setting = SettingContext()
        if not self.creative_recommendations:
            self.creative_recommendations = AdCreativeRecommendation()

    @property
    def analysis_score(self) -> int:
        """Returns overall analysis completeness score 0-100."""
        score = 0
        if self.identification.confidence_score > 0:
            score += 20
        if self.pain_points:
            score += 15
        if self.use_cases:
            score += 10
        if self.color_palette:
            score += 10
        if self.features:
            score += 15
        if self.uvps:
            score += 15
        if self.creative_recommendations.primary_hook:
            score += 15
        return min(score, 100)

    @property
    def product_summary(self) -> str:
        return self.identification.identification_summary


# ════════════════════════════════════════════════════════════════════════════════
# ANALYSIS ENGINES - Specialized Analysis Modules
# ════════════════════════════════════════════════════════════════════════════════

class ProductIdentifierEngine:
    """Engine for product identification and classification."""

    def __init__(self):
        self.category_keywords = {
            ProductCategory.FASHION_APPAREL: ["dress", "shirt", "pants", "jacket", "shoes", "clothing", "wear"],
            ProductCategory.BEAUTY_SKINCARE: ["cream", "serum", "moisturizer", "skincare", "beauty", "makeup"],
            ProductCategory.TECHNOLOGY_ELECTRONICS: ["phone", "laptop", "gadget", "electronic", "device", "tech"],
            ProductCategory.HOME_DECOR: ["furniture", "lamp", "decor", "pillow", "rug", "home"],
            ProductCategory.FOOD_BEVERAGE: ["food", "drink", "snack", "beverage", "organic", "gourmet"],
            ProductCategory.FITNESS_WELLNESS: ["fitness", "yoga", "workout", "exercise", "gym", "wellness"]
        }

    def identify_category(self, description: str) -> ProductCategory:
        """Identify product category from description."""
        description_lower = description.lower()
        for category, keywords in self.category_keywords.items():
            if any(kw in description_lower for kw in keywords):
                return category
        return ProductCategory.HOME_DECOR

    def estimate_price_tier(self, visual_cues: list, brand_name: Optional[str] = None) -> PriceTier:
        """Estimate price tier from visual cues and brand."""
        luxury_cues = ["gold", "silk", "leather", "crystal", "premium packaging"]
        premium_cues = ["quality materials", "branded", "professional finish"]

        cues_lower = [c.lower() for c in visual_cues]

        if any(cue in " ".join(cues_lower) for cue in luxury_cues):
            return PriceTier.LUXURY
        if any(cue in " ".join(cues_lower) for cue in premium_cues):
            return PriceTier.PREMIUM
        return PriceTier.MID_RANGE

    def detect_quality_indicators(self, visual_description: str) -> list:
        """Detect quality indicators from visual description."""
        detected = []
        description_lower = visual_description.lower()

        indicator_keywords = {
            QualityIndicator.PREMIUM_MATERIALS: ["leather", "silk", "cashmere", "metal", "glass"],
            QualityIndicator.FINE_CRAFTSMANSHIP: ["stitching", "seams", "finish", "crafted"],
            QualityIndicator.PROFESSIONAL_PACKAGING: ["box", "packaging", "tissue", "ribbon"],
            QualityIndicator.ECO_FRIENDLY: ["sustainable", "eco", "recycled", "organic"],
            QualityIndicator.MINIMALIST_DESIGN: ["minimal", "clean", "simple", "sleek"]
        }

        for indicator, keywords in indicator_keywords.items():
            if any(kw in description_lower for kw in keywords):
                detected.append(indicator)

        return detected

    def create_identification(
        self,
        product_description: str,
        visual_cues: list,
        brand_name: Optional[str] = None
    ) -> ProductIdentification:
        """Create complete product identification."""
        category = self.identify_category(product_description)
        tier = self.estimate_price_tier(visual_cues, brand_name)
        indicators = self.detect_quality_indicators(" ".join(visual_cues))

        return ProductIdentification(
            category=category,
            subcategory=category.common_subcategories[0] if category.common_subcategories else "general",
            product_type=product_description.split()[0] if product_description else "product",
            brand_name=brand_name,
            brand_visible=brand_name is not None,
            price_tier=tier,
            quality_indicators=indicators,
            confidence_score=0.8 if brand_name else 0.6
        )


class AudienceProfilerEngine:
    """Engine for audience profiling and targeting."""

    def __init__(self):
        self.lifestyle_indicators = {
            LifestyleProfile.HEALTH_CONSCIOUS: ["organic", "natural", "wellness", "clean"],
            LifestyleProfile.ECO_WARRIOR: ["sustainable", "eco", "green", "ethical"],
            LifestyleProfile.TECH_ENTHUSIAST: ["smart", "connected", "digital", "app"],
            LifestyleProfile.FASHIONISTA: ["trend", "style", "fashion", "designer"],
            LifestyleProfile.FITNESS_FANATIC: ["workout", "gym", "athletic", "performance"]
        }

    def profile_demographics(
        self,
        product_category: ProductCategory,
        price_tier: PriceTier
    ) -> DemographicProfile:
        """Generate demographic profile from product attributes."""
        age_range = product_category.primary_audience_ages
        income_percentile = price_tier.target_income_percentile

        income_level = "middle"
        if income_percentile[0] >= 80:
            income_level = "high"
        elif income_percentile[0] >= 60:
            income_level = "upper_middle"
        elif income_percentile[1] <= 40:
            income_level = "lower_middle"

        return DemographicProfile(
            age_range_primary=age_range,
            income_level=income_level
        )

    def profile_psychographics(
        self,
        product_description: str,
        visual_cues: list
    ) -> PsychographicProfile:
        """Generate psychographic profile from product context."""
        combined_text = f"{product_description} {' '.join(visual_cues)}".lower()

        detected_lifestyle = LifestyleProfile.BUSY_PROFESSIONAL
        for lifestyle, indicators in self.lifestyle_indicators.items():
            if any(ind in combined_text for ind in indicators):
                detected_lifestyle = lifestyle
                break

        return PsychographicProfile(
            lifestyle=detected_lifestyle,
            values=detected_lifestyle.values,
            interests=detected_lifestyle.interests
        )

    def identify_pain_points(
        self,
        product_category: ProductCategory,
        product_benefits: list
    ) -> list:
        """Identify pain points the product addresses."""
        pain_points = []

        category_pain_map = {
            ProductCategory.BEAUTY_SKINCARE: [
                PainPointCategory.APPEARANCE_INSECURITY,
                PainPointCategory.TIME_SCARCITY,
                PainPointCategory.QUALITY_DISAPPOINTMENT
            ],
            ProductCategory.TECHNOLOGY_ELECTRONICS: [
                PainPointCategory.COMPLEXITY_FRUSTRATION,
                PainPointCategory.TIME_SCARCITY,
                PainPointCategory.PERFORMANCE_ANXIETY
            ],
            ProductCategory.FITNESS_WELLNESS: [
                PainPointCategory.HEALTH_WORRIES,
                PainPointCategory.PERFORMANCE_ANXIETY,
                PainPointCategory.TIME_SCARCITY
            ],
            ProductCategory.HOME_DECOR: [
                PainPointCategory.STATUS_DESIRE,
                PainPointCategory.QUALITY_DISAPPOINTMENT,
                PainPointCategory.CONVENIENCE_NEEDS
            ]
        }

        relevant_categories = category_pain_map.get(
            product_category,
            [PainPointCategory.QUALITY_DISAPPOINTMENT, PainPointCategory.CONVENIENCE_NEEDS]
        )

        for i, pain_cat in enumerate(relevant_categories[:3]):
            pain_points.append(PainPoint(
                category=pain_cat,
                description=pain_cat.trigger_phrases[0] if pain_cat.trigger_phrases else "",
                intensity=8 - i,
                solution_offered=pain_cat.solution_framing[0] if pain_cat.solution_framing else ""
            ))

        return pain_points

    def discover_use_cases(
        self,
        product_category: ProductCategory,
        product_type: str
    ) -> list:
        """Discover primary use cases for the product."""
        use_cases = []

        use_case_templates = {
            ProductCategory.BEAUTY_SKINCARE: [
                ("Daily skincare routine", "daily", "primary"),
                ("Special occasion prep", "occasional", "secondary"),
                ("Self-care ritual", "regular", "tertiary")
            ],
            ProductCategory.TECHNOLOGY_ELECTRONICS: [
                ("Daily productivity", "daily", "primary"),
                ("Entertainment", "regular", "secondary"),
                ("Communication", "daily", "tertiary")
            ],
            ProductCategory.FASHION_APPAREL: [
                ("Everyday wear", "daily", "primary"),
                ("Special occasions", "occasional", "secondary"),
                ("Work/professional", "regular", "tertiary")
            ],
            ProductCategory.HOME_DECOR: [
                ("Home enhancement", "regular", "primary"),
                ("Entertaining guests", "occasional", "secondary"),
                ("Personal sanctuary", "daily", "tertiary")
            ]
        }

        templates = use_case_templates.get(
            product_category,
            [("Regular use", "regular", "primary"), ("Special use", "occasional", "secondary")]
        )

        for desc, freq, priority in templates:
            use_cases.append(UseCase(
                description=desc,
                frequency=freq,
                priority=priority
            ))

        return use_cases


class EmotionalMapperEngine:
    """Engine for emotional benefit mapping."""

    def __init__(self):
        self.aspiration_templates = {
            ProductCategory.BEAUTY_SKINCARE: ["radiant confidence", "ageless beauty", "natural glow"],
            ProductCategory.FASHION_APPAREL: ["effortless style", "confident presence", "personal expression"],
            ProductCategory.TECHNOLOGY_ELECTRONICS: ["seamless productivity", "connected lifestyle", "modern efficiency"],
            ProductCategory.FITNESS_WELLNESS: ["peak performance", "vibrant health", "strong body"],
            ProductCategory.HOME_DECOR: ["sanctuary space", "elevated living", "personal style"]
        }

        self.fear_templates = {
            ProductCategory.BEAUTY_SKINCARE: ["aging skin", "dull complexion", "ineffective products"],
            ProductCategory.FASHION_APPAREL: ["outdated style", "poor fit", "fashion mistakes"],
            ProductCategory.TECHNOLOGY_ELECTRONICS: ["falling behind", "tech frustration", "missing features"],
            ProductCategory.FITNESS_WELLNESS: ["declining health", "low energy", "missed goals"],
            ProductCategory.HOME_DECOR: ["uninspired space", "poor quality", "dated design"]
        }

    def map_emotional_triggers(
        self,
        product_category: ProductCategory,
        benefits: list
    ) -> EmotionalTrigger:
        """Map emotional triggers for the product."""
        aspirations = self.aspiration_templates.get(
            product_category,
            ["improved quality of life", "personal satisfaction", "smart choice"]
        )

        fears = self.fear_templates.get(
            product_category,
            ["settling for less", "missing out", "poor decisions"]
        )

        return EmotionalTrigger(
            aspirations=aspirations,
            fears_solved=fears,
            transformation_from=fears[0] if fears else "current state",
            transformation_to=aspirations[0] if aspirations else "desired state"
        )

    def build_benefit_hierarchy(
        self,
        product_category: ProductCategory,
        features: list,
        price_tier: PriceTier
    ) -> BenefitHierarchy:
        """Build complete benefit hierarchy."""
        hierarchy = BenefitHierarchy()

        # Functional benefits from features
        hierarchy.functional_benefits = [f.benefit for f in features[:3]] if features else ["Quality performance"]

        # Emotional benefits from category
        emotion_map = {
            ProductCategory.BEAUTY_SKINCARE: ["Confidence boost", "Self-care satisfaction", "Radiant feeling"],
            ProductCategory.TECHNOLOGY_ELECTRONICS: ["Sense of control", "Peace of mind", "Accomplishment"],
            ProductCategory.FASHION_APPAREL: ["Feel put-together", "Self-expression", "Confidence"],
            ProductCategory.FITNESS_WELLNESS: ["Energized", "Accomplished", "Empowered"],
            ProductCategory.HOME_DECOR: ["Pride in space", "Comfort", "Satisfaction"]
        }
        hierarchy.emotional_benefits = emotion_map.get(
            product_category,
            ["Satisfaction", "Peace of mind"]
        )

        # Self-expressive benefits
        if price_tier in [PriceTier.PREMIUM, PriceTier.LUXURY]:
            hierarchy.self_expressive_benefits = [
                "Shows you value quality",
                "Reflects your standards",
                "Expresses your taste"
            ]

        # Social benefits for higher tiers
        if price_tier == PriceTier.LUXURY:
            hierarchy.social_benefits = [
                "Impresses others",
                "Status symbol",
                "Conversation starter"
            ]

        # Transformational benefit
        aspirations = self.aspiration_templates.get(product_category, ["better life"])
        hierarchy.transformational_benefit = f"Become your most {aspirations[0]} self"

        return hierarchy


class VisualAnalyzerEngine:
    """Engine for visual element analysis."""

    def __init__(self):
        self.mood_color_map = {
            VisualMood.ENERGETIC: ["red", "orange", "yellow", "bright"],
            VisualMood.CALM: ["blue", "green", "lavender", "soft"],
            VisualMood.LUXURIOUS: ["gold", "black", "purple", "champagne"],
            VisualMood.PLAYFUL: ["pink", "turquoise", "coral", "fun"],
            VisualMood.PROFESSIONAL: ["navy", "grey", "white", "charcoal"],
            VisualMood.NATURAL: ["brown", "green", "beige", "earth"]
        }

    def extract_color_palette(self, color_descriptions: list) -> list:
        """Extract color palette from descriptions."""
        palette = []

        color_moods = {
            "white": ("clean", "background"),
            "black": ("sophisticated", "accent"),
            "gold": ("luxury", "accent"),
            "blue": ("trustworthy", "primary"),
            "green": ("natural", "primary"),
            "red": ("energetic", "accent"),
            "pink": ("feminine", "primary"),
            "neutral": ("versatile", "background")
        }

        for i, color in enumerate(color_descriptions[:4]):
            color_lower = color.lower()
            mood, usage = color_moods.get(color_lower, ("neutral", "secondary"))
            role = "primary" if i == 0 else "secondary" if i == 1 else "accent"

            palette.append(ColorPaletteEntry(
                color_name=color,
                hex_code="#FFFFFF",  # Would be extracted from actual image
                role=role,
                mood=mood,
                usage=usage
            ))

        return palette

    def analyze_composition(self, layout_description: str) -> CompositionAnalysis:
        """Analyze visual composition."""
        layout_lower = layout_description.lower()

        layout_type = "center_focused"
        if "grid" in layout_lower:
            layout_type = "grid"
        elif "diagonal" in layout_lower:
            layout_type = "diagonal"
        elif "flat lay" in layout_lower:
            layout_type = "flat_lay"

        return CompositionAnalysis(
            layout_type=layout_type,
            focal_point="product center",
            balance="symmetric",
            negative_space="moderate"
        )

    def assess_mood(self, visual_elements: list) -> MoodAssessment:
        """Assess visual mood from elements."""
        elements_text = " ".join(visual_elements).lower()

        detected_mood = VisualMood.PROFESSIONAL
        for mood, indicators in self.mood_color_map.items():
            if any(ind in elements_text for ind in indicators):
                detected_mood = mood
                break

        energy = "high" if detected_mood in [VisualMood.ENERGETIC, VisualMood.PLAYFUL] else "medium"
        warmth = "warm" if detected_mood in [VisualMood.COZY, VisualMood.ROMANTIC] else "neutral"

        return MoodAssessment(
            overall_mood=detected_mood,
            energy_level=energy,
            sophistication="high" if detected_mood in [VisualMood.LUXURIOUS, VisualMood.MINIMALIST] else "medium",
            warmth=warmth
        )

    def determine_setting(self, context_description: str) -> SettingContext:
        """Determine setting context from description."""
        context_lower = context_description.lower()

        environment = "studio"
        if "outdoor" in context_lower or "nature" in context_lower:
            environment = "outdoor"
        elif "home" in context_lower or "living" in context_lower:
            environment = "home"
        elif "office" in context_lower or "work" in context_lower:
            environment = "office"
        elif "lifestyle" in context_lower:
            environment = "lifestyle"

        return SettingContext(
            environment=environment,
            context_description=context_description
        )


class SellingPointExtractor:
    """Engine for extracting selling points and UVPs."""

    def extract_features(
        self,
        product_description: str,
        visible_elements: list
    ) -> list:
        """Extract product features from description and visuals."""
        features = []

        # Common feature patterns
        feature_benefit_map = {
            "quality": ("Premium Quality", "Long-lasting satisfaction"),
            "design": ("Thoughtful Design", "Beautiful and functional"),
            "material": ("Superior Materials", "Feels as good as it looks"),
            "durable": ("Built to Last", "Investment that pays off"),
            "comfortable": ("Ultimate Comfort", "All-day wearability"),
            "versatile": ("Versatile Style", "Works for any occasion")
        }

        combined_text = f"{product_description} {' '.join(visible_elements)}".lower()

        for keyword, (feature_name, benefit) in feature_benefit_map.items():
            if keyword in combined_text:
                features.append(Feature(
                    feature_name=feature_name,
                    benefit=benefit,
                    proof_point="See the details",
                    visibility="visible"
                ))

        # Ensure at least 2 features
        if len(features) < 2:
            features.append(Feature(
                feature_name="Quality Crafted",
                benefit="Excellence you can see and feel",
                visibility="implied"
            ))

        return features[:5]

    def identify_quality_indicators(
        self,
        visual_cues: list,
        price_tier: PriceTier
    ) -> list:
        """Identify quality indicators from visuals."""
        indicators = []
        cues_text = " ".join(visual_cues).lower()

        for indicator in QualityIndicator:
            if any(cue.lower() in cues_text for cue in indicator.visual_cues[:2]):
                indicators.append(indicator)

        # Add tier-appropriate indicators
        if price_tier in [PriceTier.PREMIUM, PriceTier.LUXURY]:
            if QualityIndicator.PREMIUM_MATERIALS not in indicators:
                indicators.append(QualityIndicator.PREMIUM_MATERIALS)

        return indicators[:5]

    def generate_uvps(
        self,
        product_category: ProductCategory,
        features: list,
        price_tier: PriceTier
    ) -> list:
        """Generate unique value propositions."""
        uvps = []

        # Category-specific UVPs
        category_uvps = {
            ProductCategory.BEAUTY_SKINCARE: [
                ("Results you can see", "Visible improvement backed by science"),
                ("Clean ingredients", "Effective without compromise"),
                ("Luxury experience", "Transform your daily ritual")
            ],
            ProductCategory.TECHNOLOGY_ELECTRONICS: [
                ("Seamless integration", "Works with your life"),
                ("Future-proof design", "Technology that grows with you"),
                ("Intuitive experience", "Powerful yet simple")
            ],
            ProductCategory.FASHION_APPAREL: [
                ("Timeless style", "Transcends trends"),
                ("Perfect fit", "Designed for real bodies"),
                ("Quality construction", "Looks better with time")
            ],
            ProductCategory.HOME_DECOR: [
                ("Elevated everyday", "Luxury meets functionality"),
                ("Curated design", "Pieces that tell a story"),
                ("Built to last", "Heirloom quality")
            ]
        }

        templates = category_uvps.get(
            product_category,
            [("Quality assured", "Excellence in every detail"), ("Value delivered", "Worth every penny")]
        )

        for i, (prop, diff) in enumerate(templates[:3]):
            uvps.append(UniqueValueProposition(
                proposition=prop,
                differentiation=diff,
                priority=i + 1
            ))

        return uvps


class CreativeRecommenderEngine:
    """Engine for ad creative recommendations."""

    def __init__(self):
        self.cta_templates = {
            PriceTier.BUDGET: ["Get Yours", "Shop Now", "Grab It"],
            PriceTier.MID_RANGE: ["Shop Now", "Discover More", "Get Started"],
            PriceTier.PREMIUM: ["Discover", "Explore", "Experience"],
            PriceTier.LUXURY: ["Inquire", "Discover the Collection", "Experience Excellence"]
        }

    def recommend_headline_angle(
        self,
        product_category: ProductCategory,
        price_tier: PriceTier,
        primary_pain_point: Optional[PainPoint] = None
    ) -> HeadlineAngle:
        """Recommend best headline angle."""
        # Get effectiveness scores for this category
        effectiveness = {}
        for angle in HeadlineAngle:
            scores = angle.effectiveness_score
            category_key = product_category.value.split("_")[0]
            effectiveness[angle] = scores.get(category_key, scores.get("general", 5))

        # Adjust for price tier
        if price_tier in [PriceTier.LUXURY, PriceTier.PREMIUM]:
            effectiveness[HeadlineAngle.ASPIRATION] += 3
            effectiveness[HeadlineAngle.TRANSFORMATION] += 2

        # Boost problem-solution if pain point identified
        if primary_pain_point:
            effectiveness[HeadlineAngle.PROBLEM_SOLUTION] += 2

        return max(effectiveness, key=effectiveness.get)

    def generate_headline_examples(
        self,
        angle: HeadlineAngle,
        product_type: str,
        benefits: list
    ) -> list:
        """Generate headline examples for the recommended angle."""
        templates = {
            HeadlineAngle.PROBLEM_SOLUTION: [
                f"Stop struggling with {product_type}. Start loving it.",
                f"Finally, {product_type} that actually works.",
                f"The {product_type} problem? Solved."
            ],
            HeadlineAngle.TRANSFORMATION: [
                f"Transform your routine with {product_type}",
                f"Before & after: The {product_type} difference",
                f"See the change in just days"
            ],
            HeadlineAngle.BENEFIT_FOCUSED: [
                f"{benefits[0] if benefits else 'Quality'} - guaranteed",
                f"Experience {benefits[0].lower() if benefits else 'excellence'} today",
                f"Why this {product_type} changes everything"
            ],
            HeadlineAngle.SOCIAL_PROOF: [
                f"Join 10,000+ happy customers",
                f"The {product_type} everyone's talking about",
                f"See why customers rate us 5 stars"
            ],
            HeadlineAngle.ASPIRATION: [
                f"The {product_type} you deserve",
                f"Elevate your everyday",
                f"For those who expect more"
            ]
        }

        return templates.get(angle, [f"Discover the perfect {product_type}"])

    def recommend_cta(
        self,
        price_tier: PriceTier,
        funnel_stage: str = "MOF"
    ) -> list:
        """Recommend CTAs based on tier and funnel stage."""
        base_ctas = self.cta_templates.get(price_tier, ["Shop Now"])

        if funnel_stage == "TOF":
            return ["Learn More", "See How", "Discover"] + base_ctas[:1]
        elif funnel_stage == "BOF":
            return base_ctas + ["Buy Now", "Add to Cart"]

        return base_ctas

    def recommend_platforms(
        self,
        product_category: ProductCategory,
        visual_mood: VisualMood,
        price_tier: PriceTier
    ) -> list:
        """Recommend best advertising platforms."""
        platforms = []

        # Start with mood-based recommendations
        platforms.extend([
            AdPlatform[p.upper().replace(" ", "_")]
            for p in visual_mood.target_platforms[:2]
            if hasattr(AdPlatform, p.upper().replace(" ", "_"))
        ])

        # Add category-specific platforms
        category_platforms = {
            ProductCategory.FASHION_APPAREL: [AdPlatform.INSTAGRAM_FEED, AdPlatform.PINTEREST],
            ProductCategory.BEAUTY_SKINCARE: [AdPlatform.INSTAGRAM_REELS, AdPlatform.TIKTOK],
            ProductCategory.TECHNOLOGY_ELECTRONICS: [AdPlatform.YOUTUBE_INSTREAM, AdPlatform.GOOGLE_DISPLAY],
            ProductCategory.HOME_DECOR: [AdPlatform.PINTEREST, AdPlatform.META_FEED],
            ProductCategory.FITNESS_WELLNESS: [AdPlatform.INSTAGRAM_REELS, AdPlatform.YOUTUBE_SHORTS]
        }

        for platform in category_platforms.get(product_category, []):
            if platform not in platforms:
                platforms.append(platform)

        # Ensure we have at least 3 recommendations
        default_platforms = [AdPlatform.META_FEED, AdPlatform.INSTAGRAM_FEED, AdPlatform.GOOGLE_DISPLAY]
        for platform in default_platforms:
            if platform not in platforms and len(platforms) < 5:
                platforms.append(platform)

        return platforms[:5]

    def create_recommendations(
        self,
        identification: ProductIdentification,
        mood: MoodAssessment,
        pain_points: list,
        benefits: BenefitHierarchy
    ) -> AdCreativeRecommendation:
        """Create complete creative recommendations."""
        headline_angle = self.recommend_headline_angle(
            identification.category,
            identification.price_tier,
            pain_points[0] if pain_points else None
        )

        headline_examples = self.generate_headline_examples(
            headline_angle,
            identification.product_type,
            benefits.functional_benefits
        )

        ctas = self.recommend_cta(identification.price_tier)
        platforms = self.recommend_platforms(
            identification.category,
            mood.overall_mood,
            identification.price_tier
        )

        return AdCreativeRecommendation(
            headline_angle=headline_angle,
            headline_examples=headline_examples,
            primary_hook=benefits.primary_benefit,
            hook_alternatives=benefits.emotional_benefits[:3],
            visual_style=mood.overall_mood.typography_style,
            cta_approach=identification.price_tier.messaging_tone[0],
            cta_examples=ctas,
            platform_recommendations=platforms
        )


class ProductAnalyzer:
    """Main orchestrator for complete product analysis."""

    def __init__(self):
        self.identifier = ProductIdentifierEngine()
        self.audience_profiler = AudienceProfilerEngine()
        self.emotional_mapper = EmotionalMapperEngine()
        self.visual_analyzer = VisualAnalyzerEngine()
        self.selling_point_extractor = SellingPointExtractor()
        self.creative_recommender = CreativeRecommenderEngine()

    def analyze(
        self,
        image_source: str,
        product_description: str,
        visual_cues: list,
        color_descriptions: list,
        layout_description: str = "",
        context_description: str = "",
        brand_name: Optional[str] = None
    ) -> ProductAnalysis:
        """Perform complete product analysis."""

        # Phase 1: Identify
        identification = self.identifier.create_identification(
            product_description, visual_cues, brand_name
        )

        # Phase 2: Profile
        demographics = self.audience_profiler.profile_demographics(
            identification.category,
            identification.price_tier
        )

        psychographics = self.audience_profiler.profile_psychographics(
            product_description, visual_cues
        )

        pain_points = self.audience_profiler.identify_pain_points(
            identification.category, []
        )

        use_cases = self.audience_profiler.discover_use_cases(
            identification.category,
            identification.product_type
        )

        # Phase 3: Extract emotions
        emotional_triggers = self.emotional_mapper.map_emotional_triggers(
            identification.category, []
        )

        features = self.selling_point_extractor.extract_features(
            product_description, visual_cues
        )

        benefit_hierarchy = self.emotional_mapper.build_benefit_hierarchy(
            identification.category,
            features,
            identification.price_tier
        )

        # Phase 4: Visualize
        color_palette = self.visual_analyzer.extract_color_palette(color_descriptions)
        composition = self.visual_analyzer.analyze_composition(layout_description)
        mood = self.visual_analyzer.assess_mood(visual_cues + color_descriptions)
        setting = self.visual_analyzer.determine_setting(context_description)

        # Phase 5: Selling points
        quality_indicators = self.selling_point_extractor.identify_quality_indicators(
            visual_cues, identification.price_tier
        )

        uvps = self.selling_point_extractor.generate_uvps(
            identification.category,
            features,
            identification.price_tier
        )

        # Phase 6: Creative recommendations
        creative_recommendations = self.creative_recommender.create_recommendations(
            identification, mood, pain_points, benefit_hierarchy
        )

        return ProductAnalysis(
            image_source=image_source,
            identification=identification,
            demographics=demographics,
            psychographics=psychographics,
            pain_points=pain_points,
            use_cases=use_cases,
            emotional_triggers=emotional_triggers,
            benefit_hierarchy=benefit_hierarchy,
            color_palette=color_palette,
            composition=composition,
            mood=mood,
            setting=setting,
            features=features,
            quality_indicators=quality_indicators,
            uvps=uvps,
            creative_recommendations=creative_recommendations
        )

    def analyze_for_audience(
        self,
        image_source: str,
        product_description: str,
        visual_cues: list
    ) -> dict:
        """Quick analysis focused on audience profiling."""
        identification = self.identifier.create_identification(
            product_description, visual_cues, None
        )
        demographics = self.audience_profiler.profile_demographics(
            identification.category, identification.price_tier
        )
        psychographics = self.audience_profiler.profile_psychographics(
            product_description, visual_cues
        )
        pain_points = self.audience_profiler.identify_pain_points(
            identification.category, []
        )

        return {
            "demographics": demographics,
            "psychographics": psychographics,
            "pain_points": pain_points,
            "targeting_summary": demographics.targeting_summary,
            "messaging_hooks": psychographics.messaging_hooks
        }

    def analyze_for_emotions(
        self,
        image_source: str,
        product_description: str,
        visual_cues: list
    ) -> dict:
        """Quick analysis focused on emotional mapping."""
        identification = self.identifier.create_identification(
            product_description, visual_cues, None
        )
        features = self.selling_point_extractor.extract_features(
            product_description, visual_cues
        )
        emotional_triggers = self.emotional_mapper.map_emotional_triggers(
            identification.category, []
        )
        benefit_hierarchy = self.emotional_mapper.build_benefit_hierarchy(
            identification.category, features, identification.price_tier
        )

        return {
            "emotional_triggers": emotional_triggers,
            "benefit_hierarchy": benefit_hierarchy,
            "transformation_arc": emotional_triggers.transformation_arc,
            "primary_benefit": benefit_hierarchy.primary_benefit
        }

    def analyze_for_creative(
        self,
        image_source: str,
        product_description: str,
        visual_cues: list,
        color_descriptions: list
    ) -> dict:
        """Quick analysis focused on creative recommendations."""
        identification = self.identifier.create_identification(
            product_description, visual_cues, None
        )
        mood = self.visual_analyzer.assess_mood(visual_cues + color_descriptions)
        pain_points = self.audience_profiler.identify_pain_points(
            identification.category, []
        )
        features = self.selling_point_extractor.extract_features(
            product_description, visual_cues
        )
        benefit_hierarchy = self.emotional_mapper.build_benefit_hierarchy(
            identification.category, features, identification.price_tier
        )

        recommendations = self.creative_recommender.create_recommendations(
            identification, mood, pain_points, benefit_hierarchy
        )

        return {
            "recommendations": recommendations,
            "headline_angle": recommendations.headline_angle.value,
            "headlines": recommendations.headline_examples,
            "ctas": recommendations.cta_examples,
            "platforms": [p.value for p in recommendations.platform_recommendations]
        }


# ════════════════════════════════════════════════════════════════════════════════
# REPORTER - ASCII Dashboard Generation
# ════════════════════════════════════════════════════════════════════════════════

class ProductAnalysisReporter:
    """Generate ASCII dashboard reports for product analysis."""

    def __init__(self, analysis: ProductAnalysis):
        self.analysis = analysis

    def _progress_bar(self, value: int, max_val: int = 100, width: int = 20) -> str:
        """Generate ASCII progress bar."""
        filled = int((value / max_val) * width)
        return f"[{'█' * filled}{'░' * (width - filled)}] {value}%"

    def _score_indicator(self, score: int, max_score: int = 10) -> str:
        """Generate score indicator."""
        filled = score
        empty = max_score - score
        return f"{'●' * filled}{'○' * empty} {score}/{max_score}"

    def generate_report(self) -> str:
        """Generate complete analysis report."""
        a = self.analysis

        report = f"""
╔══════════════════════════════════════════════════════════════════════════════╗
║                        PRODUCT ANALYSIS REPORT                               ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  Product: {a.product_summary:<65} ║
║  Category: {a.identification.category.value:<64} ║
║  Analysis Date: {a.analysis_date:<59} ║
║  Completeness: {self._progress_bar(a.analysis_score):<60} ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌──────────────────────────────────────────────────────────────────────────────┐
│                          PRODUCT IDENTIFICATION                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │                         PRODUCT PROFILE                                │  │
│  │                                                                        │  │
│  │  Category: {a.identification.category.value:<55} │  │
│  │  Type: {a.identification.product_type:<59} │  │
│  │  Brand: {(a.identification.brand_name or 'Not visible'):<58} │  │
│  │  Price Tier: {a.identification.price_tier.value:<53} │  │
│  │                                                                        │  │
│  │  Industry: {a.identification.industry:<55} │  │
│  │  Subcategory: {a.identification.subcategory:<52} │  │
│  │  Stage: {a.identification.product_stage:<58} │  │
│  │  Confidence: {self._progress_bar(int(a.identification.confidence_score * 100), width=15):<40} │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  Quality Indicators Detected:                                                │
"""

        for indicator in a.quality_indicators[:5]:
            report += f"│    • {indicator.value:<70} │\n"

        if not a.quality_indicators:
            report += "│    • No specific quality indicators detected                                │\n"

        report += f"""│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│                          TARGET AUDIENCE ANALYSIS                            │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  DEMOGRAPHICS                                                                │
│  ├── Age Range: {a.demographics.age_range_primary[0]}-{a.demographics.age_range_primary[1]:<56} │
│  ├── Gender: {a.demographics.gender_primary:<60} │
│  ├── Income: {a.demographics.income_level:<60} │
│  ├── Location: {a.demographics.location_type:<57} │
│  └── Education: {a.demographics.education_level:<55} │
│                                                                              │
│  PSYCHOGRAPHICS                                                              │
│  ├── Lifestyle: {a.psychographics.lifestyle.value:<56} │
│  ├── Values: {', '.join(a.psychographics.values[:3]):<60} │
│  └── Interests: {', '.join(a.psychographics.interests[:3]):<55} │
│                                                                              │
│  PAIN POINTS ADDRESSED                                                       │
"""

        for pp in a.pain_points[:3]:
            report += f"│    [{self._score_indicator(pp.intensity)}] {pp.category.value:<50} │\n"

        report += f"""│                                                                              │
│  USE CASES                                                                   │
"""

        for uc in a.use_cases[:3]:
            report += f"│    • {uc.description:<45} ({uc.priority})      │\n"

        report += f"""│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│                        EMOTIONAL BENEFITS MAPPING                            │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │                       EMOTIONAL LANDSCAPE                              │  │
│  │                                                                        │  │
│  │  Aspirations:                                                          │  │
"""

        for asp in a.emotional_triggers.aspirations[:3]:
            report += f"│  │    ├── {asp:<59} │  │\n"

        report += f"""│  │                                                                        │  │
│  │  Fears/Problems Solved:                                                │  │
"""

        for fear in a.emotional_triggers.fears_solved[:3]:
            report += f"│  │    ├── {fear:<59} │  │\n"

        report += f"""│  │                                                                        │  │
│  │  Transformation Promise:                                               │  │
│  │    FROM: {a.emotional_triggers.transformation_from:<57} │  │
│  │    TO:   {a.emotional_triggers.transformation_to:<57} │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  BENEFIT HIERARCHY                                                           │
│  ├── Functional: {', '.join(a.benefit_hierarchy.functional_benefits[:2]):<54} │
│  ├── Emotional: {', '.join(a.benefit_hierarchy.emotional_benefits[:2]):<56} │
│  ├── Self-expressive: {', '.join(a.benefit_hierarchy.self_expressive_benefits[:2]) or 'N/A':<49} │
│  └── Social: {', '.join(a.benefit_hierarchy.social_benefits[:2]) or 'N/A':<59} │
│                                                                              │
│  Primary Benefit: {a.benefit_hierarchy.primary_benefit:<53} │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│                         VISUAL ELEMENT ANALYSIS                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  COLOR PALETTE                                                               │
"""

        for color in a.color_palette[:4]:
            report += f"│    • {color.color_name:<15} | {color.role:<12} | {color.mood:<35} │\n"

        if not a.color_palette:
            report += "│    • No colors extracted                                                    │\n"

        report += f"""│                                                                              │
│  COMPOSITION                                                                 │
│  ├── Layout: {a.composition.layout_type:<59} │
│  ├── Balance: {a.composition.balance:<58} │
│  ├── Negative Space: {a.composition.negative_space:<50} │
│  └── Composition Score: {self._score_indicator(a.composition.composition_score):<39} │
│                                                                              │
│  MOOD & ATMOSPHERE                                                           │
│  ├── Overall Mood: {a.mood.overall_mood.value:<52} │
│  ├── Energy Level: {a.mood.energy_level:<52} │
│  ├── Sophistication: {a.mood.sophistication:<50} │
│  └── Warmth: {a.mood.warmth:<59} │
│                                                                              │
│  SETTING CONTEXT                                                             │
│    {a.setting.setting_summary:<72} │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│                         SELLING POINTS EXTRACTION                            │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  KEY FEATURES                                                                │
"""

        for feature in a.features[:4]:
            report += f"│    • {feature.feature_name:<20} → {feature.benefit:<41} │\n"

        report += f"""│                                                                              │
│  UNIQUE VALUE PROPOSITIONS                                                   │
"""

        for uvp in a.uvps[:3]:
            report += f"│    P{uvp.priority}. {uvp.proposition:<25} | {uvp.differentiation:<35} │\n"

        report += f"""│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│                       AD CREATIVE RECOMMENDATIONS                            │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  HEADLINE STRATEGY                                                           │
│    Angle: {a.creative_recommendations.headline_angle.value:<62} │
│                                                                              │
│  Headline Examples:                                                          │
"""

        for headline in a.creative_recommendations.headline_examples[:3]:
            report += f"│    • {headline:<70} │\n"

        report += f"""│                                                                              │
│  PRIMARY HOOK                                                                │
│    {a.creative_recommendations.primary_hook:<72} │
│                                                                              │
│  VISUAL STYLE                                                                │
│    {a.creative_recommendations.visual_style:<72} │
│                                                                              │
│  CTA APPROACH: {a.creative_recommendations.cta_approach:<57} │
│    Examples: {', '.join(a.creative_recommendations.cta_examples[:3]):<60} │
│                                                                              │
│  PLATFORM RECOMMENDATIONS                                                    │
"""

        for platform in a.creative_recommendations.platform_recommendations[:4]:
            report += f"│    • {platform.value:<30} | Ratio: {platform.aspect_ratio:<27} │\n"

        report += f"""│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════
                              END OF REPORT
                    Generated by PRODUCT.ANALYZER.OS.EXE
═══════════════════════════════════════════════════════════════════════════════
"""

        return report

    def generate_quick_summary(self) -> str:
        """Generate quick summary card."""
        a = self.analysis

        return f"""
┌─────────────────────────────────────────────────┐
│         PRODUCT ANALYSIS QUICK CARD             │
├─────────────────────────────────────────────────┤
│ Product: {a.product_summary[:36]:<38} │
│ Category: {a.identification.category.value[:36]:<37} │
│ Price Tier: {a.identification.price_tier.value[:34]:<35} │
│ Target: {a.demographics.targeting_summary[:38]:<39} │
│ Primary Hook: {a.benefit_hierarchy.primary_benefit[:32]:<33} │
│ Best Platform: {a.creative_recommendations.platform_recommendations[0].value if a.creative_recommendations.platform_recommendations else 'N/A':<31} │
│ Headline Angle: {a.creative_recommendations.headline_angle.value:<30} │
│ Analysis Score: {self._progress_bar(a.analysis_score, width=12):<30} │
└─────────────────────────────────────────────────┘
"""

    def generate_audience_report(self) -> str:
        """Generate audience-focused report."""
        a = self.analysis

        report = f"""
╔══════════════════════════════════════════════════════════════════════════════╗
║                         AUDIENCE PROFILE REPORT                              ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  Product: {a.product_summary:<65} ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌──────────────────────────────────────────────────────────────────────────────┐
│                          DEMOGRAPHIC PROFILE                                 │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  PRIMARY TARGET                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │  Age: {a.demographics.age_range_primary[0]}-{a.demographics.age_range_primary[1]:<61}│  │
│  │  Gender: {a.demographics.gender_primary:<58}│  │
│  │  Income: {a.demographics.income_level:<58}│  │
│  │  Location: {a.demographics.location_type:<56}│  │
│  │  Education: {a.demographics.education_level:<55}│  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  Meta Targeting Summary: {a.demographics.targeting_summary:<45} │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│                         PSYCHOGRAPHIC PROFILE                                │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Lifestyle: {a.psychographics.lifestyle.value:<60} │
│                                                                              │
│  Values:                                                                     │
"""

        for value in a.psychographics.values[:4]:
            report += f"│    • {value:<70} │\n"

        report += f"""│                                                                              │
│  Interests:                                                                  │
"""

        for interest in a.psychographics.interests[:5]:
            report += f"│    • {interest:<70} │\n"

        report += f"""│                                                                              │
│  Messaging Hooks:                                                            │
"""

        for hook in a.psychographics.messaging_hooks[:4]:
            report += f"│    → {hook:<70} │\n"

        report += f"""│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│                         PAIN POINTS & USE CASES                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  PAIN POINTS ADDRESSED                                                       │
"""

        for pp in a.pain_points:
            report += f"│                                                                              │\n"
            report += f"│    {pp.category.value.upper():<72} │\n"
            report += f"│    Intensity: {self._score_indicator(pp.intensity):<58} │\n"
            report += f"│    Solution: {pp.ad_hook:<59} │\n"

        report += f"""│                                                                              │
│  PRIMARY USE CASES                                                           │
"""

        for uc in a.use_cases:
            report += f"│    [{uc.priority.upper():<9}] {uc.description:<45} ({uc.frequency}) │\n"

        report += f"""│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
"""

        return report

    def generate_creative_brief(self) -> str:
        """Generate creative brief for ad production."""
        a = self.analysis
        r = a.creative_recommendations

        return f"""
╔══════════════════════════════════════════════════════════════════════════════╗
║                           CREATIVE BRIEF                                     ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  Product: {a.product_summary:<65} ║
║  Date: {a.analysis_date:<69} ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌──────────────────────────────────────────────────────────────────────────────┐
│                         CREATIVE DIRECTION                                   │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  HEADLINE STRATEGY                                                           │
│  ═══════════════                                                             │
│  Recommended Angle: {r.headline_angle.value:<51} │
│                                                                              │
│  Headline Options:                                                           │
│    1. {r.headline_examples[0] if r.headline_examples else 'N/A':<71} │
│    2. {r.headline_examples[1] if len(r.headline_examples) > 1 else 'N/A':<71} │
│    3. {r.headline_examples[2] if len(r.headline_examples) > 2 else 'N/A':<71} │
│                                                                              │
│  PRIMARY HOOK                                                                │
│  ════════════                                                                │
│    {r.primary_hook:<72} │
│                                                                              │
│  Alternative Hooks:                                                          │
"""

        brief = ""
        for hook in r.hook_alternatives[:3]:
            brief += f"│    • {hook:<70} │\n"

        brief += f"""│                                                                              │
│  VISUAL DIRECTION                                                            │
│  ════════════════                                                            │
│  Style: {r.visual_style:<68} │
│  Mood: {a.mood.overall_mood.value:<69} │
│  Energy: {a.mood.energy_level:<67} │
│                                                                              │
│  Color Palette:                                                              │
"""

        for color in a.color_palette[:3]:
            brief += f"│    • {color.color_name:<20} - {color.mood:<47} │\n"

        brief += f"""│                                                                              │
│  CTA STRATEGY                                                                │
│  ════════════                                                                │
│  Approach: {r.cta_approach:<65} │
│                                                                              │
│  CTA Options:                                                                │
"""

        for cta in r.cta_examples[:4]:
            brief += f"│    → {cta:<70} │\n"

        brief += f"""│                                                                              │
│  PLATFORM SPECIFICATIONS                                                     │
│  ═══════════════════════                                                     │
"""

        for platform in r.platform_recommendations[:4]:
            guidelines = platform.text_guidelines
            brief += f"│    {platform.value.upper():<74} │\n"
            brief += f"│      Aspect Ratio: {platform.aspect_ratio:<53} │\n"
            brief += f"│      Headline Max: {guidelines.get('headline_length', 40)} chars                                         │\n"
            brief += f"│                                                                              │\n"

        brief += f"""│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│                         KEY MESSAGES                                         │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Transformation Promise:                                                     │
│    {a.emotional_triggers.transformation_arc:<72} │
│                                                                              │
│  Key Benefits to Highlight:                                                  │
"""

        for benefit in a.benefit_hierarchy.functional_benefits[:2]:
            brief += f"│    ✓ {benefit:<70} │\n"
        for benefit in a.benefit_hierarchy.emotional_benefits[:2]:
            brief += f"│    ♥ {benefit:<70} │\n"

        brief += f"""│                                                                              │
│  UVP Focus:                                                                  │
"""

        for uvp in a.uvps[:2]:
            brief += f"│    → {uvp.uvp_statement[:70]:<70} │\n"

        brief += f"""│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════
                           END OF CREATIVE BRIEF
                    Generated by PRODUCT.ANALYZER.OS.EXE
═══════════════════════════════════════════════════════════════════════════════
"""

        return brief


# ════════════════════════════════════════════════════════════════════════════════
# CLI INTERFACE
# ════════════════════════════════════════════════════════════════════════════════

def main():
    """Main CLI entry point."""
    import argparse

    parser = argparse.ArgumentParser(
        description="PRODUCT.ANALYZER.OS.EXE - Product Advertising Analysis System",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  product-analyzer analyze --description "Premium face serum" --cues "glass bottle" "gold cap"
  product-analyzer audience --description "Athletic shoes" --cues "mesh" "foam sole"
  product-analyzer emotions --description "Luxury handbag" --cues "leather" "gold hardware"
  product-analyzer creative --description "Smart watch" --cues "metal" "display"
  product-analyzer demo

Report Issues: github.com/murphbeck/product-analyzer
        """
    )

    subparsers = parser.add_subparsers(dest="command", help="Analysis commands")

    # Analyze command
    analyze_parser = subparsers.add_parser("analyze", help="Full product analysis")
    analyze_parser.add_argument("--image", "-i", default="uploaded_image", help="Image source/path")
    analyze_parser.add_argument("--description", "-d", required=True, help="Product description")
    analyze_parser.add_argument("--cues", "-c", nargs="+", default=[], help="Visual cues")
    analyze_parser.add_argument("--colors", nargs="+", default=[], help="Color descriptions")
    analyze_parser.add_argument("--layout", default="", help="Layout description")
    analyze_parser.add_argument("--context", default="", help="Setting context")
    analyze_parser.add_argument("--brand", "-b", default=None, help="Brand name if visible")
    analyze_parser.add_argument("--output", "-o", choices=["full", "summary", "brief"], default="full")

    # Audience command
    audience_parser = subparsers.add_parser("audience", help="Audience profiling focus")
    audience_parser.add_argument("--description", "-d", required=True, help="Product description")
    audience_parser.add_argument("--cues", "-c", nargs="+", default=[], help="Visual cues")

    # Emotions command
    emotions_parser = subparsers.add_parser("emotions", help="Emotional mapping focus")
    emotions_parser.add_argument("--description", "-d", required=True, help="Product description")
    emotions_parser.add_argument("--cues", "-c", nargs="+", default=[], help="Visual cues")

    # Creative command
    creative_parser = subparsers.add_parser("creative", help="Ad creative recommendations")
    creative_parser.add_argument("--description", "-d", required=True, help="Product description")
    creative_parser.add_argument("--cues", "-c", nargs="+", default=[], help="Visual cues")
    creative_parser.add_argument("--colors", nargs="+", default=[], help="Color descriptions")

    # Demo command
    demo_parser = subparsers.add_parser("demo", help="Run demo analysis")
    demo_parser.add_argument("--type", "-t", choices=["skincare", "tech", "fashion", "home"], default="skincare")

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        return

    analyzer = ProductAnalyzer()

    if args.command == "analyze":
        analysis = analyzer.analyze(
            image_source=args.image,
            product_description=args.description,
            visual_cues=args.cues,
            color_descriptions=args.colors,
            layout_description=args.layout,
            context_description=args.context,
            brand_name=args.brand
        )
        reporter = ProductAnalysisReporter(analysis)

        if args.output == "full":
            print(reporter.generate_report())
        elif args.output == "summary":
            print(reporter.generate_quick_summary())
        else:
            print(reporter.generate_creative_brief())

    elif args.command == "audience":
        result = analyzer.analyze_for_audience(
            image_source="uploaded_image",
            product_description=args.description,
            visual_cues=args.cues
        )

        analysis = analyzer.analyze(
            image_source="uploaded_image",
            product_description=args.description,
            visual_cues=args.cues,
            color_descriptions=[],
            layout_description="",
            context_description=""
        )
        reporter = ProductAnalysisReporter(analysis)
        print(reporter.generate_audience_report())

    elif args.command == "emotions":
        result = analyzer.analyze_for_emotions(
            image_source="uploaded_image",
            product_description=args.description,
            visual_cues=args.cues
        )

        print("\n" + "=" * 60)
        print("EMOTIONAL MAPPING ANALYSIS")
        print("=" * 60)
        print(f"\nTransformation Arc:")
        print(f"  {result['emotional_triggers'].transformation_arc}")
        print(f"\nAspirations:")
        for asp in result['emotional_triggers'].aspirations:
            print(f"  • {asp}")
        print(f"\nFears Addressed:")
        for fear in result['emotional_triggers'].fears_solved:
            print(f"  • {fear}")
        print(f"\nPrimary Benefit: {result['primary_benefit']}")
        print(f"\nBenefit Hierarchy:")
        hierarchy = result['benefit_hierarchy']
        print(f"  Functional: {', '.join(hierarchy.functional_benefits[:2])}")
        print(f"  Emotional: {', '.join(hierarchy.emotional_benefits[:2])}")
        if hierarchy.self_expressive_benefits:
            print(f"  Self-expressive: {', '.join(hierarchy.self_expressive_benefits[:2])}")
        if hierarchy.social_benefits:
            print(f"  Social: {', '.join(hierarchy.social_benefits[:2])}")
        print("=" * 60)

    elif args.command == "creative":
        result = analyzer.analyze_for_creative(
            image_source="uploaded_image",
            product_description=args.description,
            visual_cues=args.cues,
            color_descriptions=args.colors
        )

        analysis = analyzer.analyze(
            image_source="uploaded_image",
            product_description=args.description,
            visual_cues=args.cues,
            color_descriptions=args.colors,
            layout_description="",
            context_description=""
        )
        reporter = ProductAnalysisReporter(analysis)
        print(reporter.generate_creative_brief())

    elif args.command == "demo":
        demo_products = {
            "skincare": {
                "description": "Premium anti-aging face serum",
                "cues": ["glass dropper bottle", "gold cap", "minimalist packaging", "clean design"],
                "colors": ["white", "gold", "clear"],
                "brand": "Luxe Skin"
            },
            "tech": {
                "description": "Wireless noise-canceling headphones",
                "cues": ["premium materials", "sleek design", "soft ear cushions", "metal accents"],
                "colors": ["matte black", "silver", "rose gold"],
                "brand": "SoundPro"
            },
            "fashion": {
                "description": "Sustainable cotton dress",
                "cues": ["flowing fabric", "natural texture", "minimalist style", "eco tag"],
                "colors": ["sage green", "cream", "natural"],
                "brand": "EcoStyle"
            },
            "home": {
                "description": "Handcrafted ceramic vase",
                "cues": ["artisan quality", "natural imperfections", "organic shape", "glazed finish"],
                "colors": ["terracotta", "cream", "earth tones"],
                "brand": None
            }
        }

        demo = demo_products[args.type]

        analysis = analyzer.analyze(
            image_source=f"demo_{args.type}_product.jpg",
            product_description=demo["description"],
            visual_cues=demo["cues"],
            color_descriptions=demo["colors"],
            layout_description="center-focused product shot",
            context_description="studio setting with soft lighting",
            brand_name=demo.get("brand")
        )

        reporter = ProductAnalysisReporter(analysis)
        print(reporter.generate_report())


if __name__ == "__main__":
    main()
```

---

## QUICK COMMANDS

- `/product-analyzer` - Full product analysis
- `/product-analyzer [image]` - Analyze specific image
- `/product-analyzer audience` - Audience profiling focus
- `/product-analyzer emotions` - Emotional mapping focus
- `/product-analyzer creative` - Ad creative recommendations
- `/product-analyzer demo` - Run demo analysis

$ARGUMENTS
