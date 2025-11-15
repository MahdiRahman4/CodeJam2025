import 'react-native-url-polyfill/auto'

import React, { useEffect, useState } from 'react'
import { View } from 'react-native'
import { Tabs } from 'expo-router'
import { Session } from '@supabase/supabase-js'

import { HapticTab } from '@/components/haptic-tab'
import { IconSymbol } from '@/components/ui/icon-symbol'
import { Colors } from '@/constants/theme'
import { useColorScheme } from '@/hooks/use-color-scheme'

import { supabase } from '../../lib/supabase'
import Auth from '../../components/Auth'

export default function TabLayout() {
  const colorScheme = useColorScheme()
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    let mounted = true

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) setSession(session)
    })

    // Subscribe to auth changes
    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (mounted) setSession(session)
      }
    )

    return () => {
      mounted = false
      subscription?.subscription?.unsubscribe?.()
    }
  }, [])

  if (!session) {
    return (
      <View style={{ flex: 1 }}>
        <Auth />
      </View>
    )
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: 'Leaderboard',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={35} name="crown.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Clan',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={50} name="person.3.fill" color={color} />
          ),
        }}
      />
      
    </Tabs>
  )
}
