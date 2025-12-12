import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function TermsScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Términos y Condiciones</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.lastUpdated}>Última actualización: Diciembre 2024</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Aceptación de términos</Text>
          <Text style={styles.sectionText}>
            Al acceder y utilizar la aplicación EventQR, aceptas estar sujeto a estos términos y condiciones de uso. Si no estás de acuerdo con alguna parte de estos términos, no podrás acceder al servicio.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Uso del servicio</Text>
          <Text style={styles.sectionText}>
            EventQR te permite descubrir eventos, comprar entradas y acceder a ellos mediante códigos QR. Te comprometes a:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>• Proporcionar información veraz y actualizada</Text>
            <Text style={styles.bulletItem}>• Mantener la seguridad de tu cuenta</Text>
            <Text style={styles.bulletItem}>• No compartir tus códigos QR con terceros</Text>
            <Text style={styles.bulletItem}>• Usar el servicio de manera legal y ética</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Compra de entradas</Text>
          <Text style={styles.sectionText}>
            Las compras realizadas a través de EventQR son finales. Los reembolsos están sujetos a la política de cada organizador de eventos. EventQR actúa como intermediario y no es responsable de la cancelación o modificación de eventos.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Códigos QR</Text>
          <Text style={styles.sectionText}>
            Cada código QR es único e intransferible. La duplicación o distribución no autorizada de códigos QR está prohibida y puede resultar en la cancelación de tu entrada sin derecho a reembolso.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Privacidad</Text>
          <Text style={styles.sectionText}>
            Tu privacidad es importante para nosotros. Consulta nuestra Política de Privacidad para entender cómo recopilamos, usamos y protegemos tu información personal.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Propiedad intelectual</Text>
          <Text style={styles.sectionText}>
            Todo el contenido de EventQR, incluyendo diseño, logos, textos e imágenes, está protegido por derechos de autor y otras leyes de propiedad intelectual.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Limitación de responsabilidad</Text>
          <Text style={styles.sectionText}>
            EventQR no será responsable por daños indirectos, incidentales o consecuentes que resulten del uso o la imposibilidad de usar el servicio.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Modificaciones</Text>
          <Text style={styles.sectionText}>
            Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios entrarán en vigor inmediatamente después de su publicación en la aplicación.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. Contacto</Text>
          <Text style={styles.sectionText}>
            Si tienes preguntas sobre estos términos, contáctanos en:
          </Text>
          <Text style={styles.contactEmail}>legal@eventqr.com</Text>
        </View>

        <View style={styles.acceptSection}>
          <Ionicons name="checkmark-circle" size={24} color="#10b981" />
          <Text style={styles.acceptText}>
            Al usar EventQR, confirmas que has leído y aceptado estos términos y condiciones.
          </Text>
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  lastUpdated: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 14,
    color: '#9ca3af',
    lineHeight: 22,
  },
  bulletList: {
    marginTop: 12,
    gap: 8,
  },
  bulletItem: {
    fontSize: 14,
    color: '#9ca3af',
    lineHeight: 22,
    paddingLeft: 8,
  },
  contactEmail: {
    fontSize: 14,
    color: '#6366f1',
    marginTop: 8,
    fontWeight: '500',
  },
  acceptSection: {
    flexDirection: 'row',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    gap: 12,
    alignItems: 'flex-start',
  },
  acceptText: {
    flex: 1,
    fontSize: 13,
    color: '#10b981',
    lineHeight: 20,
  },
});
