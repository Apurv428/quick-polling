"""
QuickPoll API — corrected version
"""
from fastapi import FastAPI, HTTPException, Request, Depends, Header, Response, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import StreamingResponse, HTMLResponse
from pydantic import BaseModel, validator, Field
from typing import List, Optional, Dict, Set, Literal
from datetime import datetime, timedelta
from enum import Enum
import json
import uuid
import asyncio
from collections import defaultdict, Counter
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import html
import re
import hashlib
import qrcode
from io import BytesIO
import base64
import aiohttp
from app.config import settings
import uvicorn

app = FastAPI(
    title="QuickPoll API",
    description="Advanced polling",
    version="1.0.0",
)

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(GZipMiddleware, minimum_size=1000)
# allow_origins might be None or list in settings; ensure it's a list
_allowed = settings.allowed_origins if getattr(settings, "allowed_origins", None) else []
if isinstance(_allowed, list):
    allow_origins = _allowed + ["*"]
else:
    allow_origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

polls_db: Dict[str, dict] = {}
votes_db: Dict[str, List[dict]] = defaultdict(list)
users_db: Dict[str, dict] = {}
reactions_db: Dict[str, Dict[str, int]] = defaultdict(lambda: defaultdict(int))
webhooks_db: Dict[str, List[dict]] = defaultdict(list)
user_votes_db: Dict[str, Dict[str, str]] = defaultdict(dict)
user_likes_db: Dict[str, Set[str]] = defaultdict(set)
active_connections: Set[str] = set()
request_times: List[float] = []


class PrivacyLevel(str, Enum):
    PUBLIC = "public"
    UNLISTED = "unlisted"
    PRIVATE = "private"


class ReactionType(str, Enum):
    LIKE = "like"
    LOVE = "love"
    LAUGH = "laugh"
    THINK = "think"
    SAD = "sad"


class PollOption(BaseModel):
    id: str
    text: str
    votes: int = 0


class CreatePollRequest(BaseModel):
    question: str
    options: List[str]
    creator_id: Optional[str] = None
    expires_in_hours: Optional[int] = None
    hide_results_until_vote: bool = False
    privacy: PrivacyLevel = PrivacyLevel.PUBLIC


class Poll(BaseModel):
    id: str
    question: str
    options: List[PollOption]
    created_at: datetime
    creator_id: Optional[str] = None
    total_votes: int = 0
    expires_at: Optional[datetime] = None
    hide_results_until_vote: bool = False
    privacy: PrivacyLevel = PrivacyLevel.PUBLIC
    qr_code_url: Optional[str] = None
    likes: int = 0


class VoteRequest(BaseModel):
    option_id: str
    user_id: Optional[str] = None


class WebhookRequest(BaseModel):
    poll_id: str
    webhook_url: str
    platform: Literal["discord", "slack"]


class AIGenerateRequest(BaseModel):
    topic: str
    num_options: int = 4


class AnalyzeRequest(BaseModel):
    text: str


class AdminStats(BaseModel):
    total_polls_today: int
    active_users_now: int
    most_popular_poll: Optional[dict]
    avg_response_time_ms: float
    total_polls: int
    total_votes: int


@app.middleware("http")
async def track_response_time(request: Request, call_next):
    """Track API response times for admin dashboard."""
    start_time = datetime.now()
    response = await call_next(request)
    duration = (datetime.now() - start_time).total_seconds() * 1000
    request_times.append(duration)
    if len(request_times) > 100:
        request_times.pop(0)
    return response


def verify_admin_key(x_admin_key: str = Header(None)):
    """Verify admin API key."""
    if x_admin_key != settings.admin_api_key:
        raise HTTPException(status_code=403, detail="Invalid admin key")
    return True


def sanitize_text(text: str) -> str:
    """Sanitize user input to prevent XSS."""
    text = html.escape(text)
    text = re.sub(r'<script[^>]*>.*?</script>', '', text, flags=re.IGNORECASE | re.DOTALL)
    return text.strip()


def generate_fingerprint(request: Request, user_id: Optional[str] = None) -> str:
    """Generate unique fingerprint for duplicate detection."""
    ip = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "")
    combined = f"{ip}:{user_agent}:{user_id or ''}"
    return hashlib.sha256(combined.encode()).hexdigest()


def generate_qr_code(poll_id: str) -> str:
    """Generate QR code for poll as base64 data URL."""
    poll_url = f"http://localhost:3000"
    qr = qrcode.QRCode(version=1, box_size=10, border=4)
    qr.add_data(poll_url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")

    buffer = BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)
    img_base64 = base64.b64encode(buffer.getvalue()).decode()
    print(img_base64,"img_base64")
    return f"data:image/png;base64,{img_base64}"


