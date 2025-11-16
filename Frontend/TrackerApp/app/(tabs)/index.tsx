import { useRef, useState, useEffect } from "react";
import {
  Animated,
  ImageBackground,
  StyleSheet,
  View,
  Text,
  Image,
  PanResponder,
  TouchableOpacity,
  Modal,
  Pressable,
  FlatList,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from '@/lib/supabase';


export default function CharacterScreen() {
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const transition = useRef(new Animated.Value(0)).current;

  const router = useRouter();



  const [inventory, setInventory] = useState<
    Array<{ id: string; name: string; src: any }>
  >([]);
  const [showInventory, setShowInventory] = useState(false);

  type ChestState = "idle" | "moving" | "opening" | "opened" | "cooldown";
  const [leftChest, setLeftChest] = useState<ChestState>("moving");
  const [rightChest, setRightChest] = useState<ChestState>("moving");

  const [leftNextAvailable, setLeftNextAvailable] = useState<number | null>(
    null
  );
  const [rightNextAvailable, setRightNextAvailable] = useState<number | null>(
    null
  );

  const LEFT_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours
  const RIGHT_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

  const LEFT_KEY = "chest_left_next";
  const RIGHT_KEY = "chest_right_next";

  // ticking clock to update countdown displays
  const [nowTick, setNowTick] = useState<number>(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const formatRemaining = (next: number | null) => {
    if (!next) return null;
    const ms = next - nowTick;
    if (ms <= 0) return null;
    const totalSec = Math.floor(ms / 1000);
    const days = Math.floor(totalSec / (24 * 3600));
    const hours = Math.floor((totalSec % (24 * 3600)) / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;
    if (days > 0) return `${days}d ${hours}h`;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}:${String(seconds).padStart(2, "0")}`;
  };

  const [popupItem, setPopupItem] = useState<{
    id: string;
    name: string;
    src: any;
  } | null>(null);

  // assets
  const chestMoving = require("../../asset_AARI/Exported/Chest/CATS_GreyChest__moving_AARIALMA.gif");
  const chestOpening = require("../../asset_AARI/Exported/Chest/CATS_GreyChest__opening_AARIALMA.gif");
  const chestThumb = require("../../asset_AARI/Exported/Chest/CATS_GreyChest_Thumbnail_AARIALMA.png");

    const catGif = require(
    "../../asset_AARI/Exported/Hats/cat_gifs_nohat/CATS_PinkCat_None_Default_AARIALMA.gif"
  );
  const catEarsDownGif = require(
  "../../asset_AARI/Exported/Hats/cat_gifs_nohat/CATS_PinkCat_None_EarsDown_AARIALMA.gif"
);

  // which hat is selected in the inventory
  const [selectedItem, setSelectedItem] = useState<{
    id: string;
    name: string;
    src: any;
  } | null>(null);

  // which hat is currently spawned on the screen
  const [equippedHatSrc, setEquippedHatSrc] = useState<any | null>(null);
  // which hat id is equipped (for ears up / ears down logic)
const [equippedHatId, setEquippedHatId] = useState<string | null>(null);
// force cat gif to "reload" by changing this key
const [catImageKey, setCatImageKey] = useState(0);
const [playerName, setPlayerName] = useState<string | null>(null);



const hatPool = [
    {
      id: "baseball",
      name: "Baseball Hat",
      src: require("../../asset_AARI/Exported/Hats/hats_gifs_10x/CATS_Hats10x_Baseball_AARIALMA.gif"),
    },
    {
      id: "beret",
      name: "Beret",
      src: require("../../asset_AARI/Exported/Hats/hats_gifs_10x/CATS_Hats10x_Beret_AARIALMA.gif"),
    },
    {
      id: "strawhat",
      name: "Straw Hat",
      src: require("../../asset_AARI/Exported/Hats/hats_gifs_10x/CATS_Hats10x_Strawhat_AARIALMA.gif"),
    },
    {
      id: "bowler",
      name: "Bowler Hat",
      src: require("../../asset_AARI/Exported/Hats/hats_gifs_10x/CATS_Hats10x_Bowler_AARIALMA.gif"),
    },
    {
      id: "chef",
      name: "Chef Hat",
      src: require("../../asset_AARI/Exported/Hats/hats_gifs_10x/CATS_Hats10x_Chef_AARIALMA.gif"),
    },
    {
      id: "fez",
      name: "Fez",
      src: require("../../asset_AARI/Exported/Hats/hats_gifs_10x/CATS_Hats10x_Fez_AARIALMA.gif"),
    },
    {
      id: "sailor",
      name: "Sailor Hat",
      src: require("../../asset_AARI/Exported/Hats/hats_gifs_10x/CATS_Hats10x_Sailor_AARIALMA.gif"),
    },
    {
      id: "sheriff",
      name: "Sheriff Hat",
      src: require("../../asset_AARI/Exported/Hats/hats_gifs_10x/CATS_Hats10x_Sheriff_AARIALMA.gif"),
    },
    {
      id: "turban",
      name: "Turban",
      src: require("../../asset_AARI/Exported/Hats/hats_gifs_10x/CATS_Hats10x_Turban_AARIALMA.gif"),
    },
  ];
  // handle chest opening lifecycle
const openChest = (side: "left" | "right") => {
  const now = Date.now();

  // already-collected hats
  const collectedIds = new Set(inventory.map((i) => i.id));

  // available hats (uncollected)
  const availableHats = hatPool.filter((hat) => !collectedIds.has(hat.id));

  if (availableHats.length === 0) {
    console.log("All hats already collected!");
    return;
  }

  const openForSide = (setChest: (s: ChestState) => void,
                      cooldownMs: number,
                      setNextAvailable: (n: number) => void,
                      storageKey: string) => {
    setChest("opening");
    const next = now + cooldownMs;
    setNextAvailable(next);
    AsyncStorage.setItem(storageKey, String(next)).catch(() => {});

    setTimeout(() => {
      const hat =
        availableHats[Math.floor(Math.random() * availableHats.length)];

      setPopupItem(hat);                 // popup shows HAT gif
      setInventory((prev) => [...prev, hat]); // inventory stores HAT gif

      setChest("opened");
      setTimeout(() => setChest("cooldown"), 600);

      const ms = next - Date.now();
      if (ms > 0) setTimeout(() => setChest("moving"), ms + 50);
    }, 1400);
  };

  if (side === "left") {
    if (leftNextAvailable && now < leftNextAvailable) return;
    openForSide(setLeftChest, LEFT_COOLDOWN_MS, setLeftNextAvailable, LEFT_KEY);
  } else {
    if (rightNextAvailable && now < rightNextAvailable) return;
    openForSide(
      setRightChest,
      RIGHT_COOLDOWN_MS,
      setRightNextAvailable,
      RIGHT_KEY
    );
  }
};


  // load persisted next-available times
  useEffect(() => {
    (async () => {
      try {
        const lv = await AsyncStorage.getItem(LEFT_KEY);
        const rv = await AsyncStorage.getItem(RIGHT_KEY);
        const now = Date.now();
        if (lv) {
          const n = Number(lv);
          setLeftNextAvailable(n);
          if (n > now) {
            setLeftChest("cooldown");
            setTimeout(() => setLeftChest("moving"), n - now + 50);
          } else {
            setLeftChest("moving");
          }
        }
        if (rv) {
          const n = Number(rv);
          setRightNextAvailable(n);
          if (n > now) {
            setRightChest("cooldown");
            setTimeout(() => setRightChest("moving"), n - now + 50);
          } else {
            setRightChest("moving");
          }
        }
      } catch (e) {
        // ignore
      }
    })();
  }, []);
useEffect(() => {
  const loadPlayerName = async () => {
    try {
      // get current auth user
      const { data: authData, error: authErr } = await supabase.auth.getUser();
      if (authErr || !authData?.user) {
        console.log('Not logged in, using default name');
        return;
      }

      const uid = authData.user.id;

      // read riotID from profiles
      const { data: profile, error: pErr } = await supabase
        .from('profiles')
        .select('riotID')
        .eq('id', uid)
        .single();

      if (pErr || !profile?.riotID) {
        console.log('No riotID on profile, using default name');
        return;
      }

      // "Plants#333" → "Plants"
      const gameNameOnly = (profile.riotID as string).split('#')[0];
      setPlayerName(gameNameOnly);
    } catch (e) {
      console.log('Failed to load player name', e);
    }
  };

  loadPlayerName();
}, []);

  // Debug: reset timers
const resetTimers = async () => {
  try {
    await AsyncStorage.removeItem(LEFT_KEY);
    await AsyncStorage.removeItem(RIGHT_KEY);

    // reset chests
    setLeftNextAvailable(null);
    setRightNextAvailable(null);
    setLeftChest("moving");
    setRightChest("moving");

    // 🔥 reset inventory + hat + cat
    setInventory([]);
    setSelectedItem(null);
    setEquippedHatSrc(null);
    setEquippedHatId(null);

    // if you added catImageKey earlier, also bump it so gif restarts:
    // setCatImageKey(k => k + 1);

    console.log("Timers + inventory reset!");
  } catch (e) {
    console.error("Failed to reset:", e);
  }
};


  // Expose reset function globally for dev
  useEffect(() => {
    (global as any).__resetChestTimers = resetTimers;
  }, []);

  // reset to moving after opened
  useEffect(() => {
    if (leftChest === "opened") {
      const t = setTimeout(() => setLeftChest("moving"), 3000);
      return () => clearTimeout(t);
    }
  }, [leftChest]);

  useEffect(() => {
    if (rightChest === "opened") {
      const t = setTimeout(() => setRightChest("moving"), 3000);
      return () => clearTimeout(t);
    }
  }, [rightChest]);

  const animatedStyle = {
    transform: [{ translateX: shakeAnim }],
  };

  // 🔸 ANIMATED POSITIONS for shared elements (0 = index layout, 1 = "towards rivals")
  const namebarAnimatedStyle = {
    position: "absolute" as const,
    transform: [
      {
        translateY: transition.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -30], // move up toward rivals title area
        }),
      },
      {
        scale: transition.interpolate({
          inputRange: [0, 1],
          outputRange: [0.815, 0.815],
        }),
      },
    ],
  };

  const circleAnimatedStyle = {
    position: "absolute" as const,
    transform: [
      {
        translateX: transition.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 40], 
        }),
      },
      {
        translateY: transition.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 600], 
        }),
      },
      {
        scale: transition.interpolate({
          inputRange: [0, 1],
          outputRange: [0.815, 1.1],
        }),
      },
    ],
  };


  const titleAnimatedStyle = {
    transform: [
      {
        translateY: transition.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -30],
        }),
      },
      {
        translateX: transition.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -100],
        }),
      },
    ],
  };

  // simple sparkle effect made from animated dots
  const Sparkles = ({ size = 120 }: { size?: number }) => {
    const count = 6;
    const anims = Array.from({ length: count }).map(
      () => useRef(new Animated.Value(0)).current
    );

    useEffect(() => {
      const loops = anims.map((a, i) => {
        const delay = i * 120;
        return Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.parallel([
              Animated.timing(a, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
              }),
            ]),
            Animated.timing(a, {
              toValue: 0,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.delay(400),
          ])
        );
      });
      loops.forEach((l) => l.start());
      return () => loops.forEach((l) => l.stop());
    }, []);

    const spots = Array.from({ length: count }).map((_, i) => {
      const a = anims[i];
      const left = Math.round(Math.random() * (size - 24));
      const top = Math.round(Math.random() * (size - 24));
      const scale = a.interpolate({
        inputRange: [0, 1],
        outputRange: [0.2, 1.2],
      });
      const opacity = a.interpolate({
        inputRange: [0, 0.6, 1],
        outputRange: [0, 1, 0],
      });
      return (
        <Animated.View
          key={i}
          style={{
            position: "absolute",
            left,
            top,
            width: 12,
            height: 12,
            borderRadius: 6,
            backgroundColor: "rgba(255,255,220,0.95)",
            transform: [{ scale }],
            opacity,
          }}
        />
      );
    });

    return <View style={{ width: size, height: size }}>{spots}</View>;
  };
 const panResponder = PanResponder.create({
  onMoveShouldSetPanResponder: (_, gesture) => {
    if (showInventory || popupItem) return false;

    const { dx, dy } = gesture;
    return Math.abs(dx) > 10 && Math.abs(dy) < 10;
  },
  onPanResponderRelease: (_, gesture) => {
    if (showInventory || popupItem) return;

    const { dx } = gesture;

    if (dx < -50) {
      router.push("/rival");
    } else if (dx > 50) {
      router.push("/leaderboard");
    }
  },
});


  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <ImageBackground
        source={require("../../asset_AARI/Exported/Gachi/CATS_GachiBG_AARIALMA.png")}
        style={styles.imageBackground}
        resizeMode="contain"
      >
        
          <ImageBackground
        source={require("../../asset_AARI/Exported/Backgrounds/CATS_Background_SunnyDay_AARIALMA.gif")}
        style={styles.imageBackground}
        resizeMode="contain"
      ></ImageBackground>
      

{/* swipe edge hints */}

<Animated.View
  pointerEvents="none"

>
  <LinearGradient
    colors={["transparent", "rgba(255,255,255,0.4)", "transparent"]}
    start={{ x: 0, y: 0.5 }}
    end={{ x: 1, y: 0.5 }}
    style={StyleSheet.absoluteFill}
  />
</Animated.View>

       <Animated.Text
  style={[
    {
      fontFamily: "PixelifySans_500Medium",
      fontSize: 30,
      position: "absolute",
      top: 135,
      left: 150,
      color: "#471B2B",
      zIndex: 10,
    },
    titleAnimatedStyle,
  ]}
>
  {playerName ?? "Plants"}
</Animated.Text>

        <Pressable
  style={styles.catContainer}
  onPress={() => setShowInventory(true)}
  accessibilityLabel="Open inventory"
>
  <Image
    key={catImageKey}  // 👈 this makes React Native remount the image
    source={
      equippedHatId &&
      ["turban", "chef", "sheriff", "bowler"].includes(equippedHatId)
        ? catEarsDownGif
        : catGif
    }
    style={styles.catImage}
  />
</Pressable>


{/* Spawned hat (positioned via styles.hatImage) */}
{/* Spawned hat (positioned via styles.hatImage) */}
{equippedHatSrc && !showInventory && (  // hide while inventory open
  <View pointerEvents="none" style={styles.hatWrapper}>
    <Image source={equippedHatSrc} style={styles.hatImage} />
  </View>
)}


        {/* Item popup (after opening) */}
        {popupItem && (
          <View style={styles.popupContainer} pointerEvents="box-none">
            <View style={styles.popupCard}>
              <Text style={styles.popupTitle}>You found:</Text>
              <Image source={popupItem.src} style={styles.popupItem} />
              <Text style={styles.popupName}>{popupItem.name}</Text>
              <TouchableOpacity
                onPress={() => setPopupItem(null)}
                style={styles.popupClose}
              >
                <Text style={{ color: "white" }}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ImageBackground>

      {/* Bottom chest bar */}
      <View style={styles.chestBar}>
        <TouchableOpacity onPress={() => openChest("left")} style={styles.chestSlot}>
          <View
            style={{
              width: 110,
              height: 110,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Image
              source={
                leftChest === "moving"
                  ? chestMoving
                  : leftChest === "opening"
                  ? chestOpening
                  : chestThumb
              }
              style={styles.chestImage}
            />
            {(leftChest === "opening" || leftChest === "opened") && (
              <View style={styles.sparkleOverlay} pointerEvents="none">
                <Sparkles size={110} />
              </View>
            )}
            {leftChest === "cooldown" && <View style={styles.cooldownOverlay} />}
            {leftChest === "cooldown" && leftNextAvailable && (
              <View style={styles.countdownLabel} pointerEvents="none">
                <Text style={styles.countdownText}>
                  {formatRemaining(leftNextAvailable)}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        <View style={styles.chestCenterSpacer} />

        <TouchableOpacity onPress={() => openChest("right")} style={styles.chestSlot}>
          <View
            style={{
              width: 110,
              height: 110,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Image
              source={
                rightChest === "moving"
                  ? chestMoving
                  : rightChest === "opening"
                  ? chestOpening
                  : chestThumb
              }
              style={styles.chestImage}
            />
            {(rightChest === "opening" || rightChest === "opened") && (
              <View style={styles.sparkleOverlay} pointerEvents="none">
                <Sparkles size={110} />
              </View>
            )}
            {rightChest === "cooldown" && <View style={styles.cooldownOverlay} />}
            {rightChest === "cooldown" && rightNextAvailable && (
              <View style={styles.countdownLabel} pointerEvents="none">
                <Text style={styles.countdownText}>
                  {formatRemaining(rightNextAvailable)}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>

      {/* Inventory modal */}
      <Modal visible={showInventory} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Inventory</Text>
            <FlatList
  data={inventory}
  keyExtractor={(i) => i.id + Math.random()}
  horizontal
  renderItem={({ item }) => (
    <TouchableOpacity
      style={[
        styles.invItem,
        selectedItem?.id === item.id && styles.invItemSelected, // optional highlight
      ]}
      onPress={() => setSelectedItem(item)}
    >
      <Image source={item.src} style={styles.invImage} />
      <Text style={styles.invName}>{item.name}</Text>
    </TouchableOpacity>
  )}
/>

 <TouchableOpacity
  onPress={() => {
    if (selectedItem) {
      const hat = hatPool.find((h) => h.id === selectedItem.id);
      if (hat) {
        setEquippedHatSrc(hat.src);   // show correct hat gif
        setEquippedHatId(hat.id);     // remember which hat is on
        setCatImageKey((k) => k + 1); // 🔥 force cat gif to restart
      }
    }
    setShowInventory(false);
  }}
  style={styles.modalClose}
>
  <Text style={{ color: "white" }}>Close</Text>
</TouchableOpacity>




          </View>
        </View>
      </Modal>

      {/* Dev: Reset button */}
      <TouchableOpacity
  onPress={resetTimers}
  style={styles.resetButton}
  hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }} // 🔥 bigger tap area
>
  <Text style={styles.resetButtonText}>Reset</Text>
</TouchableOpacity>


      <Animated.View style={[styles.buttonContainer, animatedStyle]} />
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
  catContainer: {
    position: "absolute",
    left: "33%",
    right: "33%",
    top: "35%",
    width: 160,
    height: 160,
    justifyContent: "center",
    alignItems: "center",
  },
  catImage: {
    width: 140,
    height: 140,
    resizeMode: "contain",
    transform: [{ scale: 4 }],
    position: "absolute",
    top: -80,
  },
  popupContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  popupCard: {
    width: 260,
    backgroundColor: "#BC8845",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    elevation: 6,
    borderWidth: 3,
    borderColor: "#471B2B",
  },
  popupTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
    color: "#471B2B",
  },
  popupItem: {
    width: 120,
    height: 120,
    resizeMode: "contain",
  },
  popupName: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: "600",
    color: "#471B2B",
  },
  popupClose: {
    marginTop: 8,
    backgroundColor: "#471B2B",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  chestBar: {
    position: "absolute",
    bottom: 140,
    left: 46,
    right: 50,
    height: 140,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  chestSlot: {
    width: 140,
    height: 140,
    justifyContent: "center",
    alignItems: "center",
    transform: [{ scale: 1.2 }],
  },
  chestImage: {
    width: 110,
    height: 110,
    resizeMode: "contain",

  },
  chestCenterSpacer: {
    flex: 1,
  },
  sparkleOverlay: {
    position: "absolute",
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  cooldownOverlay: {
    position: "absolute",
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 8,
  },
  countdownLabel: {
    position: "absolute",
    bottom: 6,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  countdownText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 12,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCard: {
    width: "90%",
    maxWidth: 560,
    backgroundColor: "#BC8845",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#471B2B",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
    color: "#471B2B",
  },
  invItem: {
    alignItems: "center",
    marginHorizontal: 8,
  },
  invImage: {
    width: 96,
    height: 96,
    resizeMode: "contain",
  },
  invName: {
    marginTop: 6,
    fontSize: 12,
    color: "#471B2B",
  },
  modalClose: {
    marginTop: 12,
    backgroundColor: "#471B2B",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
resetButton: {
  position: "absolute",
  top: 40,
  right: 12,
  backgroundColor: "#666",
  paddingHorizontal: 16,   // a bit larger
  paddingVertical: 8,
  borderRadius: 8,
  zIndex: 50,              // 🔥 keep it visually on top of other stuff
},

  resetButtonText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "600",
  },
  invItemSelected: {
  borderWidth: 2,
  borderColor: "#471B2B",
  borderRadius: 8,
}, hatWrapper: {
  position: "absolute",
  top: 270,   // same as you used before
  left: 160,
  // no zIndex here → keeps it under modal
},
hatImage: {
  width: 120,
  height: 120,
  resizeMode: "contain",
  transform: [{ scale: 4 }],  // tweak or remove if too big
},
edgeGlowLeft: {
  position: "absolute",
  left: 0,
  top: "35%",          // vertical position (middle-ish)
  width: 26,           // how thick the glow is
  height: "30%",       // how tall it is
  borderTopRightRadius: 16,
  borderBottomRightRadius: 16,
  overflow: "hidden",
  zIndex: 5,
},

edgeGlowRight: {
  position: "absolute",
  right: 0,
  top: "35%",
  width: 26,
  height: "30%",
  borderTopLeftRadius: 16,
  borderBottomLeftRadius: 16,
  overflow: "hidden",
  zIndex: 5,
},




});