from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime


class OverlayMetadata(BaseModel):
    """Model for overlay metadata"""
    type: Literal["text", "image",
                  "video"] = Field(..., description="Type of overlay")
    content: str = Field(
        ..., description="Content of the overlay (text content, image path, or video path)")
    x: float = Field(..., ge=0, le=1,
                     description="X position (0-1, relative to video width)")
    y: float = Field(..., ge=0, le=1,
                     description="Y position (0-1, relative to video height)")
    start_time: float = Field(..., ge=0, description="Start time in seconds")
    end_time: float = Field(..., gt=0, description="End time in seconds")
    width: Optional[float] = Field(
        None, ge=0, le=1, description="Width (0-1, relative to video width)")
    height: Optional[float] = Field(
        None, ge=0, le=1, description="Height (0-1, relative to video height)")
    font_size: Optional[int] = Field(
        24, ge=8, le=100, description="Font size for text overlays")
    font_color: Optional[str] = Field(
        "white", description="Font color for text overlays")
    background_color: Optional[str] = Field(
        None, description="Background color for text overlays")
    opacity: Optional[float] = Field(
        1.0, ge=0, le=1, description="Opacity of the overlay")

    class Config:
        json_schema_extra = {
            "example": {
                "type": "text",
                "content": "Hello World!",
                "x": 0.1,
                "y": 0.1,
                "start_time": 5.0,
                "end_time": 10.0,
                "width": 0.3,
                "height": 0.1,
                "font_size": 24,
                "font_color": "white",
                "background_color": "black",
                "opacity": 0.8
            }
        }


class JobResponse(BaseModel):
    """Response model for job creation"""
    job_id: str = Field(..., description="Unique identifier for the job")
    status: str = Field(..., description="Current status of the job")
    message: str = Field(...,
                         description="Human-readable message about the job")

    class Config:
        json_schema_extra = {
            "example": {
                "job_id": "123e4567-e89b-12d3-a456-426614174000",
                "status": "processing",
                "message": "Video upload successful. Processing started."
            }
        }


class JobStatus(BaseModel):
    """Model for job status"""
    job_id: str = Field(..., description="Unique identifier for the job")
    status: Literal["processing", "completed",
                    "failed"] = Field(..., description="Current status")
    progress: float = Field(
        0, ge=0, le=100, description="Progress percentage (0-100)")
    message: str = Field(..., description="Status message")
    created_at: datetime = Field(..., description="Job creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")
    error_details: Optional[str] = Field(
        None, description="Error details if status is failed")
    estimated_completion: Optional[datetime] = Field(
        None, description="Estimated completion time")

    class Config:
        json_schema_extra = {
            "example": {
                "job_id": "123e4567-e89b-12d3-a456-426614174000",
                "status": "processing",
                "progress": 45.5,
                "message": "Processing video overlays...",
                "created_at": "2023-12-07T10:30:00Z",
                "updated_at": "2023-12-07T10:32:15Z",
                "error_details": None,
                "estimated_completion": "2023-12-07T10:35:00Z"
            }
        }


class ErrorResponse(BaseModel):
    """Model for error responses"""
    detail: str = Field(..., description="Error message")
    error_code: Optional[str] = Field(None, description="Error code")
    timestamp: datetime = Field(
        default_factory=datetime.now, description="Error timestamp")

    class Config:
        json_schema_extra = {
            "example": {
                "detail": "File must be a video",
                "error_code": "INVALID_FILE_TYPE",
                "timestamp": "2023-12-07T10:30:00Z"
            }
        }