async def trigger_webhooks(poll_id: str, event_type: str, data: dict):
    """Trigger webhooks for poll events."""
    if not getattr(settings, "webhook_enabled", False) or poll_id not in webhooks_db:
        return

    for webhook in webhooks_db[poll_id]:
        try:
            async with aiohttp.ClientSession() as session:
                if webhook["platform"] == "discord":
                    payload = {
                        "content": f" New vote on poll: {data.get('poll_question', 'Unknown')}",
                        "embeds": [{
                            "title": "Poll Update",
                            "description": f"Total votes: {data.get('total_votes', 0)}",
                            "color": 5814783
                        }]
                    }
                elif webhook["platform"] == "slack":
                    payload = {
                        "text": f" New vote on poll: {data.get('poll_question', 'Unknown')}",
                        "blocks": [{
                            "type": "section",
                            "text": {
                                "type": "mrkdwn",
                                "text": f"*Poll Update*\nTotal votes: {data.get('total_votes', 0)}"
                            }
                        }]
                    }
                else:
                    continue

                async with session.post(webhook["webhook_url"], json=payload) as resp:
                    if resp.status in (200, 204):
                        print(f"Webhook sent successfully to {webhook['platform']}")
        except Exception as e:
            print(f"Webhook error: {e}")


async def generate_ai_poll(topic: str, num_options: int = 4) -> dict:
    """Generate poll question and options using OpenAI."""
    if not getattr(settings, "openai_enabled", False) or not getattr(settings, "openai_api_key", None):
        raise HTTPException(status_code=503, detail="AI features not enabled")

    try:
        client = AsyncOpenAI(api_key=settings.openai_api_key)

        prompt = f"""Generate a poll question and {num_options} answer options about: {topic}

Format your response as JSON:
{{
    "question": "Your poll question here?",
    "options": ["Option 1", "Option 2", "Option 3", "Option 4"]
}}"""

        response = await client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7
        )

        content = response.choices[0].message.content
        result = json.loads(content)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")

@app.get("/", tags=["Health"])
async def root():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "app": "QuickPoll API",
    }


@app.get("/api/polls", tags=["Polls"])
async def list_polls():
    """List all polls (returns Pydantic models so datetimes are serializable)."""
    return [Poll(**p) for p in polls_db.values()]


@app.get("/api/admin/stats", tags=["Admin"])
async def get_admin_stats(admin: bool = Depends(verify_admin_key)):
    """Get admin dashboard statistics."""
    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    polls_today = sum(1 for p in polls_db.values() if p["created_at"] >= today)

    most_popular = None
    max_votes = 0
    for poll_id, poll in polls_db.items():
        if poll.get("total_votes", 0) > max_votes:
            max_votes = poll.get("total_votes", 0)
            most_popular = {
                "id": poll_id,
                "question": poll["question"],
                "total_votes": poll["total_votes"]
            }

    avg_response_time = sum(request_times) / len(request_times) if request_times else 0

    return AdminStats(
        total_polls_today=polls_today,
        active_users_now=len(active_connections),
        most_popular_poll=most_popular,
        avg_response_time_ms=round(avg_response_time, 2),
        total_polls=len(polls_db),
        total_votes=sum(len(votes) for votes in votes_db.values())
    )


@app.post("/api/ai/generate-poll", tags=["AI"])
@limiter.limit("5/minute")
async def ai_generate_poll(request: Request, ai_request: AIGenerateRequest):
    """Generate poll using AI."""
    result = await generate_ai_poll(ai_request.topic, ai_request.num_options)
    return result


@app.post("/api/polls", tags=["Polls"])
@limiter.limit(getattr(settings, "rate_limit_polls_create", "5/minute"))
async def create_poll(request: Request, poll_request: CreatePollRequest):
    """Create a new poll."""
    question = sanitize_text(poll_request.question)

    if len(question) < getattr(settings, "min_poll_title_length", 3):
        raise HTTPException(status_code=400, detail="Question too short")

    if len(poll_request.options) < getattr(settings, "min_poll_options", 2):
        raise HTTPException(status_code=400, detail="Need at least 2 options")

    poll_id = str(uuid.uuid4())
    options = [
        PollOption(id=str(uuid.uuid4()), text=sanitize_text(opt), votes=0)
        for opt in poll_request.options
    ]

    expires_at = None
    if poll_request.expires_in_hours:
        expires_at = datetime.now() + timedelta(hours=poll_request.expires_in_hours)

    qr_code = generate_qr_code(poll_id)

    poll_dict = {
        "id": poll_id,
        "question": question,
        "options": [opt.dict() for opt in options],
        "created_at": datetime.now(),
        "creator_id": poll_request.creator_id,
        "total_votes": 0,
        "expires_at": expires_at,
        "hide_results_until_vote": poll_request.hide_results_until_vote,
        "privacy": poll_request.privacy.value,
        "qr_code_url": qr_code,
    }

    polls_db[poll_id] = poll_dict

    return Poll(**poll_dict)


