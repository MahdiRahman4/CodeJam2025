// components/table.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';

export interface StatsRow {
  name: string;
  avg_impact_score: number;
  avg_kda: number;              
  avg_damage: number;
  avg_cs: number;
  avg_gold: number;
  avg_vision_score: number;

}

interface StatsTableProps {
  data?: StatsRow[];
  title?: string;
}

// just some demo data if no data prop is passed
const defaultData: StatsRow[] = [
  {
    name: 'DemoPlayer',
    avg_impact_score: 75,
    avg_kda: 3.5,
    avg_damage: 25000,
    avg_cs: 180,
    avg_gold: 12000,
    avg_vision_score: 30,

  },
];

const StatsTable: React.FC<StatsTableProps> = ({
  data,
  title = 'Montreal Leaderboard',
}) => {
  const [showRivals, setShowRivals] = useState(false);

  const montrealData = data ?? defaultData;
  const rowsToShow = montrealData;
  const currentTitle = title;

  const handleToggleBoard = () => {
    setShowRivals(prev => !prev);
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{currentTitle}</Text>

      {/* if you want to keep a rivals toggle later, reuse this button */}
      {/* <Pressable ... onPress={handleToggleBoard}> ... </Pressable> */}

      {/* HEADER */}
      <View style={[styles.row, styles.headerRow]}>
        <Text style={[styles.cell, styles.headerCell, styles.nameCol]}>
          Name
        </Text>
        <Text style={[styles.cell, styles.headerCell, styles.col,styles.impactCol]}>
          Score
        </Text>
        <Text style={[styles.cell, styles.headerCell, styles.col]}>
          KDA
        </Text>
        <Text style={[styles.cell, styles.headerCell, styles.col]}>
          DMG
        </Text>
        <Text style={[styles.cell, styles.headerCell, styles.col]}>
          CS
        </Text>
        <Text style={[styles.cell, styles.headerCell, styles.col]}>
          Gold
        </Text>
        <Text style={[styles.cell, styles.headerCell, styles.col,styles.visionCol]}>
          Vision
        </Text>
        
        
        
      </View>

      {/* BODY */}
      <ScrollView style={styles.body}>
        {rowsToShow.map((item, index) => (
          <View
            key={`${item.name}-${index}`}
            style={[
              styles.row,
              index % 2 === 0 ? styles.evenRow : styles.oddRow,
            ]}
          >
            <Text style={[styles.cell, styles.nameCol]} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={[styles.cell, styles.col]} numberOfLines={1}>
              {Math.trunc(item.avg_impact_score*10)}
            </Text>
            <Text style={[styles.cell, styles.col]} numberOfLines={1}>
              {item.avg_kda.toFixed(1)}
            </Text>
            <Text style={[styles.cell, styles.col]} numberOfLines={1}>
              {Math.trunc(Math.round(item.avg_damage)/1000)}K
            </Text>
            <Text style={[styles.cell, styles.col]} numberOfLines={1}>
              {Math.trunc(item.avg_cs)}
            </Text>
            <Text style={[styles.cell, styles.col]} numberOfLines={1}>
              {Math.trunc(Math.round(item.avg_gold)/1000)}K
            </Text>
            <Text style={[styles.cell, styles.col]} numberOfLines={1}>
              {item.avg_vision_score.toFixed(1)}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

export default StatsTable;

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#A65F36',
    borderRadius: 12,
    padding: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    width: '100%',
    flex: 1,    
  },
  title: {
    fontSize: 25,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
    fontFamily:"Jersey10_400Regular",

  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 36,
    paddingHorizontal: 8,
  },
  headerRow: {
    paddingVertical: 6,
    backgroundColor: '#BC8845',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    
  },
  body: {
    marginTop: 4,
    flex: 1,
  },
  cell: {
    paddingVertical: 6,
    paddingHorizontal: 4,
    color: '#000',
    fontSize: 20,
    fontFamily:"Jersey10_400Regular"
      

   
  },
  headerCell: {
    fontWeight: '700',
    textTransform: 'uppercase',
    fontSize: 18,
    letterSpacing: 0.5,      
    fontFamily:"Jersey10_400Regular"

  },
  nameCol: {
    flex: 2,
  },
  col: {
    flex: 1,
    textAlign: 'center' as const,
  },
  evenRow: {
    backgroundColor: '#893F30',
  },
  oddRow: {
    backgroundColor: '#682A2E',
  },
    visionCol: { 
    fontWeight: '700',
    textTransform: 'uppercase',
    fontSize: 16,
    letterSpacing: 0,
        fontFamily:"Jersey10_400Regular"

},
impactCol: { 
    fontWeight: '700',
    textTransform: 'uppercase',
    fontSize:16,
    letterSpacing: 0,
        fontFamily:"Jersey10_400Regular"


}});
