import React, { useState } from 'react'
import {
Alert,
StyleSheet,
View,
Text,
TextInput,
Button,
ActivityIndicator,
} from 'react-native'
import { supabase } from '../lib/supabase'
export default function Auth() {
const [email, setEmail] = useState('')
const [password, setPassword] = useState('')
const [loading, setLoading] = useState(false)
const [locality, setlocality] = useState('')

async function signInWithEmail() {
    try {
setLoading(true)
const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
})
if (error) {
        Alert.alert('Sign in error', error.message)
}
    } finally {
setLoading(false)
    }
}

  async function signUpWithEmail() {
    try {
      setLoading(true)
      const {
        data: { session },
        error,
      } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) {
        Alert.alert('Sign up error', error.message)
      } else if (!session) {
        Alert.alert('Check your email', 'Please verify your email to finish signup.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <View style={[styles.verticallySpaced, styles.mt20]}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          onChangeText={setEmail}
          value={email}
          placeholder="email@address.com"
          autoCapitalize="none"
          keyboardType="email-address"
        />
      </View>

      <View style={styles.verticallySpaced}>
        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          onChangeText={setPassword}
          value={password}
          secureTextEntry
          placeholder="Password"
          autoCapitalize="none"
        />
      </View>

      {loading && (
        <View style={styles.verticallySpaced}>
          <ActivityIndicator />
        </View>
      )}

      <View style={[styles.verticallySpaced, styles.mt20]}>
        <Button title="Sign in" disabled={loading} onPress={signInWithEmail} />
      </View>

      <View style={styles.verticallySpaced}>
        <Button title="Sign up" disabled={loading} onPress={signUpWithEmail} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginTop: 40,
    padding: 12,
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
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: '#fff',
  },
})
