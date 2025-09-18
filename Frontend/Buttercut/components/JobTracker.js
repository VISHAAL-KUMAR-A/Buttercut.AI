import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const JobTracker = ({ visible, onClose, jobId }) => {
  const [jobStatus, setJobStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchJobStatus = async () => {
    if (!jobId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`http://localhost:8000/status/${jobId}`);
      
      if (response.ok) {
        const status = await response.json();
        setJobStatus(status);
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to fetch job status');
      }
    } catch (error) {
      console.error('Error fetching job status:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadResult = async () => {
    if (!jobId || jobStatus?.status !== 'completed') return;

    try {
      // In a real app, you would handle file download here
      // For now, we'll just show the download URL
      Alert.alert(
        'Download Ready',
        `Your video is ready for download!\n\nDownload URL: http://localhost:8000/result/${jobId}`,
        [
          {
            text: 'Copy URL',
            onPress: () => {
              // In a real app, you would copy to clipboard
              console.log('Download URL copied');
            }
          },
          { text: 'OK' }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to download result');
    }
  };

  useEffect(() => {
    if (visible && jobId) {
      fetchJobStatus();
      
      // Set up polling for job updates
      const interval = setInterval(() => {
        if (jobStatus?.status === 'processing') {
          fetchJobStatus();
        }
      }, 2000); // Poll every 2 seconds

      return () => clearInterval(interval);
    }
  }, [visible, jobId, jobStatus?.status]);

  const getStatusIcon = () => {
    switch (jobStatus?.status) {
      case 'processing':
        return { name: 'hourglass', color: '#ff9500' };
      case 'completed':
        return { name: 'checkmark-circle', color: '#34c759' };
      case 'failed':
        return { name: 'close-circle', color: '#ff3b30' };
      default:
        return { name: 'help-circle', color: '#8e8e93' };
    }
  };

  const getProgressColor = () => {
    const progress = jobStatus?.progress || 0;
    if (progress < 30) return '#ff3b30';
    if (progress < 70) return '#ff9500';
    return '#34c759';
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.header}
        >
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Job Tracker</Text>
          <Text style={styles.headerSubtitle}>Track your video processing</Text>
        </LinearGradient>

        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={fetchJobStatus} />
          }
        >
          {/* Job ID */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Job ID</Text>
            <Text style={styles.jobId}>{jobId}</Text>
          </View>

          {error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="warning" size={24} color="#ff3b30" />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={fetchJobStatus}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : jobStatus ? (
            <>
              {/* Status */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Status</Text>
                <View style={styles.statusContainer}>
                  <Ionicons 
                    name={getStatusIcon().name} 
                    size={24} 
                    color={getStatusIcon().color} 
                  />
                  <Text style={[styles.statusText, { color: getStatusIcon().color }]}>
                    {jobStatus.status.toUpperCase()}
                  </Text>
                </View>
              </View>

              {/* Progress */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Progress</Text>
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { 
                          width: `${jobStatus.progress}%`,
                          backgroundColor: getProgressColor()
                        }
                      ]} 
                    />
                  </View>
                  <Text style={styles.progressText}>{Math.round(jobStatus.progress)}%</Text>
                </View>
              </View>

              {/* Message */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Message</Text>
                <Text style={styles.messageText}>{jobStatus.message}</Text>
              </View>

              {/* Timestamps */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Timeline</Text>
                <View style={styles.timestampContainer}>
                  <Text style={styles.timestampLabel}>Created:</Text>
                  <Text style={styles.timestampValue}>
                    {new Date(jobStatus.created_at).toLocaleString()}
                  </Text>
                </View>
                <View style={styles.timestampContainer}>
                  <Text style={styles.timestampLabel}>Updated:</Text>
                  <Text style={styles.timestampValue}>
                    {new Date(jobStatus.updated_at).toLocaleString()}
                  </Text>
                </View>
                {jobStatus.estimated_completion && (
                  <View style={styles.timestampContainer}>
                    <Text style={styles.timestampLabel}>Estimated Completion:</Text>
                    <Text style={styles.timestampValue}>
                      {new Date(jobStatus.estimated_completion).toLocaleString()}
                    </Text>
                  </View>
                )}
              </View>

              {/* Error Details */}
              {jobStatus.error_details && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Error Details</Text>
                  <Text style={styles.errorDetails}>{jobStatus.error_details}</Text>
                </View>
              )}

              {/* Download Button */}
              {jobStatus.status === 'completed' && (
                <TouchableOpacity style={styles.downloadButton} onPress={downloadResult}>
                  <LinearGradient
                    colors={['#34c759', '#30d158']}
                    style={styles.downloadGradient}
                  >
                    <Ionicons name="download" size={20} color="white" />
                    <Text style={styles.downloadText}>Download Result</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </>
          ) : !isLoading && (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading job status...</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  jobId: {
    fontSize: 14,
    fontFamily: 'monospace',
    color: '#666',
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderRadius: 6,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    minWidth: 40,
  },
  messageText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  timestampContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  timestampLabel: {
    fontSize: 14,
    color: '#666',
  },
  timestampValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  errorDetails: {
    fontSize: 14,
    color: '#ff3b30',
    backgroundColor: '#fff5f5',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#ff3b30',
  },
  downloadButton: {
    marginTop: 20,
    marginBottom: 40,
  },
  downloadGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  downloadText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  errorText: {
    fontSize: 16,
    color: '#ff3b30',
    textAlign: 'center',
    marginVertical: 12,
  },
  retryButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 6,
  },
  retryText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
});

export default JobTracker;
