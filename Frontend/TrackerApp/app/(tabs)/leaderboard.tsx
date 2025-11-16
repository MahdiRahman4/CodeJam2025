import React, { useEffect, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  Alert,
} from 'react-native';
import StatsTable, { StatsRow } from '../../components/table';
import { supabase } from '@/lib/supabase';

const TabTwoScreen = () => {
  const [rows, setRows] = useState<StatsRow[]>([]);
  const [region, setRegion] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummaries = async () => {
      try {
        setLoading(true);

        // 1) Get current auth user
        const {
          data: authData,
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !authData?.user) {
          console.log(userError);
          Alert.alert('Error', 'Not logged in');
          return;
        }

        const userId = authData.user.id;

        // 2) Get this user's Riot ID from profiles
        const {
          data: profile,
          error: profileError,
        } = await supabase
          .from('profiles')
          .select('riotID')
          .eq('id', userId)
          .single();

        if (profileError || !profile) {
          console.log(profileError);
          Alert.alert('Error', 'Could not load your profile');
          return;
        }

        const riotID = profile.riotID as string | null;
        if (!riotID) {
          Alert.alert(
            'No Riot ID',
            'Please link your Riot account before viewing the leaderboard.'
          );
          return;
        }

        // 3) Find this player's region from summaries
        const {
          data: mySummary,
          error: summaryError,
        } = await supabase
          .from('summaries')
          .select('region')
          .eq('game_name', riotID)
          .maybeSingle();

        if (summaryError) {
          console.log(summaryError);
          Alert.alert('Error', 'Could not determine your region');
          return;
        }

        const regionValue = mySummary?.region ?? null;
        setRegion(regionValue);

        // 4) Load leaderboard rows filtered by that region
        let query = supabase
          .from('summaries')
          .select(
            'game_name, avg_damage, avg_vision_score, avg_impact_score, avg_cs, avg_gold, avg_kda, region'
          )
          .order('avg_kda', { ascending: false });

        if (regionValue) {
          query = query.eq('region', regionValue);
        }

        const { data, error } = await query;

        if (error) {
          console.log(error);
          Alert.alert('Error', 'Could not load leaderboard');
          return;
        }

        const mapped: StatsRow[] = (data ?? []).map((row: any) => ({
          name: row.game_name,
          avg_damage: row.avg_damage ?? 0,
          avg_vision_score: row.avg_vision_score ?? 0,
          avg_impact_score: row.avg_impact_score ?? 0,
          avg_cs: row.avg_cs ?? 0,
          avg_gold: row.avg_gold ?? 0,
          avg_kda: row.avg_kda ?? 0,
        }));

        setRows(mapped);
      } finally {
        setLoading(false);
      }
    };

    fetchSummaries();
  }, []);

  const title = region
    ? `Best Players in ${region}`
    : 'Best Players';

  return (
    <View style={style.container}>
      <Text style={style.title}>Leaderboards</Text>

      <View style={style.leaderboardContainer}>
        <View style={style.tableWrapper}>
          {loading ? (
            <ActivityIndicator />
          ) : (
            <StatsTable data={rows} title={title} />
          )}
        </View>
      </View>

      <Pressable onPress={LogOut}>
        <Text
          style={{
            fontSize: 24,
            color: 'white',
            position: 'absolute',
            bottom: 40,
          }}
        >
          Log Out
        </Text>
      </Pressable>
    </View>
  );
};

export default TabTwoScreen;

const style = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    width: '100%',
    backgroundColor: '#020617',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 80,
    marginBottom: 16,
    color: '#fff',
    width: '100%',
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
});

const LogOut = () => {
  supabase.auth.signOut();
};
