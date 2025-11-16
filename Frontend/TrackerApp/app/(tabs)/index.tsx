import { useEffect, useRef } from "react";
import { Animated, ImageBackground, StyleSheet, TouchableOpacity, View, Text } from "react-native";
import FloatingButton from "@/components/rival-button";

export default function CharacterScreen() {
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shake = () => {
      Animated.sequence([
        Animated.timing(shakeAnim, {
          toValue: 1,
          duration: 5,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: -1,
          duration: 5,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 1,
          duration: 5,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: -1,
          duration: 5,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 0,
          duration: 5,
          useNativeDriver: true,
        }),
      ]).start(() => shake());
    };
    shake();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animatedStyle = {
    transform: [{ translateX: shakeAnim }],
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require("../../assets/images/test.png")}
        style={styles.imageBackground}
      >
      </ImageBackground>
      <FloatingButton />
      <Animated.View style={[styles.buttonContainer, animatedStyle]}>
        <TouchableOpacity style={styles.shakeButton}>
          <Text style={styles.buttonText}>CHEST</Text>
        </TouchableOpacity>
      </Animated.View>
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
