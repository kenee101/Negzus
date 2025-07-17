import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet, Platform, Keyboard, TouchableWithoutFeedback, KeyboardAvoidingView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { signUpUser } from '@/services/api';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function SignUpScreen() {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false)

  const handleSignUp = async () => {
      try {
        setLoading(true);
        const user = await signUpUser(email, password, fullName);
        // console.log(user)
        setLoading(false);
    } catch (error) {
        setErrorMsg(error.message);
        console.log(error.message);
    } finally {
        setLoading(false); 
        navigation.replace('(tabs)');
    }
}

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
    {/* <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }} keyboardVerticalOffset={100}> */}
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          <Text style={styles.title}>Create your Account</Text>

          <TextInput
            placeholder="Full Name"
            style={styles.input}
            value={fullName}
            onChangeText={setFullName}
          />

          <TextInput
            placeholder="Email"
            autoCapitalize="none"
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
            <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowPassword(!showPassword)}>
              <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={24} color="black" />
            </TouchableOpacity>
          </View>

          {errorMsg && <Text style={styles.error}>{errorMsg}</Text>}

          {loading ? (
            <ActivityIndicator color="#0000ff"/>
          ) : (
            <Button title="Sign Up" onPress={handleSignUp} />
          )}

          <Text style={styles.loginPrompt}>
            Already have an account?{' '}
            <Text style={styles.link} onPress={() => navigation.replace('LoginScreen')}>
              Log in
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
        marginBottom: 16,
        paddingHorizontal: 12,
        backgroundColor: '#fff',
      },
      error: {
        color: 'red',
        marginBottom: 16,
        textAlign: 'center',
      },
      loginPrompt: {
        marginTop: 24,
        textAlign: 'center',
      },
      link: {
        color: '#007bff',
        fontWeight: 'bold',
    },
});