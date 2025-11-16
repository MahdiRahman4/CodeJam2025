import { ImageBackground, StyleSheet, View } from "react-native";
import FloatingButton from "@/components/rival-button";

export default function CharacterScreen() {
  return (
    <View style={styles.container}>
      <ImageBackground
        source={require("../../assets/images/test.png")}
        style={styles.imageBackground}
      >
      </ImageBackground>
      <FloatingButton />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  imageBackground: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: "absolute",
  },
});
