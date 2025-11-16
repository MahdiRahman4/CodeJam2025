import { StyleSheet, View, Text } from "react-native";
import FloatingButton from "@/components/rival-button";

export default function RivalScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}></Text>
      <View style={styles.statDisparityBox}>
        <Text style={styles.statDisparityTitle}>STAT DISPARITY</Text>
      </View>
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
  statDisparityBox: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "50%",
    backgroundColor: "#f5f5f5",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statDisparityTitle: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 15,
  },
});

