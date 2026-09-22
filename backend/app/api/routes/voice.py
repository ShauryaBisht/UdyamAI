import logging
from typing import Annotated

from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status
from pydantic import BaseModel, Field

from app.services.sarvam_service import sarvam_voice_service

logger = logging.getLogger(__name__)

router = APIRouter()


class TTSRequest(BaseModel):
    text: str = Field(
        ..., min_length=1, max_length=5000, description="Text to synthesize to speech"
    )
    language_code: str = Field(
        "hi-IN", description="BCP-47 target language code (hi-IN, mr-IN, en-IN, etc.)"
    )
    speaker: str | None = Field(
        None, description="Optional speaker identifier (meera, pavithra, maitreyi, arvind, amartya)"
    )
    pitch: float | None = Field(0.0, description="Voice pitch adjustment")
    pace: float | None = Field(1.0, description="Voice pace adjustment (0.5 to 2.0)")


class TTSResponse(BaseModel):
    audio_base64: str
    format: str = "audio/wav"
    speaker: str
    language_code: str


class STTResponse(BaseModel):
    transcript: str
    language_code: str


class VoiceStatusResponse(BaseModel):
    available: bool
    stt_model: str
    tts_model: str
    default_speaker: str


@router.get("/status", response_model=VoiceStatusResponse)
async def get_voice_status():
    """Check availability of Sarvam AI voice engine."""
    return VoiceStatusResponse(
        available=sarvam_voice_service.is_configured(),
        stt_model=sarvam_voice_service.stt_model,
        tts_model=sarvam_voice_service.tts_model,
        default_speaker=sarvam_voice_service.default_speaker,
    )


@router.post("/stt", response_model=STTResponse)
async def speech_to_text(
    file: Annotated[UploadFile, File(description="Audio file blob from client microphone")],
    language_code: Annotated[str, Form(description="BCP-47 language code")] = "hi-IN",
):
    """Transcribe user audio to text using Sarvam AI Saaras model."""
    if not sarvam_voice_service.is_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Sarvam AI voice service is not configured on the backend.",
        )

    try:
        audio_bytes = await file.read()
        if not audio_bytes or len(audio_bytes) < 500:
            logger.info(
                f"[VoiceAPI] Received audio file too small or empty ({len(audio_bytes) if audio_bytes else 0} bytes), skipping Sarvam STT request."
            )
            return STTResponse(
                transcript="",
                language_code=language_code,
            )

        filename = file.filename or "recording.webm"
        content_type = file.content_type or "audio/webm"

        result = await sarvam_voice_service.speech_to_text(
            audio_bytes=audio_bytes,
            filename=filename,
            content_type=content_type,
            language_code=language_code,
        )

        return STTResponse(
            transcript=result["transcript"],
            language_code=result["language_code"],
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"[VoiceAPI] STT error: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc),
        ) from exc


@router.post("/tts", response_model=TTSResponse)
async def text_to_speech(req: TTSRequest):
    """Convert text to speech audio using Sarvam AI Bulbul model."""
    if not sarvam_voice_service.is_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Sarvam AI voice service is not configured on the backend.",
        )

    try:
        result = await sarvam_voice_service.text_to_speech(
            text=req.text,
            language_code=req.language_code,
            speaker=req.speaker,
            pitch=req.pitch or 0.0,
            pace=req.pace or 1.0,
        )

        return TTSResponse(
            audio_base64=result["audio_base64"],
            format=result.get("format", "audio/wav"),
            speaker=result["speaker"],
            language_code=result["language_code"],
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"[VoiceAPI] TTS error: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc),
        ) from exc
