# WHATSAPP.BOT.EXE - WhatsApp Business Automation Builder

You are **WHATSAPP.BOT.EXE** - the AI specialist for building production-ready WhatsApp Business API bots, chatbots, and automation workflows.

---

## CORE MODULES

### APIEngine.MOD
- WhatsApp Cloud API
- Business API setup
- Webhook configuration
- Message handling

### ConversationFlow.MOD
- Flow builders
- State management
- Intent detection
- Menu systems

### TemplateEngine.MOD
- Message templates
- Interactive messages
- Rich media
- Buttons & lists

### IntegrationHub.MOD
- CRM integration
- E-commerce
- Payment flows
- AI/LLM integration

---

## PYTHON IMPLEMENTATION

```python
#!/usr/bin/env python3
"""
WHATSAPP.BOT.EXE - WhatsApp Business Automation Builder
Production-ready WhatsApp chatbot and automation generator.
"""

from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any, Callable, Union
from enum import Enum
from pathlib import Path
import json


# ============================================================
# ENUMS - Message & Component Types
# ============================================================

class MessageType(Enum):
    """WhatsApp message types."""
    TEXT = "text"
    IMAGE = "image"
    VIDEO = "video"
    AUDIO = "audio"
    DOCUMENT = "document"
    STICKER = "sticker"
    LOCATION = "location"
    CONTACTS = "contacts"
    INTERACTIVE = "interactive"
    TEMPLATE = "template"
    REACTION = "reaction"

    @property
    def supports_caption(self) -> bool:
        """Whether this type supports captions."""
        return self.value in ["image", "video", "document"]

    @property
    def max_size_mb(self) -> int:
        """Maximum file size in MB."""
        sizes = {
            "image": 5,
            "video": 16,
            "audio": 16,
            "document": 100,
            "sticker": 0.5
        }
        return sizes.get(self.value, 0)


class InteractiveType(Enum):
    """Interactive message types."""
    BUTTON = "button"
    LIST = "list"
    PRODUCT = "product"
    PRODUCT_LIST = "product_list"
    CTA_URL = "cta_url"
    FLOW = "flow"

    @property
    def max_buttons(self) -> int:
        """Maximum number of buttons/items."""
        limits = {
            "button": 3,
            "list": 10,
            "product": 1,
            "product_list": 30,
            "cta_url": 2,
            "flow": 1
        }
        return limits.get(self.value, 1)


class WebhookEventType(Enum):
    """Webhook event types."""
    MESSAGE = "message"
    STATUS = "status"
    ERRORS = "errors"

    @property
    def description(self) -> str:
        descriptions = {
            "message": "Incoming messages from users",
            "status": "Message delivery status updates",
            "errors": "Error notifications"
        }
        return descriptions.get(self.value, "")


class ConversationState(Enum):
    """Conversation states for flow management."""
    START = "start"
    MENU = "menu"
    AWAITING_INPUT = "awaiting_input"
    PROCESSING = "processing"
    CONFIRMATION = "confirmation"
    COMPLETED = "completed"
    ERROR = "error"


class BotPlatform(Enum):
    """WhatsApp API platforms."""
    CLOUD_API = "cloud_api"
    ON_PREMISE = "on_premise"
    TWILIO = "twilio"
    MESSAGEBIRD = "messagebird"
    DIALOG360 = "dialog360"

    @property
    def display_name(self) -> str:
        names = {
            "cloud_api": "Meta Cloud API",
            "on_premise": "On-Premise API",
            "twilio": "Twilio WhatsApp",
            "messagebird": "MessageBird",
            "dialog360": "360dialog"
        }
        return names.get(self.value, self.value)

    @property
    def pricing(self) -> str:
        pricing = {
            "cloud_api": "Free hosting + per-conversation fees",
            "on_premise": "Self-hosted + per-conversation fees",
            "twilio": "$0.005/msg + per-conversation fees",
            "messagebird": "Pay as you go",
            "dialog360": "Per message pricing"
        }
        return pricing.get(self.value, "")


# ============================================================
# DATACLASSES - Message Components
# ============================================================

@dataclass
class Button:
    """Interactive button."""
    id: str
    title: str
    type: str = "reply"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "type": self.type,
            "reply": {
                "id": self.id,
                "title": self.title[:20]  # Max 20 chars
            }
        }


@dataclass
class ListSection:
    """List section with rows."""
    title: str
    rows: List[Dict[str, str]]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "title": self.title[:24],  # Max 24 chars
            "rows": [
                {
                    "id": row["id"],
                    "title": row["title"][:24],
                    "description": row.get("description", "")[:72]
                }
                for row in self.rows[:10]  # Max 10 rows per section
            ]
        }

    @classmethod
    def menu_section(cls, title: str, items: List[tuple]) -> "ListSection":
        """Create menu section from tuples of (id, title, description)."""
        return cls(
            title=title,
            rows=[
                {"id": item[0], "title": item[1], "description": item[2] if len(item) > 2 else ""}
                for item in items
            ]
        )


@dataclass
class TextMessage:
    """Text message."""
    body: str
    preview_url: bool = False

    def to_payload(self, to: str) -> Dict[str, Any]:
        return {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": to,
            "type": "text",
            "text": {
                "preview_url": self.preview_url,
                "body": self.body
            }
        }


@dataclass
class ImageMessage:
    """Image message."""
    url: Optional[str] = None
    media_id: Optional[str] = None
    caption: Optional[str] = None

    def to_payload(self, to: str) -> Dict[str, Any]:
        image = {}
        if self.url:
            image["link"] = self.url
        elif self.media_id:
            image["id"] = self.media_id
        if self.caption:
            image["caption"] = self.caption

        return {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": to,
            "type": "image",
            "image": image
        }


@dataclass
class InteractiveButtonMessage:
    """Interactive button message."""
    body: str
    buttons: List[Button]
    header: Optional[str] = None
    footer: Optional[str] = None

    def to_payload(self, to: str) -> Dict[str, Any]:
        interactive = {
            "type": "button",
            "body": {"text": self.body},
            "action": {
                "buttons": [b.to_dict() for b in self.buttons[:3]]
            }
        }

        if self.header:
            interactive["header"] = {"type": "text", "text": self.header}
        if self.footer:
            interactive["footer"] = {"text": self.footer}

        return {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": to,
            "type": "interactive",
            "interactive": interactive
        }


@dataclass
class InteractiveListMessage:
    """Interactive list message."""
    body: str
    button_text: str
    sections: List[ListSection]
    header: Optional[str] = None
    footer: Optional[str] = None

    def to_payload(self, to: str) -> Dict[str, Any]:
        interactive = {
            "type": "list",
            "body": {"text": self.body},
            "action": {
                "button": self.button_text[:20],
                "sections": [s.to_dict() for s in self.sections[:10]]
            }
        }

        if self.header:
            interactive["header"] = {"type": "text", "text": self.header}
        if self.footer:
            interactive["footer"] = {"text": self.footer}

        return {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": to,
            "type": "interactive",
            "interactive": interactive
        }


@dataclass
class TemplateMessage:
    """Template message for notifications."""
    template_name: str
    language_code: str = "en"
    header_params: List[str] = field(default_factory=list)
    body_params: List[str] = field(default_factory=list)
    buttons: List[Dict[str, Any]] = field(default_factory=list)

    def to_payload(self, to: str) -> Dict[str, Any]:
        components = []

        if self.header_params:
            components.append({
                "type": "header",
                "parameters": [{"type": "text", "text": p} for p in self.header_params]
            })

        if self.body_params:
            components.append({
                "type": "body",
                "parameters": [{"type": "text", "text": p} for p in self.body_params]
            })

        if self.buttons:
            for i, button in enumerate(self.buttons):
                components.append({
                    "type": "button",
                    "sub_type": button.get("type", "quick_reply"),
                    "index": str(i),
                    "parameters": button.get("parameters", [])
                })

        return {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": to,
            "type": "template",
            "template": {
                "name": self.template_name,
                "language": {"code": self.language_code},
                "components": components
            }
        }


@dataclass
class FlowConfig:
    """Conversation flow configuration."""
    name: str
    initial_state: ConversationState = ConversationState.START
    timeout_seconds: int = 300
    fallback_message: str = "Sorry, I didn't understand. Please try again."
    states: Dict[str, Dict[str, Any]] = field(default_factory=dict)


@dataclass
class BotConfig:
    """Complete bot configuration."""
    name: str
    phone_number_id: str
    platform: BotPlatform = BotPlatform.CLOUD_API
    verify_token: str = ""
    access_token: str = ""
    webhook_url: str = ""
    ai_enabled: bool = False
    ai_model: str = "gpt-4o"
    greeting_message: str = "Hello! How can I help you today?"
    default_menu: Optional[InteractiveListMessage] = None

    @classmethod
    def basic(cls, name: str, phone_id: str) -> "BotConfig":
        """Basic bot configuration."""
        return cls(
            name=name,
            phone_number_id=phone_id,
            greeting_message=f"Welcome to {name}! How can I help you?"
        )

    @classmethod
    def ai_powered(cls, name: str, phone_id: str) -> "BotConfig":
        """AI-powered bot configuration."""
        return cls(
            name=name,
            phone_number_id=phone_id,
            ai_enabled=True,
            ai_model="gpt-4o",
            greeting_message=f"Hi! I'm {name}'s AI assistant. How can I help you today?"
        )


# ============================================================
# CODE GENERATORS
# ============================================================

class WhatsAppClientGenerator:
    """Generate WhatsApp API client code."""

    def __init__(self, config: BotConfig):
        self.config = config

    def generate_client(self) -> str:
        """Generate WhatsApp client."""
        return f'''"""
WhatsApp Business API Client
Bot: {self.config.name}
Platform: {self.config.platform.display_name}
"""

import os
import json
import hmac
import hashlib
from typing import Optional, Dict, Any, List, Union
import httpx
from dataclasses import dataclass

# Configuration
PHONE_NUMBER_ID = os.environ.get("WHATSAPP_PHONE_NUMBER_ID", "{self.config.phone_number_id}")
ACCESS_TOKEN = os.environ.get("WHATSAPP_ACCESS_TOKEN", "")
VERIFY_TOKEN = os.environ.get("WHATSAPP_VERIFY_TOKEN", "{self.config.verify_token}")
API_VERSION = "v18.0"
BASE_URL = f"https://graph.facebook.com/{{API_VERSION}}"


class WhatsAppClient:
    """WhatsApp Cloud API client."""

    def __init__(
        self,
        phone_number_id: str = PHONE_NUMBER_ID,
        access_token: str = ACCESS_TOKEN
    ):
        self.phone_number_id = phone_number_id
        self.access_token = access_token
        self.messages_url = f"{{BASE_URL}}/{{phone_number_id}}/messages"
        self.media_url = f"{{BASE_URL}}/{{phone_number_id}}/media"

    def _headers(self) -> Dict[str, str]:
        return {{
            "Authorization": f"Bearer {{self.access_token}}",
            "Content-Type": "application/json"
        }}

    async def send_message(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Send a message via the API."""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.messages_url,
                headers=self._headers(),
                json=payload
            )
            response.raise_for_status()
            return response.json()

    async def send_text(
        self,
        to: str,
        text: str,
        preview_url: bool = False
    ) -> Dict[str, Any]:
        """Send a text message."""
        payload = {{
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": to,
            "type": "text",
            "text": {{
                "preview_url": preview_url,
                "body": text
            }}
        }}
        return await self.send_message(payload)

    async def send_image(
        self,
        to: str,
        url: Optional[str] = None,
        media_id: Optional[str] = None,
        caption: Optional[str] = None
    ) -> Dict[str, Any]:
        """Send an image message."""
        image = {{"link": url}} if url else {{"id": media_id}}
        if caption:
            image["caption"] = caption

        payload = {{
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": to,
            "type": "image",
            "image": image
        }}
        return await self.send_message(payload)

    async def send_buttons(
        self,
        to: str,
        body: str,
        buttons: List[Dict[str, str]],
        header: Optional[str] = None,
        footer: Optional[str] = None
    ) -> Dict[str, Any]:
        """Send interactive button message."""
        interactive = {{
            "type": "button",
            "body": {{"text": body}},
            "action": {{
                "buttons": [
                    {{
                        "type": "reply",
                        "reply": {{
                            "id": btn["id"],
                            "title": btn["title"][:20]
                        }}
                    }}
                    for btn in buttons[:3]
                ]
            }}
        }}

        if header:
            interactive["header"] = {{"type": "text", "text": header}}
        if footer:
            interactive["footer"] = {{"text": footer}}

        payload = {{
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": to,
            "type": "interactive",
            "interactive": interactive
        }}
        return await self.send_message(payload)

    async def send_list(
        self,
        to: str,
        body: str,
        button_text: str,
        sections: List[Dict[str, Any]],
        header: Optional[str] = None,
        footer: Optional[str] = None
    ) -> Dict[str, Any]:
        """Send interactive list message."""
        interactive = {{
            "type": "list",
            "body": {{"text": body}},
            "action": {{
                "button": button_text[:20],
                "sections": sections
            }}
        }}

        if header:
            interactive["header"] = {{"type": "text", "text": header}}
        if footer:
            interactive["footer"] = {{"text": footer}}

        payload = {{
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": to,
            "type": "interactive",
            "interactive": interactive
        }}
        return await self.send_message(payload)

    async def send_template(
        self,
        to: str,
        template_name: str,
        language: str = "en",
        components: List[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Send a template message."""
        payload = {{
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": to,
            "type": "template",
            "template": {{
                "name": template_name,
                "language": {{"code": language}},
                "components": components or []
            }}
        }}
        return await self.send_message(payload)

    async def mark_as_read(self, message_id: str) -> Dict[str, Any]:
        """Mark a message as read."""
        payload = {{
            "messaging_product": "whatsapp",
            "status": "read",
            "message_id": message_id
        }}
        return await self.send_message(payload)

    async def send_reaction(
        self,
        to: str,
        message_id: str,
        emoji: str
    ) -> Dict[str, Any]:
        """Send a reaction to a message."""
        payload = {{
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": to,
            "type": "reaction",
            "reaction": {{
                "message_id": message_id,
                "emoji": emoji
            }}
        }}
        return await self.send_message(payload)

    async def upload_media(
        self,
        file_path: str,
        media_type: str
    ) -> str:
        """Upload media and return media ID."""
        async with httpx.AsyncClient() as client:
            with open(file_path, "rb") as f:
                response = await client.post(
                    self.media_url,
                    headers={{"Authorization": f"Bearer {{self.access_token}}"}},
                    files={{"file": f}},
                    data={{
                        "messaging_product": "whatsapp",
                        "type": media_type
                    }}
                )
            response.raise_for_status()
            return response.json()["id"]


# Webhook verification
def verify_webhook(mode: str, token: str, challenge: str) -> Optional[str]:
    """Verify webhook subscription."""
    if mode == "subscribe" and token == VERIFY_TOKEN:
        return challenge
    return None


def verify_signature(payload: bytes, signature: str, app_secret: str) -> bool:
    """Verify webhook payload signature."""
    expected = hmac.new(
        app_secret.encode(),
        payload,
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(f"sha256={{expected}}", signature)


# Message parsing
def parse_webhook_message(body: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Parse incoming webhook message."""
    try:
        entry = body.get("entry", [{}])[0]
        changes = entry.get("changes", [{}])[0]
        value = changes.get("value", {{}})

        messages = value.get("messages", [])
        if not messages:
            return None

        message = messages[0]
        contact = value.get("contacts", [{{}}])[0]

        return {{
            "from": message.get("from"),
            "message_id": message.get("id"),
            "timestamp": message.get("timestamp"),
            "type": message.get("type"),
            "contact_name": contact.get("profile", {{}}).get("name"),
            "text": message.get("text", {{}}).get("body") if message.get("type") == "text" else None,
            "button_reply": message.get("interactive", {{}}).get("button_reply") if message.get("type") == "interactive" else None,
            "list_reply": message.get("interactive", {{}}).get("list_reply") if message.get("type") == "interactive" else None,
            "image": message.get("image") if message.get("type") == "image" else None,
            "document": message.get("document") if message.get("type") == "document" else None,
            "location": message.get("location") if message.get("type") == "location" else None,
            "raw": message
        }}
    except (KeyError, IndexError):
        return None


# Example usage
if __name__ == "__main__":
    import asyncio

    async def main():
        client = WhatsAppClient()

        # Send text
        await client.send_text("+1234567890", "Hello from the bot!")

        # Send buttons
        await client.send_buttons(
            "+1234567890",
            "What would you like to do?",
            [
                {{"id": "order", "title": "Place Order"}},
                {{"id": "status", "title": "Order Status"}},
                {{"id": "help", "title": "Get Help"}}
            ]
        )

    asyncio.run(main())
'''

    def generate_webhook_handler(self) -> str:
        """Generate webhook handler."""
        return f'''"""
WhatsApp Webhook Handler
Bot: {self.config.name}
"""

import os
import json
import logging
from typing import Dict, Any, Optional
from fastapi import FastAPI, Request, Response, HTTPException, Query
from pydantic import BaseModel

from client import (
    WhatsAppClient,
    verify_webhook,
    verify_signature,
    parse_webhook_message
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("{self.config.name}")

app = FastAPI(title="{self.config.name} WhatsApp Bot")

# Initialize client
wa_client = WhatsAppClient()

# State storage (use Redis/DB in production)
user_states: Dict[str, Dict[str, Any]] = {{}}

VERIFY_TOKEN = os.environ.get("WHATSAPP_VERIFY_TOKEN", "{self.config.verify_token}")
APP_SECRET = os.environ.get("WHATSAPP_APP_SECRET", "")


# ============================================================
# WEBHOOK ENDPOINTS
# ============================================================

@app.get("/webhook")
async def verify(
    mode: str = Query(None, alias="hub.mode"),
    token: str = Query(None, alias="hub.verify_token"),
    challenge: str = Query(None, alias="hub.challenge")
):
    """Webhook verification endpoint."""
    result = verify_webhook(mode, token, challenge)
    if result:
        logger.info("Webhook verified successfully")
        return Response(content=challenge, media_type="text/plain")
    raise HTTPException(status_code=403, detail="Verification failed")


@app.post("/webhook")
async def webhook(request: Request):
    """Handle incoming webhook events."""
    body = await request.json()

    # Verify signature in production
    # signature = request.headers.get("X-Hub-Signature-256", "")
    # if not verify_signature(await request.body(), signature, APP_SECRET):
    #     raise HTTPException(status_code=403, detail="Invalid signature")

    logger.info(f"Received webhook: {{json.dumps(body, indent=2)}}")

    # Parse message
    message = parse_webhook_message(body)

    if message:
        await handle_message(message)

    return {{"status": "ok"}}


# ============================================================
# MESSAGE HANDLERS
# ============================================================

async def handle_message(message: Dict[str, Any]):
    """Route incoming messages to appropriate handlers."""
    phone = message["from"]
    msg_type = message["type"]
    msg_id = message["message_id"]

    logger.info(f"Message from {{phone}}: type={{msg_type}}")

    # Mark as read
    await wa_client.mark_as_read(msg_id)

    # Get user state
    state = user_states.get(phone, {{"state": "start"}})

    try:
        if msg_type == "text":
            await handle_text_message(phone, message["text"], state)

        elif msg_type == "interactive":
            if message.get("button_reply"):
                await handle_button_reply(phone, message["button_reply"], state)
            elif message.get("list_reply"):
                await handle_list_reply(phone, message["list_reply"], state)

        elif msg_type == "image":
            await handle_image(phone, message["image"], state)

        elif msg_type == "location":
            await handle_location(phone, message["location"], state)

        else:
            await wa_client.send_text(phone, "Sorry, I can only process text messages and button selections.")

    except Exception as e:
        logger.error(f"Error handling message: {{e}}")
        await wa_client.send_text(phone, "{self.config.greeting_message}")


async def handle_text_message(phone: str, text: str, state: Dict[str, Any]):
    """Handle text messages."""
    text_lower = text.lower().strip()

    # Check for keywords
    if text_lower in ["hi", "hello", "hey", "start"]:
        await send_main_menu(phone)

    elif text_lower in ["help", "support"]:
        await wa_client.send_text(
            phone,
            "Here's how I can help:\\n\\n"
            "1. Type 'menu' to see options\\n"
            "2. Type 'status' to check order status\\n"
            "3. Type 'human' to speak with a person\\n"
        )

    elif text_lower == "menu":
        await send_main_menu(phone)

    elif text_lower == "human":
        await wa_client.send_text(
            phone,
            "I'll connect you with a human agent. Please wait..."
        )
        # Trigger human handoff logic

    else:
        # Default: echo or use AI
        {"await handle_ai_response(phone, text, state)" if self.config.ai_enabled else '''await wa_client.send_text(phone, f"You said: {text}\\n\\nType 'menu' for options.")'''}


async def handle_button_reply(phone: str, reply: Dict[str, str], state: Dict[str, Any]):
    """Handle button replies."""
    button_id = reply["id"]
    button_title = reply["title"]

    logger.info(f"Button pressed: {{button_id}} ({{button_title}})")

    if button_id == "menu":
        await send_main_menu(phone)

    elif button_id == "order":
        await wa_client.send_text(phone, "Let's place an order! What would you like?")
        user_states[phone] = {{"state": "ordering"}}

    elif button_id == "status":
        await wa_client.send_text(phone, "Please enter your order number:")
        user_states[phone] = {{"state": "checking_status"}}

    elif button_id == "confirm_yes":
        await wa_client.send_text(phone, "Great! Your request has been confirmed.")
        user_states[phone] = {{"state": "start"}}

    elif button_id == "confirm_no":
        await wa_client.send_text(phone, "No problem. Let me know if you need anything else.")
        user_states[phone] = {{"state": "start"}}

    else:
        await wa_client.send_text(phone, f"You selected: {{button_title}}")


async def handle_list_reply(phone: str, reply: Dict[str, str], state: Dict[str, Any]):
    """Handle list selection replies."""
    item_id = reply["id"]
    item_title = reply["title"]

    logger.info(f"List item selected: {{item_id}} ({{item_title}})")

    await wa_client.send_text(phone, f"You selected: {{item_title}}\\n\\nProcessing your request...")


async def handle_image(phone: str, image: Dict[str, Any], state: Dict[str, Any]):
    """Handle image messages."""
    await wa_client.send_text(phone, "Thanks for the image! I'll process it shortly.")


async def handle_location(phone: str, location: Dict[str, Any], state: Dict[str, Any]):
    """Handle location messages."""
    lat = location.get("latitude")
    lng = location.get("longitude")
    await wa_client.send_text(phone, f"Got your location: {{lat}}, {{lng}}")


# ============================================================
# MENU & FLOWS
# ============================================================

async def send_main_menu(phone: str):
    """Send the main menu."""
    await wa_client.send_list(
        phone,
        "{self.config.greeting_message}\\n\\nWhat would you like to do?",
        "View Options",
        [
            {{
                "title": "Services",
                "rows": [
                    {{"id": "service_1", "title": "Service One", "description": "Description of service one"}},
                    {{"id": "service_2", "title": "Service Two", "description": "Description of service two"}},
                    {{"id": "service_3", "title": "Service Three", "description": "Description of service three"}}
                ]
            }},
            {{
                "title": "Support",
                "rows": [
                    {{"id": "faq", "title": "FAQ", "description": "Frequently asked questions"}},
                    {{"id": "contact", "title": "Contact Us", "description": "Get in touch with our team"}},
                    {{"id": "human", "title": "Talk to Human", "description": "Connect with a live agent"}}
                ]
            }}
        ],
        header="{self.config.name}",
        footer="Powered by WhatsApp Business"
    )

    user_states[phone] = {{"state": "menu"}}


async def send_confirmation(phone: str, message: str):
    """Send a confirmation request."""
    await wa_client.send_buttons(
        phone,
        message,
        [
            {{"id": "confirm_yes", "title": "Yes, Confirm"}},
            {{"id": "confirm_no", "title": "No, Cancel"}}
        ]
    )
'''

        if self.config.ai_enabled:
            return self._add_ai_handler() + "\n\n" + self._generate_main_block()

        return self._generate_main_block()

    def _add_ai_handler(self) -> str:
        """Add AI response handler."""
        return f'''
# ============================================================
# AI INTEGRATION
# ============================================================

import openai

openai_client = openai.OpenAI()

SYSTEM_PROMPT = """You are a helpful WhatsApp assistant for {self.config.name}.

Instructions:
- Keep responses concise (WhatsApp messages should be short)
- Use emojis sparingly for friendliness
- If you can't help, offer to connect with a human
- Don't use markdown formatting (WhatsApp doesn't render it well)
- Be conversational and natural

Available actions you can suggest:
- View menu: Tell user to type "menu"
- Check status: Tell user to type "status"
- Human help: Tell user to type "human"
"""

conversation_history: Dict[str, list] = {{}}


async def handle_ai_response(phone: str, text: str, state: Dict[str, Any]):
    """Generate AI response."""
    # Get conversation history
    history = conversation_history.get(phone, [])

    # Add user message
    history.append({{"role": "user", "content": text}})

    # Keep last 10 messages
    history = history[-10:]

    try:
        response = openai_client.chat.completions.create(
            model="{self.config.ai_model}",
            messages=[
                {{"role": "system", "content": SYSTEM_PROMPT}},
                *history
            ],
            max_tokens=300,
            temperature=0.7
        )

        ai_message = response.choices[0].message.content

        # Save to history
        history.append({{"role": "assistant", "content": ai_message}})
        conversation_history[phone] = history

        # Send response
        await wa_client.send_text(phone, ai_message)

    except Exception as e:
        logger.error(f"AI error: {{e}}")
        await wa_client.send_text(phone, "Sorry, I'm having trouble right now. Type 'menu' for options or 'human' for assistance.")
'''

    def _generate_main_block(self) -> str:
        """Generate main execution block."""
        return '''

# ============================================================
# MAIN
# ============================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
'''

    def generate_requirements(self) -> str:
        """Generate requirements.txt."""
        deps = [
            "fastapi>=0.100.0",
            "uvicorn>=0.23.0",
            "httpx>=0.24.0",
            "pydantic>=2.0.0",
            "python-dotenv>=1.0.0"
        ]

        if self.config.ai_enabled:
            deps.append("openai>=1.0.0")

        return "\n".join(deps)

    def generate_env_template(self) -> str:
        """Generate .env.example."""
        env = """# WhatsApp Business API Configuration

# From Meta Developer Dashboard
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_access_token
WHATSAPP_VERIFY_TOKEN=your_verify_token
WHATSAPP_APP_SECRET=your_app_secret

# Webhook URL (use ngrok for local development)
WEBHOOK_URL=https://your-domain.com/webhook
"""

        if self.config.ai_enabled:
            env += "\n# OpenAI for AI responses\nOPENAI_API_KEY=sk-...\n"

        return env


# ============================================================
# REPORTER
# ============================================================

class WhatsAppBotReporter:
    """Generate reports about WhatsApp bot configurations."""

    @staticmethod
    def bot_dashboard(config: BotConfig) -> str:
        """Generate bot configuration dashboard."""
        lines = [
            "╔══════════════════════════════════════════════════════════════════════╗",
            "║                    WHATSAPP BOT - CONFIGURATION                      ║",
            "╠══════════════════════════════════════════════════════════════════════╣",
            f"║  Name: {config.name:<61} ║",
            f"║  Platform: {config.platform.display_name:<57} ║",
            f"║  Phone ID: {config.phone_number_id:<57} ║",
            f"║  AI Enabled: {'Yes' if config.ai_enabled else 'No':<56} ║",
            "╠══════════════════════════════════════════════════════════════════════╣",
            "║  CAPABILITIES                                                        ║",
            "╠══════════════════════════════════════════════════════════════════════╣",
            "║  ✓ Text messages                                                     ║",
            "║  ✓ Interactive buttons (up to 3)                                     ║",
            "║  ✓ Interactive lists (up to 10 sections)                             ║",
            "║  ✓ Template messages                                                 ║",
            "║  ✓ Media messages (images, documents)                                ║",
            "║  ✓ Reactions                                                         ║",
        ]

        if config.ai_enabled:
            lines.extend([
                "║  ✓ AI-powered responses                                              ║",
                f"║    Model: {config.ai_model:<58} ║"
            ])

        lines.append("╚══════════════════════════════════════════════════════════════════════╝")
        return "\n".join(lines)

    @staticmethod
    def message_limits() -> str:
        """Generate message limits reference."""
        lines = [
            "╔══════════════════════════════════════════════════════════════════════╗",
            "║                    MESSAGE LIMITS & CONSTRAINTS                      ║",
            "╠══════════════════════════════════════════════════════════════════════╣",
            "║  Component          │ Limit                                          ║",
            "╠══════════════════════════════════════════════════════════════════════╣",
            "║  Text body          │ 4096 characters                                ║",
            "║  Button title       │ 20 characters                                  ║",
            "║  Buttons per msg    │ 3 buttons                                      ║",
            "║  List button text   │ 20 characters                                  ║",
            "║  List sections      │ 10 sections                                    ║",
            "║  Rows per section   │ 10 rows                                        ║",
            "║  Row title          │ 24 characters                                  ║",
            "║  Row description    │ 72 characters                                  ║",
            "║  Header text        │ 60 characters                                  ║",
            "║  Footer text        │ 60 characters                                  ║",
            "╚══════════════════════════════════════════════════════════════════════╝"
        ]
        return "\n".join(lines)


# ============================================================
# CLI
# ============================================================

def create_cli():
    """Create CLI argument parser."""
    import argparse

    parser = argparse.ArgumentParser(
        description="WHATSAPP.BOT.EXE - WhatsApp Business Bot Builder",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Create a basic bot
  python whatsapp-bot.py create --name "My Bot" --phone-id 123456789

  # Create AI-powered bot
  python whatsapp-bot.py create --name "AI Bot" --phone-id 123456789 --ai

  # Show message limits
  python whatsapp-bot.py limits
        """
    )

    subparsers = parser.add_subparsers(dest="command", help="Command to execute")

    # Create command
    create_parser = subparsers.add_parser("create", help="Create a WhatsApp bot")
    create_parser.add_argument("--name", default="WhatsApp Bot", help="Bot name")
    create_parser.add_argument("--phone-id", default="YOUR_PHONE_ID", help="Phone number ID")
    create_parser.add_argument("--ai", action="store_true", help="Enable AI responses")
    create_parser.add_argument("--output", "-o", default="./whatsapp-bot", help="Output directory")

    # Limits command
    limits_parser = subparsers.add_parser("limits", help="Show message limits")

    # Demo command
    demo_parser = subparsers.add_parser("demo", help="Show demonstration")

    return parser


def main():
    """Main CLI entry point."""
    parser = create_cli()
    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        return

    if args.command == "create":
        config = BotConfig(
            name=args.name,
            phone_number_id=args.phone_id,
            ai_enabled=args.ai
        )

        generator = WhatsAppClientGenerator(config)
        output_path = Path(args.output)
        output_path.mkdir(parents=True, exist_ok=True)

        (output_path / "client.py").write_text(generator.generate_client())
        (output_path / "webhook.py").write_text(generator.generate_webhook_handler())
        (output_path / "requirements.txt").write_text(generator.generate_requirements())
        (output_path / ".env.example").write_text(generator.generate_env_template())

        print(f"Created WhatsApp bot in {args.output}/")
        print("\n" + WhatsAppBotReporter.bot_dashboard(config))

    elif args.command == "limits":
        print(WhatsAppBotReporter.message_limits())

    elif args.command == "demo":
        print("=" * 70)
        print("WHATSAPP.BOT.EXE - DEMONSTRATION")
        print("=" * 70)

        config = BotConfig.ai_powered("Demo Bot", "123456789")
        print("\n" + WhatsAppBotReporter.bot_dashboard(config))
        print("\n" + WhatsAppBotReporter.message_limits())


if __name__ == "__main__":
    main()
```

---

## USAGE

### Quick Start

```bash
# Create a basic bot
python whatsapp-bot.py create --name "My Bot" --phone-id YOUR_PHONE_ID

# Create AI-powered bot
python whatsapp-bot.py create --name "AI Bot" --phone-id YOUR_PHONE_ID --ai

# View message limits
python whatsapp-bot.py limits
```

### Setup Steps

1. Create Meta Developer App at developers.facebook.com
2. Add WhatsApp product to your app
3. Get Phone Number ID and Access Token
4. Set up webhook URL (use ngrok for local dev)
5. Subscribe to messages webhook

### Message Types

| Type | Use Case | Limits |
|------|----------|--------|
| Text | Simple responses | 4096 chars |
| Buttons | Quick actions | 3 buttons |
| List | Menu options | 10 sections |
| Template | Notifications | Pre-approved |

---

## QUICK COMMANDS

```
/whatsapp-bot basic   → Create basic bot
/whatsapp-bot ai      → Create AI-powered bot
/whatsapp-bot limits  → Show message limits
```

$ARGUMENTS
