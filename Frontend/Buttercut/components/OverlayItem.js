import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  Image,
} from 'react-native';

const OverlayItem = ({ 
  overlay, 
  isVisible, 
  containerWidth, 
  containerHeight, 
  onPositionUpdate 
}) => {
  const pan = useRef(new Animated.ValueXY()).current;
  const scaleValue = useRef(new Animated.Value(0)).current;
  const opacityValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Initialize position
    pan.setValue({
      x: overlay.x * containerWidth,
      y: overlay.y * containerHeight,
    });
  }, [overlay.x, overlay.y, containerWidth, containerHeight]);

  useEffect(() => {
    if (isVisible) {
      // Animate in
      Animated.parallel([
        Animated.spring(scaleValue, {
          toValue: 1,
          tension: 80,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacityValue, {
          toValue: overlay.opacity || 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Animate out
      Animated.parallel([
        Animated.timing(scaleValue, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityValue, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible, overlay.opacity]);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    
    onPanResponderGrant: () => {
      // Highlight overlay when touched
      Animated.spring(scaleValue, {
        toValue: 1.1,
        useNativeDriver: true,
      }).start();
    },

    onPanResponderMove: Animated.event(
      [null, { dx: pan.x, dy: pan.y }],
      { useNativeDriver: false }
    ),

    onPanResponderRelease: (evt, gestureState) => {
      // Calculate new position
      const newX = Math.max(0, Math.min(
        gestureState.dx + overlay.x * containerWidth,
        containerWidth - 80
      ));
      const newY = Math.max(0, Math.min(
        gestureState.dy + overlay.y * containerHeight,
        containerHeight - 40
      ));

      // Update position in parent component
      onPositionUpdate(overlay.id, {
        x: newX / containerWidth,
        y: newY / containerHeight,
      });

      // Animate to final position
      Animated.spring(pan, {
        toValue: { x: newX, y: newY },
        useNativeDriver: false,
      }).start();

      // Reset scale
      Animated.spring(scaleValue, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    },
  });

  if (!isVisible) return null;

  const renderContent = () => {
    switch (overlay.type) {
      case 'text':
        return (
          <View style={[
            styles.textContainer,
            { backgroundColor: overlay.background_color || 'rgba(0,0,0,0.5)' }
          ]}>
            <Text style={[
              styles.text,
              {
                fontSize: overlay.font_size || 16,
                color: overlay.font_color || 'white',
              }
            ]}>
              {overlay.content}
            </Text>
          </View>
        );

      case 'image':
        return (
          <View style={styles.imageContainer}>
            {overlay.content.startsWith('http') || overlay.content.startsWith('file') ? (
              <Image source={{ uri: overlay.content }} style={styles.image} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Text style={styles.placeholderText}>📷</Text>
                <Text style={styles.placeholderSubtext}>Image</Text>
              </View>
            )}
          </View>
        );

      case 'video':
        return (
          <View style={styles.videoContainer}>
            <Text style={styles.placeholderText}>🎥</Text>
            <Text style={styles.placeholderSubtext}>Video</Text>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            { translateX: pan.x },
            { translateY: pan.y },
            { scale: scaleValue },
          ],
          opacity: opacityValue,
        },
      ]}
      {...panResponder.panHandlers}
    >
      {renderContent()}
      
      {/* Selection indicator */}
      <View style={styles.selectionIndicator} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 10,
  },
  textContainer: {
    padding: 8,
    borderRadius: 6,
    minWidth: 60,
    minHeight: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  imageContainer: {
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  image: {
    width: 80,
    height: 60,
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: 80,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  videoContainer: {
    width: 80,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFD700',
    borderStyle: 'dashed',
  },
  placeholderText: {
    fontSize: 20,
    marginBottom: 2,
  },
  placeholderSubtext: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
  },
  selectionIndicator: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderWidth: 2,
    borderColor: '#667eea',
    borderRadius: 8,
    opacity: 0.8,
  },
});

export default OverlayItem;
