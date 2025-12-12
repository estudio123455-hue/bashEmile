import { auth } from '@/config/firebase';
import { useAuth } from '@/context/AuthContext';
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
  { id: 'music', label: 'Música', icon: 'musical-notes' },
  { id: 'sports', label: 'Deportes', icon: 'football' },
  { id: 'conference', label: 'Conferencia', icon: 'mic' },
  { id: 'theater', label: 'Teatro', icon: 'film' },
  { id: 'festival', label: 'Festival', icon: 'sparkles' },
  { id: 'other', label: 'Otro', icon: 'ellipsis-horizontal' },
];

const DEFAULT_IMAGES = [
  'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800',
  'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800',
  'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800',
];

export default function CreateEventScreen() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('');
  const [ticketPrice, setTicketPrice] = useState('');
  const [capacity, setCapacity] = useState('');
  const [imageUrl, setImageUrl] = useState(DEFAULT_IMAGES[0]);

  const validateForm = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'El nombre del evento es obligatorio');
      return false;
    }
    if (title.length < 3) {
      Alert.alert('Error', 'El nombre debe tener al menos 3 caracteres');
      return false;
    }
    if (!description.trim() || description.length < 10) {
      Alert.alert('Error', 'La descripción debe tener al menos 10 caracteres');
      return false;
    }
    if (!date) {
      Alert.alert('Error', 'La fecha es obligatoria');
      return false;
    }
    if (!time) {
      Alert.alert('Error', 'La hora es obligatoria');
      return false;
    }
    if (!location.trim()) {
      Alert.alert('Error', 'La ubicación es obligatoria');
      return false;
    }
    if (!category) {
      Alert.alert('Error', 'Selecciona una categoría');
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

  const handleCreateEvent = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) {
        Alert.alert('Error', 'Debes iniciar sesión');
        return;
      }

      const idToken = await firebaseUser.getIdToken();

      const response = await fetch(`${API_BASE_URL}/organizer/events`, {
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
          imageUrl,
        }),
      });

      const data = await response.json();

      if (data.success) {
        Alert.alert(
          '¡Evento Creado!',
          'Tu evento ha sido publicado exitosamente.',
          [
            {
              text: 'Ver Mis Eventos',
              onPress: () => router.replace('/(organizer)/my-events' as any),
            },
            {
              text: 'Crear Otro',
              onPress: () => resetForm(),
            },
          ]
        );
      } else {
        Alert.alert('Error', data.error || 'No se pudo crear el evento');
      }
    } catch (error) {
      console.error('Error creating event:', error);
      Alert.alert('Error', 'Ocurrió un error al crear el evento');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDate('');
    setTime('');
    setLocation('');
    setCategory('');
    setTicketPrice('');
    setCapacity('');
    setImageUrl(DEFAULT_IMAGES[0]);
    setShowPreview(false);
  };

  const formatPrice = (price: string) => {
    const num = parseFloat(price);
    if (isNaN(num)) return '$0 COP';
    return `$${num.toLocaleString('es-CO')} COP`;
  };

  if (showPreview) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.previewHeader}>
          <TouchableOpacity onPress={() => setShowPreview(false)}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.previewTitle}>Vista Previa</Text>
          <View style={{ width: 24 }} />
        </View>
        
        <ScrollView>
          <Image source={{ uri: imageUrl }} style={styles.previewImage} />
          <View style={styles.previewContent}>
            <View style={styles.previewBadge}>
              <Text style={styles.previewBadgeText}>
                {CATEGORIES.find(c => c.id === category)?.label || category}
              </Text>
            </View>
            <Text style={styles.previewEventTitle}>{title}</Text>
            
            <View style={styles.previewInfo}>
              <View style={styles.previewInfoRow}>
                <Ionicons name="calendar-outline" size={18} color="#6366f1" />
                <Text style={styles.previewInfoText}>{date} • {time}</Text>
              </View>
              <View style={styles.previewInfoRow}>
                <Ionicons name="location-outline" size={18} color="#6366f1" />
                <Text style={styles.previewInfoText}>{location}</Text>
              </View>
              <View style={styles.previewInfoRow}>
                <Ionicons name="people-outline" size={18} color="#6366f1" />
                <Text style={styles.previewInfoText}>{capacity} entradas disponibles</Text>
              </View>
            </View>

            <Text style={styles.previewDescTitle}>Descripción</Text>
            <Text style={styles.previewDesc}>{description}</Text>

            <View style={styles.previewPriceBox}>
              <Text style={styles.previewPriceLabel}>Precio por entrada</Text>
              <Text style={styles.previewPrice}>{formatPrice(ticketPrice)}</Text>
            </View>
          </View>
        </ScrollView>

        <View style={styles.previewFooter}>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => setShowPreview(false)}
          >
            <Text style={styles.editButtonText}>Editar</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.publishButton, isLoading && styles.buttonDisabled]}
            onPress={handleCreateEvent}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="rocket" size={20} color="#fff" />
                <Text style={styles.publishButtonText}>Publicar Evento</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Crear Evento</Text>
            <Text style={styles.headerSubtitle}>
              Completa la información de tu evento
            </Text>
          </View>

          <View style={styles.form}>
            {/* Event Image */}
            <Text style={styles.label}>Imagen del Evento</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.imageSelector}
            >
              {DEFAULT_IMAGES.map((img, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => setImageUrl(img)}
                  style={[
                    styles.imageOption,
                    imageUrl === img && styles.imageOptionSelected,
                  ]}
                >
                  <Image source={{ uri: img }} style={styles.imageThumb} />
                  {imageUrl === img && (
                    <View style={styles.imageCheck}>
                      <Ionicons name="checkmark" size={16} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Title */}
            <Text style={styles.label}>Nombre del Evento *</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="text-outline" size={20} color="#64748b" />
              <TextInput
                style={styles.input}
                placeholder="Ej: Concierto de Rock"
                placeholderTextColor="#64748b"
                value={title}
                onChangeText={setTitle}
                maxLength={100}
              />
            </View>

            {/* Description */}
            <Text style={styles.label}>Descripción *</Text>
            <View style={[styles.inputContainer, styles.textAreaContainer]}>
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
            <Text style={styles.charCount}>{description.length}/2000</Text>

            {/* Date & Time */}
            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Fecha *</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="calendar-outline" size={20} color="#64748b" />
                  <TextInput
                    style={styles.input}
                    placeholder="2025-02-15"
                    placeholderTextColor="#64748b"
                    value={date}
                    onChangeText={setDate}
                  />
                </View>
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Hora *</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="time-outline" size={20} color="#64748b" />
                  <TextInput
                    style={styles.input}
                    placeholder="19:00"
                    placeholderTextColor="#64748b"
                    value={time}
                    onChangeText={setTime}
                  />
                </View>
              </View>
            </View>

            {/* Location */}
            <Text style={styles.label}>Ubicación *</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="location-outline" size={20} color="#64748b" />
              <TextInput
                style={styles.input}
                placeholder="Ej: Teatro Nacional, Bogotá"
                placeholderTextColor="#64748b"
                value={location}
                onChangeText={setLocation}
              />
            </View>

            {/* Category */}
            <Text style={styles.label}>Categoría *</Text>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryOption,
                    category === cat.id && styles.categorySelected,
                  ]}
                  onPress={() => setCategory(cat.id)}
                >
                  <Ionicons
                    name={cat.icon as any}
                    size={20}
                    color={category === cat.id ? '#6366f1' : '#64748b'}
                  />
                  <Text
                    style={[
                      styles.categoryText,
                      category === cat.id && styles.categoryTextSelected,
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Price & Capacity */}
            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Precio (COP) *</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="cash-outline" size={20} color="#64748b" />
                  <TextInput
                    style={styles.input}
                    placeholder="50000"
                    placeholderTextColor="#64748b"
                    value={ticketPrice}
                    onChangeText={setTicketPrice}
                    keyboardType="numeric"
                  />
                </View>
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Capacidad *</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="people-outline" size={20} color="#64748b" />
                  <TextInput
                    style={styles.input}
                    placeholder="300"
                    placeholderTextColor="#64748b"
                    value={capacity}
                    onChangeText={setCapacity}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>

            {/* Preview Button */}
            <TouchableOpacity
              style={styles.previewButton}
              onPress={() => {
                if (validateForm()) {
                  setShowPreview(true);
                }
              }}
            >
              <Ionicons name="eye-outline" size={20} color="#6366f1" />
              <Text style={styles.previewButtonText}>Ver Vista Previa</Text>
            </TouchableOpacity>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, isLoading && styles.buttonDisabled]}
              onPress={handleCreateEvent}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="rocket" size={20} color="#fff" />
                  <Text style={styles.submitButtonText}>Publicar Evento</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  form: {
    padding: 20,
    paddingTop: 0,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
    marginTop: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 10,
  },
  input: {
    flex: 1,
    height: 50,
    color: '#fff',
    fontSize: 15,
  },
  textAreaContainer: {
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'right',
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  imageSelector: {
    marginBottom: 8,
  },
  imageOption: {
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  imageOptionSelected: {
    borderColor: '#6366f1',
  },
  imageThumb: {
    width: 100,
    height: 70,
  },
  imageCheck: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#6366f1',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 6,
  },
  categorySelected: {
    borderColor: '#6366f1',
    backgroundColor: '#6366f115',
  },
  categoryText: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '500',
  },
  categoryTextSelected: {
    color: '#6366f1',
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 24,
    gap: 8,
    borderWidth: 1,
    borderColor: '#6366f1',
  },
  previewButtonText: {
    color: '#6366f1',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 12,
    marginBottom: 40,
    gap: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  // Preview styles
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  previewImage: {
    width: '100%',
    height: 200,
  },
  previewContent: {
    padding: 20,
  },
  previewBadge: {
    backgroundColor: '#6366f120',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  previewBadgeText: {
    color: '#6366f1',
    fontSize: 12,
    fontWeight: '600',
  },
  previewEventTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginTop: 12,
  },
  previewInfo: {
    marginTop: 16,
    gap: 10,
  },
  previewInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  previewInfoText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  previewDescTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginTop: 24,
    marginBottom: 8,
  },
  previewDesc: {
    color: '#94a3b8',
    fontSize: 14,
    lineHeight: 22,
  },
  previewPriceBox: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    alignItems: 'center',
  },
  previewPriceLabel: {
    color: '#64748b',
    fontSize: 13,
  },
  previewPrice: {
    color: '#10b981',
    fontSize: 28,
    fontWeight: '700',
    marginTop: 4,
  },
  previewFooter: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  editButton: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  publishButton: {
    flex: 2,
    flexDirection: 'row',
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  publishButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
