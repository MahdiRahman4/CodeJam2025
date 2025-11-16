import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Image,
  PanResponder,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import FloatingButton from '@/components/rival-button';
import * as Progress from 'react-native-progress';

interface ProfileRow {
  id: string;
  riotID: string | null;
  has_rival: boolean;
  // stores player_summaries.game_name as text
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

interface RivalOption {
  game_name: string;  // from player_summaries.game_name
  tag_line: string;   // from player_summaries.tag_line
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
          router.push('/leaderboard');
        } else if (dx > 50) {
          router.push('/');
        }
      },
    })
  ).current;

  const [currentProfile, setCurrentProfile] = useState<ProfileRow | null>(null);
  const [progressValues, setProgressValues] = useState<number[]>([
    0.5, 0.5, 0.5, 0.5, 0.5,
  ]);
  const [playerData1, setPlayerData1] = useState<any>(null); // T3rroth
  const [playerData2, setPlayerData2] = useState<any>(null); // rival

  const [rivalName, setRivalName] = useState<string>('Rival');
  const [rivalSelectorOpen, setRivalSelectorOpen] = useState(false);
  const [rivalOptions, setRivalOptions] = useState<RivalOption[]>([]);
  const [loadingRivals, setLoadingRivals] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // 1) Load profile + current rival name (if any)
  useEffect(() => {
    const loadProfile = async () => {
      const { data: authData, error: userError } = await supabase.auth.getUser();
      if (userError || !authData?.user) {
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

      const profile = data as ProfileRow;
      setCurrentProfile(profile);

      // If a rival is already set, fetch their name from player_summaries via game_name
      if (profile.rival_profile_id) {
        const { data: rival, error: rivalErr } = await supabase
          .from('player_summaries')
          .select('game_name, tag_line')
          .eq('game_name', profile.rival_profile_id)
          .maybeSingle();

        if (!rivalErr && rival?.game_name) {
          setRivalName(rival.game_name);
        }
      }
    };

    loadProfile();
  }, []);

  // 2) Fetch stats for T3rroth (hardcoded) vs current rival whenever rival changes
  useEffect(() => {
    const fetchAverageStats = async () => {
      if (!currentProfile) return;

      try {
        // --- LEFT SIDE: "YOU" (for now hardcoded as T3rroth) ---
        // TODO: later, replace this block with:
        //  - use currentProfile.riotID, split into game_name / tag_line
        //  - query player_summaries based on the logged-in user's Riot ID
        const { data: data1, error: error1 } = await supabase
          .from('player_summaries')
          .select(
            'avg_damage, avg_vision_score, avg_impact_score, avg_cs, avg_gold, avg_kda'
          )
          .eq('game_name', 'T3rroth')
          .eq('tag_line', 'NA1') // TODO: replace with user's tag later
          .maybeSingle();

        if (error1 || !data1) {
          console.log('Error fetching T3rroth stats or not found:', error1);
          return;
        }

        // If no rival set, show T3rroth only (keep bars neutral at 0.5)
        if (!currentProfile.rival_profile_id) {
          setPlayerData1(data1);
          setPlayerData2(null);
          setProgressValues([0.5, 0.5, 0.5, 0.5, 0.5]);
          return;
        }

        // --- RIGHT SIDE: RIVAL (dynamic via rival_profile_id / game_name) ---
        const { data: data2, error: error2 } = await supabase
          .from('player_summaries')
          .select(
            'avg_damage, avg_vision_score, avg_impact_score, avg_cs, avg_gold, avg_kda, game_name, tag_line'
          )
          .eq('game_name', currentProfile.rival_profile_id)
          .maybeSingle();

        if (error2) {
          console.log('Error fetching rival stats:', error2);
          Alert.alert('Error', `Could not fetch rival stats: ${error2.message}`);
          return;
        }

        if (!data2) {
          console.log('Rival not found:', currentProfile.rival_profile_id);
          // Clear the rival if they don't exist at all
          setPlayerData2(null);
          setProgressValues([0.5, 0.5, 0.5, 0.5, 0.5]);
          return;
        }

        // Handle missing stats gracefully with defaults (0)
        const rivalData = {
          ...data2,
          avg_damage: data2.avg_damage ?? 0,
          avg_kda: data2.avg_kda ?? 0,
          avg_cs: data2.avg_cs ?? 0,
          avg_gold: data2.avg_gold ?? 0,
          avg_vision_score: data2.avg_vision_score ?? 0,
          avg_impact_score: data2.avg_impact_score ?? 0,
        };

        setPlayerData1(data1);
        setPlayerData2(rivalData);

        // Also keep rival name in sync if it somehow wasn't set yet
        if (rivalData.game_name && rivalName === 'Rival') {
          setRivalName(rivalData.game_name);
        }

        // Calculate ratios, defaulting to 0.5 if both players have 0 for a stat
        const calculateRatio = (val1: number, val2: number) => {
          const sum = val1 + val2;
          return sum > 0 ? val1 / sum : 0.5;
        };

        const avgStats: PlayerStats = {
          avg_damage_ratio: calculateRatio(data1.avg_damage || 0, rivalData.avg_damage),
          avg_vision_score_ratio: calculateRatio(data1.avg_vision_score || 0, rivalData.avg_vision_score),
          avg_impact_score_ratio: calculateRatio(data1.avg_impact_score || 0, rivalData.avg_impact_score),
          avg_cs_ratio: calculateRatio(data1.avg_cs || 0, rivalData.avg_cs),
          avg_gold_ratio: calculateRatio(data1.avg_gold || 0, rivalData.avg_gold),
          avg_kda_ratio: calculateRatio(data1.avg_kda || 0, rivalData.avg_kda),
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

    fetchAverageStats();
  }, [currentProfile, rivalName]);

  // Load rivals from player_summaries when opening modal
  const openRivalSelector = async () => {
    try {
      setLoadingRivals(true);
      setRivalSelectorOpen(true);

      const { data, error } = await supabase
        .from('player_summaries')
        .select('game_name, tag_line');

      if (error) {
        console.log('Error loading rival options from player_summaries:', error);
        Alert.alert('Error', 'Could not load players');
        return;
      }

      // Only filter out players without a game_name
      const validPlayers = (data ?? []).filter(player => player.game_name);

      setRivalOptions(validPlayers as RivalOption[]);
    } finally {
      setLoadingRivals(false);
    }
  };

  // When user taps a rival from list
  const handleSelectRival = async (rival: RivalOption) => {
    if (!currentProfile) return;
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          has_rival: true,
          // store player_summaries.game_name in profiles.rival_profile_id
          rival_profile_id: rival.game_name,
        })
        .eq('id', currentProfile.id);

      if (error) {
        console.log('Error setting rival:', error);
        Alert.alert('Error', `Could not set rival: ${error.message}`);
        return;
      }

      setRivalName(rival.game_name);
      setCurrentProfile({
        ...currentProfile,
        has_rival: true,
        rival_profile_id: rival.game_name,
      });
      setRivalSelectorOpen(false);
  
    } catch (err: any) {
      console.log('Error selecting rival (unexpected):', err);
      Alert.alert('Error', 'Unexpected error while setting rival');
    }
  };

  if (!currentProfile) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Loading profile...</Text>
      </View>
    );
  }

  const lowerSearch = searchTerm.toLowerCase();
  const filteredRivals = rivalOptions.filter((opt) => {
    if (!lowerSearch) return true;
    const name = opt.game_name.toLowerCase();
    const tag = (opt.tag_line || '').toLowerCase();
    return name.includes(lowerSearch) || tag.includes(lowerSearch);
  });

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

      <Text style={styles.titleText}>{rivalName}</Text>
      <Text style={styles.subText}>Last 5 Games</Text>
      <Text
        style={[
          styles.impactText,
          {
            color:
              playerData1 && playerData2
                ? (() => {
                    // Calculate weighted score for player1
                    let player1Score = 0;
                    
                    // KDA (weight: 1)
                    if ((playerData1.avg_kda || 0) > (playerData2.avg_kda || 0)) player1Score += 1;
                    
                    // Damage (weight: 1)
                    if ((playerData1.avg_damage || 0) > (playerData2.avg_damage || 0)) player1Score += 1;
                    
                    // CS (weight: 1)
                    if ((playerData1.avg_cs || 0) > (playerData2.avg_cs || 0)) player1Score += 1;
                    
                    // Gold (weight: 0.5)
                    if ((playerData1.avg_gold || 0) > (playerData2.avg_gold || 0)) player1Score += 0.5;
                    
                    // Vision (weight: 1)
                    if ((playerData1.avg_vision_score || 0) > (playerData2.avg_vision_score || 0)) player1Score += 1;
                    
                    // Total possible score: 4.5 (1+1+1+0.5+1)
                    // Player1 wins if they have more than half
                    return player1Score > 2.25 ? '#a23e8c' : '#4f8fba';
                  })()
                : '#471B2B',
          },
        ]}
      >
        {playerData1 && playerData2
          ? (() => {
              // Calculate weighted score for player1
              let player1Score = 0;
              
              // KDA (weight: 1)
              if ((playerData1.avg_kda || 0) > (playerData2.avg_kda || 0)) player1Score += 1;
              
              // Damage (weight: 1)
              if ((playerData1.avg_damage || 0) > (playerData2.avg_damage || 0)) player1Score += 1;
              
              // CS (weight: 1)
              if ((playerData1.avg_cs || 0) > (playerData2.avg_cs || 0)) player1Score += 1;
              
              // Gold (weight: 0.5)
              if ((playerData1.avg_gold || 0) > (playerData2.avg_gold || 0)) player1Score += 0.5;
              
              // Vision (weight: 1)
              if ((playerData1.avg_vision_score || 0) > (playerData2.avg_vision_score || 0)) player1Score += 1;
              
              // Total possible score: 4.5 (1+1+1+0.5+1)
              // Player1 wins if they have more than half
              return player1Score > 2.25 ? '>' : '<';
            })()
          : '-'}
      </Text>

      {/* Left (you / T3rroth for now) */}
      <Image
        source={require('../../asset_AARI/Exported/Hats/Headshots/CATS_PinkCat_Headshot_Default_AARIALMA.gif')}
        style={styles.leftCatImage}
        resizeMode="contain"
      />

      {/* Right (rival) – clickable */}
      <Pressable style={styles.rightCatPressable} onPress={openRivalSelector}>
        <Image
          source={require('../../asset_AARI/Exported/Hats/Headshots/CATS_BlueCat_Headshot_Default_AARIALMA.gif')}
          style={styles.rightCatImage}
          resizeMode="contain"
        />
      </Pressable>

      <FloatingButton useBack={true} />

      {/* Rival selector modal */}
      <Modal
        visible={rivalSelectorOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setRivalSelectorOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Choose your rival</Text>

            {/* Search bar */}
            <TextInput
              value={searchTerm}
              onChangeText={setSearchTerm}
              placeholder="Search by name or tag..."
              placeholderTextColor="#F9E4C8"
              style={styles.modalSearch}
            />

            {loadingRivals ? (
              <Text style={styles.modalText}>Loading players...</Text>
            ) : (
              <ScrollView style={styles.modalList}>
                {filteredRivals.length === 0 ? (
                  <Text style={styles.modalText}>No rivals found.</Text>
                ) : (
                  filteredRivals.map((opt) => (
                    <Pressable
                      key={`${opt.game_name}-${opt.tag_line}`}
                      style={styles.modalItem}
                      onPress={() => handleSelectRival(opt)}
                    >
                      <Text style={styles.modalItemText}>{opt.game_name}</Text>
                      {opt.tag_line && (
                        <Text style={styles.modalItemSub}>#{opt.tag_line}</Text>
                      )}
                    </Pressable>
                  ))
                )}
              </ScrollView>
            )}
            <Pressable
              style={styles.modalCloseButton}
              onPress={() => setRivalSelectorOpen(false)}
            >
              <Text style={styles.modalCloseText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
};

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
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  title2: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    zIndex: 1,
  },
  rivalBarImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: 3,
  },
  statsImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: 2,
  },
  titleBarImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: 4,
  },
  titleText: {
    position: 'absolute',
    fontFamily: 'PixelifySans_500Medium',
    fontSize: 50,
    color: '#471B2B',
    top: '8%',
    marginTop: 30,
    left: 0,
    right: 0,
    zIndex: 5,
    textAlign: 'center',
  },
  subText: {
    position: 'absolute',
    fontFamily: 'Jersey10_400Regular',
    fontSize: 40,
    color: '#471B2B',
    top: '8%',
    marginTop: 110,
    left: 0,
    right: 0,
    zIndex: 5,
    textAlign: 'center',
  },
  impactText: {
    position: 'absolute',
    fontFamily: 'Jersey10_400Regular',
    fontSize: 90,
    color: '#471B2B',
    top: '8%',
    marginTop: 625,
    left: 0,
    right: 0,
    zIndex: 5,
    textAlign: 'center',
  },
  progressContainer: {
    position: 'absolute',
    top: '35%',
    marginTop: -90,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 6,
    gap: 7,
  },
  progressBar: {
    marginBottom: 0,
    borderRadius: 0,
  },
  statContainer: {
    alignItems: 'center',
    marginBottom: 5,
  },
  statLabel: {
    fontFamily: 'Jersey10_400Regular',
    fontSize: 25,
    color: '#471B2B',
    marginBottom: 4,
    textAlign: 'center',
  },
  leftCatImage: {
    position: 'absolute',
    width: 200,
    height: 200,
    top: '8%',
    marginTop: 525,
    left: '-1%',
    zIndex: 5,
    transform: [{ scaleX: -1 }],
  },
  rightCatPressable: {
    position: 'absolute',
    width: 200,
    height: 200,
    top: '8%',
    marginTop: 525,
    right: '-1%',
    zIndex: 5,
  },
  rightCatImage: {
    width: '100%',
    height: '100%',
  },
  // modal styles in your color scheme
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: '85%',
    maxHeight: '70%',
    backgroundColor: '#682A2E', // deep reddish-brown
    borderRadius: 16,
    padding: 16,
    borderWidth: 3,
    borderColor: '#BC8845', // golden border
  },
  modalTitle: {
    fontSize: 28,
    color: '#FDE68A',
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: 'PixelifySans_500Medium',
  },
  modalSearch: {
    backgroundColor: '#471B2B',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 14,
    color: '#FDE68A',
    fontFamily: 'Jersey10_400Regular',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#BC8845',
    fontSize: 16,
  },
  modalText: {
    color: '#F9FAFB',
    textAlign: 'center',
    fontSize: 16,
    fontFamily: 'Jersey10_400Regular',
  },
  modalList: {
    marginTop: 4,
  },
  modalItem: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#A65F36',
  },
  modalItemText: {
    color: '#F9FAFB',
    fontSize: 22,
    fontFamily: 'Jersey10_400Regular',
  },
  modalItemSub: {
    color: '#FDE68A',
    fontSize: 14,
    marginTop: 2,
  },
  modalCloseButton: {
    marginTop: 12,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#FDE68A',
    backgroundColor: '#471B2B',
  },
  modalCloseText: {
    color: '#F9FAFB',
    fontSize: 18,
    fontFamily: 'Jersey10_400Regular',
  },
});
