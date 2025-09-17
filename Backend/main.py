from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uuid
import os
import json
import asyncio
from datetime import datetime
import shutil

from models import OverlayMetadata, JobStatus, JobResponse
from video_processor import VideoProcessor

app = FastAPI(
    title="Video Editor API",
    description="Backend API for video editing with overlays",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize video processor
video_processor = VideoProcessor()

# Storage directories
UPLOAD_DIR = "uploads"
OUTPUT_DIR = "outputs"
TEMP_DIR = "temp"

# Create directories if they don't exist
for dir_path in [UPLOAD_DIR, OUTPUT_DIR, TEMP_DIR]:
    os.makedirs(dir_path, exist_ok=True)


@app.get("/")
async def root():
    """Health check endpoint"""
    return {"message": "Video Editor API is running", "timestamp": datetime.now()}


@app.post("/upload", response_model=JobResponse)
async def upload_video(
    video: UploadFile = File(...),
    overlays: str = Form(...)
):
    """
    Upload a video file and overlay metadata for processing

    - **video**: Video file to process
    - **overlays**: JSON string containing overlay metadata
    """
    try:
        # Generate unique job ID
        job_id = str(uuid.uuid4())

        # Validate video file
        if not video.content_type.startswith('video/'):
            raise HTTPException(status_code=400, detail="File must be a video")

        # Parse overlay metadata
        try:
            overlay_data = json.loads(overlays)
            overlay_list = [OverlayMetadata(**overlay)
                            for overlay in overlay_data]
        except (json.JSONDecodeError, ValueError) as e:
            raise HTTPException(
                status_code=400, detail=f"Invalid overlay metadata: {str(e)}")

        # Save uploaded video
        video_filename = f"{job_id}_{video.filename}"
        video_path = os.path.join(UPLOAD_DIR, video_filename)

        with open(video_path, "wb") as buffer:
            shutil.copyfileobj(video.file, buffer)

        # Start video processing in background
        asyncio.create_task(video_processor.process_video(
            job_id, video_path, overlay_list))

        return JobResponse(
            job_id=job_id,
            status="processing",
            message="Video upload successful. Processing started."
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@app.get("/status/{job_id}", response_model=JobStatus)
async def get_job_status(job_id: str):
    """
    Get the processing status of a video job

    - **job_id**: Unique identifier for the video processing job
    """
    status = video_processor.get_job_status(job_id)

    if not status:
        raise HTTPException(status_code=404, detail="Job not found")

    return status


@app.get("/result/{job_id}")
async def get_result(job_id: str):
    """
    Download the processed video file

    - **job_id**: Unique identifier for the video processing job
    """
    status = video_processor.get_job_status(job_id)

    if not status:
        raise HTTPException(status_code=404, detail="Job not found")

    if status.status != "completed":
        raise HTTPException(
            status_code=400,
            detail=f"Job is not completed. Current status: {status.status}"
        )

    output_path = os.path.join(OUTPUT_DIR, f"{job_id}_output.mp4")

    if not os.path.exists(output_path):
        raise HTTPException(status_code=404, detail="Output file not found")

    return FileResponse(
        path=output_path,
        filename=f"edited_video_{job_id}.mp4",
        media_type="video/mp4"
    )


@app.delete("/cleanup/{job_id}")
async def cleanup_job(job_id: str):
    """
    Clean up files associated with a job

    - **job_id**: Unique identifier for the video processing job
    """
    try:
        # Remove from processor tracking
        video_processor.cleanup_job(job_id)

        # Clean up files
        for directory in [UPLOAD_DIR, OUTPUT_DIR, TEMP_DIR]:
            for filename in os.listdir(directory):
                if filename.startswith(job_id):
                    file_path = os.path.join(directory, filename)
                    if os.path.exists(file_path):
                        os.remove(file_path)

        return {"message": f"Job {job_id} cleaned up successfully"}

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Cleanup failed: {str(e)}")


@app.get("/jobs")
async def list_jobs():
    """List all jobs and their statuses"""
    return video_processor.list_all_jobs()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
