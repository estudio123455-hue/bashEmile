import { useTickets } from '@/context/TicketContext';
import { Ticket } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    FlatList,
    StyleSheet,
    Text,
    View,
} from 'react-native';

export default function HistoryScreen() {
  const { tickets } = useTickets();

  const sortedTickets = [...tickets].sort((a, b) => 
    new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime()
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isPastEvent = (eventDate: string) => {
    return new Date(eventDate) < new Date();
  };

  const renderHistoryItem = ({ item }: { item: Ticket }) => {
    const past = isPastEvent(item.eventDate);
    
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.statusBadge, past ? styles.pastBadge : styles.activeBadge]}>
            <Text style={styles.statusText}>
              {past ? 'Finalizado' : 'Próximo'}
            </Text>
          </View>
          <Text style={styles.purchaseDate}>
            Comprado el {formatDate(item.purchaseDate)} a las {formatTime(item.purchaseDate)}
          </Text>
        </View>
        
        <Text style={styles.eventTitle}>{item.eventTitle}</Text>
        
        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={16} color="#9ca3af" />
            <Text style={styles.detailText}>{formatDate(item.eventDate)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={16} color="#9ca3af" />
            <Text style={styles.detailText} numberOfLines={1}>{item.eventLocation}</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.ticketInfo}>
            <Ionicons name="ticket-outline" size={16} color="#6366f1" />
            <Text style={styles.ticketInfoText}>
              {item.quantity} {item.quantity === 1 ? 'entrada' : 'entradas'}
            </Text>
          </View>
          <Text style={styles.totalPrice}>${item.totalPrice.toFixed(2)}</Text>
        </View>
      </View>
    );
  };

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="receipt-outline" size={80} color="#334155" />
      <Text style={styles.emptyTitle}>Sin historial</Text>
      <Text style={styles.emptyText}>
        Aquí aparecerán todas tus compras de entradas
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Historial</Text>
        <Text style={styles.headerSubtitle}>
          {tickets.length} {tickets.length === 1 ? 'compra realizada' : 'compras realizadas'}
        </Text>
      </View>

      {sortedTickets.length === 0 ? (
        <EmptyState />
      ) : (
        <FlatList
          data={sortedTickets}
          renderItem={renderHistoryItem}
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
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  activeBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  pastBadge: {
    backgroundColor: 'rgba(156, 163, 175, 0.2)',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  purchaseDate: {
    fontSize: 11,
    color: '#64748b',
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  detailsContainer: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    color: '#9ca3af',
    fontSize: 14,
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  ticketInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ticketInfoText: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '500',
  },
  totalPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10b981',
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
});
