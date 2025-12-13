import { getPriceSummary } from '@/services/paypal';
import { Event } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface PayPalCheckoutProps {
  visible: boolean;
  event: Event;
  quantity: number;
  onClose: () => void;
  onPaymentSuccess: (transactionId: string) => void;
  onPaymentError: (error: string) => void;
}

type PaymentStep = 'summary' | 'processing' | 'success' | 'error';

export default function PayPalCheckout({
  visible,
  event,
  quantity,
  onClose,
  onPaymentSuccess,
  onPaymentError,
}: PayPalCheckoutProps) {
  const [step, setStep] = useState<PaymentStep>('summary');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const priceSummary = getPriceSummary(event, quantity);

  const handlePayPalPayment = async () => {
    setIsLoading(true);
    setStep('processing');

    const API_BASE_URL = __DEV__ 
      ? 'http://localhost:3001/api'
      : 'https://backend-estudio123455-hues-projects.vercel.app/api';

    try {
      // Get auth token
      if (!auth.currentUser) {
        throw new Error('Debes iniciar sesión para comprar tickets');
      }
      const idToken = await auth.currentUser.getIdToken();

      // 1. Crear orden en el backend
      const createResponse = await fetch(`${API_BASE_URL}/paypal/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          eventId: event.id,
          quantity: quantity,
        }),
      });

      const createData = await createResponse.json();

      if (!createData.success || !createData.data?.approvalUrl) {
        throw new Error(createData.error || 'Error al crear orden');
      }

      // 2. Abrir PayPal en el navegador
      const { Linking } = await import('react-native');
      await Linking.openURL(createData.data.approvalUrl);

      // 3. Mostrar instrucciones al usuario
      setStep('summary');
      setIsLoading(false);
      
      // Nota: En una implementación completa, usarías deep linking
      // para capturar cuando el usuario regresa de PayPal
      // Por ahora, el usuario debe completar el pago en PayPal
      // y el ticket se generará cuando PayPal notifique al webhook

    } catch (error: any) {
      console.error('PayPal error:', error);
      setErrorMessage(error.message || 'Error al procesar el pago');
      setStep('error');
      onPaymentError(error.message || 'Error al procesar el pago');
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setStep('summary');
    setErrorMessage('');
    onClose();
  };

  const renderSummary = () => (
    <>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Resumen de Compra</Text>
        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <Ionicons name="close" size={24} color="#94a3b8" />
        </TouchableOpacity>
      </View>

      <View style={styles.eventInfo}>
        <Text style={styles.eventTitle}>{event.title}</Text>
        <View style={styles.quantityRow}>
          <Ionicons name="ticket" size={16} color="#6366f1" />
          <Text style={styles.quantityText}>
            {quantity} {quantity === 1 ? 'entrada' : 'entradas'}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.priceBreakdown}>
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Subtotal</Text>
          <View style={styles.priceValues}>
            <Text style={styles.priceCOP}>{priceSummary.formattedSubtotalCOP}</Text>
            <Text style={styles.priceUSD}>≈ {priceSummary.formattedSubtotalUSD}</Text>
          </View>
        </View>

        <View style={styles.priceRow}>
          <View style={styles.feeLabel}>
            <Text style={styles.priceLabel}>Comisión PayPal</Text>
            <Ionicons name="information-circle-outline" size={14} color="#64748b" />
          </View>
          <Text style={styles.feeValue}>{priceSummary.formattedPayPalFee}</Text>
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total a pagar</Text>
          <Text style={styles.totalValue}>{priceSummary.formattedTotal}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.paymentMethods}>
        <Text style={styles.methodsTitle}>Métodos de pago aceptados</Text>
        <View style={styles.methodsGrid}>
          <View style={styles.methodItem}>
            <Ionicons name="card" size={20} color="#6366f1" />
            <Text style={styles.methodText}>Tarjetas</Text>
          </View>
          <View style={styles.methodItem}>
            <Ionicons name="wallet" size={20} color="#6366f1" />
            <Text style={styles.methodText}>PayPal</Text>
          </View>
          <View style={styles.methodItem}>
            <Ionicons name="globe" size={20} color="#6366f1" />
            <Text style={styles.methodText}>Internacional</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={styles.payButton}
        onPress={handlePayPalPayment}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={['#0070ba', '#003087']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.payButtonGradient}
        >
          <Ionicons name="logo-paypal" size={24} color="#fff" />
          <Text style={styles.payButtonText}>Pagar con PayPal</Text>
        </LinearGradient>
      </TouchableOpacity>

      <View style={styles.securityNote}>
        <Ionicons name="shield-checkmark" size={16} color="#10b981" />
        <Text style={styles.securityText}>
          Pago seguro procesado por PayPal
        </Text>
      </View>
    </>
  );

  const renderProcessing = () => (
    <View style={styles.statusContainer}>
      <View style={styles.processingIcon}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
      <Text style={styles.statusTitle}>Procesando pago...</Text>
      <Text style={styles.statusSubtitle}>
        Por favor espera mientras verificamos tu pago
      </Text>
      <View style={styles.processingSteps}>
        <View style={styles.processingStep}>
          <Ionicons name="checkmark-circle" size={20} color="#10b981" />
          <Text style={styles.stepText}>Orden creada</Text>
        </View>
        <View style={styles.processingStep}>
          <ActivityIndicator size="small" color="#6366f1" />
          <Text style={styles.stepText}>Verificando pago...</Text>
        </View>
        <View style={styles.processingStep}>
          <Ionicons name="ellipse-outline" size={20} color="#64748b" />
          <Text style={[styles.stepText, styles.stepPending]}>Generando entrada</Text>
        </View>
      </View>
    </View>
  );

  const renderSuccess = () => (
    <View style={styles.statusContainer}>
      <View style={styles.successIcon}>
        <Ionicons name="checkmark-circle" size={80} color="#10b981" />
      </View>
      <Text style={styles.statusTitle}>¡Pago exitoso!</Text>
      <Text style={styles.statusSubtitle}>
        Tu entrada ha sido generada correctamente
      </Text>
      <View style={styles.successDetails}>
        <View style={styles.successRow}>
          <Text style={styles.successLabel}>Evento</Text>
          <Text style={styles.successValue}>{event.title}</Text>
        </View>
        <View style={styles.successRow}>
          <Text style={styles.successLabel}>Entradas</Text>
          <Text style={styles.successValue}>{quantity}</Text>
        </View>
        <View style={styles.successRow}>
          <Text style={styles.successLabel}>Total pagado</Text>
          <Text style={styles.successValue}>{priceSummary.formattedTotal}</Text>
        </View>
      </View>
    </View>
  );

  const renderError = () => (
    <View style={styles.statusContainer}>
      <View style={styles.errorIcon}>
        <Ionicons name="close-circle" size={80} color="#ef4444" />
      </View>
      <Text style={styles.statusTitle}>Error en el pago</Text>
      <Text style={styles.statusSubtitle}>{errorMessage}</Text>
      <TouchableOpacity
        style={styles.retryButton}
        onPress={() => setStep('summary')}
      >
        <Text style={styles.retryButtonText}>Intentar de nuevo</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
        <Text style={styles.cancelButtonText}>Cancelar</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {step === 'summary' && renderSummary()}
          {step === 'processing' && renderProcessing()}
          {step === 'success' && renderSuccess()}
          {step === 'error' && renderError()}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventInfo: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  quantityText: {
    fontSize: 14,
    color: '#a5b4fc',
  },
  divider: {
    height: 1,
    backgroundColor: '#334155',
    marginVertical: 16,
  },
  priceBreakdown: {
    gap: 12,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 14,
    color: '#94a3b8',
  },
  priceValues: {
    alignItems: 'flex-end',
  },
  priceCOP: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  priceUSD: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  feeLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  feeValue: {
    fontSize: 14,
    color: '#f59e0b',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    padding: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#10b981',
  },
  paymentMethods: {
    marginBottom: 20,
  },
  methodsTitle: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 12,
  },
  methodsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  methodItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0f172a',
    paddingVertical: 10,
    borderRadius: 10,
  },
  methodText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  payButton: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 16,
  },
  payButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
  },
  payButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  securityText: {
    fontSize: 12,
    color: '#64748b',
  },
  statusContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  processingIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  successIcon: {
    marginBottom: 24,
  },
  errorIcon: {
    marginBottom: 24,
  },
  statusTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  statusSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 24,
  },
  processingSteps: {
    width: '100%',
    gap: 16,
    paddingHorizontal: 20,
  },
  processingStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepText: {
    fontSize: 14,
    color: '#fff',
  },
  stepPending: {
    color: '#64748b',
  },
  successDetails: {
    width: '100%',
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 16,
    gap: 12,
  },
  successRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  successLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  successValue: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  retryButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginBottom: 12,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: 12,
  },
  cancelButtonText: {
    color: '#94a3b8',
    fontSize: 14,
  },
});
