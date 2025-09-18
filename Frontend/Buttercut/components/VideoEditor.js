import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
  Dimensions,
  SafeAreaView,
  ScrollView,
  Animated,
  PanResponder,
  TextInput,
  Modal,
} from 'react-native';
import { Video } from 'expo-av';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import SubmitProgressModal from './SubmitProgressModal';
import JobTracker from './JobTracker';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const VIDEO_CONTAINER_HEIGHT = 250;
const VIDEO_CONTAINER_WIDTH = screenWidth - 40;

const VideoEditor = () => {
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [overlays, setOverlays] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showOverlayModal, setShowOverlayModal] = useState(false);
  const [selectedOverlayType, setSelectedOverlayType] = useState('text');
  const [newOverlayText, setNewOverlayText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('Preparing your project...');
  const [showJobTracker, setShowJobTracker] = useState(false);
  const [currentJobId, setCurrentJobId] = useState(null);
  
  const videoRef = useRef(null);
  const playbackSliderValue = useRef(new Animated.Value(0)).current;

  // Animation values for UI elements
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Animate UI entrance
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 80,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const pickVideo = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'video/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedVideo(result.assets[0]);
        setOverlays([]); // Reset overlays when new video is selected
        
        // Animate video load
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 0.95,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
          }),
        ]).start();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick video');
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        return result.assets[0].uri;
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
    return null;
  };

  const addOverlay = async (type) => {
    let content = '';
    
    if (type === 'text') {
      if (!newOverlayText.trim()) {
        Alert.alert('Error', 'Please enter text for the overlay');
        return;
      }
      content = newOverlayText.trim();
    } else if (type === 'image') {
      const imageUri = await pickImage();
      if (!imageUri) return;
      content = imageUri;
    } else if (type === 'video') {
      // For demo purposes, we'll use a placeholder
      content = 'demo_overlay_video.mp4';
    }

    const newOverlay = {
      id: Date.now().toString(),
      type,
      content,
      x: 0.1, // 10% from left
      y: 0.1, // 10% from top
      start_time: currentTime,
      end_time: Math.min(currentTime + 5, duration),
      width: type === 'text' ? 0.3 : 0.2,
      height: type === 'text' ? 0.1 : 0.15,
      font_size: 24,
      font_color: 'white',
      background_color: type === 'text' ? 'rgba(0,0,0,0.5)' : null,
      opacity: 1.0,
      position: new Animated.ValueXY({ x: 0.1 * VIDEO_CONTAINER_WIDTH, y: 0.1 * VIDEO_CONTAINER_HEIGHT }),
    };

    setOverlays([...overlays, newOverlay]);
    setShowOverlayModal(false);
    setNewOverlayText('');
    
    // Animate overlay appearance
    Animated.spring(newOverlay.position, {
      toValue: { x: 0.1 * VIDEO_CONTAINER_WIDTH, y: 0.1 * VIDEO_CONTAINER_HEIGHT },
      useNativeDriver: false,
    }).start();
  };

  const createPanResponder = (overlay) => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (event, gestureState) => {
        const newX = Math.max(0, Math.min(gestureState.dx + overlay.x * VIDEO_CONTAINER_WIDTH, VIDEO_CONTAINER_WIDTH - 50));
        const newY = Math.max(0, Math.min(gestureState.dy + overlay.y * VIDEO_CONTAINER_HEIGHT, VIDEO_CONTAINER_HEIGHT - 30));
        
        overlay.position.setValue({ x: newX, y: newY });
      },
      onPanResponderRelease: (event, gestureState) => {
        const newX = Math.max(0, Math.min(gestureState.dx + overlay.x * VIDEO_CONTAINER_WIDTH, VIDEO_CONTAINER_WIDTH - 50));
        const newY = Math.max(0, Math.min(gestureState.dy + overlay.y * VIDEO_CONTAINER_HEIGHT, VIDEO_CONTAINER_HEIGHT - 30));
        
        // Update overlay position in state
        const updatedOverlays = overlays.map(o => {
          if (o.id === overlay.id) {
            return {
              ...o,
              x: newX / VIDEO_CONTAINER_WIDTH,
              y: newY / VIDEO_CONTAINER_HEIGHT,
            };
          }
          return o;
        });
        setOverlays(updatedOverlays);
        
        // Animate to final position
        Animated.spring(overlay.position, {
          toValue: { x: newX, y: newY },
          useNativeDriver: false,
        }).start();
      },
    });
  };

  const updateOverlayTiming = (overlayId, field, value) => {
    const updatedOverlays = overlays.map(overlay => {
      if (overlay.id === overlayId) {
        return { ...overlay, [field]: parseFloat(value) || 0 };
      }
      return overlay;
    });
    setOverlays(updatedOverlays);
  };

  const removeOverlay = (overlayId) => {
    const updatedOverlays = overlays.filter(overlay => overlay.id !== overlayId);
    setOverlays(updatedOverlays);
  };

  const onPlaybackStatusUpdate = (status) => {
    if (status.isLoaded) {
      setCurrentTime(status.positionMillis / 1000);
      setDuration(status.durationMillis / 1000);
      setIsPlaying(status.isPlaying);
      
      // Update slider position
      const progress = status.positionMillis / status.durationMillis;
      playbackSliderValue.setValue(progress);
    }
  };

  const seekTo = (position) => {
    if (videoRef.current) {
      videoRef.current.setPositionAsync(position * 1000);
    }
  };

  const validateProject = () => {
    // Validate video
    if (!selectedVideo) {
      Alert.alert('Validation Error', 'Please select a video file first.');
      return false;
    }

    // Validate overlays
    if (overlays.length === 0) {
      Alert.alert('Validation Error', 'Please add at least one overlay to your video.');
      return false;
    }

    // Validate overlay timing
    for (const overlay of overlays) {
      if (overlay.start_time >= overlay.end_time) {
        Alert.alert(
          'Validation Error', 
          `Overlay "${overlay.content}" has invalid timing. End time must be greater than start time.`
        );
        return false;
      }
      if (overlay.end_time > duration) {
        Alert.alert(
          'Validation Error', 
          `Overlay "${overlay.content}" extends beyond video duration (${Math.floor(duration)}s).`
        );
        return false;
      }
    }

    return true;
  };

  const submitProject = async () => {
    // Validate project before submission
    if (!validateProject()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage('Preparing your project...');

    try {
      // Prepare overlay data exactly matching backend OverlayMetadata model
      const overlayData = overlays.map(overlay => ({
        type: overlay.type,
        content: overlay.content,
        x: Number(overlay.x.toFixed(3)), // Round to 3 decimal places
        y: Number(overlay.y.toFixed(3)),
        start_time: Number(overlay.start_time),
        end_time: Number(overlay.end_time),
        width: overlay.width || (overlay.type === 'text' ? 0.3 : 0.2),
        height: overlay.height || (overlay.type === 'text' ? 0.1 : 0.15),
        font_size: overlay.font_size || 24,
        font_color: overlay.font_color || 'white',
        background_color: overlay.background_color || null,
        opacity: Number((overlay.opacity || 1.0).toFixed(2)),
      }));

      // Log the data being sent for debugging
      console.log('Submitting project:', {
        videoName: selectedVideo.name,
        videoSize: selectedVideo.size,
        overlayCount: overlayData.length,
        overlays: overlayData
      });

      // Create form data
      const formData = new FormData();
      
      // Add video file
      formData.append('video', {
        uri: selectedVideo.uri,
        type: selectedVideo.mimeType || 'video/mp4',
        name: selectedVideo.name || `video_${Date.now()}.mp4`,
      });
      
      // Add overlay metadata as JSON string
      formData.append('overlays', JSON.stringify(overlayData));

      setSubmitMessage('Uploading video and overlay data...');

      // Submit to backend (remove Content-Type header - FormData sets it automatically)
      const response = await fetch('http://localhost:8000/upload', {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header - FormData handles it automatically with boundary
      });

      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        throw new Error('Invalid response from server. Please check if the backend is running.');
      }

      if (response.ok) {
        // Success - store job ID and show tracker
        setCurrentJobId(result.job_id);
        
        Alert.alert(
          '🎉 Success!', 
          `Video submitted successfully!\n\n` +
          `Job ID: ${result.job_id}\n` +
          `Status: ${result.status}\n` +
          `Message: ${result.message}\n\n` +
          `Your video is now being processed on the server.`,
          [
            {
              text: 'Track Progress',
              onPress: () => {
                setShowJobTracker(true);
              }
            },
            {
              text: 'Create New Project',
              style: 'default',
              onPress: () => {
                // Reset the editor for new project
                setSelectedVideo(null);
                setOverlays([]);
                setCurrentTime(0);
                setDuration(0);
              }
            }
          ]
        );
      } else {
        // Handle different types of errors
        let errorMessage = 'Unknown error occurred';
        
        if (result && result.detail) {
          errorMessage = result.detail;
        } else if (response.status === 404) {
          errorMessage = 'Backend server not found. Please ensure the server is running on http://localhost:8000';
        } else if (response.status === 413) {
          errorMessage = 'Video file is too large. Please select a smaller video file.';
        } else if (response.status >= 500) {
          errorMessage = 'Server error occurred. Please try again later.';
        }
        
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Submit error:', error);
      
      let userMessage = error.message;
      
      // Handle network errors
      if (error.name === 'TypeError' && error.message.includes('Network request failed')) {
        userMessage = 'Network error: Please check your internet connection and ensure the backend server is running.';
      } else if (error.message.includes('fetch')) {
        userMessage = 'Connection error: Cannot reach the backend server. Please ensure it\'s running on http://localhost:8000';
      }
      
      Alert.alert(
        'Submission Failed', 
        userMessage,
        [
          {
            text: 'Retry',
            onPress: () => submitProject()
          },
          {
            text: 'Cancel',
            style: 'cancel'
          }
        ]
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderOverlay = (overlay) => {
    const panResponder = createPanResponder(overlay);
    const isVisible = currentTime >= overlay.start_time && currentTime <= overlay.end_time;

    if (!isVisible) return null;

    return (
      <Animated.View
        key={overlay.id}
        style={[
          styles.overlayItem,
          {
            transform: [
              { translateX: overlay.position.x },
              { translateY: overlay.position.y },
            ],
            opacity: overlay.opacity,
          },
        ]}
        {...panResponder.panHandlers}
      >
        {overlay.type === 'text' && (
          <View style={[
            styles.textOverlay,
            { backgroundColor: overlay.background_color || 'transparent' }
          ]}>
            <Text style={[
              styles.overlayText,
              {
                fontSize: overlay.font_size,
                color: overlay.font_color,
              }
            ]}>
              {overlay.content}
            </Text>
          </View>
        )}
        {overlay.type === 'image' && (
          <View style={styles.imageOverlay}>
            <Text style={styles.placeholderText}>📷 Image</Text>
          </View>
        )}
        {overlay.type === 'video' && (
          <View style={styles.videoOverlay}>
            <Text style={styles.placeholderText}>🎥 Video</Text>
          </View>
        )}
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[
        styles.content,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        }
      ]}>
        {/* Header */}
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>🎬 Video Editor</Text>
          <Text style={styles.headerSubtitle}>Create amazing videos with overlays</Text>
        </LinearGradient>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Video Selection */}
          {!selectedVideo ? (
            <TouchableOpacity style={styles.videoSelectButton} onPress={pickVideo}>
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.gradientButton}
              >
                <Ionicons name="videocam" size={30} color="white" />
                <Text style={styles.buttonText}>Select Video</Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <View style={styles.videoContainer}>
              <View style={styles.videoPlayer}>
                <Video
                  ref={videoRef}
                  source={{ uri: selectedVideo.uri }}
                  style={styles.video}
                  useNativeControls={false}
                  resizeMode="contain"
                  onPlaybackStatusUpdate={onPlaybackStatusUpdate}
                />
                
                {/* Overlays rendered on top of video */}
                <View style={styles.overlayContainer}>
                  {overlays.map(renderOverlay)}
                </View>
              </View>

              {/* Video Controls */}
              <View style={styles.videoControls}>
                <TouchableOpacity
                  style={styles.playButton}
                  onPress={() => {
                    if (isPlaying) {
                      videoRef.current.pauseAsync();
                    } else {
                      videoRef.current.playAsync();
                    }
                  }}
                >
                  <Ionicons
                    name={isPlaying ? "pause" : "play"}
                    size={24}
                    color="white"
                  />
                </TouchableOpacity>
                
                <View style={styles.timelineContainer}>
                  <Text style={styles.timeText}>
                    {Math.floor(currentTime)}s / {Math.floor(duration)}s
                  </Text>
                  <View style={styles.timeline}>
                    <View style={[
                      styles.timelineProgress,
                      { width: `${(currentTime / duration) * 100}%` }
                    ]} />
                  </View>
                </View>
              </View>

              {/* Change Video Button */}
              <TouchableOpacity style={styles.changeVideoButton} onPress={pickVideo}>
                <Text style={styles.changeVideoText}>Change Video</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Overlay Controls */}
          {selectedVideo && (
            <View style={styles.overlayControls}>
              <Text style={styles.sectionTitle}>Overlays</Text>
              
              {/* Add Overlay Buttons */}
              <View style={styles.addOverlayButtons}>
                <TouchableOpacity
                  style={styles.overlayTypeButton}
                  onPress={() => {
                    setSelectedOverlayType('text');
                    setShowOverlayModal(true);
                  }}
                >
                  <Ionicons name="text" size={20} color="white" />
                  <Text style={styles.overlayTypeText}>Text</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.overlayTypeButton}
                  onPress={() => addOverlay('image')}
                >
                  <Ionicons name="image" size={20} color="white" />
                  <Text style={styles.overlayTypeText}>Image</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.overlayTypeButton}
                  onPress={() => addOverlay('video')}
                >
                  <Ionicons name="videocam" size={20} color="white" />
                  <Text style={styles.overlayTypeText}>Video</Text>
                </TouchableOpacity>
              </View>

              {/* Overlay List */}
              {overlays.map((overlay, index) => (
                <View key={overlay.id} style={styles.overlayListItem}>
                  <View style={styles.overlayInfo}>
                    <Text style={styles.overlayTitle}>
                      {overlay.type.toUpperCase()} - {overlay.type === 'text' ? overlay.content : 'Media'}
                    </Text>
                    <View style={styles.timingControls}>
                      <View style={styles.timingInput}>
                        <Text style={styles.timingLabel}>Start:</Text>
                        <TextInput
                          style={styles.timingTextInput}
                          value={overlay.start_time.toString()}
                          onChangeText={(value) => updateOverlayTiming(overlay.id, 'start_time', value)}
                          keyboardType="numeric"
                          placeholder="0"
                        />
                        <Text style={styles.timingUnit}>s</Text>
                      </View>
                      
                      <View style={styles.timingInput}>
                        <Text style={styles.timingLabel}>End:</Text>
                        <TextInput
                          style={styles.timingTextInput}
                          value={overlay.end_time.toString()}
                          onChangeText={(value) => updateOverlayTiming(overlay.id, 'end_time', value)}
                          keyboardType="numeric"
                          placeholder="5"
                        />
                        <Text style={styles.timingUnit}>s</Text>
                      </View>
                    </View>
                  </View>
                  
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeOverlay(overlay.id)}
                  >
                    <Ionicons name="trash" size={20} color="#ff4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* Submit Button */}
          {selectedVideo && overlays.length > 0 && (
            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={submitProject}
              disabled={isSubmitting}
            >
              <LinearGradient
                colors={isSubmitting ? ['#cccccc', '#999999'] : ['#ff6b6b', '#ee5a52']}
                style={styles.gradientButton}
              >
                <Ionicons 
                  name={isSubmitting ? "hourglass" : "cloud-upload"} 
                  size={24} 
                  color="white" 
                />
                <Text style={styles.buttonText}>
                  {isSubmitting ? 'Submitting...' : 'Submit for Rendering'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </ScrollView>

        {/* Text Overlay Modal */}
        <Modal
          visible={showOverlayModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowOverlayModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Add Text Overlay</Text>
              
              <TextInput
                style={styles.textInput}
                placeholder="Enter text..."
                value={newOverlayText}
                onChangeText={setNewOverlayText}
                multiline
                autoFocus
              />
              
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => setShowOverlayModal(false)}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonPrimary]}
                  onPress={() => addOverlay('text')}
                >
                  <Text style={[styles.modalButtonText, styles.modalButtonTextPrimary]}>
                    Add
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Submit Progress Modal */}
        <SubmitProgressModal 
          visible={isSubmitting} 
          message={submitMessage}
        />

        {/* Job Tracker Modal */}
        <JobTracker 
          visible={showJobTracker}
          onClose={() => setShowJobTracker(false)}
          jobId={currentJobId}
        />
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 40,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginTop: 5,
  },
  videoSelectButton: {
    margin: 20,
    marginTop: 30,
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  videoContainer: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  videoPlayer: {
    position: 'relative',
    width: '100%',
    height: VIDEO_CONTAINER_HEIGHT,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  overlayItem: {
    position: 'absolute',
    zIndex: 10,
  },
  textOverlay: {
    padding: 8,
    borderRadius: 8,
    minWidth: 80,
    minHeight: 30,
  },
  overlayText: {
    fontSize: 16,
    fontWeight: '600',
  },
  imageOverlay: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'white',
    borderStyle: 'dashed',
  },
  videoOverlay: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'yellow',
    borderStyle: 'dashed',
  },
  placeholderText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  videoControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 12,
  },
  playButton: {
    backgroundColor: '#667eea',
    padding: 12,
    borderRadius: 8,
  },
  timelineContainer: {
    flex: 1,
  },
  timeText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  timeline: {
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  timelineProgress: {
    height: '100%',
    backgroundColor: '#667eea',
  },
  changeVideoButton: {
    marginTop: 12,
    alignSelf: 'center',
  },
  changeVideoText: {
    color: '#667eea',
    fontSize: 14,
    fontWeight: '600',
  },
  overlayControls: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  addOverlayButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  overlayTypeButton: {
    flex: 1,
    backgroundColor: '#667eea',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 6,
  },
  overlayTypeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  overlayListItem: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  overlayInfo: {
    flex: 1,
  },
  overlayTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  timingControls: {
    flexDirection: 'row',
    gap: 16,
  },
  timingInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timingLabel: {
    fontSize: 12,
    color: '#666',
  },
  timingTextInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 4,
    width: 40,
    textAlign: 'center',
    fontSize: 12,
  },
  timingUnit: {
    fontSize: 12,
    color: '#666',
  },
  removeButton: {
    padding: 8,
  },
  submitButton: {
    margin: 20,
    marginBottom: 40,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: screenWidth - 40,
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  modalButtonPrimary: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  modalButtonText: {
    fontSize: 16,
    color: '#666',
  },
  modalButtonTextPrimary: {
    color: 'white',
    fontWeight: '600',
  },
});

export default VideoEditor;
