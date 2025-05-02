// screens/SignUpScreen.jsx
import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { signUpUser } from '@/services/api';

export default function SignUpScreen() {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
      try {
        setLoading(true);
        const user = await signUpUser(email, password)
        setLoading(false);
    } catch (error) {
        setErrorMsg(error.message);
        setLoading(false);  
    } finally {
        navigation.replace('(tabs)');
    }
}

  return (
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

      <TextInput
        placeholder="Password"
        secureTextEntry
        style={styles.input}
        value={password}
        onChangeText={setPassword}
      />

      {errorMsg && <Text style={styles.error}>{errorMsg}</Text>}

      {loading ? (
        <ActivityIndicator />
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