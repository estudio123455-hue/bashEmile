import { useAuth } from '@/context/AuthContext';
import { useTickets } from '@/context/TicketContext';
import { Event } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    Image,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import PayPalCheckout from '../../components/payment/PayPalCheckout';

const API_BASE_URL = __DEV__
  ? 'http://localhost:3001/api'
  : 'https://backend-estudio123455-hues-projects.vercel.app/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HERO_HEIGHT = 240;

interface IncludeItem {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
}

const INCLUDES: IncludeItem[] = [
  { icon: 'ticket', text: 'Entrada general' },
  { icon: 'wifi', text: 'WiFi gratuito' },
  { icon: 'car', text: 'Estacionamiento' },
  { icon: 'shield-checkmark', text: 'Seguro incluido' },
];

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { purchaseTicket } = useTickets();
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoadingEvent, setIsLoadingEvent] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showPayPal, setShowPayPal] = useState(false);
  const scrollY = new Animated.Value(0);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/events/${id}`);
        const data = await response.json();
        
        if (data.success && data.data) {
          const eventData = data.data;
          setEvent({
            id: eventData.id,
            title: eventData.title,
            description: eventData.description,
            date: eventData.date,
            time: eventData.time,
            location: eventData.location,
            price: eventData.ticketPrice || eventData.price,
            image: eventData.imageUrl || eventData.image,
            availableTickets: eventData.availableTickets || eventData.capacity,
          });
        }
      } catch (error) {
        console.error('Error fetching event:', error);
      } finally {
        setIsLoadingEvent(false);
      }
    };

    if (id) {
      fetchEvent();
    }
  }, [id]);

  if (isLoadingEvent) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.errorText}>Cargando evento...</Text>
        </View>
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#64748b" />
          <Text style={styles.errorText}>Evento no encontrado</Text>
          <TouchableOpacity style={styles.errorButton} onPress={() => router.back()}>
            <Text style={styles.errorButtonText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  const formatShortDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleDateString('es-ES', { month: 'short' }).toUpperCase();
    return { day, month };
  };

  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta;
    if (newQuantity >= 1 && newQuantity <= Math.min(10, event.availableTickets)) {
      setQuantity(newQuantity);
    }
  };

  const handlePurchase = () => {
    if (!user) {
      Alert.alert('Error', 'Debes iniciar sesión para comprar entradas');
      return;
    }
    setShowPayPal(true);
  };

  const handlePaymentSuccess = async (transactionId: string) => {
    setShowPayPal(false);
    setIsLoading(true);
    try {
      const ticket = await purchaseTicket(event, quantity);
      Alert.alert(
        '¡Compra Exitosa!',
        `Tu pago ha sido procesado correctamente.\nTransacción: ${transactionId}`,
        [
          {
            text: 'Ver mi entrada',
            onPress: () => router.push(`/ticket/${ticket.id}` as any),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Pago procesado pero hubo un error generando la entrada.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentError = (error: string) => {
    setShowPayPal(false);
    Alert.alert('Error', error);
  };

  const totalPrice = event.price * quantity;
  const { day, month } = formatShortDate(event.date);

  return (
    <View style={styles.container}>
      {/* Imagen Hero con gradiente */}
      <View style={styles.heroContainer}>
        <Image source={{ uri: event.image }} style={styles.heroImage} />
        <LinearGradient
          colors={['rgba(15, 23, 42, 0.3)', 'rgba(15, 23, 42, 0.7)', '#0f172a']}
          style={styles.heroGradient}
        />
        
        {/* Botones flotantes */}
        <View style={styles.heroButtons}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          
          <View style={styles.heroRightButtons}>
            <TouchableOpacity style={styles.iconButton} activeOpacity={0.8}>
              <Ionicons name="heart-outline" size={22} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} activeOpacity={0.8}>
              <Ionicons name="share-outline" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Badge de fecha en hero */}
        <View style={styles.dateBadge}>
          <Text style={styles.dateBadgeDay}>{day}</Text>
          <Text style={styles.dateBadgeMonth}>{month}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Header del contenido */}
        <View style={styles.contentHeader}>
          <View style={styles.categoryBadge}>
            <Ionicons name="musical-notes" size={12} color="#a5b4fc" />
            <Text style={styles.categoryText}>Evento</Text>
          </View>
          
          <Text style={styles.title}>{event.title}</Text>
          
          <View style={styles.priceRow}>
            <Text style={styles.priceFrom}>Desde</Text>
            <Text style={styles.priceAmount}>${event.price}</Text>
            <Text style={styles.pricePer}>/ persona</Text>
          </View>
        </View>

        {/* Separador */}
        <View style={styles.divider} />

        {/* Info cards compactas */}
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <View style={[styles.infoIcon, { backgroundColor: 'rgba(99, 102, 241, 0.15)' }]}>
              <Ionicons name="calendar" size={20} color="#6366f1" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Fecha</Text>
              <Text style={styles.infoValue}>{formatDate(event.date)}</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <View style={[styles.infoIcon, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
              <Ionicons name="time" size={20} color="#f59e0b" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Hora</Text>
              <Text style={styles.infoValue}>{event.time} hrs</Text>
            </View>
          </View>

          <View style={[styles.infoItem, styles.infoItemFull]}>
            <View style={[styles.infoIcon, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
              <Ionicons name="location" size={20} color="#10b981" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Ubicación</Text>
              <Text style={styles.infoValue}>{event.location}</Text>
            </View>
            <TouchableOpacity style={styles.mapButton}>
              <Ionicons name="map-outline" size={16} color="#6366f1" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Separador */}
        <View style={styles.divider} />

        {/* Descripción */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acerca del evento</Text>
          <Text style={styles.description}>{event.description}</Text>
        </View>

        {/* Qué incluye */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Qué incluye</Text>
          <View style={styles.includesGrid}>
            {INCLUDES.map((item, index) => (
              <View key={index} style={styles.includeItem}>
                <View style={styles.includeIcon}>
                  <Ionicons name={item.icon} size={18} color="#10b981" />
                </View>
                <Text style={styles.includeText}>{item.text}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Disponibilidad */}
        <View style={styles.availabilityCard}>
          <View style={styles.availabilityLeft}>
            <Ionicons name="ticket" size={20} color="#10b981" />
            <View>
              <Text style={styles.availabilityTitle}>Entradas disponibles</Text>
              <Text style={styles.availabilityCount}>{event.availableTickets} restantes</Text>
            </View>
          </View>
          <View style={styles.availabilityBadge}>
            <Text style={styles.availabilityBadgeText}>Disponible</Text>
          </View>
        </View>

        {/* Espacio para el footer sticky */}
        <View style={{ height: 200 }} />
      </ScrollView>

      {/* Footer sticky */}
      <View style={styles.footer}>
        <View style={styles.footerTop}>
          <View style={styles.quantitySection}>
            <Text style={styles.quantityLabel}>Cantidad</Text>
            <View style={styles.quantityControls}>
              <TouchableOpacity
                style={[styles.quantityButton, quantity <= 1 && styles.quantityButtonDisabled]}
                onPress={() => handleQuantityChange(-1)}
                disabled={quantity <= 1}
                activeOpacity={0.7}
              >
                <Ionicons name="remove" size={18} color={quantity <= 1 ? '#475569' : '#fff'} />
              </TouchableOpacity>
              <Text style={styles.quantityValue}>{quantity}</Text>
              <TouchableOpacity
                style={[styles.quantityButton, quantity >= 10 && styles.quantityButtonDisabled]}
                onPress={() => handleQuantityChange(1)}
                disabled={quantity >= 10}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={18} color={quantity >= 10 ? '#475569' : '#fff'} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.totalSection}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>${totalPrice.toFixed(2)}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.purchaseButton, isLoading && styles.purchaseButtonDisabled]}
          onPress={handlePurchase}
          disabled={isLoading}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={['#6366f1', '#4f46e5']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.purchaseButtonGradient}
          >
            {isLoading ? (
              <Text style={styles.purchaseButtonText}>Procesando...</Text>
            ) : (
              <>
                <Ionicons name="flash" size={20} color="#fff" />
                <Text style={styles.purchaseButtonText}>Comprar entrada</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* PayPal Checkout Modal */}
      <PayPalCheckout
        visible={showPayPal}
        event={event}
        quantity={quantity}
        onClose={() => setShowPayPal(false)}
        onPaymentSuccess={handlePaymentSuccess}
        onPaymentError={handlePaymentError}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    color: '#94a3b8',
    fontSize: 18,
    marginTop: 16,
    marginBottom: 24,
  },
  errorButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  errorButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  heroContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: HERO_HEIGHT,
    zIndex: 1,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: HERO_HEIGHT,
  },
  heroButtons: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 54 : 44,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    backdropFilter: 'blur(10px)',
  },
  heroRightButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateBadge: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  dateBadgeDay: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
    lineHeight: 26,
  },
  dateBadgeMonth: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6366f1',
    letterSpacing: 0.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: HERO_HEIGHT - 30,
  },
  contentHeader: {
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginBottom: 14,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#a5b4fc',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
    lineHeight: 32,
    marginBottom: 14,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  priceFrom: {
    fontSize: 14,
    color: '#64748b',
  },
  priceAmount: {
    fontSize: 28,
    fontWeight: '800',
    color: '#10b981',
  },
  pricePer: {
    fontSize: 14,
    color: '#64748b',
  },
  divider: {
    height: 1,
    backgroundColor: '#1e293b',
    marginHorizontal: 20,
    marginVertical: 20,
  },
  infoGrid: {
    paddingHorizontal: 20,
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 14,
    gap: 14,
  },
  infoItemFull: {
    marginTop: 0,
  },
  infoIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  mapButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 14,
  },
  description: {
    fontSize: 15,
    color: '#94a3b8',
    lineHeight: 24,
  },
  includesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  includeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    gap: 8,
  },
  includeIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  includeText: {
    fontSize: 13,
    color: '#e2e8f0',
    fontWeight: '500',
  },
  availabilityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  availabilityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  availabilityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  availabilityCount: {
    fontSize: 12,
    color: '#10b981',
    marginTop: 2,
  },
  availabilityBadge: {
    backgroundColor: '#10b981',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  availabilityBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
  },
  footerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  quantitySection: {
    gap: 8,
  },
  quantityLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quantityButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonDisabled: {
    backgroundColor: '#334155',
  },
  quantityValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    minWidth: 28,
    textAlign: 'center',
  },
  totalSection: {
    alignItems: 'flex-end',
  },
  totalLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    marginBottom: 4,
  },
  totalValue: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
  },
  purchaseButton: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  purchaseButtonDisabled: {
    opacity: 0.7,
  },
  purchaseButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
  },
  purchaseButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
});
