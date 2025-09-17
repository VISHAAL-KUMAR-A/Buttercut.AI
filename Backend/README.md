# Video Editor Backend API

A FastAPI backend for video editing with overlay support using ffmpeg.

## Prerequisites

Before running the backend, make sure you have the following installed:

1. **Python 3.8+**
2. **ffmpeg** - Required for video processing
   - Windows: Download from https://ffmpeg.org/download.html
   - macOS: `brew install ffmpeg`
   - Linux: `sudo apt-get install ffmpeg`

## Setup Instructions

1. **Navigate to the Backend directory:**
   ```bash
   cd Backend
   ```

2. **Create a virtual environment:**
   ```bash
   python -m venv venv
   ```

3. **Activate the virtual environment:**
   - Windows: `venv\Scripts\activate`
   - macOS/Linux: `source venv/bin/activate`

4. **Configure environment variables:**
   ```bash
   # Copy the example environment file
   cp .env.example .env
   
   # Edit .env file and update the FFMPEG_PATH and FFPROBE_PATH
   # Example for Windows:
   # FFMPEG_PATH=C:\path\to\ffmpeg\bin\ffmpeg.exe
   # FFPROBE_PATH=C:\path\to\ffmpeg\bin\ffprobe.exe
   ```

5. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

6. **Run the server:**
   ```bash
   python main.py
   ```
   Or using uvicorn directly:
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

7. **Verify the server is running:**
   - Open http://localhost:8000 in your browser
   - You should see: `{"message": "Video Editor API is running", "timestamp": "..."}`
   - API documentation available at: http://localhost:8000/docs
   - Check the console logs to ensure ffmpeg paths are detected correctly

## API Endpoints

### 1. Health Check
- **GET** `/`
- Returns server status and timestamp

### 2. Upload Video
- **POST** `/upload`
- Upload video file with overlay metadata
- **Form Data:**
  - `video`: Video file (multipart/form-data)
  - `overlays`: JSON string containing overlay metadata

### 3. Get Job Status
- **GET** `/status/{job_id}`
- Returns processing status and progress

### 4. Download Result
- **GET** `/result/{job_id}`
- Download the processed video file

### 5. Cleanup Job
- **DELETE** `/cleanup/{job_id}`
- Clean up files associated with a job

### 6. List All Jobs
- **GET** `/jobs`
- List all jobs and their statuses

## Testing with Postman

### Step 1: Upload a Video

**Request:**
- Method: `POST`
- URL: `http://localhost:8000/upload`
- Body Type: `form-data`

**Form Data:**
- Key: `video`, Type: `File`, Value: Select a video file
- Key: `overlays`, Type: `Text`, Value: JSON string (see example below)

**Example Overlay JSON:**
```json
[
  {
    "type": "text",
    "content": "Hello World!",
    "x": 0.1,
    "y": 0.1,
    "start_time": 2.0,
    "end_time": 5.0,
    "width": 0.3,
    "height": 0.1,
    "font_size": 24,
    "font_color": "white",
    "background_color": "black",
    "opacity": 0.8
  },
  {
    "type": "text",
    "content": "Overlay Text 2",
    "x": 0.5,
    "y": 0.8,
    "start_time": 3.0,
    "end_time": 7.0,
    "font_size": 32,
    "font_color": "yellow"
  }
]
```

**Expected Response:**
```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "processing",
  "message": "Video upload successful. Processing started."
}
```

### Step 2: Check Status

**Request:**
- Method: `GET`
- URL: `http://localhost:8000/status/{job_id}`

**Expected Response:**
```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "processing",
  "progress": 45.5,
  "message": "Processing video overlays...",
  "created_at": "2023-12-07T10:30:00Z",
  "updated_at": "2023-12-07T10:32:15Z",
  "error_details": null,
  "estimated_completion": "2023-12-07T10:35:00Z"
}
```

### Step 3: Download Result

**Request:**
- Method: `GET`
- URL: `http://localhost:8000/result/{job_id}`

**Expected Response:**
- File download with processed video

## Overlay Types

### Text Overlay
```json
{
  "type": "text",
  "content": "Your text here",
  "x": 0.1,
  "y": 0.1,
  "start_time": 2.0,
  "end_time": 5.0,
  "font_size": 24,
  "font_color": "white",
  "background_color": "black",
  "opacity": 0.8
}
```

### Image Overlay
```json
{
  "type": "image",
  "content": "/path/to/image.png",
  "x": 0.5,
  "y": 0.5,
  "start_time": 1.0,
  "end_time": 4.0,
  "width": 0.2,
  "height": 0.2,
  "opacity": 0.9
}
```

### Video Overlay
```json
{
  "type": "video",
  "content": "/path/to/overlay_video.mp4",
  "x": 0.7,
  "y": 0.1,
  "start_time": 0.0,
  "end_time": 3.0,
  "width": 0.25,
  "height": 0.25
}
```

## Directory Structure

```
Backend/
├── main.py              # FastAPI application
├── models.py            # Pydantic models
├── video_processor.py   # Video processing logic
├── requirements.txt     # Python dependencies
├── README.md           # This file
├── uploads/            # Uploaded videos (auto-created)
├── outputs/            # Processed videos (auto-created)
└── temp/              # Temporary files (auto-created)
```

## Error Handling

The API includes comprehensive error handling for:
- Invalid file types
- Missing required fields
- Video processing errors
- File system errors
- ffmpeg execution errors

## Environment Variables

The application uses a `.env` file for configuration. Key variables include:

- `FFMPEG_PATH`: Full path to ffmpeg executable
- `FFPROBE_PATH`: Full path to ffprobe executable  
- `HOST`: Server host (default: 0.0.0.0)
- `PORT`: Server port (default: 8000)
- `DEBUG`: Enable debug mode (default: True)
- `MAX_UPLOAD_SIZE`: Maximum file upload size
- `MAX_CONCURRENT_JOBS`: Maximum concurrent video processing jobs

## Notes

- Videos are processed asynchronously in the background
- Job IDs are UUIDs for unique identification
- Files are automatically cleaned up after processing
- The API supports CORS for frontend integration
- All timestamps are in seconds
- Position coordinates are relative (0-1) to video dimensions
- ffmpeg path is configurable via .env file (no system PATH required)
