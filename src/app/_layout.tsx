///app/_layout.tsx


import "../global.css"; // your NativeWind CSS import: keep whatever path you already have

import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Toaster } from "sonner-native";
import { FullScreenLoader } from "../components/FullScreenLoader";
import { AuthProvider, useAuth } from "../contexts/AuthContexts";
import { ConfessionsProvider } from "../contexts/ConfessionContext";

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { status } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // The loader overlay covers the screen while the session restores, so the splash can go right away.
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  // Replaces PublicOnlyRoute and RequireAuth.
  useEffect(() => {
    if (status === "loading") return; // still reading the token from AsyncStorage

    const inAuthGroup = segments[0] === "(auth)";

    if (status === "unauthenticated" && !inAuthGroup) {
      router.replace("/(auth)/welcome");
    } else if (status === "authenticated" && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [status, segments]);

  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }} />
      {status === "loading" && (
        <View style={StyleSheet.absoluteFill}>
          <FullScreenLoader />
        </View>
      )}
    </View>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <AuthProvider>
          <ConfessionsProvider>
            <RootNavigator />
          </ConfessionsProvider>
        </AuthProvider>
      </BottomSheetModalProvider>
      <Toaster />
    </GestureHandlerRootView>
  );
}
