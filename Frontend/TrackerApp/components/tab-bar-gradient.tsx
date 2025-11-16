import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet } from 'react-native';

export function TabBarGradient() {
  return (
    <LinearGradient
      colors={['#000000', '#0a0a1a', '#1a1a3a']} // Black to dark blue gradient
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.gradient}
    />
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
    borderRadius: 20,
  },
});

