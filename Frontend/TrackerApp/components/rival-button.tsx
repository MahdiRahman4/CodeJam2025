import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

interface FloatingButtonProps {
  route?: string;
  useBack?: boolean;
}

export default function FloatingButton({ route = "/(tabs)/rival", useBack = false }: FloatingButtonProps) {
    const router = useRouter();
  
    return (
      <TouchableOpacity
        style={styles.floatingBtn}
        onPress={() => {
          if (useBack) {
            router.replace("/(tabs)" as any);
          } else if (route) {
            router.replace(route as any);
          }
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "bold" }}>Insert Image Here</Text>
      </TouchableOpacity>
    );
}

  const styles = StyleSheet.create({
    floatingBtn: {
      position: "absolute",
      top: 30,
      right: 30,
      width: 70,
      height: 70,
      borderRadius: 35,
      backgroundColor: "#1E90FF",
      justifyContent: "center",
      alignItems: "center",
      elevation: 8,           // Android shadow
      shadowColor: "#000",    // iOS shadow
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
    },
  });