import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

type AccountType = 'user' | 'organizer';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [accountType, setAccountType] = useState<AccountType | null>(null);
  const { register } = useAuth();

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    if (!accountType) {
      Alert.alert('Error', 'Por favor selecciona el tipo de cuenta');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setIsLoading(true);
    const success = await register(name, email, password, accountType as UserRole);
    setIsLoading(false);

    if (success) {
      // Redirección según el rol (el layout se encargará)
      router.replace('/(tabs)');
    } else {
      Alert.alert('Error', 'El email ya está registrado');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Ionicons name="ticket" size={80} color="#6366f1" />
          <Text style={styles.title}>EventQR</Text>
          <Text style={styles.subtitle}>Crea tu cuenta</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Nombre completo"
              placeholderTextColor="#9ca3af"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#9ca3af"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Contraseña"
              placeholderTextColor="#9ca3af"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color="#9ca3af"
              />
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Confirmar contraseña"
              placeholderTextColor="#9ca3af"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPassword}
            />
          </View>

          {/* Selector de tipo de cuenta */}
          <Text style={styles.accountTypeLabel}>¿Qué deseas hacer?</Text>
          <View style={styles.accountTypeContainer}>
            <TouchableOpacity
              style={[
                styles.accountTypeOption,
                accountType === 'user' && styles.accountTypeSelected,
              ]}
              onPress={() => setAccountType('user')}
            >
              <View style={[
                styles.radioOuter,
                accountType === 'user' && styles.radioOuterSelected,
              ]}>
                {accountType === 'user' && <View style={styles.radioInner} />}
              </View>
              <View style={styles.accountTypeContent}>
                <Ionicons 
                  name="ticket-outline" 
                  size={24} 
                  color={accountType === 'user' ? '#6366f1' : '#9ca3af'} 
                />
                <View style={styles.accountTypeText}>
                  <Text style={[
                    styles.accountTypeTitle,
                    accountType === 'user' && styles.accountTypeTitleSelected,
                  ]}>
                    Quiero comprar entradas
                  </Text>
                  <Text style={styles.accountTypeDesc}>
                    Compra tickets y asiste a eventos
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.accountTypeOption,
                accountType === 'organizer' && styles.accountTypeSelected,
              ]}
              onPress={() => setAccountType('organizer')}
            >
              <View style={[
                styles.radioOuter,
                accountType === 'organizer' && styles.radioOuterSelected,
              ]}>
                {accountType === 'organizer' && <View style={styles.radioInner} />}
              </View>
              <View style={styles.accountTypeContent}>
                <Ionicons 
                  name="calendar-outline" 
                  size={24} 
                  color={accountType === 'organizer' ? '#6366f1' : '#9ca3af'} 
                />
                <View style={styles.accountTypeText}>
                  <Text style={[
                    styles.accountTypeTitle,
                    accountType === 'organizer' && styles.accountTypeTitleSelected,
                  ]}>
                    Quiero organizar eventos
                  </Text>
                  <Text style={styles.accountTypeDesc}>
                    Crea eventos y vende tickets
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'Registrando...' : 'Registrarse'}
            </Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>¿Ya tienes cuenta? </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text style={styles.linkText}>Inicia sesión</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#9ca3af',
    marginTop: 8,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 56,
    color: '#fff',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    color: '#9ca3af',
    fontSize: 16,
  },
  linkText: {
    color: '#6366f1',
    fontSize: 16,
    fontWeight: '600',
  },
  accountTypeLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 8,
  },
  accountTypeContainer: {
    gap: 12,
    marginBottom: 16,
  },
  accountTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#334155',
  },
  accountTypeSelected: {
    borderColor: '#6366f1',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#64748b',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  radioOuterSelected: {
    borderColor: '#6366f1',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#6366f1',
  },
  accountTypeContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  accountTypeText: {
    flex: 1,
  },
  accountTypeTitle: {
    color: '#9ca3af',
    fontSize: 15,
    fontWeight: '600',
  },
  accountTypeTitleSelected: {
    color: '#fff',
  },
  accountTypeDesc: {
    color: '#64748b',
    fontSize: 13,
    marginTop: 2,
  },
});
