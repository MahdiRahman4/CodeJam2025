import { StyleSheet, Text, View } from 'react-native';
import StatsTable, { StatsRow } from '../../components/table';
const data: StatsRow[] = [
  { name: "Aariyan", champion: 'Zed', role: 'Mid', winRate: '53%' },
  { name: "Yasin",champion: 'Vi', role: 'Jungle', winRate: '50%' },
  { name: "Liam",champion: 'Caitlyn', role: 'ADC', winRate: '49%' },
];

export default function TabTwoScreen() {
  return (
    <View style={style.container}>
      <View>
        <Text style={style.title}>Leaderboards</Text>
      </View>
      <View style={style.leaderboardContainer}>
        <View style={style.tableWrapper}>
          <StatsTable data={data} title="Best ... in Montreal" />
        </View>
      </View>
    </View>
  );
}

const style = StyleSheet.create({
    container:{
        flex: 1,
        alignItems: 'center',
        width: '100%',
    }
    ,bg:{
backgroundColor: '#A1CEDC',
position: 'absolute',
top: 100,
left: 0,
right: 0,
height: 100,
    }
    ,title:{
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginTop: 100,
        color: "#fff",
        width: '100%',
    }
    ,leaderboardContainer:{
        flex: 1,
        width: '100%',
    }
    ,tableWrapper:{
        width: '100%',
        alignItems: 'center',
        justifyContent: 'flex-start',
    }
    ,leaderboardContainer2:{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-start',
        width: '100%',
    }
})

