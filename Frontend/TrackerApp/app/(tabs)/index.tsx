import { useRef } from "react";
import {
  Animated,
  ImageBackground,
  StyleSheet,
  View,
  Text,
  Image,
  PanResponder,
} from "react-native";
import { useRouter } from "expo-router";


export default function CharacterScreen() {
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const router = useRouter();

  const animatedStyle = {
    transform: [{ translateX: shakeAnim }],
  };

  // swipe left → rival, swipe right → leaderboard
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => {
        const { dx, dy } = gesture;
        // only start if mostly horizontal swipe
        return Math.abs(dx) > 10 && Math.abs(dy) < 10;
      },
      onPanResponderRelease: (_, gesture) => {
        const { dx } = gesture;

        if (dx < -50) {
          // swipe left
          router.push("/(tabs)/rival");
        } else if (dx > 50) {
          // swipe right
          router.push("/(tabs)/leaderboard");
        }
      },
    })
  ).current;

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <ImageBackground
        source={require("../../asset_AARI/Exported/Gachi/CATS_GachiBG_AARIALMA.png")}
        style={styles.imageBackground}
        resizeMode="contain"
      >
        <Image
          source={require("../../asset_AARI/Exported/Gachi/CATS_GachiBG_AARIALMANamebar BG.png")}
        />
        <Text
          style={{
            fontFamily: "PixelifySans_500Medium",
            fontSize: 50,
            position: "absolute",
            top: 125,
            left: 150,
            color: "#471B2B",
          }}
        >
          Plants
        </Text>
      </ImageBackground>

      <Animated.View style={[styles.buttonContainer, animatedStyle]}>
        {/* <FloatingButton />  // if you want it back */}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#893F30",
  },
  imageBackground: {
    flex: 1,
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
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
  buttonContainer: {
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
  },
  shakeButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
});
