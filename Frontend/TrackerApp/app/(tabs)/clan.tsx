import { Image } from 'expo-image';
import { Button, Platform, StyleSheet, View } from 'react-native';

import { Collapsible } from '@/components/ui/collapsible';
import { ExternalLink } from '@/components/external-link';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Fonts } from '@/constants/theme';
import SearchBar from '@/components/ui/search-bar';
import { supabase } from '../../lib/supabase';

export default function TabTwoScreen() {
  const handleSignOut = async () => {
    await supabase.auth.signOut();
  }
  return (
    <View> 
      <View style={style.bg}><SearchBar/></View>
      <Button title="log out" onPress ={handleSignOut} />
    </View>
  );
}
  const style = StyleSheet.create({
    bg:{
      backgroundColor: '#A1CEDC',
    }
  })





