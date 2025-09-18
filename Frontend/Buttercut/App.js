import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import VideoEditor from './components/VideoEditor';

export default function App() {
  return (
    <>
      <VideoEditor />
      <StatusBar style="light" />
    </>
  );
}
