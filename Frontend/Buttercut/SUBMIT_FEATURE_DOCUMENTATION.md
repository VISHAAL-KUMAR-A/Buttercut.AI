# 📤 Submit Feature Documentation

## Overview
The submit functionality allows users to send their video project (uploaded video + overlay metadata) to the backend API for processing. This feature includes comprehensive validation, progress tracking, error handling, and job monitoring.

## Components

### 1. Main Submit Function (`submitProject`)
**Location**: `VideoEditor.js` (lines 259-394)

**Features**:
- ✅ **Pre-submission Validation**: Validates video, overlays, and timing
- ✅ **Data Preparation**: Formats overlay data to match backend `OverlayMetadata` model
- ✅ **FormData Creation**: Properly packages video file and metadata
- ✅ **API Communication**: Sends POST request to `/upload` endpoint
- ✅ **Error Handling**: Comprehensive error catching and user feedback
- ✅ **Success Handling**: Job ID tracking and progress monitoring

### 2. Project Validation (`validateProject`)
**Location**: `VideoEditor.js` (lines 225-257)

**Validates**:
- Video file selection
- At least one overlay present
- Overlay timing (start < end, within video duration)
- Provides specific error messages for each validation failure

### 3. Submit Progress Modal (`SubmitProgressModal`)
**Location**: `components/SubmitProgressModal.js`

**Features**:
- Beautiful animated loading screen
- Dynamic progress messages
- Rotating upload icon and pulsing animations
- Gradient overlay design

### 4. Job Tracker (`JobTracker`)
**Location**: `components/JobTracker.js`

**Features**:
- Real-time job status monitoring
- Progress bar with percentage
- Timeline tracking (created, updated, estimated completion)
- Download functionality when completed
- Error details display
- Auto-refresh every 2 seconds for processing jobs

## Data Flow

### 1. Submission Process
```
User clicks "Submit" 
→ validateProject() 
→ Prepare overlay data 
→ Create FormData 
→ POST to /upload 
→ Handle response
```

### 2. Overlay Data Format
The frontend sends overlay data exactly matching the backend `OverlayMetadata` model:

```javascript
{
  type: "text" | "image" | "video",
  content: string,
  x: number (0-1),
  y: number (0-1), 
  start_time: number,
  end_time: number,
  width: number (optional),
  height: number (optional),
  font_size: number (optional),
  font_color: string (optional),
  background_color: string (optional),
  opacity: number (optional)
}
```

### 3. FormData Structure
```
FormData {
  video: File {
    uri: string,
    type: "video/mp4",
    name: string
  },
  overlays: JSON.stringify(overlayData[])
}
```

## API Integration

### Backend Endpoints Used
1. **POST `/upload`** - Submit video and overlays
2. **GET `/status/{job_id}`** - Check processing status  
3. **GET `/result/{job_id}`** - Download completed video

### Request Headers
- **Content-Type**: Not set (FormData handles automatically with boundary)
- **Method**: POST for upload, GET for status/result

### Response Handling
- **Success (200)**: Extract `job_id`, show tracker
- **Client Error (4xx)**: Show specific error message
- **Server Error (5xx)**: Show generic server error
- **Network Error**: Show connection error with retry option

## Error Handling

### Validation Errors
- Missing video file
- No overlays added
- Invalid overlay timing
- Overlay extends beyond video duration

### Network Errors
- Backend server not running
- Connection timeout
- Invalid response format
- File too large (413)

### User Feedback
- **Validation**: Immediate alerts with specific issues
- **Network**: Clear error messages with retry options
- **Success**: Job ID and tracking options

## User Experience Flow

### 1. Submit Button Appearance
- Only appears when video selected AND overlays added
- Gradient styling with cloud-upload icon
- Disabled state during submission

### 2. Submission Process
1. **Validation**: Instant feedback if issues found
2. **Progress Modal**: Beautiful loading screen with messages
3. **Success Alert**: Job ID and tracking options
4. **Job Tracker**: Real-time monitoring with progress bar

### 3. Progress Messages
- "Preparing your project..."
- "Uploading video and overlay data..."
- Custom messages from backend during processing

## Advanced Features

### Auto-Refresh Job Status
- Polls backend every 2 seconds for processing jobs
- Stops polling when job completes or fails
- Pull-to-refresh capability

### Download Integration
- Direct download link when job completes
- Copy URL functionality
- File handling for mobile devices

### Project Reset
- Clears video selection
- Removes all overlays
- Resets timing controls
- Ready for new project

## Code Examples

### Basic Submit Call
```javascript
const response = await fetch('http://localhost:8000/upload', {
  method: 'POST',
  body: formData, // FormData with video + overlays
});
```

### Overlay Data Preparation
```javascript
const overlayData = overlays.map(overlay => ({
  type: overlay.type,
  content: overlay.content,
  x: Number(overlay.x.toFixed(3)),
  y: Number(overlay.y.toFixed(3)),
  start_time: Number(overlay.start_time),
  end_time: Number(overlay.end_time),
  // ... other properties
}));
```

### Job Status Polling
```javascript
const interval = setInterval(() => {
  if (jobStatus?.status === 'processing') {
    fetchJobStatus();
  }
}, 2000);
```

## Backend Compatibility

### OverlayMetadata Model Match
The frontend data structure exactly matches the backend Pydantic model:
- All required fields included
- Optional fields handled properly
- Data types match (float, int, string)
- Validation constraints respected

### File Upload Format
- Uses `multipart/form-data` encoding
- Video file as binary data
- Overlay metadata as JSON string
- Proper filename and MIME type

## Testing Checklist

### Happy Path
- ✅ Select video file
- ✅ Add multiple overlays
- ✅ Submit successfully
- ✅ Track job progress
- ✅ Download result

### Error Cases
- ✅ Submit without video
- ✅ Submit without overlays
- ✅ Invalid overlay timing
- ✅ Backend server down
- ✅ Network connectivity issues
- ✅ Large file upload

### UI/UX
- ✅ Beautiful loading animations
- ✅ Clear error messages
- ✅ Progress feedback
- ✅ Responsive design
- ✅ Smooth transitions

## Performance Optimizations

### Efficient Data Transfer
- Minimal overlay data sent
- Proper file compression
- FormData boundary handling

### Smart Polling
- Only polls during processing
- Stops when complete/failed
- Configurable intervals

### Memory Management
- Cleans up animations
- Removes event listeners
- Proper component unmounting

The submit feature provides a complete, professional-grade video upload and processing experience with comprehensive error handling, real-time progress tracking, and beautiful user interface animations.
