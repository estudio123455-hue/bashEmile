import { useTickets } from '@/context/TicketContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    Animated,
    Dimensions,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const QR_SIZE = Math.min(SCREEN_WIDTH - 120, 220);

type TicketStatus = 'valid' | 'used' | 'expired';

interface StatusConfig {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

const STATUS_CONFIG: Record<TicketStatus, StatusConfig> = {
  valid: {
    icon: 'checkmark-circle',
    label: 'Válido',
    color: '#10b981',
    bgColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  used: {
    icon: 'close-circle',
    label: 'Usado',
    color: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  expired: {
    icon: 'alert-circle',
    label: 'Expirado',
    color: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
};

export default function TicketDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getTicketById } = useTickets();
  const [dynamicToken, setDynamicToken] = useState<string>('');
  const [refreshCountdown, setRefreshCountdown] = useState(30);
  const [pulseAnim] = useState(new Animated.Value(1));

  const ticket = getTicketById(id || '');

  const generateDynamicToken = useCallback(() => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 10);
    return `${ticket?.id}-${timestamp}-${random}`;
  }, [ticket?.id]);

  const getTicketStatus = useCallback((): TicketStatus => {
    if (!ticket) return 'expired';
    
    const eventDate = new Date(ticket.eventDate);
    const now = new Date();
    
    if (eventDate < now) {
      return 'expired';
    }
    
    return 'valid';
  }, [ticket]);

  useEffect(() => {
    if (ticket) {
      setDynamicToken(generateDynamicToken());
    }
  }, [ticket, generateDynamicToken]);

  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshCountdown((prev) => {
        if (prev <= 1) {
          setDynamicToken(generateDynamicToken());
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [generateDynamicToken]);

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  if (!ticket) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Entrada</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="ticket-outline" size={80} color="#334155" />
          <Text style={styles.errorText}>Entrada no encontrada</Text>
          <TouchableOpacity style={styles.errorButton} onPress={() => router.back()}>
            <Text style={styles.errorButtonText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const status = getTicketStatus();
  const statusConfig = STATUS_CONFIG[status];

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

  const qrData = JSON.stringify({
    ticketId: ticket.id,
    token: dynamicToken,
    eventId: ticket.eventId,
    timestamp: Date.now(),
  });

  const { day, month } = formatShortDate(ticket.eventDate);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1e1b4b', '#0f172a']}
        style={styles.headerGradient}
      />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mi Entrada</Text>
        <TouchableOpacity style={styles.shareButton} activeOpacity={0.8}>
          <Ionicons name="share-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Badge */}
        <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor, borderColor: statusConfig.borderColor }]}>
          <Ionicons name={statusConfig.icon} size={18} color={statusConfig.color} />
          <Text style={[styles.statusText, { color: statusConfig.color }]}>{statusConfig.label}</Text>
        </View>

        {/* Ticket Card */}
        <View style={styles.ticketCard}>
          {/* Header con evento */}
          <View style={styles.ticketHeader}>
            <View style={styles.dateBadge}>
              <Text style={styles.dateBadgeDay}>{day}</Text>
              <Text style={styles.dateBadgeMonth}>{month}</Text>
            </View>
            <View style={styles.eventInfo}>
              <Text style={styles.eventTitle} numberOfLines={2}>{ticket.eventTitle}</Text>
              <View style={styles.quantityBadge}>
                <Ionicons name="ticket" size={14} color="#a5b4fc" />
                <Text style={styles.quantityText}>
                  {ticket.quantity} {ticket.quantity === 1 ? 'entrada' : 'entradas'}
                </Text>
              </View>
            </View>
          </View>

          {/* Divider tipo ticket */}
          <View style={styles.divider}>
            <View style={styles.dividerCircleLeft} />
            <View style={styles.dividerDashed} />
            <View style={styles.dividerCircleRight} />
          </View>

          {/* QR Section */}
          <View style={styles.qrSection}>
            <Animated.View style={[styles.qrWrapper, { transform: [{ scale: status === 'valid' ? pulseAnim : 1 }] }]}>
              <View style={[styles.qrContainer, status !== 'valid' && styles.qrContainerDisabled]}>
                <QRCode
                  value={qrData}
                  size={QR_SIZE}
                  backgroundColor="#fff"
                  color={status === 'valid' ? '#0f172a' : '#94a3b8'}
                />
                
                {/* Security watermark */}
                <View style={styles.securityMark}>
                  <Ionicons name="shield-checkmark" size={16} color="#6366f1" />
                </View>
              </View>
            </Animated.View>

