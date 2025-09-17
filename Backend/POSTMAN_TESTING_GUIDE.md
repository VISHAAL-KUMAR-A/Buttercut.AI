# 📮 Postman Testing Guide for Video Editor API

This guide provides step-by-step instructions for testing the Video Editor API using Postman.

## 🚀 Quick Start

### 1. Start the Server
```bash
cd Backend
python start_server.py
```
Or manually:
```bash
pip install -r requirements.txt
python main.py
```

### 2. Import Postman Collection
- Open Postman
- Click "Import" button
- Select the file: `Video_Editor_API.postman_collection.json`
- The collection will be imported with all pre-configured requests

### 3. Verify Server is Running
- Use the "Health Check" request
- Expected response:
```json
{
  "message": "Video Editor API is running",
  "timestamp": "2023-12-07T10:30:00Z"
}
```

## 📝 Testing Scenarios

### Scenario 1: Basic Text Overlay

**Step 1: Upload Video with Text Overlay**
- Request: `2. Upload Video with Text Overlays`
- Select a video file (MP4, AVI, MOV, etc.)
- The overlay JSON is pre-filled with text overlays
- Click "Send"
- **Save the `job_id` from the response**

**Step 2: Monitor Progress**
- Request: `4. Get Job Status`
- The `job_id` is automatically set from Step 1
- Keep checking until status becomes "completed"

**Step 3: Download Result**
- Request: `5. Download Processed Video`
- Download the processed video file

### Scenario 2: Mixed Overlays (Text + Image + Video)

**Step 1: Prepare Assets**
- Have an image file ready (PNG, JPG)
- Have a small video clip ready (MP4)
- Update the overlay JSON paths in request `3. Upload Video with Mixed Overlays`

**Step 2: Upload**
- Use request: `3. Upload Video with Mixed Overlays`
- Update the `content` fields with actual file paths:
```json
{
  "type": "image",
  "content": "C:/path/to/your/image.png",
  ...
}
```

**Step 3: Monitor and Download**
- Same as Scenario 1

## 🔧 Customizing Overlays

### Text Overlay Parameters
```json
{
  "type": "text",
  "content": "Your text here",
  "x": 0.1,                    // Position X (0-1)
  "y": 0.1,                    // Position Y (0-1)
  "start_time": 2.0,           // Start time in seconds
  "end_time": 5.0,             // End time in seconds
  "font_size": 24,             // Font size
  "font_color": "white",       // Font color
  "background_color": "black", // Background color
  "opacity": 0.8               // Opacity (0-1)
}
```

### Image Overlay Parameters
```json
{
  "type": "image",
  "content": "/full/path/to/image.png",
  "x": 0.5,                    // Position X (0-1)
  "y": 0.5,                    // Position Y (0-1)
  "start_time": 1.0,           // Start time in seconds
  "end_time": 4.0,             // End time in seconds
  "width": 0.2,                // Width relative to video (0-1)
  "height": 0.2,               // Height relative to video (0-1)
  "opacity": 0.9               // Opacity (0-1)
}
```

### Video Overlay Parameters
```json
{
  "type": "video",
  "content": "/full/path/to/overlay.mp4",
  "x": 0.7,                    // Position X (0-1)
  "y": 0.1,                    // Position Y (0-1)
  "start_time": 0.0,           // Start time in seconds
  "end_time": 3.0,             // End time in seconds
  "width": 0.25,               // Width relative to video (0-1)
  "height": 0.25               // Height relative to video (0-1)
}
```

## 📊 Expected Response Codes

| Endpoint | Success Code | Error Codes |
|----------|-------------|-------------|
| Health Check | 200 | - |
| Upload | 200 | 400 (bad file/data), 500 (server error) |
| Status | 200 | 404 (job not found) |
| Result | 200 | 400 (not completed), 404 (not found) |
| Jobs | 200 | - |
| Cleanup | 200 | 500 (cleanup error) |

## 🧪 Testing Checklist

- [ ] Health check returns 200
- [ ] Upload with valid video and overlay data
- [ ] Status endpoint shows processing progress
- [ ] Status eventually shows "completed"
- [ ] Result endpoint downloads video file
- [ ] Jobs endpoint lists all jobs
- [ ] Cleanup removes job data

## 🚨 Troubleshooting

### "ffmpeg not found" Error
- Install ffmpeg and ensure it's in your system PATH
- Windows: Download from https://ffmpeg.org/download.html
- macOS: `brew install ffmpeg`
- Linux: `sudo apt-get install ffmpeg`

### Upload Fails with 400 Error
- Check file type (must be video)
- Validate JSON format in overlays field
- Ensure all required fields are present

### Processing Fails
- Check server logs for ffmpeg errors
- Verify overlay file paths exist (for image/video overlays)
- Check video format compatibility

### Connection Refused
- Ensure server is running on port 8000
- Check if another service is using the port
- Verify firewall settings

## 📁 Sample Files Structure

Create a test folder with sample files:
```
test_files/
├── video.mp4        # Main video file
├── logo.png         # Image overlay
├── clip.mp4         # Video overlay
└── subtitle.srt     # (Future feature)
```

## 🔄 Testing Workflow

1. **Start Server** → Health Check
2. **Upload Video** → Get job_id
3. **Poll Status** → Wait for completion
4. **Download Result** → Verify output
5. **Cleanup** → Remove files
6. **Repeat** with different overlay combinations

## 📈 Performance Notes

- Small videos (< 100MB) process in 1-3 minutes
- Processing time depends on video length and overlay complexity
- Progress updates every few seconds
- Background processing doesn't block other requests

## 🔐 Security Notes

- API accepts any file type upload (validation needed for production)
- No authentication implemented (for testing only)
- Files are stored locally (consider cloud storage for production)
- No rate limiting (implement for production use)
