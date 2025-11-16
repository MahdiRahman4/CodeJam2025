// app/(tabs)/TabTwoScreen.tsx (or wherever this file lives)
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View, ActivityIndicator, Alert } from 'react-native';
import StatsTable, { StatsRow } from '../../components/table';
import { supabase } from '@/lib/supabase';

const TabTwoScreen = () => {
  const [rows, setRows] = useState<StatsRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummaries = async () => {
      try {
        setLoading(true);

        const { data, error } = await supabase
          .from('summaries') 
          .select(
            'game_name, avg_damage, avg_vision_score, avg_impact_score, avg_cs, avg_gold, avg_kda'
          )
          .order('avg_kda', { ascending: false }); 

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

  return (
    <View style={style.container}>
      <Text style={style.title}>Leaderboards</Text>

      <View style={style.leaderboardContainer}>
        <View style={style.tableWrapper}>
          {loading ? (
            <ActivityIndicator />
          ) : (
            <StatsTable data={rows} title="Best ... in Montreal" />
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
    flex: 0.9,      // 👈 use most of the remaining height
    width: '100%',
  },
  tableWrapper: {
    flex: 1,        // 👈 let the table fill this container
    width: '100%',
    paddingHorizontal: 12,
  },
});

const LogOut = () => {
  supabase.auth.signOut();
};
