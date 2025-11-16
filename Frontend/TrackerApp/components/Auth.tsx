import React, { useState } from 'react'
import {
  Alert,
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native'
import { supabase } from '../lib/supabase'
import { processSingleRiotId } from './logic/scraper'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [riotID, setRiotID] = useState('') 
  const [registeredRiotID, setRegisteredRiotID] = useState<string | null>(null)

  async function signUpWithEmail() {
    try {
      setLoading(true)

      // Validate Riot ID is provided
      if (!riotID || !riotID.includes('#')) {
        Alert.alert('Invalid Riot ID', 'Please enter a valid Riot ID in the format: GameName#TAG')
        return
      }

      // Extract game name and tag from Riot ID (e.g., "Hideonbush#NA1")
      const [gameName, tagLine] = riotID.split('#')

      if (!gameName || !tagLine) {
        Alert.alert('Invalid Riot ID', 'Please enter a valid Riot ID in the format: GameName#TAG')
        return
      }

      // First, run the scraper to fetch and store the player's data from Riot API
      console.log('Fetching player data from Riot API...')
      Alert.alert('Verifying Riot Account', 'Fetching your match history from Riot API. This may take a moment...')
      
      const scraperResult = await processSingleRiotId(gameName, tagLine)

      if (!scraperResult.success) {
        Alert.alert('Verification Failed', scraperResult.message)
        return
      }

      console.log('Scraper completed successfully:', scraperResult.message)

      // Use the resolved names from Riot API (which are the canonical capitalization)
      const resolvedGameName = scraperResult.resolvedName || gameName
      const resolvedTagLine = scraperResult.resolvedTag || tagLine

      // Verify the Riot account now exists in player_summaries
      const { data: playerData, error: playerError } = await supabase
        .from('player_summaries')
        .select('game_name, tag_line')
        .eq('game_name', resolvedGameName)
        .eq('tag_line', resolvedTagLine)
        .maybeSingle()

      if (playerError) {
        console.log('Error verifying Riot ID:', playerError)
        Alert.alert('Verification Error', 'Could not verify Riot ID. Please try again.')
        return
      }

      if (!playerData) {
        Alert.alert(
          'Riot Account Not Found',
          `The Riot ID "${riotID}" was not found. Please make sure you entered it correctly and that you have recent match history.`
        )
        return
      }

      // Use the canonical Riot ID format from the API
      const canonicalRiotID = `${resolvedGameName}#${resolvedTagLine}`

      // Try to sign up first
      let user = null
      let isNewUser = false

      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (signUpError) {
        // If sign up fails because user already exists, try to sign in instead
        console.log('Sign up failed, attempting sign in:', signUpError.message)
        
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (signInError) {
          Alert.alert('Authentication error', 'Could not sign in with these credentials. Please check your email and password.')
          return
        }

        user = signInData.user
        console.log('User signed in successfully')
      } else {
        if (!signUpData.user) {
          // email confirmation flow
          Alert.alert(
            'Check your email',
            'Please verify your email to finish signup.'
          )
          return
        }
        user = signUpData.user
        isNewUser = true
        console.log('New user signed up successfully')
      }

      if (!user) {
        Alert.alert('Error', 'Could not authenticate user')
        return
      }

      // Create or update profile with Riot ID
      // Use upsert so it works for both new and existing users
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: user.id,
        riotID: canonicalRiotID,
      }, {
        onConflict: 'id'
      })

      if (profileError) {
        console.log('profileError', profileError)
        Alert.alert('Profile error', profileError.message)
        return
      }

      // Store the registered Riot ID
      setRegisteredRiotID(canonicalRiotID)
      
      const message = isNewUser 
        ? `Your account has been created and linked to ${canonicalRiotID}. Welcome to the game!`
        : `You have been signed in and your account is linked to ${canonicalRiotID}. Welcome back!`
      
      Alert.alert('Success!', message)

      // The registered Riot ID is now available in the registeredRiotID state variable

    } catch (err) {
      console.error(err)
      Alert.alert('Unexpected error', String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Image
          source={require('../asset_AARI/Exported/Logo/CATS_Logo_AARIALMA.gif')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      {/* Email */}
      <View style={[styles.verticallySpaced, styles.mt20]}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          onChangeText={setEmail}
          value={email}
          placeholder="league@gmail.com"
          autoCapitalize="none"
        />
      </View>

      {/* Password */}
      <View style={styles.verticallySpaced}>
        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          onChangeText={setPassword}
          value={password}
          secureTextEntry
          placeholder="ILoveLeague123"
          autoCapitalize="none"
        />
      </View>

      {/* Riot game name */}
      <View style={styles.verticallySpaced}>
        <Text style={styles.label}>Riot Game Name</Text>
        <TextInput
          style={styles.input}
          onChangeText={setRiotID}
          value={riotID}
          placeholder="Hideonbush#NA1"
          autoCapitalize="none"
        />
      </View>
      
      {loading && (
        <View style={styles.verticallySpaced}>
          <ActivityIndicator />
        </View>
      )}

      <View style={styles.verticallySpaced}>
        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          disabled={loading} 
          onPress={signUpWithEmail}
        >
          <Text style={styles.buttonText}>Sign up</Text>
        </TouchableOpacity>
      </View>

      {/* Show registered Riot ID if available */}
      {registeredRiotID && (
        <View style={styles.successContainer}>
          <Text style={styles.successText}>
            ✓ Registered as {registeredRiotID}
          </Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginTop: 40,
    padding: 12,
    backgroundColor: '#A65F36',
    flex: 1,
  },
  verticallySpaced: {
    paddingTop: 4,
    paddingBottom: 4,
    alignSelf: 'stretch',
  },
  mt20: {
    marginTop: 20,
  },
  label: {
    marginBottom: 4,
    fontWeight: '600',
    color: '#fff',
    fontFamily: 'Jersey10_400Regular',
    fontSize: 22,
  },
  input: {
    borderWidth: 2,
    borderColor: '#471B2B',
    borderRadius: 0,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: '#fff',
    fontFamily: 'Jersey10_400Regular',
    fontSize: 16,
    backgroundColor: '#BC8845',
  },
  logoContainer: {
    marginTop: -30,
    marginBottom: -50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 300,
    height: 300,
  },
  button: {
    backgroundColor: '#471B2B',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#2A0F1A',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 20,
    fontFamily: 'Jersey10_400Regular',
    fontWeight: 'bold',
  },
  successContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#2E7D32',
    borderRadius: 4,
    marginTop: 8,
    alignItems: 'center',
  },
  successText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Jersey10_400Regular',
    fontWeight: 'bold',
  },
})
