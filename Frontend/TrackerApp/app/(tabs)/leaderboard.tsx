// app/(tabs)/leaderboard.tsx

import React, { useEffect, useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  Alert,
  ImageBackground,
  PanResponder,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import StatsTable, { StatsRow } from '../../components/table';
import { supabase } from '@/lib/supabase';

const TabTwoScreen = () => {
  const router = useRouter();

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 10 && Math.abs(g.dy) < 10,
      onMoveShouldSetPanResponderCapture: (_, g) =>
        Math.abs(g.dx) > 10 && Math.abs(g.dy) < 10,
      onStartShouldSetPanResponderCapture: () => false,
      onPanResponderRelease: (_, g) => {
        if (g.dx < -50) router.push('/');      // left → home
        else if (g.dx > 50) router.push('/rival'); // right → rival
      },
    })
  ).current;

  const [rows, setRows] = useState<StatsRow[]>([]);
  const [region, setRegion] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [myName, setMyName] = useState<string | null>(null);


  useEffect(() => {
    const fetchSummaries = async () => {
      try {
        setLoading(true);

        // Auth
        const { data: authData, error: authErr } = await supabase.auth.getUser();
        if (authErr || !authData?.user) {
          Alert.alert('Error', 'Not logged in');
          return;
        }

        const uid = authData.user.id;

        // Get riotID
        const { data: profile, error: pErr } = await supabase
          .from('profiles')
          .select('riotID')
          .eq('id', uid)
          .single();

        if (pErr || !profile) {
          Alert.alert('Error', 'Could not load your profile');
          return;
        }

        if (!profile.riotID) {
          Alert.alert('No Riot ID', 'Please link your Riot account first.');
          return;
        }

        const riotID = profile.riotID as string;
        const gameNameOnly = riotID.split('#')[0]; // "MRTrashed#NA1" -> "MRTrashed"
setMyName(gameNameOnly);


        // User region from player_summaries
       const { data: mySummary, error: summaryErr } = await supabase
  .from('player_summaries')
  .select(
    'game_name, avg_impact_score, avg_kda, avg_damage, avg_cs, avg_gold, avg_vision_score, region'
  )
  .eq('game_name', riotID)
  .maybeSingle();


        if (summaryErr) {
          Alert.alert('Error', 'Could not determine your region');
          return;
        }

        const regionValue = mySummary?.region ?? "NA1";
        setRegion(regionValue);

        // Leaderboard query: order by impact score (score) desc
        let q = supabase
          .from('player_summaries')
          .select(
            'game_name, avg_impact_score, avg_kda, avg_damage, avg_cs, avg_gold, avg_vision_score, region'
          )
          .order('avg_impact_score', { ascending: false });

        if (regionValue) {
          q = q.eq('region', regionValue);
        }

        const { data: lb, error: lbErr } = await q;

        if (lbErr) {
          Alert.alert('Error', 'Could not load leaderboard');
          return;
        }

        // map to StatsRow[] – keep numeric, let table format to 1 decimal
        const mapped: StatsRow[] =
          lb?.map((row: any) => ({
            name: row.game_name,
            avg_impact_score: (row.avg_impact_score ?? 0) * 10,
            avg_kda: row.avg_kda ?? 0,
            avg_damage: row.avg_damage ?? 0,
            avg_cs: row.avg_cs ?? 0,
            avg_gold: row.avg_gold ?? 0,
            avg_vision_score: row.avg_vision_score ?? 0,
          })) ?? [];
          // helper to normalize names
const normalizeName = (s: string | null | undefined) =>
  (s ?? '').trim().toLowerCase();

// If mySummary exists but I'm not in mapped (lb), add myself
if (mySummary) {
  const alreadyIn = mapped.some(
    (row) => normalizeName(row.name) === normalizeName(mySummary.game_name)
  );

  if (!alreadyIn) {
    mapped.push({
      name: mySummary.game_name,
      avg_impact_score: (mySummary.avg_impact_score ?? 0) * 10,
      avg_kda: mySummary.avg_kda ?? 0,
      avg_damage: mySummary.avg_damage ?? 0,
      avg_cs: mySummary.avg_cs ?? 0,
      avg_gold: mySummary.avg_gold ?? 0,
      avg_vision_score: mySummary.avg_vision_score ?? 0,
    });
  }
}


        // safety sort by score desc
        mapped.sort((a, b) => b.avg_impact_score - a.avg_impact_score);

        setRows(mapped);
      } finally {
        setLoading(false);
      }
    };

    fetchSummaries();
  }, []);

  const title = region ? `Best Players in ${region}` : 'Best Players';

  return (
    <ImageBackground
      source={require('../../asset_AARI/Exported/Gachi/CATS_GachiBG_AARIALMAMain Color.png')}
      style={styles.background}
      resizeMode="cover"
      {...panResponder.panHandlers}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Leaderboards</Text>

        <View style={styles.leaderboardContainer}>
          <View style={styles.tableWrapper}>
            {loading ? (
  <ActivityIndicator />
) : (
  <StatsTable
    data={rows}
    title={title}
    highlightName={myName || undefined} // 👈 pass current player
  />
)}

          </View>
        </View>

        {/* Logout Button */}
        <Pressable onPress={() => supabase.auth.signOut()} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
      </View>
    </ImageBackground>
  );
};

export default TabTwoScreen;

const styles = StyleSheet.create({
  background: { flex: 1, width: '100%', height: '100%' },
  container: { flex: 1, alignItems: 'center', width: '100%' },
  title: {
    fontSize: 40,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 80,
    marginBottom: 16,
    color: '#000',
    width: '100%',
    fontFamily: 'Jersey10_400Regular',
  },
  leaderboardContainer: {
    flex: 0.9,
    width: '100%',
  },
  tableWrapper: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 12,
  },
  logoutButton: {
    position: 'absolute',
    bottom: 10,
    backgroundColor: '#471B2B',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#893F30',
  },
  logoutText: {
    fontSize: 18,
    color: 'white',
    fontWeight: '600',
  },
});
