import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
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
  const [rivalRiotId, setRivalRiotId] = useState('');
  const [loading, setLoading] = useState(false);

  // 1) Load current user's profile
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

  // 2) Handler to set rival
  const handleSetRival = async () => {
    if (!currentProfile) return;
    if (!rivalRiotId.trim()) {
      Alert.alert('Error', 'Please enter a Riot ID');
      return;
    }

    try {
      setLoading(true);

      // find rival profile by riotID
      const { data: rival, error: rivalError } = await supabase
        .from('profiles')
        .select('id, riotID')
        .eq('riotID', rivalRiotId.trim())
        .single();

      if (rivalError || !rival) {
        Alert.alert('Not found', 'No player with that Riot ID');
        return;
      }

      // prevent setting yourself as rival
      if (rival.id === currentProfile.id) {
        Alert.alert('Nice try 😅', 'You cannot set yourself as your rival');
        return;
      }

      // update current user's profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          has_rival: true,
          rival_profile_id: rival.id,
        })
        .eq('id', currentProfile.id);

      if (updateError) {
        console.log(updateError);
        Alert.alert('Error', 'Could not set rival');
        return;
      }

      Alert.alert('Rival set!', `You are now rivals with ${rival.riotID}`);
      setCurrentProfile({
        ...currentProfile,
        has_rival: true,
        rival_profile_id: rival.id,
      });
    } finally {
      setLoading(false);
    }
  };

  if (!currentProfile) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Loading profile...</Text>
      </View>
    );
  }

  // Already has rival → later you can show stats comparison here
  if (currentProfile.has_rival) {
    return (
          <View style={styles.container2}>
      <Text style={styles.title2}></Text>
      <View style={styles.statDisparityBox}>
        <Text style={styles.statDisparityTitle}>STAT DISPARITY</Text>
        
      </View>
      <FloatingButton useBack={true} />
    </View>
  );
}

const styles2 = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  statDisparityBox: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "50%",
    backgroundColor: "#f5f5f5",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statDisparityTitle: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 15,
  },
});


  

  // No rival yet → show input
  return (

    <View style={styles.container}>
      <Text style={styles.text}>You don’t have a rival yet.</Text>
      <Text style={styles.textSmall}>Ask your friend for their Riot ID</Text>

      <TextInput
        style={styles.input}
        placeholder="friendName#TAG"
        value={rivalRiotId}
        onChangeText={setRivalRiotId}
        autoCapitalize="none"
      />

      <Button title={loading ? 'Saving...' : 'Set Rival'} onPress={handleSetRival} disabled={loading} />
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
  },
  title2: {
    fontSize: 24,
    fontWeight: "bold",
  },
  statDisparityBox: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "50%",
    backgroundColor: "#f5f5f5",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statDisparityTitle: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 15,
  },
});
