            {/* Refresh indicator */}
            {status === 'valid' && (
              <View style={styles.refreshContainer}>
                <View style={styles.refreshIndicator}>
                  <Ionicons name="refresh" size={14} color="#64748b" />
                  <Text style={styles.refreshText}>
                    Actualiza en {refreshCountdown}s
                  </Text>
                </View>
                <View style={styles.refreshProgress}>
                  <View style={[styles.refreshProgressBar, { width: `${(refreshCountdown / 30) * 100}%` }]} />
                </View>
              </View>
            )}

            <Text style={styles.qrHint}>
              {status === 'valid' 
                ? 'Muestra este QR en la entrada del evento'
                : status === 'used'
                ? 'Esta entrada ya fue utilizada'
                : 'Esta entrada ha expirado'}
            </Text>
          </View>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerCircleLeft} />
            <View style={styles.dividerDashed} />
            <View style={styles.dividerCircleRight} />
          </View>

          {/* Event Details */}
          <View style={styles.detailsSection}>
            <View style={styles.detailRow}>
              <View style={[styles.detailIcon, { backgroundColor: 'rgba(99, 102, 241, 0.15)' }]}>
                <Ionicons name="calendar" size={18} color="#6366f1" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Fecha</Text>
                <Text style={styles.detailValue}>{formatDate(ticket.eventDate)}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={[styles.detailIcon, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                <Ionicons name="time" size={18} color="#f59e0b" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Hora</Text>
                <Text style={styles.detailValue}>{ticket.eventTime} hrs</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={[styles.detailIcon, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                <Ionicons name="location" size={18} color="#10b981" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Ubicación</Text>
                <Text style={styles.detailValue}>{ticket.eventLocation}</Text>
              </View>
            </View>
          </View>

          {/* Ticket ID Footer */}
          <View style={styles.ticketIdSection}>
            <View style={styles.ticketIdRow}>
              <Text style={styles.ticketIdLabel}>ID de Entrada</Text>
              <Text style={styles.ticketIdValue}>{ticket.id}</Text>
            </View>
            <View style={styles.securityBadge}>
              <Ionicons name="lock-closed" size={12} color="#64748b" />
              <Text style={styles.securityText}>Código seguro</Text>
            </View>
          </View>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoIconContainer}>
            <Ionicons name="information-circle" size={24} color="#6366f1" />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Información importante</Text>
            <View style={styles.infoList}>
              <View style={styles.infoItem}>
                <View style={styles.infoBullet} />
                <Text style={styles.infoText}>Presenta este QR en la entrada</Text>
              </View>
              <View style={styles.infoItem}>
                <View style={styles.infoBullet} />
                <Text style={styles.infoText}>El código es único e intransferible</Text>
              </View>
              <View style={styles.infoItem}>
                <View style={styles.infoBullet} />
                <Text style={styles.infoText}>Llega 30 min antes del evento</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Bottom spacing */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 54 : 44,
    paddingBottom: 16,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
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
  scrollContent: {
    paddingHorizontal: 20,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 20,
  },
  statusText: {
    fontSize: 15,
    fontWeight: '700',
  },
  ticketCard: {
    backgroundColor: '#1e293b',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  ticketHeader: {
    flexDirection: 'row',
    padding: 20,
    gap: 16,
  },
  dateBadge: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
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
  eventInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
    lineHeight: 24,
  },
  quantityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  quantityText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#a5b4fc',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dividerCircleLeft: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#0f172a',
    marginLeft: -12,
  },
  dividerDashed: {
    flex: 1,
    height: 2,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#334155',
  },
  dividerCircleRight: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#0f172a',
    marginRight: -12,
  },
  qrSection: {
    padding: 24,
    alignItems: 'center',
  },
  qrWrapper: {
    marginBottom: 16,
  },
  qrContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 20,
    position: 'relative',
  },
  qrContainerDisabled: {
    opacity: 0.5,
  },
  securityMark: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 12,
    padding: 6,
  },
  refreshContainer: {
    alignItems: 'center',
    marginBottom: 12,
    width: '100%',
  },
  refreshIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  refreshText: {
    fontSize: 12,
    color: '#64748b',
  },
  refreshProgress: {
    width: '60%',
    height: 3,
    backgroundColor: '#334155',
    borderRadius: 2,
    overflow: 'hidden',
  },
  refreshProgressBar: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 2,
  },
  qrHint: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  detailsSection: {
    padding: 20,
    gap: 14,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  detailIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '600',
  },
  ticketIdSection: {
    padding: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ticketIdRow: {
    flex: 1,
  },
  ticketIdLabel: {
    fontSize: 10,
    color: '#64748b',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  ticketIdValue: {
    fontSize: 12,
    color: '#94a3b8',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(100, 116, 139, 0.2)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  securityText: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '500',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
    gap: 14,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#a5b4fc',
    marginBottom: 10,
  },
  infoList: {
    gap: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#6366f1',
  },
  infoText: {
    fontSize: 13,
    color: '#94a3b8',
    flex: 1,
  },
});
