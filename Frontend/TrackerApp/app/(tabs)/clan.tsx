import { Image } from 'expo-image';
import { Platform, StyleSheet, View } from 'react-native';

import { Collapsible } from '@/components/ui/collapsible';
import { ExternalLink } from '@/components/external-link';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Fonts } from '@/constants/theme';
import SearchBar from '@/components/ui/search-bar';

export default function TabTwoScreen() {
  return (
    <View> 
      <View style={style.bg}><SearchBar/></View>
      
    </View>
  );
}
  const style = StyleSheet.create({
    bg:{
      backgroundColor: '#A1CEDC',
    }
  })





