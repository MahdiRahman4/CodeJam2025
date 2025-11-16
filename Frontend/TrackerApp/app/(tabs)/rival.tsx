import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Alert, Image, PanResponder } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import FloatingButton from "@/components/rival-button";
import * as Progress from 'react-native-progress';

interface ProfileRow {
  id: string;
  riotID: string | null;
  has_rival: boolean;
  rival_profile_id: string | null;
}

interface PlayerStats {
  avg_kda_ratio: number;
  avg_damage_ratio: number;
  avg_cs_ratio: number;
  avg_gold_ratio: number;
  avg_vision_score_ratio: number;
  avg_impact_score_ratio: number;
}

const FindRivalScreen: React.FC = () => {
  const router = useRouter();
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => {
        const { dx, dy } = gesture;
        return Math.abs(dx) > 10 && Math.abs(dy) < 10;
      },
      onPanResponderRelease: (_, gesture) => {
        const { dx } = gesture;
        if (dx < -50) {
          // circle to leaderboard
          router.push("/leaderboard");
        } else if (dx > 50) {
          // back to index
          router.push("/");
        }
      },
    })
  ).current;
  const [currentProfile, setCurrentProfile] = useState<ProfileRow | null>(null);
  const [progressValues, setProgressValues] = useState<number[]>([0.3, 0.3, 0.3, 0.3, 0.3]);

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

    const fetchAverageStats = async () => {
      try {
        // First check if game_names exist in profiles
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('riotID')
          .not('riotID', 'is', null);

        if (profilesError) {
          console.log('Error fetching profiles:', profilesError);
          return;
        }

        // Extract game names from profiles (part before #) and convert to lowercase
        const profileGameNames = profiles
          ?.map(profile => profile.riotID?.split('#')[0]?.toLowerCase())
          .filter(name => name) || [];

        // Check if T3rroth exists in profiles (case-insensitive)
        const player1GameName = 'T3rroth';
        const player1InProfiles = profileGameNames.includes(player1GameName.toLowerCase());

        if (!player1InProfiles) {
          console.log(`Game name "${player1GameName}" not found in profiles`);
          return;
        }

        // Check if Plants exists in profiles (case-insensitive)
        const player2GameName = 'Plants';
        const player2InProfiles = profileGameNames.includes(player2GameName.toLowerCase());

        if (!player2InProfiles) {
          console.log(`Game name "${player2GameName}" not found in profiles`);
          return;
        }

        // Fetch stats for both players
        const { data: data1, error: error1 } = await supabase
          .from('player_summaries')
          .select('avg_damage, avg_vision_score, avg_impact_score, avg_cs, avg_gold, avg_kda')
          .eq('game_name', player1GameName)
          .eq('tag_line', 'NA1')
          .maybeSingle();

        const { data: data2, error: error2 } = await supabase
          .from('player_summaries')
          .select('avg_damage, avg_vision_score, avg_impact_score, avg_cs, avg_gold, avg_kda')
          .eq('game_name', player2GameName)
          .eq('tag_line', '333')
          .maybeSingle();

        if (error1 || error2) {
          console.log('Error fetching stats:', error1 || error2);
          return;
        }

        if (!data1 || !data2) {
          console.log('One or both players not found in database');
          return;
        }

        // Calculate averages
        const avgStats: PlayerStats = {
          avg_damage_ratio: data1.avg_damage /((data1.avg_damage || 0) + (data2.avg_damage || 0)),
          avg_vision_score_ratio: data1.avg_vision_score / ((data1.avg_vision_score || 0) + (data2.avg_vision_score || 0)),
          avg_impact_score_ratio: data1.avg_impact_score  / ((data1.avg_impact_score || 0) + (data2.avg_impact_score || 0)),
          avg_cs_ratio: data1.avg_cs / ((data1.avg_cs || 0) + (data2.avg_cs || 0)),
          avg_gold_ratio: data1.avg_gold / ((data1.avg_gold || 0) + (data2.avg_gold || 0)),
          avg_kda_ratio: data1.avg_kda  / ((data1.avg_kda || 0) + (data2.avg_kda || 0)),
        };

        const ratios = [
          avgStats.avg_kda_ratio,
          avgStats.avg_damage_ratio,
          avgStats.avg_cs_ratio,
          avgStats.avg_gold_ratio,
          avgStats.avg_vision_score_ratio,
        ];

        setProgressValues(ratios);
      } catch (err) {
        console.log('Error calculating average stats:', err);
      }
    };

    loadProfile();
    fetchAverageStats();
  }, []);

  if (!currentProfile) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container2} {...panResponder.panHandlers}>
      <Image
        source={require('../../asset_AARI/Exported/Rivals/CATS_RivalsBG_AARIALMABackground.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      />
      <Image
        source={require('../../asset_AARI/Exported/Rivals/CATS_RivalsBG_AARIALMAStats.png')}
        style={styles.statsImage}
        resizeMode="contain"
      />
      <Image
        source={require('../../asset_AARI/Exported/Rivals/CATS_RivalsBG_AARIALMARival Bar.png')}
        style={styles.rivalBarImage}
        resizeMode="contain"
      />
      <Image
        source={require('../../asset_AARI/Exported/Rivals/CATS_RivalsBG_AARIALMATitle Bar.png')}
        style={styles.titleBarImage}
        resizeMode="contain"
      />
      <View style={styles.progressContainer}>
        <View style={styles.statContainer}>
          <Text style={styles.statLabel}>KDA</Text>
          <Progress.Bar 
            progress={progressValues[0]} 
            width={230} 
            height={30}
            color="#a23e8c"
            unfilledColor="#4f8fba"
            borderWidth={5}
            borderColor="#471B2B"
            borderRadius={0}
            style={styles.progressBar}
          />
        </View>
        <View style={styles.statContainer}>
          <Text style={styles.statLabel}>DMG</Text>
          <Progress.Bar 
            progress={progressValues[1]} 
            width={230} 
            height={30}
            color="#a23e8c"
            unfilledColor="#4f8fba"
            borderWidth={5}
            borderColor="#471B2B"
            borderRadius={0}
            style={styles.progressBar}
          />
        </View>
        <View style={styles.statContainer}>
          <Text style={styles.statLabel}>CS</Text>
          <Progress.Bar 
            progress={progressValues[2]} 
            width={230} 
            height={30}
            color="#a23e8c"
            unfilledColor="#4f8fba"
            borderWidth={5}
            borderColor="#471B2B"
            borderRadius={0}
            style={styles.progressBar}
          />
        </View>
        <View style={styles.statContainer}>
          <Text style={styles.statLabel}>GOLD</Text>
          <Progress.Bar 
            progress={progressValues[3]} 
            width={230} 
            height={30}
            color="#a23e8c"
            unfilledColor="#4f8fba"
            borderWidth={5}
            borderColor="#471B2B"
            borderRadius={0}
            style={styles.progressBar}
          />
        </View>
        <View style={styles.statContainer}>
          <Text style={styles.statLabel}>VISION</Text>
          <Progress.Bar 
            progress={progressValues[4]} 
            width={230} 
            height={30}
            color="#a23e8c"
            unfilledColor="#4f8fba"
            borderWidth={5}
            borderColor="#471B2B"
            borderRadius={0}
            style={styles.progressBar}
          />
        </View>
      </View>
      <Text style={styles.titleText}>Plants</Text>
      <Text style={styles.subText}>Last 5 Games</Text>
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
  subText: {
    position: "absolute",
    fontFamily: "Jersey10_400Regular",
    fontSize: 40,
    color: "#471B2B",
    top: "8%",
    marginTop: 110,
    left: 0,
    right: 0,
    zIndex: 5,
    textAlign: "center",
  },
  progressContainer: {
    position: "absolute",
    top: "35%",
    marginTop: -90,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 6,
    gap: 7,
  },
  progressBar: {
    marginBottom: 0,
    borderRadius: 0,
  },
  statContainer: {
    alignItems: "center",
    marginBottom: 5,
  },
  statLabel: {
    fontFamily: "Jersey10_400Regular",
    fontSize: 25,
    color: "#471B2B",
    marginBottom: 4,
    textAlign: "center",
  },
});