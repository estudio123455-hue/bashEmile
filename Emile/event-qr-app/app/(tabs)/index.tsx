import EventCard from '@/components/events/EventCard';
import { useAuth } from '@/context/AuthContext';
import { Event } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Platform,
    RefreshControl,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const API_BASE_URL = __DEV__
  ? 'http://localhost:3001/api'
  : 'https://backend-estudio123455-hues-projects.vercel.app/api';

const ITEM_HEIGHT = 320;

export default function EventsScreen() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchEvents = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/events`);
      const data = await response.json();
      
      // Handle both formats: data.events (from backend) or data directly
      const eventsArray = data.data?.events || data.data || [];
      
      if (data.success && Array.isArray(eventsArray)) {
        // Map backend event format to frontend Event type
        const mappedEvents = eventsArray.map((event: any) => ({
          id: event.id,
          title: event.title,
          description: event.description,
          date: event.date,
          time: event.time,
          location: event.location,
          price: event.ticketPrice || event.price,
          image: event.imageUrl || event.image,
          availableTickets: event.availableTickets || event.capacity,
          category: event.category,
        }));
        setEvents(mappedEvents);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchEvents();
  }, []);

  const handleEventPress = useCallback((eventId: string) => {
    router.push(`/event/${eventId}` as any);
  }, []);

  const renderEventCard = useCallback(
    ({ item }: { item: Event }) => (
      <EventCard event={item} onPress={() => handleEventPress(item.id)} />
    ),
    [handleEventPress]
  );

  const keyExtractor = useCallback((item: Event) => item.id, []);

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    }),
    []
  );

  const totalTickets = useMemo(() => 
    events.reduce((sum, e) => sum + (e.availableTickets || 0), 0), 
    [events]
  );

  const ListHeaderComponent = useMemo(
    () => (
      <View style={styles.headerContent}>
        <View style={styles.greetingRow}>
          <View style={styles.locationContainer}>
            <Ionicons name="location" size={14} color="#6366f1" />
            <Text style={styles.locationText}>Tu ubicación</Text>
          </View>
        </View>
        
        <Text style={styles.headerTitle}>Descubre Eventos</Text>
        
        <Text style={styles.headerSubtitle}>
          Encuentra eventos cerca de ti
        </Text>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{events.length}</Text>
            <Text style={styles.statLabel}>Eventos</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{totalTickets}</Text>
            <Text style={styles.statLabel}>Entradas</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {new Set(events.map(e => e.location?.split(',')[0])).size || 0}
            </Text>
            <Text style={styles.statLabel}>Ciudades</Text>
          </View>
        </View>

        {/* CTA - Publicar evento gratis */}
        <TouchableOpacity 
          style={styles.publishCta} 
          onPress={() => router.push('/create-event' as any)}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#6366f1', '#8b5cf6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.publishCtaGradient}
          >
            <View style={styles.publishCtaContent}>
              <View style={styles.publishCtaLeft}>
                <Ionicons name="add-circle" size={24} color="#fff" />
                <View>
                  <Text style={styles.publishCtaTitle}>Publica tu evento gratis</Text>
                  <Text style={styles.publishCtaSubtitle}>Solo pagas comisión si vendes</Text>
                </View>
              </View>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    ),
    [events, totalTickets]
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header con gradiente */}
      <LinearGradient
        colors={['#1e1b4b', '#0f172a', '#0f172a']}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Cargando eventos...</Text>
        </View>
      ) : events.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={64} color="#334155" />
          <Text style={styles.emptyTitle}>No hay eventos disponibles</Text>
          <Text style={styles.emptyText}>
            ¡Sé el primero en publicar un evento!
          </Text>
          
          {/* CTA - Publicar evento gratis */}
          <TouchableOpacity 
            style={styles.emptyPublishCta} 
            onPress={() => router.push('/create-event' as any)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#6366f1', '#8b5cf6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.emptyPublishCtaGradient}
            >
              <Ionicons name="add-circle" size={22} color="#fff" />
              <Text style={styles.emptyPublishCtaText}>Publica tu evento gratis</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <Text style={styles.emptyCtaSubtext}>
            Solo pagas comisión cuando vendes
          </Text>
        </View>
      ) : (
      <FlatList
        data={events}
        renderItem={renderEventCard}
        keyExtractor={keyExtractor}
        getItemLayout={getItemLayout}
        ListHeaderComponent={ListHeaderComponent}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={Platform.OS === 'android'}
        maxToRenderPerBatch={5}
        windowSize={5}
        initialNumToRender={3}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#6366f1"
            colors={['#6366f1']}
            progressBackgroundColor="#1e293b"
          />
        }
      />
      )}
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
    height: 280,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  headerContent: {
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingBottom: 24,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  locationText: {
    fontSize: 12,
    color: '#a5b4fc',
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#94a3b8',
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.1)',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(148, 163, 184, 0.2)',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingText: {
    color: '#64748b',
    marginTop: 12,
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 8,
  },
  emptyPublishCta: {
    marginTop: 24,
    borderRadius: 12,
    overflow: 'hidden',
  },
  emptyPublishCtaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  emptyPublishCtaText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  emptyCtaSubtext: {
    color: '#64748b',
    fontSize: 13,
    marginTop: 12,
  },
  publishCta: {
    marginTop: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  publishCtaGradient: {
    borderRadius: 16,
  },
  publishCtaContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  publishCtaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  publishCtaTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  publishCtaSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
});
