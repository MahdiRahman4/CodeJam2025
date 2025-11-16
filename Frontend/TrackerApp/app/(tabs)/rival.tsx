import { StyleSheet, View, Text } from "react-native";
import FloatingButton from "@/components/rival-button";

export default function RivalScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Rival Screen</Text>
      <FloatingButton useBack={true} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
});

