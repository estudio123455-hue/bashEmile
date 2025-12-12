import { auth } from '@/config/firebase';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const API_BASE_URL = __DEV__
  ? 'http://localhost:3001/api'
  : 'https://backend-estudio123455-hues-projects.vercel.app/api';

type Step = 'intro' | 'redirected' | 'capturing' | 'done';

export default function PremiumScreen() {
  const { user, refreshUser } = useAuth();
  const [step, setStep] = useState<Step>('intro');
  const [isLoading, setIsLoading] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [paypalOrderId, setPaypalOrderId] = useState<string | null>(null);

  // Get premium status from backend
  const premiumStatus = user?.premiumStatus || { status: 'none', daysRemaining: 0, canPublish: false };
  const { status, daysRemaining, canPublish } = premiumStatus;

  const benefits = useMemo(
    () => [
      {
        icon: 'calendar-outline',
        title: 'Publica eventos',
        description: 'Crea y publica tus eventos en el marketplace',
      },
      {
        icon: 'cash-outline',
        title: 'Vende tickets',
        description: 'Monetiza tu evento con tickets online',
      },
      {
        icon: 'qr-code-outline',
        title: 'Validación con QR',
        description: 'Escaneo rápido en la entrada',
      },
      {
        icon: 'stats-chart-outline',
        title: 'Estadísticas',
        description: 'Ventas y tickets disponibles en tiempo real',
      },
    ],
    []
  );

  const startPremiumPayment = async () => {
    if (!auth.currentUser) {
      Alert.alert('Error', 'Debes iniciar sesión');
      return;
    }

    setIsLoading(true);
    try {
      const idToken = await auth.currentUser.getIdToken();

      const resp = await fetch(`${API_BASE_URL}/paypal/create-premium-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({}),
      });

      const data = await resp.json();
      if (!data.success || !data.data?.orderId || !data.data?.paypalOrderId) {
        throw new Error(data.error || 'No se pudo crear la orden Premium');
      }

      setOrderId(data.data.orderId);
      setPaypalOrderId(data.data.paypalOrderId);

      if (data.data.approvalUrl) {
        const { Linking } = await import('react-native');
        await Linking.openURL(data.data.approvalUrl);
        setStep('redirected');
      } else {
        // Demo mode: no approvalUrl, still allow capture
        setStep('redirected');
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Error iniciando el pago');
    } finally {
      setIsLoading(false);
    }
  };

  const capturePremiumPayment = async () => {
    if (!auth.currentUser) {
      Alert.alert('Error', 'Debes iniciar sesión');
      return;
    }

    if (!orderId || !paypalOrderId) {
      Alert.alert('Error', 'No hay una orden Premium para capturar');
      return;
    }

    setIsLoading(true);
    setStep('capturing');
    try {
      const idToken = await auth.currentUser.getIdToken();

      const resp = await fetch(`${API_BASE_URL}/paypal/capture-premium-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ orderId, paypalOrderId }),
      });

      const data = await resp.json();
      if (!data.success) {
        const msg = data.error || 'No se pudo capturar el pago';
        throw new Error(msg);
      }

      await refreshUser();

      if (Platform.OS === 'web') {
        window.alert('¡Premium activado! Ya puedes publicar eventos.');
      } else {
        Alert.alert('¡Premium activado!', 'Ya puedes publicar eventos.');
      }

      setStep('done');
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Error capturando el pago');
      setStep('redirected');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Premium</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View style={styles.badge}>
            <Ionicons name="diamond" size={36} color="#fbbf24" />
          </View>
          <Text style={styles.title}>EventQR Premium</Text>
          <Text style={styles.subtitle}>
            Publica tus eventos en el marketplace
          </Text>

          {status === 'active' ? (
            <View style={styles.premiumActive}>
              <Ionicons name="checkmark-circle" size={18} color="#10b981" />
              <Text style={styles.premiumActiveText}>Premium Activo</Text>
            </View>
          ) : status === 'trial' ? (
            <View style={styles.trialActive}>
              <Ionicons name="time-outline" size={18} color="#6366f1" />
              <Text style={styles.trialActiveText}>
                Trial: {daysRemaining} {daysRemaining === 1 ? 'día' : 'días'} restantes
              </Text>
            </View>
          ) : (
            <View style={styles.premiumInactive}>
              <Ionicons name="lock-closed" size={18} color="#ef4444" />
              <Text style={styles.premiumInactiveText}>Trial expirado</Text>
            </View>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Beneficios</Text>
          {benefits.map((b, idx) => (
            <View key={idx} style={styles.benefitRow}>
              <View style={styles.benefitIcon}>
                <Ionicons name={b.icon as any} size={20} color="#6366f1" />
              </View>
              <View style={styles.benefitText}>
                <Text style={styles.benefitTitle}>{b.title}</Text>
                <Text style={styles.benefitDesc}>{b.description}</Text>
              </View>
            </View>
          ))}
        </View>

        {status !== 'active' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Activar Premium</Text>
            <Text style={styles.cardDesc}>
              Ser Premium te habilita el botón “Publicar evento”. El backend valida siempre.
            </Text>

            {step === 'intro' && (
              <TouchableOpacity
                style={[styles.primaryBtn, isLoading && styles.disabledBtn]}
                onPress={startPremiumPayment}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="logo-paypal" size={18} color="#fff" />
                    <Text style={styles.primaryBtnText}>Pagar con PayPal</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {step !== 'intro' && (
              <>
                <View style={styles.orderBox}>
                  <Text style={styles.orderLabel}>Orden</Text>
                  <Text style={styles.orderValue}>{orderId || '-'}</Text>
                </View>

                <TouchableOpacity
                  style={[styles.primaryBtn, isLoading && styles.disabledBtn]}
                  onPress={capturePremiumPayment}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="checkmark" size={18} color="#fff" />
                      <Text style={styles.primaryBtnText}>Ya pagué, activar Premium</Text>
                    </>
                  )}
                </TouchableOpacity>

                <Text style={styles.hint}>
                  Si aún no terminaste el pago, vuelve a PayPal y completa el checkout.
                </Text>
              </>
            )}
          </View>
        )}

        {status === 'active' && step === 'done' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Listo</Text>
            <Text style={styles.cardDesc}>Ahora ya puedes publicar eventos desde el marketplace.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  content: { padding: 20, paddingBottom: 40 },
  hero: { alignItems: 'center', marginBottom: 20 },
  badge: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: 'rgba(251, 191, 36, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: { fontSize: 26, fontWeight: '800', color: '#fff' },
  subtitle: { marginTop: 6, color: '#94a3b8', textAlign: 'center' },
  premiumActive: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    alignItems: 'center',
  },
  premiumActiveText: { color: '#a7f3d0', fontWeight: '600' },
  premiumInactive: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
    alignItems: 'center',
  },
  premiumInactiveText: { color: '#fca5a5', fontWeight: '600' },
  trialActive: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.25)',
    alignItems: 'center',
  },
  trialActiveText: { color: '#a5b4fc', fontWeight: '600' },
  card: {
    backgroundColor: '#111c33',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 14,
  },
  cardTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 10 },
  cardDesc: { color: '#94a3b8', marginBottom: 12 },
  benefitRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  benefitIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(99, 102, 241, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitText: { flex: 1 },
  benefitTitle: { color: '#fff', fontWeight: '700' },
  benefitDesc: { color: '#94a3b8', marginTop: 2 },
  primaryBtn: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  disabledBtn: { opacity: 0.7 },
  orderBox: {
    marginTop: 8,
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#0b1224',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  orderLabel: { color: '#94a3b8', marginBottom: 4 },
  orderValue: { color: '#fff', fontWeight: '700' },
  hint: { marginTop: 10, color: '#94a3b8', fontSize: 12 },
});
