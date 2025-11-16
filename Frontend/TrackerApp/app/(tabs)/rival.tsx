import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, Image } from 'react-native';
import { supabase } from '../../lib/supabase';
import FloatingButton from "@/components/rival-button";

interface ProfileRow {
  id: string;
  riotID: string | null;
  has_rival: boolean;
  rival_profile_id: string | null;
}

const FindRivalScreen: React.FC = () => {
  const [currentProfile, setCurrentProfile] = useState<ProfileRow | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      const { data: authData, error: userError } = await supabase.auth.getUser();
      if (userError || !authData.user) {
        Alert.alert('Error', 'Not logged in');
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('id, riotID, has_rival, rival_profile_id')
        .eq('id', authData.user.id)
        .single();

      if (error) {
        console.log(error);
        Alert.alert('Error', 'Could not load profile');
        return;
      }

      setCurrentProfile(data as ProfileRow);
    };

    loadProfile();
  }, []);

  if (!currentProfile) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Loading profile...</Text>
      </View>
    );
  }

  // Show rival screen with layered assets
  return (
    <View style={styles.container2}>
      {/* Background layer - first */}
      <Image
        source={require('../../asset_AARI/Aseprite/Exported/Rivals/CATS_RivalsBG_AARIALMABackground.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      />
      {/* Stats layer - second */}
      <Image
        source={require('../../asset_AARI/Aseprite/Exported/Rivals/CATS_RivalsBG_AARIALMAStats.png')}
        style={styles.statsImage}
        resizeMode="contain"
      />
      {/* Rival Bar layer - third (on top of Stats) */}
      <Image
        source={require('../../asset_AARI/Aseprite/Exported/Rivals/CATS_RivalsBG_AARIALMARival Bar.png')}
        style={styles.rivalBarImage}
        resizeMode="contain"
      />
      {/* Title Bar layer - last */}
      <Image
        source={require('../../asset_AARI/Aseprite/Exported/Rivals/CATS_RivalsBG_AARIALMATitle Bar.png')}
        style={styles.titleBarImage}
        resizeMode="contain"
      />
      {/* Text overlay on title bar */}
      <Text style={styles.titleText}>Plants#333</Text>
      <FloatingButton useBack={true} />
    </View>
  );
}


export default FindRivalScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#020617',
    justifyContent: 'center',
  },
  text: {
    color: '#E5E7EB',
    marginBottom: 8,
    fontSize: 16,
  },
  textSmall: {
    color: '#9CA3AF',
    marginBottom: 12,
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: '#4B5563',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: '#F9FAFB',
    marginBottom: 12,
  },
  container2: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  title2: {
    fontSize: 24,
    fontWeight: "bold",
  },
  backgroundImage: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
    zIndex: 1,
  },
  rivalBarImage: {
    position: "absolute",
    width: "100%",
    height: "100%",
    zIndex: 3,
  },
  statsImage: {
    position: "absolute",
    width: "100%",
    height: "100%",
    zIndex: 2,
  },
  titleBarImage: {
    position: "absolute",
    width: "100%",
    height: "100%",
    zIndex: 4,
  },
  titleText: {
    position: "absolute",
    fontFamily: "PixelifySans_500Medium",
    fontSize: 50,
    color: "#471B2B",
    top: "8%",
    marginTop: 30,
    left: 0,
    right: 0,
    zIndex: 5,
    textAlign: "center",
  },
});
