@app.get("/api/polls/trending", tags=["Polls"])
@limiter.limit("60/minute")
async def get_trending_polls(request: Request, limit: int = 5):
    """Get trending polls based on recent activity."""
    # Calculate trending score: votes + (likes * 2) + recency bonus
    now = datetime.now()
    trending_scores = []

    for poll_id, poll in polls_db.items():
        # Skip expired polls
        if poll.get("expires_at") and now > poll["expires_at"]:
            continue

        # Skip private polls (stored as string value)
        if poll.get("privacy") == PrivacyLevel.PRIVATE.value:
            continue

        # Calculate recency bonus (polls created in last 24h get bonus)
        created_at = poll["created_at"]
        hours_old = (now - created_at).total_seconds() / 3600
        recency_bonus = max(0, 24 - hours_old) / 24 * 10  # 0-10 points

        # Calculate trending score
        score = (
            poll.get("total_votes", 0) +
            poll.get("likes", 0) * 2 +
            recency_bonus
        )

        trending_scores.append((score, poll_id, poll))

    # Sort by score descending
    trending_scores.sort(reverse=True, key=lambda x: x[0])

    # Return top N polls as Pydantic models (serializable)
    trending_polls = [Poll(**poll) for _, _, poll in trending_scores[:limit]]

    return trending_polls


@app.get("/api/polls/{poll_id}", tags=["Polls"])
async def get_poll(poll_id: str, user_fingerprint: Optional[str] = None):
    """Get poll by ID."""
    if poll_id not in polls_db:
        raise HTTPException(status_code=404, detail="Poll not found")

    poll = polls_db[poll_id].copy()

    if poll.get("hide_results_until_vote") and user_fingerprint:
        has_voted = any(
            v.get("fingerprint") == user_fingerprint
            for v in votes_db.get(poll_id, [])
        )
        if not has_voted:
            for option in poll["options"]:
                option["votes"] = 0

    return Poll(**poll)


@app.post("/api/polls/{poll_id}/vote", tags=["Votes"])
@limiter.limit(getattr(settings, "rate_limit_votes", "10/minute"))
async def vote_on_poll(request: Request, poll_id: str, vote_request: VoteRequest):
    """Vote on a poll."""
    if poll_id not in polls_db:
        raise HTTPException(status_code=404, detail="Poll not found")

    poll = polls_db[poll_id]

    if poll.get("expires_at") and datetime.now() > poll["expires_at"]:
        raise HTTPException(status_code=400, detail="Poll has expired")

    fingerprint = generate_fingerprint(request, vote_request.user_id)

    existing_votes = votes_db.get(poll_id, [])
    if any(v.get("fingerprint") == fingerprint for v in existing_votes):
        raise HTTPException(status_code=400, detail="Already voted")

    option_found = False
    for option in poll["options"]:
        if option["id"] == vote_request.option_id:
            option["votes"] += 1
            option_found = True
            break

    if not option_found:
        raise HTTPException(status_code=400, detail="Invalid option")

    poll["total_votes"] += 1

    vote_record = {
        "option_id": vote_request.option_id,
        "fingerprint": fingerprint,
        "timestamp": datetime.now(),
        "user_id": vote_request.user_id
    }
    votes_db[poll_id].append(vote_record)

    # Track user vote for this poll
    if vote_request.user_id:
        user_votes_db[vote_request.user_id][poll_id] = vote_request.option_id

    await trigger_webhooks(poll_id, "vote", {
        "poll_question": poll["question"],
        "total_votes": poll["total_votes"]
    })

    return {"success": True, "total_votes": poll["total_votes"]}


@app.get("/api/user/{user_id}/votes", tags=["User"])
@limiter.limit("100/minute")
async def get_user_votes(request: Request, user_id: str):
    """Get all votes for a specific user."""
    return user_votes_db.get(user_id, {})


@app.get("/api/user/{user_id}/likes", tags=["User"])
@limiter.limit("100/minute")
async def get_user_likes(request: Request, user_id: str):
    """Get all liked polls for a specific user."""
    return list(user_likes_db.get(user_id, set()))


