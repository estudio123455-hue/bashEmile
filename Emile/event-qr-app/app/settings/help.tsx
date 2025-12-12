import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

const FAQ_DATA: FAQItem[] = [
  {
    id: '1',
    question: '¿Cómo compro entradas?',
    answer: 'Navega a la sección de eventos, selecciona el evento que te interesa, elige la cantidad de entradas y presiona "Comprar". Tu entrada con código QR estará disponible inmediatamente.',
  },
  {
    id: '2',
    question: '¿Cómo uso mi código QR?',
    answer: 'Presenta el código QR desde la app en la entrada del evento. El personal escaneará tu código para validar tu entrada. Asegúrate de tener brillo alto en tu pantalla.',
  },
  {
    id: '3',
    question: '¿Puedo transferir mis entradas?',
    answer: 'Actualmente las entradas son personales e intransferibles. Cada código QR está vinculado a tu cuenta.',
  },
  {
    id: '4',
    question: '¿Cómo solicito un reembolso?',
    answer: 'Los reembolsos dependen de la política de cada evento. Contacta con soporte dentro de las 48 horas posteriores a la compra para solicitar un reembolso.',
  },
  {
    id: '5',
    question: '¿Qué hago si mi QR no funciona?',
    answer: 'Asegúrate de tener conexión a internet y que el brillo de tu pantalla esté al máximo. Si el problema persiste, contacta con soporte.',
  },
];

export default function HelpScreen() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleContact = (type: 'email' | 'phone' | 'chat') => {
    switch (type) {
      case 'email':
        Linking.openURL('mailto:soporte@eventqr.com');
        break;
      case 'phone':
        Linking.openURL('tel:+1234567890');
        break;
      case 'chat':
        // Abrir chat en vivo
        break;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ayuda y Soporte</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Contacto rápido */}
        <Text style={styles.sectionTitle}>Contacto rápido</Text>
        <View style={styles.contactGrid}>
          <TouchableOpacity
            style={styles.contactCard}
            onPress={() => handleContact('email')}
          >
            <View style={[styles.contactIcon, { backgroundColor: 'rgba(99, 102, 241, 0.2)' }]}>
              <Ionicons name="mail" size={24} color="#6366f1" />
            </View>
            <Text style={styles.contactTitle}>Email</Text>
            <Text style={styles.contactSubtitle}>soporte@eventqr.com</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.contactCard}
            onPress={() => handleContact('chat')}
          >
            <View style={[styles.contactIcon, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
              <Ionicons name="chatbubbles" size={24} color="#10b981" />
            </View>
            <Text style={styles.contactTitle}>Chat en vivo</Text>
            <Text style={styles.contactSubtitle}>Respuesta inmediata</Text>
          </TouchableOpacity>
        </View>

        {/* FAQ */}
        <Text style={[styles.sectionTitle, { marginTop: 32 }]}>Preguntas frecuentes</Text>
        <View style={styles.faqList}>
          {FAQ_DATA.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.faqItem}
              onPress={() => toggleExpand(item.id)}
              activeOpacity={0.8}
            >
              <View style={styles.faqHeader}>
                <Text style={styles.faqQuestion}>{item.question}</Text>
                <Ionicons
                  name={expandedId === item.id ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color="#6366f1"
                />
              </View>
              {expandedId === item.id && (
                <Text style={styles.faqAnswer}>{item.answer}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Más ayuda */}
        <View style={styles.moreHelp}>
          <Text style={styles.moreHelpTitle}>¿Necesitas más ayuda?</Text>
          <Text style={styles.moreHelpText}>
            Nuestro equipo de soporte está disponible 24/7 para ayudarte
          </Text>
          <TouchableOpacity style={styles.supportButton}>
            <Ionicons name="headset" size={20} color="#fff" />
            <Text style={styles.supportButtonText}>Contactar soporte</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  contactGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  contactCard: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  contactIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  contactTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  contactSubtitle: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },
  faqList: {
    gap: 12,
  },
  faqItem: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    marginRight: 12,
  },
  faqAnswer: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 12,
    lineHeight: 22,
  },
  moreHelp: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginTop: 32,
    alignItems: 'center',
  },
  moreHelpTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  moreHelpText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 16,
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#6366f1',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  supportButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
