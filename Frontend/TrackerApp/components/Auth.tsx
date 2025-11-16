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

export default function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [riotID, setRiotID] = useState('') 


  async function signUpWithEmail() {
    try {
      setLoading(true)

      // 1) Create auth user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) {
        Alert.alert('Sign up error', error.message)
        return
      }

      if (!data.user) {
        // email confirmation flow
        Alert.alert(
          'Check your email',
          'Please verify your email to finish signup.'
        )
        return
      }

      const user = data.user

      // 2) Create profile row with Riot info on the SAME step
      const { error: profileError } = await supabase.from('profiles').insert({
        id: user.id,                // assumes profiles.id references auth.users.id
        riotID: riotID || null,
        // riot_puuid: null for now – you’ll fill this after calling Riot API
      })

      if (profileError) {
        console.log('profileError', profileError)
        Alert.alert('Profile error', profileError.message)
        return
      }

      Alert.alert('Success', 'Account created!')

      // later you might navigate to main app screen here

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
})
