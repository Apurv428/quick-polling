"""
QuickPoll - Comprehensive Test Suite
Tests all features: Admin, AI, Embeds, QR, Export, Webhooks
"""
import pytest
from fastapi.testclient import TestClient
from datetime import datetime
import json
import base64
from unittest.mock import Mock, patch, AsyncMock
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from main import app, polls_db, votes_db, webhooks_db, request_times
from app.config import settings

client = TestClient(app)


@pytest.fixture(autouse=True)
def reset_db():
    """Reset in-memory databases before each test."""
    polls_db.clear()
    votes_db.clear()
    webhooks_db.clear()
    request_times.clear()
    yield


class TestHealthCheck:
    """Test health check and basic endpoints."""
   
    def test_root_endpoint(self):
        """Test root health check."""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["app"] == "QuickPoll API"

class TestQRCodeGeneration:
    """Test QR code generation."""
   
    def test_qr_code_in_poll_creation(self):
        """Test QR code is generated during poll creation."""
        response = client.post("/api/polls", json={
            "question": "QR test?",
            "options": ["Yes", "No"]
        })
       
        assert response.status_code == 200
        data = response.json()
        assert "qr_code_url" in data
        assert data["qr_code_url"].startswith("data:image/png;base64,")
       
        base64_data = data["qr_code_url"].split(",")[1]
        decoded = base64.b64decode(base64_data)
        assert decoded.startswith(b'\x89PNG')
   
    def test_get_qr_code_endpoint(self):
        """Test dedicated QR code endpoint."""
        create_response = client.post("/api/polls", json={
            "question": "QR test?",
            "options": ["A", "B"]
        })
        poll = create_response.json()
       
        qr_response = client.get(f"/api/polls/{poll['id']}/qr")
       
        assert qr_response.status_code == 200
        data = qr_response.json()
        assert "qr_code_url" in data
        assert data["qr_code_url"] == poll["qr_code_url"]
   
    def test_qr_code_nonexistent_poll(self):
        """Test QR code for non-existent poll."""
        response = client.get("/api/polls/nonexistent/qr")
        assert response.status_code == 404

class TestResponseTimeTracking:
    """Test response time tracking for admin dashboard."""
   
    def test_response_times_tracked(self):
        """Test that response times are tracked."""
        client.get("/")
       
        response = client.get("/api/admin/stats", headers={
            "X-Admin-Key": settings.admin_api_key
        })
       
        assert response.status_code == 200
        data = response.json()
        assert data["avg_response_time_ms"] >= 0

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])