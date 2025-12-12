import { Event } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { memo } from 'react';
import {
    Dimensions,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 40;

interface EventCardProps {
  event: Event;
  onPress: () => void;
}

const EventCard = memo(({ event, onPress }: EventCardProps) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleDateString('es-ES', { month: 'short' }).toUpperCase();
    return { day, month };
  };

  const formatFullDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  const { day, month } = formatDate(event.date);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.9}
    >
      {/* Imagen del evento */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: event.image }}
          style={styles.image}
          resizeMode="cover"
        />
        
        {/* Overlay gradiente */}
        <LinearGradient
          colors={['transparent', 'rgba(15, 23, 42, 0.8)']}
          style={styles.imageOverlay}
        />

        {/* Badge de fecha */}
        <View style={styles.dateBadge}>
          <Text style={styles.dateDay}>{day}</Text>
          <Text style={styles.dateMonth}>{month}</Text>
        </View>

        {/* Badge de precio */}
        <View style={styles.priceBadge}>
          <Text style={styles.priceText}>${event.price}</Text>
        </View>
      </View>

      {/* Contenido */}
      <View style={styles.content}>
        {/* Título */}
        <Text style={styles.title} numberOfLines={2}>
          {event.title}
        </Text>

        {/* Metadata */}
        <View style={styles.metaContainer}>
          <View style={styles.metaRow}>
            <Ionicons name="calendar-outline" size={14} color="#94a3b8" />
            <Text style={styles.metaText}>
              {formatFullDate(event.date)} • {event.time}
            </Text>
          </View>
          
          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={14} color="#94a3b8" />
            <Text style={styles.metaText} numberOfLines={1}>
              {event.location}
            </Text>
          </View>
        </View>

        {/* Footer con CTA */}
        <View style={styles.footer}>
          <View style={styles.availabilityContainer}>
            <View style={styles.availabilityDot} />
            <Text style={styles.availabilityText}>
              {event.availableTickets} disponibles
            </Text>
          </View>

          <TouchableOpacity
            style={styles.ctaButton}
            onPress={onPress}
            activeOpacity={0.8}
          >
            <Text style={styles.ctaText}>Ver evento</Text>
            <Ionicons name="arrow-forward" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
});

EventCard.displayName = 'EventCard';

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#1e293b',
    borderRadius: 20,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  imageContainer: {
    position: 'relative',
    height: 150,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  dateBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    minWidth: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  dateDay: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    lineHeight: 22,
  },
  dateMonth: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6366f1',
    letterSpacing: 0.5,
  },
  priceBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.95)',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  priceText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    lineHeight: 24,
    marginBottom: 12,
  },
  metaContainer: {
    gap: 8,
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    fontSize: 13,
    color: '#94a3b8',
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.15)',
  },
  availabilityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  availabilityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
  },
  availabilityText: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '500',
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#6366f1',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  ctaText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});

export default EventCard;
