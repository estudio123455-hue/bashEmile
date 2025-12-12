import { auth } from '@/config/firebase';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Alert,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const API_BASE_URL = __DEV__
  ? 'http://localhost:3001/api'
  : 'https://backend-estudio123455-hues-projects.vercel.app/api';

export default function ScannerScreen() {
  const [ticketCode, setTicketCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    ticket?: any;
  } | null>(null);

  const validateTicket = async () => {
    if (!ticketCode.trim()) {
      Alert.alert('Error', 'Ingresa un código de ticket');
      return;
    }

    setIsValidating(true);
    setResult(null);

    try {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) {
        Alert.alert('Error', 'Debes iniciar sesión');
        return;
      }

      const idToken = await firebaseUser.getIdToken();

      const response = await fetch(`${API_BASE_URL}/tickets/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({ ticketId: ticketCode.trim() }),
      });

      const data = await response.json();

      setResult({
        success: data.success,
        message: data.success 
          ? '¡Ticket válido! Entrada permitida.' 
          : data.error || 'Ticket inválido',
        ticket: data.data,
      });

      if (data.success) {
        setTicketCode('');
      }
    } catch (error) {
      console.error('Error validating ticket:', error);
      setResult({
        success: false,
        message: 'Error al validar el ticket',
      });
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Escáner de Tickets</Text>
        <Text style={styles.headerSubtitle}>
          Valida las entradas en la puerta del evento
        </Text>
      </View>

      <View style={styles.content}>
        <View style={styles.scannerPlaceholder}>
          <View style={styles.scannerIcon}>
            <Ionicons name="qr-code" size={80} color="#6366f1" />
          </View>
          <Text style={styles.scannerText}>
            Escaneo de cámara próximamente
          </Text>
          <Text style={styles.scannerSubtext}>
            Por ahora, ingresa el código manualmente
          </Text>
        </View>

        <View style={styles.manualInput}>
          <Text style={styles.inputLabel}>Código del Ticket</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="ticket-outline" size={20} color="#64748b" />
            <TextInput
              style={styles.input}
              placeholder="Ingresa el ID del ticket"
              placeholderTextColor="#64748b"
              value={ticketCode}
              onChangeText={setTicketCode}
              autoCapitalize="none"
            />
            {ticketCode.length > 0 && (
              <TouchableOpacity onPress={() => setTicketCode('')}>
                <Ionicons name="close-circle" size={20} color="#64748b" />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={[styles.validateButton, isValidating && styles.buttonDisabled]}
            onPress={validateTicket}
            disabled={isValidating}
          >
            {isValidating ? (
              <Text style={styles.validateButtonText}>Validando...</Text>
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.validateButtonText}>Validar Ticket</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {result && (
          <View style={[
            styles.resultCard,
            result.success ? styles.resultSuccess : styles.resultError
          ]}>
            <Ionicons
              name={result.success ? 'checkmark-circle' : 'close-circle'}
              size={48}
              color={result.success ? '#10b981' : '#ef4444'}
            />
            <Text style={[
              styles.resultMessage,
              result.success ? styles.resultMessageSuccess : styles.resultMessageError
            ]}>
              {result.message}
            </Text>
            {result.ticket && (
              <View style={styles.ticketInfo}>
                <Text style={styles.ticketInfoText}>
                  Evento: {result.ticket.eventTitle}
                </Text>
                <Text style={styles.ticketInfoText}>
                  Cantidad: {result.ticket.quantity} entrada(s)
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    padding: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  scannerPlaceholder: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#334155',
    borderStyle: 'dashed',
  },
  scannerIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#6366f115',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  scannerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  scannerSubtext: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
  },
  manualInput: {
    marginTop: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 10,
  },
  input: {
    flex: 1,
    height: 50,
    color: '#fff',
    fontSize: 15,
  },
  validateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 16,
    gap: 8,
  },
  validateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  resultCard: {
    marginTop: 24,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  resultSuccess: {
    backgroundColor: '#10b98115',
    borderWidth: 1,
    borderColor: '#10b98130',
  },
  resultError: {
    backgroundColor: '#ef444415',
    borderWidth: 1,
    borderColor: '#ef444430',
  },
  resultMessage: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
  },
  resultMessageSuccess: {
    color: '#10b981',
  },
  resultMessageError: {
    color: '#ef4444',
  },
  ticketInfo: {
    marginTop: 16,
    alignItems: 'center',
  },
  ticketInfoText: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
  },
});
