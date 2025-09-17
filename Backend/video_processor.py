import asyncio
import subprocess
import os
import json
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import logging

from models import OverlayMetadata, JobStatus

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class VideoProcessor:
    """Handles video processing with ffmpeg"""

    def __init__(self):
        self.jobs: Dict[str, JobStatus] = {}
        self.processing_tasks: Dict[str, asyncio.Task] = {}

    async def process_video(self, job_id: str, video_path: str, overlays: List[OverlayMetadata]) -> None:
        """Process video with overlays using ffmpeg"""
        try:
            # Initialize job status
            self.jobs[job_id] = JobStatus(
                job_id=job_id,
                status="processing",
                progress=0,
                message="Starting video processing...",
                created_at=datetime.now(),
                updated_at=datetime.now(),
                estimated_completion=datetime.now() + timedelta(minutes=5)
            )

            # Update progress: Video analysis
            await self._update_job_progress(job_id, 10, "Analyzing video properties...")

            # Get video information
            video_info = await self._get_video_info(video_path)
            logger.info(f"Video info for job {job_id}: {video_info}")

            # Update progress: Preparing overlays
            await self._update_job_progress(job_id, 30, "Preparing overlay filters...")

            # Build ffmpeg filter complex
            filter_complex = await self._build_filter_complex(video_info, overlays, job_id)

            # Update progress: Processing video
            await self._update_job_progress(job_id, 50, "Processing video with overlays...")

            # Execute ffmpeg command
            output_path = os.path.join("outputs", f"{job_id}_output.mp4")
            await self._execute_ffmpeg(video_path, output_path, filter_complex, job_id)

            # Update progress: Finalizing
            await self._update_job_progress(job_id, 90, "Finalizing output...")

            # Verify output file
            if os.path.exists(output_path) and os.path.getsize(output_path) > 0:
                await self._update_job_progress(job_id, 100, "Video processing completed successfully!")
                self.jobs[job_id].status = "completed"
            else:
                raise Exception("Output file was not created or is empty")

        except Exception as e:
            logger.error(f"Error processing video for job {job_id}: {str(e)}")
            self.jobs[job_id].status = "failed"
            self.jobs[job_id].message = f"Processing failed: {str(e)}"
            self.jobs[job_id].error_details = str(e)

        finally:
            self.jobs[job_id].updated_at = datetime.now()
            # Remove from active tasks
            if job_id in self.processing_tasks:
                del self.processing_tasks[job_id]

    async def _get_video_info(self, video_path: str) -> dict:
        """Get video information using ffprobe"""
        cmd = [
            "ffprobe",
            "-v", "quiet",
            "-print_format", "json",
            "-show_format",
            "-show_streams",
            video_path
        ]

        try:
            result = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout, stderr = await result.communicate()

            if result.returncode != 0:
                raise Exception(f"ffprobe failed: {stderr.decode()}")

            info = json.loads(stdout.decode())

            # Extract video stream info
            video_stream = next(
                (stream for stream in info["streams"]
                 if stream["codec_type"] == "video"),
                None
            )

            if not video_stream:
                raise Exception("No video stream found")

            return {
                "width": int(video_stream["width"]),
                "height": int(video_stream["height"]),
                "duration": float(video_stream.get("duration", info["format"]["duration"])),
                "fps": eval(video_stream.get("r_frame_rate", "30/1"))
            }

        except Exception as e:
            raise Exception(f"Failed to get video info: {str(e)}")

    async def _build_filter_complex(self, video_info: dict, overlays: List[OverlayMetadata], job_id: str) -> str:
        """Build ffmpeg filter complex for overlays"""
        filters = []
        inputs = ["0:v"]  # Start with the main video

        video_width = video_info["width"]
        video_height = video_info["height"]

        overlay_count = 0

        for i, overlay in enumerate(overlays):
            try:
                if overlay.type == "text":
                    # Text overlay
                    text_filter = self._create_text_filter(
                        overlay, video_width, video_height)
                    filters.append(text_filter)

                    # Overlay the text
                    input_label = inputs[-1]
                    output_label = f"v{overlay_count}"
                    overlay_filter = f"[{input_label}][{len(inputs)}]overlay=enable='between(t,{overlay.start_time},{overlay.end_time})'[{output_label}]"
                    filters.append(overlay_filter)
                    inputs.append(output_label)
                    overlay_count += 1

                elif overlay.type == "image":
                    # Image overlay
                    image_path = await self._prepare_image_overlay(overlay, video_width, video_height, job_id)

                    # Calculate position
                    x = int(overlay.x * video_width)
                    y = int(overlay.y * video_height)

                    # Create overlay filter
                    input_label = inputs[-1]
                    output_label = f"v{overlay_count}"
                    overlay_filter = f"[{input_label}][{len(inputs)}]overlay={x}:{y}:enable='between(t,{overlay.start_time},{overlay.end_time})'[{output_label}]"
                    filters.append(overlay_filter)
                    inputs.append(output_label)
                    overlay_count += 1

                elif overlay.type == "video":
                    # Video overlay
                    video_overlay_path = overlay.content

                    # Calculate position and size
                    x = int(overlay.x * video_width)
                    y = int(overlay.y * video_height)
                    width = int((overlay.width or 0.2) * video_width)
                    height = int((overlay.height or 0.2) * video_height)

                    # Scale the overlay video
                    scale_filter = f"[{len(inputs)}]scale={width}:{height}[scaled_{overlay_count}]"
                    filters.append(scale_filter)

                    # Create overlay filter
                    input_label = inputs[-1]
                    output_label = f"v{overlay_count}"
                    overlay_filter = f"[{input_label}][scaled_{overlay_count}]overlay={x}:{y}:enable='between(t,{overlay.start_time},{overlay.end_time})'[{output_label}]"
                    filters.append(overlay_filter)
                    inputs.append(output_label)
                    overlay_count += 1

            except Exception as e:
                logger.error(
                    f"Error creating overlay {i} for job {job_id}: {str(e)}")
                continue

        if not filters:
            # No overlays, just copy the video
            return "[0:v]copy[out]"

        # Join all filters
        filter_complex = ";".join(filters)

        # Map the final output
        final_output = inputs[-1]
        filter_complex += f";[{final_output}]copy[out]"

        return filter_complex

    def _create_text_filter(self, overlay: OverlayMetadata, video_width: int, video_height: int) -> str:
        """Create text filter for ffmpeg"""
        # Calculate position and size
        x = int(overlay.x * video_width)
        y = int(overlay.y * video_height)
        font_size = overlay.font_size or 24

        # Escape text for ffmpeg
        text = overlay.content.replace("'", "\\'").replace(":", "\\:")

        # Create drawtext filter
        text_filter = f"drawtext=text='{text}':x={x}:y={y}:fontsize={font_size}:fontcolor={overlay.font_color}"

        if overlay.background_color:
            text_filter += f":box=1:boxcolor={overlay.background_color}"

        if overlay.opacity and overlay.opacity < 1.0:
            text_filter += f":alpha={overlay.opacity}"

        return f"[0:v]{text_filter}[text_{len(text_filter)}]"

    async def _prepare_image_overlay(self, overlay: OverlayMetadata, video_width: int, video_height: int, job_id: str) -> str:
        """Prepare image for overlay"""
        # In a real implementation, you would handle image scaling and positioning here
        # For now, assume the image path is provided correctly
        return overlay.content

    async def _execute_ffmpeg(self, input_path: str, output_path: str, filter_complex: str, job_id: str) -> None:
        """Execute ffmpeg command"""
        cmd = [
            "ffmpeg",
            "-y",  # Overwrite output file
            "-i", input_path,
            "-filter_complex", filter_complex,
            "-map", "[out]",
            "-map", "0:a?",  # Include audio if present
            "-c:a", "copy",  # Copy audio codec
            "-c:v", "libx264",  # Use H.264 video codec
            "-preset", "medium",  # Encoding preset
            "-crf", "23",  # Quality setting
            output_path
        ]

        logger.info(
            f"Executing ffmpeg command for job {job_id}: {' '.join(cmd)}")

        try:
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )

            # Monitor progress (simplified)
            stdout, stderr = await process.communicate()

            if process.returncode != 0:
                error_msg = stderr.decode() if stderr else "Unknown ffmpeg error"
                raise Exception(f"ffmpeg failed: {error_msg}")

            logger.info(f"ffmpeg completed successfully for job {job_id}")

        except Exception as e:
            raise Exception(f"Error executing ffmpeg: {str(e)}")

    async def _update_job_progress(self, job_id: str, progress: float, message: str) -> None:
        """Update job progress"""
        if job_id in self.jobs:
            self.jobs[job_id].progress = progress
            self.jobs[job_id].message = message
            self.jobs[job_id].updated_at = datetime.now()
            logger.info(f"Job {job_id} progress: {progress}% - {message}")

        # Add small delay to simulate processing time
        await asyncio.sleep(0.5)

    def get_job_status(self, job_id: str) -> Optional[JobStatus]:
        """Get job status by ID"""
        return self.jobs.get(job_id)

    def cleanup_job(self, job_id: str) -> None:
        """Clean up job from memory"""
        if job_id in self.jobs:
            del self.jobs[job_id]

        if job_id in self.processing_tasks:
            task = self.processing_tasks[job_id]
            if not task.done():
                task.cancel()
            del self.processing_tasks[job_id]

    def list_all_jobs(self) -> Dict[str, JobStatus]:
        """List all jobs"""
        return self.jobs