@app.post("/api/likes", tags=["Likes"])
@limiter.limit(getattr(settings, "rate_limit_votes", "10/minute"))
async def toggle_like(request: Request, like_data: dict = Body(...)):
    """Toggle like on a poll."""
    poll_id = like_data.get("pollId")
    user_id = like_data.get("userId")

    if not poll_id or not user_id:
        raise HTTPException(status_code=400, detail="Missing pollId or userId")

    if poll_id not in polls_db:
        raise HTTPException(status_code=404, detail="Poll not found")

    poll = polls_db[poll_id]

    # Initialize likes if not present
    if "likes" not in poll:
        poll["likes"] = 0

    # Toggle like
    if poll_id in user_likes_db[user_id]:
        user_likes_db[user_id].remove(poll_id)
        poll["likes"] = max(0, poll["likes"] - 1)
        liked = False
    else:
        user_likes_db[user_id].add(poll_id)
        poll["likes"] += 1
        liked = True

    return {
        "success": True,
        "liked": liked,
        "total_likes": poll["likes"]
    }


@app.post("/api/polls/{poll_id}/webhook", tags=["Webhooks"])
async def add_webhook(poll_id: str, webhook: WebhookRequest):
    """Add webhook for poll notifications."""
    if poll_id not in polls_db:
        raise HTTPException(status_code=404, detail="Poll not found")

    webhooks_db[poll_id].append(webhook.dict())
    return {"success": True, "message": "Webhook added"}


@app.get("/api/polls/{poll_id}/qr", tags=["QR Code"])
async def get_qr_code(poll_id: str):
    """Get QR code for poll."""
    if poll_id not in polls_db:
        raise HTTPException(status_code=404, detail="Poll not found")

    poll = polls_db[poll_id]
    return {"qr_code_url": poll.get("qr_code_url")}


@app.get("/api/polls/{poll_id}/export/csv", tags=["Export"])
async def export_csv(poll_id: str):
    """Export poll results as CSV."""
    if poll_id not in polls_db:
        raise HTTPException(status_code=404, detail="Poll not found")

    poll = polls_db[poll_id]

    csv_content = f"Question,\"{poll['question']}\"\n"
    csv_content += "Option,Votes,Percentage\n"

    total = poll["total_votes"] or 1
    for option in poll["options"]:
        percentage = (option["votes"] / total) * 100
        csv_content += f"\"{option['text']}\",{option['votes']},{percentage:.1f}%\n"

    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=poll_{poll_id}.csv"}
    )


@app.get("/embed/{poll_id}", tags=["Embed"], response_class=HTMLResponse)
async def embed_poll(poll_id: str):
    """Embed poll as iframe."""
    if poll_id not in polls_db:
        return "<html><body>Poll not found</body></html>"

    poll = polls_db[poll_id]

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{poll['question']}</title>
        <style>
            * {{ margin: 0; padding: 0; box-sizing: border-box; }}
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                padding: 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }}
            .poll-container {{
                background: white;
                border-radius: 12px;
                padding: 24px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }}
            .question {{
                font-size: 20px;
                font-weight: bold;
                margin-bottom: 20px;
                color: #1a202c;
            }}
            .option {{
                background: #f7fafc;
                border: 2px solid #e2e8f0;
                border-radius: 8px;
                padding: 12px 16px;
                margin-bottom: 10px;
                cursor: pointer;
                transition: all 0.2s;
            }}
            .option:hover {{
                border-color: #667eea;
                background: #edf2f7;
            }}
            .votes {{
                color: #718096;
                font-size: 14px;
                margin-top: 4px;
            }}
        </style>
    </head>
    <body>
        <div class="poll-container">
            <div class="question">{poll['question']}</div>
            {''.join(f'''
            <div class="option">
                <div>{option['text']}</div>
                <div class="votes">{option['votes']} votes</div>
            </div>
            ''' for option in poll['options'])}
        </div>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content)


@app.get("/embed/script.js", tags=["Embed"])
async def embed_script():
    """JavaScript embed script."""
    script = """
(function() {
    var pollId = document.currentScript.getAttribute('data-poll-id');
    var iframe = document.createElement('iframe');
    iframe.src = 'http://localhost:8000/embed/' + pollId;
    iframe.style.width = '100%';
    iframe.style.height = '400px';
    iframe.style.border = 'none';
    iframe.style.borderRadius = '12px';
    document.currentScript.parentNode.insertBefore(iframe, document.currentScript);
})();
    """
    return Response(content=script, media_type="application/javascript")


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
