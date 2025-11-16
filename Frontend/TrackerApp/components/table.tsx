import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export interface StatsRow {
  name: string;
  champion: string;
  role: string;
  winRate: string;
}

interface StatsTableProps {
  data?: StatsRow[];
  title?: string;
}

const defaultData: StatsRow[] = [
  { name:"Aariyan", champion: 'Ahri', role: 'Mid', winRate: '52%' },
  { name: "Yasin", champion: 'Lee Sin', role: 'Jungle', winRate: '49%' },
  { name: "Liam", champion: 'Jinx', role: 'ADC', winRate: '51%' },
  { name: "Mahdi",champion: 'Thresh', role: 'Support', winRate: '50%' },
];

const StatsTable: React.FC<StatsTableProps> = ({
  data = defaultData,
  title = 'Champion Stats',
}) => {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>

      {/* HEADER */}
        
      <View style={[styles.row, styles.headerRow]}>
        <Text style={[styles.cell, styles.headerCell, styles.nameCol]}>
          Name
        </Text>
        <Text style={[styles.cell, styles.headerCell, styles.champCol]}>
          Champion
        </Text>
        <Text style={[styles.cell, styles.headerCell, styles.roleCol]}>
          Role
        </Text>
        <Text style={[styles.cell, styles.headerCell, styles.winCol]}>
          Win %
        </Text>
      </View>

      {/* BODY */}
      <ScrollView style={styles.body}>
        {data.map((item, index) => (
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
            <Text style={[styles.cell, styles.champCol]} numberOfLines={1}>
              {item.champion}
            </Text>
            <Text style={[styles.cell, styles.roleCol]} numberOfLines={1}>
              {item.role}
            </Text>
            <Text style={[styles.cell, styles.winCol]} numberOfLines={1}>
              {item.winRate}
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
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 12,
    margin: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    width: 360,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#E5E7EB',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 36,
    paddingHorizontal: 8,
  },
  headerRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#4B5563',
    paddingVertical: 6,
    backgroundColor: '#1F2937',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  body: {
    marginTop: 4,
    maxHeight: 200,
  },
  cell: {
    paddingVertical: 6,
    paddingHorizontal: 4,
    color: '#E5E7EB',
    fontSize: 14,
  },
  headerCell: {
    fontWeight: '700',
    textTransform: 'uppercase',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  nameCol: {
    flex: 1,
  },
  champCol: {
    flex: 2,
  },
  roleCol: {
    flex: 1,
    textAlign: 'center' as const,
  },
  winCol: {
    flex: 1,
    textAlign: 'right' as const,
  },
  evenRow: {
    backgroundColor: '#030712',
  },
  oddRow: {
    backgroundColor: '#020617',
  },
});
