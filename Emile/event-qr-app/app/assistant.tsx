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
  '¿Cómo publico un evento?',
  'Mi QR no funciona',
  '¿Cómo pido reembolso?',
];

// Knowledge base for the assistant - Commission-based model
const getAssistantResponse = (question: string): string => {
  const q = question.toLowerCase().trim();

  // Compra de tickets
  if (q.includes('comprar') || q.includes('compra') || (q.includes('ticket') && (q.includes('cómo') || q.includes('como'))) || q.includes('entrada')) {
    return `🎫 **Comprar entradas es muy fácil:**

1. Explora los eventos en la página principal
2. Selecciona el evento que te interesa
3. Elige la cantidad de entradas (máximo 10)
4. Pulsa "Comprar con PayPal"
5. Completa el pago en PayPal
6. ¡Listo! Tu código QR aparecerá en "Mis Tickets"

El pago es 100% seguro a través de PayPal. Puedes pagar con tu cuenta PayPal o con tarjeta de crédito/débito.`;
  }

  // QR / Escaneo / Validación
  if (q.includes('qr') || q.includes('escaneo') || q.includes('escanear') || q.includes('validar') || q.includes('código')) {
    return `📱 **Sobre los códigos QR:**

• Cada compra genera un **código QR único**
• El QR se usa **una sola vez** para ingresar al evento
• Una vez escaneado, queda marcado como "usado"
• Si el QR ya fue usado, **no vuelve a ser válido**

**Para mostrar tu QR:**
1. Ve a "Mis Tickets" en la app
2. Selecciona el ticket del evento
3. Muestra el QR al organizador en la entrada

⚠️ **Importante:** No compartas tu QR con nadie. Si alguien más lo usa antes que tú, no podrás entrar.`;
  }

  // QR no funciona / Ticket no válido
  if (q.includes('no funciona') || q.includes('no válido') || q.includes('invalido') || q.includes('no valido') || q.includes('usado') || q.includes('rechazado')) {
    return `⚠️ **¿Tu QR no funciona?**

**Posibles causas:**
• **Ya fue escaneado:** El QR solo se puede usar una vez. Si alguien más lo usó, ya no es válido.
• **Brillo bajo:** Sube el brillo de tu pantalla al máximo.
• **Pantalla sucia:** Limpia la pantalla para que el escáner lo lea bien.
• **Evento incorrecto:** Verifica que el ticket sea para este evento y fecha.

**Si crees que es un error:**
El organizador del evento puede verificar el estado de tu ticket. Contacta directamente con él.

Si necesitas más ayuda, describe exactamente qué mensaje aparece.`;
  }

  // Publicar evento - GRATIS para todos
  if (q.includes('publicar') || q.includes('crear evento') || q.includes('mi evento') || q.includes('organizar') || q.includes('vender') || q.includes('gratis')) {
    return `🎉 **¡Publicar eventos es GRATIS!**

En EventQR puedes publicar tus eventos sin costo alguno.

**¿Cómo funciona?**
1. Ve a la página principal
2. Pulsa "Publicar evento gratis"
3. Completa los datos: título, fecha, lugar, precio
4. Sube una imagen atractiva
5. ¡Publica y empieza a vender!

**Modelo de comisión:**
Solo cobramos una pequeña comisión (8-10%) por cada boleta vendida.
Sin costos fijos. Sin riesgos.

Tus eventos aparecerán en el marketplace para todos los usuarios.`;
  }

  // Comisión
  if (q.includes('comisión') || q.includes('comision') || q.includes('costo') || q.includes('cobran') || q.includes('precio')) {
    return `💰 **Modelo de comisión EventQR:**

**Publicar eventos:** GRATIS
**Comisión por boleta vendida:** 8-10%

**Ejemplo:**
Si vendes una boleta de $50.000 COP:
• Precio boleta: $50.000
• Comisión EventQR (~8%): $4.000
• Tú recibes: $46.000

**Ventajas:**
• Sin costos fijos
• Sin riesgos - solo pagas si vendes
• Transparente - el comprador ve el desglose

¡Empieza a vender sin inversión inicial!`;
  }

  // PayPal / Pagos
  if (q.includes('paypal') || q.includes('pago') || q.includes('pagar') || q.includes('tarjeta') || q.includes('cobrar')) {
    return `💳 **Pagos en EventQR:**

**Para comprar tickets:**
• Todos los pagos se procesan con PayPal
• Puedes pagar con cuenta PayPal o tarjeta
• El pago es seguro y encriptado
• Recibes confirmación inmediata

**Si tienes problemas:**
1. Verifica tu conexión a internet
2. Asegúrate de tener fondos disponibles
3. Intenta con otro método de pago en PayPal
4. Si el pago fue rechazado, contacta a soporte de PayPal

**Para organizadores:**
Los pagos de tickets se procesan a través de PayPal. Configura tu cuenta en el panel de organizador.`;
  }

  // Reembolso
  if (q.includes('reembolso') || q.includes('devolucion') || q.includes('devolución') || q.includes('cancelar') || q.includes('devolver')) {
    return `💰 **Política de reembolsos:**

**Importante:** Los reembolsos dependen del organizador del evento, no de EventQR.

**¿Cómo solicitar reembolso?**
1. Contacta directamente al organizador del evento
2. Explica el motivo de tu solicitud
3. El organizador decide si procede el reembolso

**Si el evento se cancela:**
El organizador debe procesar el reembolso a todos los compradores.

**Para disputas de pago:**
Puedes abrir un caso en PayPal si no recibes respuesta del organizador.

Si necesitas contactar al organizador y no sabes cómo, indícame el nombre del evento.`;
  }

  // Problemas de acceso / Login
  if (q.includes('acceso') || q.includes('login') || q.includes('iniciar sesión') || q.includes('contraseña') || q.includes('cuenta')) {
    return `🔐 **Problemas de acceso:**

**¿Olvidaste tu contraseña?**
En la pantalla de login, pulsa "¿Olvidaste tu contraseña?" y sigue las instrucciones.

**¿No puedes iniciar sesión?**
• Verifica que el email sea correcto
• Revisa tu conexión a internet
• Intenta cerrar y abrir la app

**¿No tienes cuenta?**
Regístrate gratis y obtén 10 días de trial Premium.

Si el problema persiste, describe qué error aparece.`;
  }

  // Problemas generales
  if (q.includes('problema') || q.includes('error') || q.includes('ayuda') || q.includes('falla')) {
    return `🔧 **¿Tienes un problema?**

**Problemas comunes:**
• **No carga la app:** Verifica tu conexión a internet
• **Pago fallido:** Intenta de nuevo o usa otro método en PayPal
• **QR no funciona:** Sube el brillo al máximo y limpia la pantalla
• **No veo mi ticket:** Revisa en "Mis Tickets" después del pago
• **No puedo publicar:** Verifica tu conexión e intenta de nuevo

**¿Necesitas ayuda humana?**
Si el problema persiste y no puedo resolverlo, te recomiendo contactar al soporte técnico describiendo el error exacto que aparece.

Describe qué ocurre y te ayudo.`;
  }

  // Saludo
  if (q.includes('hola') || q.includes('buenas') || q.includes('hey') || q === 'hi' || q.includes('buenos')) {
    return `👋 ¡Hola! Soy el asistente de Ayuda y Soporte de EventQR.

Puedo ayudarte con:
• Compra de entradas
• Publicar eventos (¡GRATIS!)
• Uso del código QR
• Tickets no válidos
• Pagos con PayPal
• Reembolsos
• Comisiones

¿En qué puedo ayudarte hoy?`;
  }

  // Gracias
  if (q.includes('gracias') || q.includes('thanks') || q.includes('genial') || q.includes('perfecto')) {
    return `😊 ¡De nada! Me alegra poder ayudarte.

¿Hay algo más en lo que pueda asistirte?`;
  }

  // Despedida
  if (q.includes('adios') || q.includes('adiós') || q.includes('chao') || q.includes('bye')) {
    return `👋 ¡Hasta luego! Que disfrutes tus eventos.

Si necesitas ayuda en el futuro, aquí estaré.`;
  }

  // Default
  return `🤔 No estoy seguro de entender tu pregunta.

Puedo ayudarte con:
• **Compra de entradas** - Cómo comprar tickets
• **Código QR** - Cómo funciona y qué hacer si no es válido
• **Publicar eventos** - ¡GRATIS! Solo comisión por venta
• **Comisiones** - Modelo de monetización
• **Pagos** - PayPal y problemas comunes
• **Reembolsos** - Política y cómo solicitarlos

Intenta reformular tu pregunta o elige uno de estos temas.

Si tu duda requiere atención personalizada, te recomiendo contactar al soporte técnico.`;
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

    const response = getAssistantResponse(text);
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
