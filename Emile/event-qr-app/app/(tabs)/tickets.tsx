import { useTickets } from '@/context/TicketContext';
import { Ticket } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function TicketsScreen() {
  const { tickets } = useTickets();

  const activeTickets = tickets;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  const renderTicketCard = ({ item }: { item: Ticket }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/ticket/${item.id}`)}
      activeOpacity={0.8}
    >
      <View style={styles.cardLeft}>
        <View style={styles.qrPlaceholder}>
          <Ionicons name="qr-code" size={40} color="#6366f1" />
        </View>
      </View>
      <View style={styles.cardRight}>
        <Text style={styles.eventTitle} numberOfLines={2}>
          {item.eventTitle}
        </Text>
        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={14} color="#9ca3af" />
          <Text style={styles.infoText}>{formatDate(item.eventDate)}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="time-outline" size={14} color="#9ca3af" />
          <Text style={styles.infoText}>{item.eventTime}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={14} color="#9ca3af" />
          <Text style={styles.infoText} numberOfLines={1}>
            {item.eventLocation}
          </Text>
        </View>
        <View style={styles.ticketCount}>
          <Ionicons name="ticket" size={14} color="#10b981" />
          <Text style={styles.ticketCountText}>
            {item.quantity} {item.quantity === 1 ? 'entrada' : 'entradas'}
          </Text>
        </View>
      </View>
      <View style={styles.cardArrow}>
        <Ionicons name="chevron-forward" size={24} color="#6366f1" />
      </View>
    </TouchableOpacity>
  );

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="ticket-outline" size={80} color="#334155" />
      <Text style={styles.emptyTitle}>No tienes entradas</Text>
      <Text style={styles.emptyText}>
        Explora los eventos disponibles y compra tus entradas
      </Text>
      <TouchableOpacity
        style={styles.exploreButton}
        onPress={() => router.push('/(tabs)')}
      >
        <Text style={styles.exploreButtonText}>Ver Eventos</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mis Entradas</Text>
        <Text style={styles.headerSubtitle}>
          {activeTickets.length} {activeTickets.length === 1 ? 'entrada activa' : 'entradas activas'}
        </Text>
      </View>

      {activeTickets.length === 0 ? (
        <EmptyState />
      ) : (
        <FlatList
          data={activeTickets}
          renderItem={renderTicketCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
  },
  listContent: {
    padding: 20,
    paddingTop: 0,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    marginBottom: 16,
    flexDirection: 'row',
    overflow: 'hidden',
    padding: 16,
  },
  cardLeft: {
    marginRight: 16,
  },
  qrPlaceholder: {
    width: 70,
    height: 70,
    backgroundColor: '#0f172a',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardRight: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  infoText: {
    color: '#9ca3af',
    fontSize: 13,
    flex: 1,
  },
  ticketCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  ticketCountText: {
    color: '#10b981',
    fontSize: 13,
    fontWeight: '600',
  },
  cardArrow: {
    justifyContent: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 20,
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 8,
  },
  exploreButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 24,
  },
  exploreButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
