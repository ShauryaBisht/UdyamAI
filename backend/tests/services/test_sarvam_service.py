from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.sarvam_service import (
    SarvamVoiceService,
    clean_text_for_speech,
)


def test_clean_text_for_speech():
    raw = "### Hello **World**! Visit https://example.com for *more* info. \n\n• Point 1\n- Point 2"
    cleaned = clean_text_for_speech(raw)
    assert "https://" not in cleaned
    assert "#" not in cleaned
    assert "*" not in cleaned
    assert "Hello World!" in cleaned
    assert "Point 1" in cleaned
    assert "Point 2" in cleaned


@pytest.mark.anyio
async def test_sarvam_service_not_configured():
    service = SarvamVoiceService(api_key="")
    assert not service.is_configured()

    with pytest.raises(ValueError, match="SARVAM_API_KEY is not configured"):
        await service.speech_to_text(b"dummy audio")

    with pytest.raises(ValueError, match="SARVAM_API_KEY is not configured"):
        await service.text_to_speech("test text")


@pytest.mark.anyio
async def test_sarvam_service_stt_success():
    service = SarvamVoiceService(api_key="test-sarvam-key")
    assert service.is_configured()

    mock_response = MagicMock()
    mock_response.json.return_value = {"transcript": "नमस्ते, मुझे लोन चाहिए"}
    mock_response.raise_for_status.return_value = None

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_response
        result = await service.speech_to_text(b"audio-bytes", language_code="hi-IN")

        assert result["transcript"] == "नमस्ते, मुझे लोन चाहिए"
        assert result["language_code"] == "hi-IN"
        mock_post.assert_called_once()


@pytest.mark.anyio
async def test_sarvam_service_tts_success():
    service = SarvamVoiceService(api_key="test-sarvam-key")

    mock_response = MagicMock()
    mock_response.json.return_value = {"audios": ["UklGRiQAAABXQVZFZm10IBAAAAABAAEA"]}
    mock_response.raise_for_status.return_value = None

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_response
        result = await service.text_to_speech(
            "UdyamAI मध्ये आपले स्वागत आहे", language_code="mr-IN", speaker="meera"
        )

        assert result["audio_base64"] == "UklGRiQAAABXQVZFZm10IBAAAAABAAEA"
        assert result["language_code"] == "mr-IN"
        assert result["speaker"] == "meera"
        mock_post.assert_called_once()


def test_voice_status_route():
    client = TestClient(app)
    response = client.get("/voice/status")
    assert response.status_code == 200
    data = response.json()
    assert "available" in data
    assert "stt_model" in data
    assert "tts_model" in data
    assert "default_speaker" in data


def test_voice_tts_unconfigured(monkeypatch):
    from app.services.sarvam_service import sarvam_voice_service

    monkeypatch.setattr(sarvam_voice_service, "api_key", None)

    client = TestClient(app)
    response = client.post("/voice/tts", json={"text": "Hello", "language_code": "en-IN"})
    assert response.status_code == 503
    assert "not configured" in response.json()["detail"]
