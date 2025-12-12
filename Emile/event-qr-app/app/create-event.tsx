import { auth } from '@/config/firebase';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const API_BASE_URL = __DEV__
  ? 'http://localhost:3001/api'
  : 'https://backend-estudio123455-hues-projects.vercel.app/api';

const CATEGORIES = [
  { value: 'music', label: '🎵 Música' },
  { value: 'sports', label: '⚽ Deportes' },
  { value: 'conference', label: '🎤 Conferencia' },
  { value: 'theater', label: '🎭 Teatro' },
  { value: 'festival', label: '🎪 Festival' },
  { value: 'other', label: '📌 Otro' },
];

export default function CreateEventScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('music');
  const [ticketPrice, setTicketPrice] = useState('');
  const [capacity, setCapacity] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const pickImage = () => {
    // Simple URL input for web compatibility
    const url = prompt('Ingresa la URL de la imagen del evento:');
    if (url) {
      setImageUrl(url);
    }
  };

  const validateForm = () => {
    if (!title.trim() || title.length < 3) {
      Alert.alert('Error', 'El título debe tener al menos 3 caracteres');
      return false;
    }
    if (!description.trim() || description.length < 10) {
      Alert.alert('Error', 'La descripción debe tener al menos 10 caracteres');
      return false;
    }
    if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      Alert.alert('Error', 'Fecha inválida. Usa formato YYYY-MM-DD');
      return false;
    }
    if (!time.match(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)) {
      Alert.alert('Error', 'Hora inválida. Usa formato HH:MM');
      return false;
    }
    if (!location.trim() || location.length < 3) {
      Alert.alert('Error', 'La ubicación debe tener al menos 3 caracteres');
      return false;
    }
    if (!ticketPrice || parseFloat(ticketPrice) < 0) {
      Alert.alert('Error', 'El precio debe ser mayor o igual a 0');
      return false;
    }
    if (!capacity || parseInt(capacity) < 1) {
      Alert.alert('Error', 'La capacidad debe ser al menos 1');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    if (!auth.currentUser) {
      Alert.alert('Error', 'Debes iniciar sesión para publicar eventos');
      return;
    }

    setIsLoading(true);

    try {
      const idToken = await auth.currentUser.getIdToken();

      const response = await fetch(`${API_BASE_URL}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          date,
          time,
          location: location.trim(),
          category,
          ticketPrice: parseFloat(ticketPrice),
          capacity: parseInt(capacity),
          imageUrl: imageUrl || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        Alert.alert(
          '¡Evento publicado!',
          'Tu evento ya está visible en el marketplace. Solo pagarás comisión cuando vendas tickets.',
          [{ text: 'Ver eventos', onPress: () => router.replace('/(tabs)') }]
        );
      } else {
        throw new Error(data.error || 'Error al publicar evento');
      }
    } catch (error: any) {
      console.error('Error creating event:', error);
      Alert.alert('Error', error.message || 'No se pudo publicar el evento');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Publicar Evento</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Banner informativo */}
          <View style={styles.infoBanner}>
            <Ionicons name="gift-outline" size={24} color="#10b981" />
            <View style={styles.infoBannerText}>
              <Text style={styles.infoBannerTitle}>¡Publicar es GRATIS!</Text>
              <Text style={styles.infoBannerSubtitle}>
                Solo cobramos 8-10% de comisión por cada boleta vendida
              </Text>
            </View>
          </View>

          {/* Imagen */}
          <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
            {imageUrl ? (
              <Image source={{ uri: imageUrl }} style={styles.imagePreview} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="image-outline" size={40} color="#64748b" />
                <Text style={styles.imagePlaceholderText}>Agregar imagen</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Título */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Título del evento *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Concierto de Rock"
              placeholderTextColor="#64748b"
              value={title}
              onChangeText={setTitle}
              maxLength={100}
            />
          </View>

          {/* Descripción */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Descripción *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe tu evento..."
              placeholderTextColor="#64748b"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              maxLength={2000}
            />
          </View>

          {/* Fecha y Hora */}
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Fecha *</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#64748b"
                value={date}
                onChangeText={setDate}
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Hora *</Text>
              <TextInput
                style={styles.input}
                placeholder="HH:MM"
                placeholderTextColor="#64748b"
                value={time}
                onChangeText={setTime}
              />
            </View>
          </View>

          {/* Ubicación */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Ubicación *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Teatro Nacional, Bogotá"
              placeholderTextColor="#64748b"
              value={location}
              onChangeText={setLocation}
              maxLength={200}
            />
          </View>

          {/* Categoría */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Categoría *</Text>
            <View style={styles.categoryContainer}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.value}
                  style={[
                    styles.categoryOption,
                    category === cat.value && styles.categoryOptionSelected
                  ]}
                  onPress={() => setCategory(cat.value)}
                >
                  <Text style={[
                    styles.categoryOptionText,
                    category === cat.value && styles.categoryOptionTextSelected
                  ]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Precio y Capacidad */}
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Precio (COP) *</Text>
              <TextInput
                style={styles.input}
                placeholder="50000"
                placeholderTextColor="#64748b"
                value={ticketPrice}
                onChangeText={setTicketPrice}
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Capacidad *</Text>
              <TextInput
                style={styles.input}
                placeholder="100"
                placeholderTextColor="#64748b"
                value={capacity}
                onChangeText={setCapacity}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Resumen de comisión */}
          {ticketPrice && parseFloat(ticketPrice) > 0 && (
            <View style={styles.commissionBox}>
              <Text style={styles.commissionTitle}>Resumen por boleta</Text>
              <View style={styles.commissionRow}>
                <Text style={styles.commissionLabel}>Precio boleta:</Text>
                <Text style={styles.commissionValue}>
                  ${parseFloat(ticketPrice).toLocaleString()} COP
                </Text>
              </View>
              <View style={styles.commissionRow}>
                <Text style={styles.commissionLabel}>Comisión EventQR (~8%):</Text>
                <Text style={styles.commissionValueRed}>
                  -${(parseFloat(ticketPrice) * 0.08).toLocaleString()} COP
                </Text>
              </View>
              <View style={[styles.commissionRow, styles.commissionTotal]}>
                <Text style={styles.commissionLabelBold}>Tú recibes:</Text>
                <Text style={styles.commissionValueGreen}>
                  ${(parseFloat(ticketPrice) * 0.92).toLocaleString()} COP
                </Text>
              </View>
            </View>
          )}

          {/* Botón publicar */}
          <TouchableOpacity
            style={[styles.submitBtn, isLoading && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="rocket-outline" size={20} color="#fff" />
                <Text style={styles.submitBtnText}>Publicar evento gratis</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            Al publicar, aceptas los términos de servicio de EventQR
          </Text>

          <View style={{ height: 40 }} />
        </ScrollView>
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
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    gap: 12,
  },
  infoBannerText: { flex: 1 },
  infoBannerTitle: { color: '#10b981', fontSize: 15, fontWeight: '700' },
  infoBannerSubtitle: { color: '#6ee7b7', fontSize: 13, marginTop: 2 },
  imagePicker: {
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
    backgroundColor: '#1e293b',
  },
  imagePreview: { width: '100%', height: '100%' },
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#334155',
    borderStyle: 'dashed',
    borderRadius: 12,
  },
  imagePlaceholderText: { color: '#64748b', marginTop: 8 },
  inputGroup: { marginBottom: 16 },
  label: { color: '#94a3b8', fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#334155',
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  row: { flexDirection: 'row' },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryOption: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  categoryOptionSelected: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  categoryOptionText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  categoryOptionTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  commissionBox: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  commissionTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
  },
  commissionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  commissionTotal: {
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 8,
    marginTop: 4,
  },
  commissionLabel: { color: '#94a3b8', fontSize: 14 },
  commissionLabelBold: { color: '#fff', fontSize: 14, fontWeight: '700' },
  commissionValue: { color: '#fff', fontSize: 14 },
  commissionValueRed: { color: '#f87171', fontSize: 14 },
  commissionValueGreen: { color: '#10b981', fontSize: 14, fontWeight: '700' },
  submitBtn: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  disclaimer: {
    color: '#64748b',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
  },
});
