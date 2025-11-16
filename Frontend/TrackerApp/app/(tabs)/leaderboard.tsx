import React, { useEffect, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  Alert,
  ImageBackground,
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

        const { data: authData, error: userError } = await supabase.auth.getUser();
        if (userError || !authData?.user) {
          console.log(userError);
          Alert.alert('Error', 'Not logged in');
          return;
        }

        const userId = authData.user.id;

        const { data: profile, error: profileError } = await supabase
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

        const { data: mySummary, error: summaryError } = await supabase
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

  const title = region ? `Best Players in ${region}` : 'Best Players';

  return (
    <ImageBackground
      source={require('../../asset_AARI/Exported/Gachi/CATS_GachiBG_AARIALMAMain Color.png')}
      style={style.background}         // full-screen background
      resizeMode="cover"
    >
      {/* overlay content on top of background */}
      <View style={style.container}>
        <Text style={{fontSize: 40,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 80,
    marginBottom: 16,
    color: '#000',
    width: '100%',
    fontFamily:"Jersey10_400Regular"
    }}>Leaderboards</Text>

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
          <Text style={style.logoutText}>Log Out</Text>
        </Pressable>
      </View>
    </ImageBackground>
  );
};

export default TabTwoScreen;

const style = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    width: '100%',
    // optional: dark overlay on top of image
    // backgroundColor: 'rgba(0,0,0,0.3)',
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
  logoutText: {
    fontSize: 24,
    color: 'white',
    position: 'absolute',
    bottom: 40,
  },
});

const LogOut = () => {
  supabase.auth.signOut();
};
