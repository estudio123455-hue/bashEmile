import { Event } from '@/types';

// PayPal Configuration
// ⚠️ En producción, estas credenciales deben estar en el backend
const PAYPAL_CONFIG = {
  clientId: 'YOUR_PAYPAL_CLIENT_ID', // Reemplazar con tu Client ID de PayPal
  // Sandbox para desarrollo, live para producción
  environment: 'sandbox' as 'sandbox' | 'live',
  currency: 'USD', // PayPal funciona mejor con USD
};

// Exchange rate aproximado (en producción usar API de tasas)
const COP_TO_USD_RATE = 0.00025; // 1 COP = 0.00025 USD aprox

export interface PayPalOrder {
  id: string;
  status: 'CREATED' | 'APPROVED' | 'COMPLETED' | 'CANCELLED';
  amount: number;
  currency: string;
  eventId: string;
  quantity: number;
  approvalUrl?: string;
  captureUrl?: string;
  createdAt: string;
}

export interface PayPalCreateOrderResponse {
  success: boolean;
  order?: PayPalOrder;
  error?: string;
}

export interface PayPalCaptureResponse {
  success: boolean;
  transactionId?: string;
  status?: string;
  error?: string;
}

/**
 * Convierte COP a USD
 */
export const convertCOPtoUSD = (copAmount: number): number => {
  return Math.round(copAmount * COP_TO_USD_RATE * 100) / 100;
};

/**
 * Calcula la comisión de PayPal (aprox 4.99% + $0.49)
 */
export const calculatePayPalFee = (usdAmount: number): number => {
  return Math.round((usdAmount * 0.0499 + 0.49) * 100) / 100;
};

/**
 * Calcula la comisión de la plataforma (8%)
 */
export const calculatePlatformFee = (amount: number): number => {
  return Math.round(amount * 0.08 * 100) / 100;
};

/**
 * Crea una orden de PayPal
 * ⚠️ En producción, esto debe hacerse en el BACKEND
 */
export const createPayPalOrder = async (
  event: Event,
  quantity: number,
  userId: string
): Promise<PayPalCreateOrderResponse> => {
  try {
    const totalCOP = event.price * quantity;
    const totalUSD = convertCOPtoUSD(totalCOP);
    
    // Simulación de creación de orden
    // En producción, esto sería una llamada al backend que usa la API de PayPal
    const orderId = `PAYPAL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const order: PayPalOrder = {
      id: orderId,
      status: 'CREATED',
      amount: totalUSD,
      currency: 'USD',
      eventId: event.id,
      quantity,
      // En producción, PayPal devuelve esta URL
      approvalUrl: `https://www.sandbox.paypal.com/checkoutnow?token=${orderId}`,
      createdAt: new Date().toISOString(),
    };

    // Simular delay de red
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      success: true,
      order,
    };
  } catch (error) {
    console.error('Error creating PayPal order:', error);
    return {
      success: false,
      error: 'No se pudo crear la orden de PayPal',
    };
  }
};

/**
 * Captura el pago después de que el usuario aprueba
 * ⚠️ En producción, esto debe hacerse en el BACKEND
 */
export const capturePayPalOrder = async (
  orderId: string
): Promise<PayPalCaptureResponse> => {
  try {
    // Simular delay de red
    await new Promise(resolve => setTimeout(resolve, 800));

    // En producción, esto sería una llamada al backend
    // que verifica con PayPal y captura el pago
    const transactionId = `TXN-${Date.now()}`;

    return {
      success: true,
      transactionId,
      status: 'COMPLETED',
    };
  } catch (error) {
    console.error('Error capturing PayPal order:', error);
    return {
      success: false,
      error: 'No se pudo procesar el pago',
    };
  }
};

/**
 * Verifica el estado de una orden
 */
export const getPayPalOrderStatus = async (
  orderId: string
): Promise<'CREATED' | 'APPROVED' | 'COMPLETED' | 'CANCELLED' | 'ERROR'> => {
  try {
    // En producción, verificar con el backend
    await new Promise(resolve => setTimeout(resolve, 300));
    return 'APPROVED';
  } catch {
    return 'ERROR';
  }
};

/**
 * Genera el resumen de precios para mostrar al usuario
 */
export const getPriceSummary = (event: Event, quantity: number) => {
  const subtotalCOP = event.price * quantity;
  const subtotalUSD = convertCOPtoUSD(subtotalCOP);
  const paypalFee = calculatePayPalFee(subtotalUSD);
  const platformFee = calculatePlatformFee(subtotalUSD);
  const totalUSD = Math.round((subtotalUSD + paypalFee) * 100) / 100;

  return {
    subtotalCOP,
    subtotalUSD,
    paypalFee,
    platformFee,
    totalUSD,
    formattedSubtotalCOP: `$${subtotalCOP.toLocaleString('es-CO')} COP`,
    formattedSubtotalUSD: `$${subtotalUSD.toFixed(2)} USD`,
    formattedPayPalFee: `$${paypalFee.toFixed(2)} USD`,
    formattedTotal: `$${totalUSD.toFixed(2)} USD`,
  };
};

export default {
  createPayPalOrder,
  capturePayPalOrder,
  getPayPalOrderStatus,
  getPriceSummary,
  convertCOPtoUSD,
  calculatePayPalFee,
  PAYPAL_CONFIG,
};
