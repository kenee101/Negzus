import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Keyboard, TouchableWithoutFeedback, Platform, TouchableOpacity } from 'react-native';
import { supabase } from '@/services/supabase';
import { useNavigation } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function LoginScreen() {
  const navigation = useNavigation();
  const [email, setEmail] = useState('nexus@gmail.com');
  const [password, setPassword] = useState('secret');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [showPassword, setShowPassword] = useState(false)

  const handleLogin = async () => {
    setLoading(true);
    setErrorMsg(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setErrorMsg(error.message);
    } else {
      navigation.replace('(tabs)'); //
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          <Text style={styles.title}>Login to Negzus</Text>

          <TextInput
            placeholder="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
          />

          <View style={styles.inputContainer}>
            <TextInput
              placeholder="Password"
              secureTextEntry={!showPassword}
              style={[styles.input, styles.passwordInput]}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity style={styles.eyeIcon} 
            onPress={() => setShowPassword(!showPassword)}
            activeOpacity={0.7}
            >
              <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={24} color="black" />
            </TouchableOpacity>
          </View>

          {errorMsg && <Text style={styles.error}>{errorMsg}</Text>}

          {loading ? (
            <ActivityIndicator color="#0000ff" />
          ) : (
            <Button title="Login" onPress={handleLogin} />
          )}

          <Text style={styles.signupPrompt}>
            Don't have an account?{' '}
            <Text style={styles.link} onPress={() => navigation.replace('SignUpScreen')}>
              Sign up
            </Text>
          </Text>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 24,
      justifyContent: 'center',
      backgroundColor: '#f8f9fa',
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      marginBottom: 32,
      textAlign: 'center',
    },
    inputContainer: { 
      flexDirection: 'row', 
      justifyContent: 'center',
      alignItems: 'center', 
      marginBottom: 18,
      position: 'relative',
      width: '100%',
    },
    passwordInput: {
      flex: 1,
      marginBottom: 0,
    },
    eyeIcon: {
      position: 'absolute',
      right: 8,
      top: 8,
      padding: 4,
    },
    input: {
      height: 48,
      borderColor: '#ccc',
      borderWidth: 1,
      borderRadius: 8,
      marginBottom: 18,
      paddingHorizontal: 12,
      backgroundColor: '#fff',
    },
    error: {
      color: 'red',
      marginBottom: 16,
      textAlign: 'center',
    },
    signupPrompt: {
      marginTop: 24,
      textAlign: 'center',
    },
    link: {
      color: '#007bff',
      fontWeight: 'bold',
    },
  });