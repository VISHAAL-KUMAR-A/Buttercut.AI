# 🎬 Buttercut - Video Editor Frontend

A beautiful and intuitive video editing app built with React Native and Expo.

## Features

✨ **Video Upload & Selection** - Choose videos from device storage
🎯 **Overlay System** - Add text, image, and video overlays
🎮 **Drag & Drop** - Position overlays with intuitive gestures
⏰ **Timing Controls** - Set precise start and end times for overlays
🎨 **Beautiful UI** - Modern design with smooth animations
☁️ **Backend Integration** - Submit projects for server-side rendering

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start the Development Server**
   ```bash
   npm start
   ```

3. **Run on Device**
   - Download Expo Go app on your phone
   - Scan the QR code from the development server
   - Or press `a` for Android emulator, `i` for iOS simulator

## Usage Guide

### 1. Select a Video
- Tap "Select Video" to choose a video from your device
- The video will appear in the preview player

### 2. Add Overlays
- **Text Overlay**: Tap "Text" button, enter your text, and tap "Add"
- **Image Overlay**: Tap "Image" button and select an image from your gallery  
- **Video Overlay**: Tap "Video" button to add a video overlay (demo mode)

### 3. Position Overlays
- Drag overlays on the video preview to position them
- Overlays are only visible during their specified time range

### 4. Set Timing
- Each overlay has start and end time controls
- Edit the timing to control when overlays appear and disappear

### 5. Submit for Rendering
- When satisfied with your edits, tap "Submit for Rendering"
- The app will send your project to the backend for processing
- You'll receive a job ID to track the rendering progress

## Backend Configuration

Make sure your backend server is running on `http://localhost:8000` or update the API endpoint in `VideoEditor.js`:

```javascript
const response = await fetch('http://your-backend-url:8000/upload', {
  // ... rest of the code
});
```

## Supported File Types

- **Videos**: MP4, MOV, AVI (device dependent)
- **Images**: JPG, PNG, GIF
- **Text**: Any UTF-8 text with customizable styling

## Architecture

```
components/
├── VideoEditor.js      # Main video editor screen
└── LoadingScreen.js    # Loading overlay component

App.js                  # Main app component
```

## Dependencies

- `expo-av` - Video playback
- `expo-document-picker` - File selection
- `expo-image-picker` - Image selection
- `react-native-gesture-handler` - Touch gestures
- `react-native-reanimated` - Smooth animations
- `expo-linear-gradient` - Beautiful gradients

## Troubleshooting

### Video Won't Play
- Ensure the video format is supported by your device
- Check that the video file isn't corrupted

### Overlays Not Appearing
- Verify that the current playback time is within the overlay's start/end time range
- Check that the overlay position is within the video bounds

### Submit Fails
- Ensure backend server is running
- Check network connectivity
- Verify the backend URL is correct

## Future Enhancements

- 🎵 Audio overlay support
- 🎨 More text styling options
- 📐 Overlay resizing handles
- 🔄 Undo/redo functionality
- 📱 Offline editing capabilities
- 🎞️ Timeline view
- 🎯 Snap-to-grid positioning

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.
