import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

const QUICK_QUESTIONS = [
  '¿Cómo compro tickets?',
  '¿Cómo funciona el QR?',
  '¿Qué es Premium?',
  '¿Cómo publico un evento?',
];

// Knowledge base for the assistant
const getAssistantResponse = (question: string, isPremium: boolean): string => {
  const q = question.toLowerCase().trim();

  // Compra de tickets
  if (q.includes('comprar') || q.includes('compra') || q.includes('ticket') && (q.includes('cómo') || q.includes('como'))) {
    return `🎫 **Comprar tickets es muy fácil:**

1. Explora los eventos en la página principal
2. Selecciona el evento que te interesa
3. Elige la cantidad de entradas
4. Pulsa "Comprar con PayPal"
5. Completa el pago en PayPal
6. ¡Listo! Tu ticket QR aparecerá en "Mis Tickets"

El pago es 100% seguro a través de PayPal.`;
  }

  // QR / Escaneo
  if (q.includes('qr') || q.includes('escaneo') || q.includes('escanear') || q.includes('entrada') || q.includes('validar')) {
    return `📱 **Sobre los tickets QR:**

• Cada ticket genera un código QR único
• El QR se valida **una sola vez** en el ingreso
• Muestra tu QR desde "Mis Tickets" en la app
• El organizador lo escanea para validar tu entrada
• Una vez escaneado, el ticket queda marcado como usado

⚠️ No compartas tu QR con nadie para evitar problemas.`;
  }

  // Premium
  if (q.includes('premium') || q.includes('plan') || q.includes('suscripción') || q.includes('suscripcion')) {
    if (isPremium) {
      return `💎 **¡Ya eres Premium!**

Tienes acceso a:
• Publicar eventos ilimitados
• Vender tickets online
• Validar entradas con QR
• Ver estadísticas de ventas

Ve a tu Perfil → "Mi Premium" para más detalles.`;
    }
    return `💎 **Plan Premium de EventQR:**

El plan Premium te permite:
• **Publicar eventos** en el marketplace
• **Vender tickets** y recibir pagos
• **Validar entradas** con escáner QR
• **Ver estadísticas** en tiempo real

**Precio:** Pago único de $12.99 USD (acceso de por vida)

Para activarlo: Perfil → "Hazte Premium" → Pagar con PayPal`;
  }

  // Publicar evento
  if (q.includes('publicar') || q.includes('crear evento') || q.includes('mi evento') || q.includes('organizar')) {
    if (isPremium) {
      return `🎉 **Como usuario Premium puedes publicar eventos:**

1. Ve a la página principal
2. Pulsa el botón "Publicar evento"
3. Completa los datos: título, fecha, lugar, precio
4. Sube una imagen atractiva
5. Publica y empieza a vender tickets

Tus eventos aparecerán en el marketplace para todos los usuarios.`;
    }
    return `📢 **Para publicar eventos necesitas ser Premium**

El plan Premium te permite:
• Publicar eventos ilimitados
• Vender tickets online
• Validar entradas con QR

**¿Cómo activarlo?**
1. Ve a tu Perfil
2. Pulsa "Hazte Premium"
3. Paga $12.99 USD con PayPal
4. ¡Listo! Ya puedes publicar eventos`;
  }

  // PayPal / Pagos
  if (q.includes('paypal') || q.includes('pago') || q.includes('pagar') || q.includes('tarjeta')) {
    return `💳 **Pagos en EventQR:**

• Todos los pagos se procesan con **PayPal**
• Puedes pagar con tu cuenta PayPal o tarjeta
• El pago es seguro y encriptado
• Recibes confirmación inmediata

Si tienes problemas con un pago:
1. Verifica tu conexión a internet
2. Asegúrate de tener fondos disponibles
3. Intenta con otro método de pago en PayPal

¿Pago rechazado? Contacta a soporte de PayPal.`;
  }

  // Reembolso
  if (q.includes('reembolso') || q.includes('devolucion') || q.includes('devolución') || q.includes('cancelar compra')) {
    return `💰 **Política de reembolsos:**

• Los reembolsos dependen del organizador del evento
• Contacta directamente al organizador para solicitar devolución
• Si el evento se cancela, el organizador debe procesar el reembolso

Para disputas de pago, puedes abrir un caso en PayPal.`;
  }

  // Problemas / Ayuda
  if (q.includes('problema') || q.includes('error') || q.includes('no funciona') || q.includes('ayuda')) {
    return `🔧 **¿Tienes un problema?**

**Problemas comunes:**
• **No carga la app:** Verifica tu conexión a internet
• **Pago fallido:** Intenta de nuevo o usa otro método en PayPal
• **QR no funciona:** Asegúrate de que el brillo esté al máximo
• **No veo mi ticket:** Revisa en "Mis Tickets" después del pago

Si el problema persiste, describe qué ocurre y te ayudo.`;
  }

  // Saludo
  if (q.includes('hola') || q.includes('buenas') || q.includes('hey') || q === 'hi') {
    return `👋 ¡Hola! Soy el asistente de EventQR.

Puedo ayudarte con:
• Compra de tickets
• Tickets QR y escaneo
• Plan Premium
• Publicación de eventos
• Problemas con pagos

¿En qué puedo ayudarte hoy?`;
  }

  // Gracias
  if (q.includes('gracias') || q.includes('thanks')) {
    return `😊 ¡De nada! Estoy aquí para ayudarte.

¿Hay algo más en lo que pueda asistirte?`;
  }

  // Default
  return `🤔 No estoy seguro de entender tu pregunta.

Puedo ayudarte con:
• **Compra de tickets** - Cómo comprar entradas
• **Tickets QR** - Cómo funcionan y se validan
• **Plan Premium** - Beneficios y cómo activarlo
• **Publicar eventos** - Requisitos y pasos
• **Pagos** - PayPal y problemas comunes

Intenta reformular tu pregunta o elige uno de estos temas.`;
};

