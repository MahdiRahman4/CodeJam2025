import { useEffect, useRef } from "react";
import { Animated, ImageBackground, StyleSheet, TouchableOpacity, View, Text, Pressable } from "react-native";
import FloatingButton from "@/components/rival-button";
import { PixelifySans_400Regular, PixelifySans_500Medium, PixelifySans_700Bold } from "@expo-google-fonts/pixelify-sans";

export default function CharacterScreen() {
  const shakeAnim = useRef(new Animated.Value(0)).current;



  const animatedStyle = {
    transform: [{ translateX: shakeAnim }],
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../../asset_AARI/Exported/Gachi/CATS_GachiBG_AARIALMA.png')}
        style={styles.imageBackground}
        resizeMode="contain"   
      >
        <Text style={{fontFamily:"PixelifySans_500Medium" ,fontSize:50, position:"absolute", top:125, left:150, color:"#471B2B"}}>Plants</Text>
      </ImageBackground>
      <Animated.View style={[styles.buttonContainer, animatedStyle]}>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor:"#893F30",
  },
  imageBackground: {
    flex: 1,                 // take all available space
    width: '100%',
    height: '100%',
    justifyContent: 'center', // optional: position inner content
    alignItems: 'center',
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
