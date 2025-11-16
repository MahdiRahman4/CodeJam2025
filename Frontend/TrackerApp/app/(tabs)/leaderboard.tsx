import { Image } from 'expo-image';
import { Platform, StyleSheet,Text,View} from 'react-native';
import StatsTable, { StatsRow } from '../../components/table';
const data: StatsRow[] = [
  { name: "Aariyan", champion: 'Zed', role: 'Mid', winRate: '53%' },
  { name: "Yasin",champion: 'Vi', role: 'Jungle', winRate: '50%' },
  { name: "Liam",champion: 'Caitlyn', role: 'ADC', winRate: '49%' },
];

export default function TabTwoScreen() {
  return (
    
<View>
    <View>
    <Text style={style.title}>Leaderboards</Text>
    </View>
    <View style={style.leaderboardContainer}>
    <StatsTable data={data} title="Best ... in Montreal" />
    </View>
</View>
  );
}

const style = StyleSheet.create({
    bg:{
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
    }
    ,leaderboardContainer:{
        flex: 1,
        position: 'absolute',
        top: 150,
        left: 0,
    }
    ,leaderboardContainer2:{
        flex: 1,
        position: 'absolute',
        top: 400,
        left: 0,
    }
})