export default function AssistantScreen() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: `👋 ¡Hola${user?.name ? ` ${user.name.split(' ')[0]}` : ''}! Soy el asistente de EventQR.\n\n¿En qué puedo ayudarte hoy?`,
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: text.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    const response = getAssistantResponse(text, user?.isPremium || false);
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      text: response,
      isUser: false,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setInputText('');

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[styles.messageBubble, item.isUser ? styles.userBubble : styles.assistantBubble]}>
      {!item.isUser && (
        <View style={styles.assistantIcon}>
          <Ionicons name="chatbubble-ellipses" size={16} color="#6366f1" />
        </View>
      )}
      <View style={[styles.messageContent, item.isUser ? styles.userContent : styles.assistantContent]}>
        <Text style={[styles.messageText, item.isUser && styles.userText]}>{item.text}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Asistente EventQR</Text>
          <View style={styles.onlineIndicator}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineText}>En línea</Text>
          </View>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
        />

        <View style={styles.quickQuestions}>
          <FlatList
            horizontal
            data={QUICK_QUESTIONS}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.quickBtn} onPress={() => sendMessage(item)}>
                <Text style={styles.quickBtnText}>{item}</Text>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickList}
          />
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Escribe tu pregunta..."
            placeholderTextColor="#64748b"
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={() => sendMessage(inputText)}
            returnKeyType="send"
          />
          <TouchableOpacity
            style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
            onPress={() => sendMessage(inputText)}
            disabled={!inputText.trim()}
          >
            <Ionicons name="send" size={20} color={inputText.trim() ? '#fff' : '#64748b'} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: { alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  onlineIndicator: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10b981' },
  onlineText: { color: '#10b981', fontSize: 12 },
  chatContainer: { flex: 1 },
  messagesList: { padding: 16, paddingBottom: 8 },
  messageBubble: { flexDirection: 'row', marginBottom: 12, maxWidth: '85%' },
  userBubble: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
  assistantBubble: { alignSelf: 'flex-start' },
  assistantIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  messageContent: { borderRadius: 16, padding: 12, maxWidth: '100%' },
  userContent: { backgroundColor: '#6366f1' },
  assistantContent: { backgroundColor: '#1e293b' },
  messageText: { color: '#e2e8f0', fontSize: 15, lineHeight: 22 },
  userText: { color: '#fff' },
  quickQuestions: { borderTopWidth: 1, borderTopColor: '#1e293b', paddingVertical: 8 },
  quickList: { paddingHorizontal: 12 },
  quickBtn: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#334155',
  },
  quickBtnText: { color: '#94a3b8', fontSize: 13 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 15,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#1e293b' },
});
