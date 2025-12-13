const express = require('express');
const paypal = require('@paypal/checkout-server-sdk');
const { v4: uuidv4 } = require('uuid');
const { auth } = require('../middleware/auth');
const { client } = require('../config/paypal');
const { eventService, orderService } = require('../services/firebaseService');

const router = express.Router();

// Exchange rate COP to USD (in production, use a real API)
const COP_TO_USD_RATE = 0.00025;

// Helper: Convert to money string with 2 decimals (PayPal requirement)
const toMoney = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return '0.00';
  return num.toFixed(2);
};

// Calculate fees with validation
const calculateFees = (amountCOP, quantity) => {
  const price = Number(amountCOP);
  const qty = Number(quantity);
  
  if (!Number.isFinite(price) || !Number.isFinite(qty)) {
    console.error('[PAYPAL] Invalid inputs to calculateFees:', { amountCOP, quantity });
    return null;
  }
  
  const subtotalCOP = price * qty;
  const subtotalUSD = subtotalCOP * COP_TO_USD_RATE;
  const paypalFee = subtotalUSD * 0.0499 + 0.49;
  const platformFeePercent = Number(process.env.PLATFORM_FEE_PERCENT || 8) / 100;
  const platformFee = subtotalUSD * platformFeePercent;
  const totalUSD = subtotalUSD + paypalFee;

  return {
    subtotalCOP: Math.round(subtotalCOP),
    subtotalUSD: Math.round(subtotalUSD * 100) / 100,
    paypalFee: Math.round(paypalFee * 100) / 100,
    platformFee: Math.round(platformFee * 100) / 100,
    totalUSD: Math.round(totalUSD * 100) / 100,
  };
};

// POST /api/paypal/create-order - Create PayPal order
router.post('/create-order', auth, async (req, res) => {
  try {
    const { eventId, quantity } = req.body;

    // 1. Validate eventId
    if (!eventId) {
      return res.status(400).json({ success: false, error: 'eventId required' });
    }

    // 2. Parse and validate quantity FIRST
    const qty = Number(quantity);
    if (!Number.isFinite(qty) || qty < 1 || qty > 10) {
      return res.status(400).json({ success: false, error: 'Invalid quantity (must be 1-10)' });
    }

    // 3. Find event
    const event = await eventService.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }

    // 4. Check availability
    if (event.availableTickets < qty) {
      return res.status(400).json({ success: false, error: 'Not enough tickets available' });
    }

    // 5. Get and validate ticket price
    const ticketPrice = Number(event.ticketPrice) || Number(event.price) || 0;
    if (!Number.isFinite(ticketPrice) || ticketPrice <= 0) {
      console.error('[PAYPAL] Invalid price:', { raw: event.ticketPrice, parsed: ticketPrice });
      return res.status(400).json({ success: false, error: 'Invalid ticket price' });
    }

    // 6. Calculate fees
    const fees = calculateFees(ticketPrice, qty);
    if (!fees || !Number.isFinite(fees.totalUSD)) {
      console.error('[PAYPAL] Invalid fees:', fees);
      return res.status(500).json({ success: false, error: 'Fee calculation failed' });
    }

    // Log calculation for debugging
    console.log('[PAYPAL] Calculation:', { ticketPrice, qty, fees });

    // 7. Create internal order
    const orderId = `ORD-${Date.now()}-${uuidv4().substring(0, 8)}`;
    const order = {
      orderId,
      userId: req.userId,
      eventId: event.id,
      eventTitle: event.title,
      quantity: qty,
      ...fees,
      status: 'created',
      paypalOrderId: null,
      createdAt: new Date().toISOString(),
    };

    // 8. Create PayPal order
    const paypalClient = client();
    
    if (paypalClient) {
      // Simplified PayPal request (no breakdown to avoid math errors)
      const request = new paypal.orders.OrdersCreateRequest();
      request.prefer('return=representation');
      request.requestBody({
        intent: 'CAPTURE',
        purchase_units: [{
          reference_id: orderId,
          amount: {
            currency_code: 'USD',
            value: fees.totalUSD.toFixed(2),
          },
        }],
        application_context: {
          brand_name: 'EventQR',
          landing_page: 'NO_PREFERENCE',
          user_action: 'PAY_NOW',
          return_url: `${process.env.FRONTEND_URL || 'http://localhost:8081'}/payment/success`,
          cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:8081'}/payment/cancel`,
        },
      });

      console.log('[PAYPAL] Sending to PayPal:', { totalUSD: fees.totalUSD.toFixed(2) });

      const paypalOrder = await paypalClient.execute(request);
      order.paypalOrderId = paypalOrder.result.id;
      order.approvalUrl = paypalOrder.result.links.find(l => l.rel === 'approve')?.href;
      console.log('[PAYPAL] Order created:', order.paypalOrderId);
    } else {
      // Demo mode
      order.paypalOrderId = `DEMO-${orderId}`;
      order.approvalUrl = null;
    }

    await orderService.create(order);

    res.json({
      success: true,
      data: {
        orderId: order.orderId,
        paypalOrderId: order.paypalOrderId,
        approvalUrl: order.approvalUrl,
        amount: {
          subtotalCOP: fees.subtotalCOP,
          subtotalUSD: fees.subtotalUSD,
          paypalFee: fees.paypalFee,
          totalUSD: fees.totalUSD,
        },
        event: {
          id: event.id,
          title: event.title,
          date: event.date,
          time: event.time,
          location: event.location,
        },
        quantity: qty,
      },
    });
  } catch (error) {
    console.error('[PAYPAL] Error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Error creating order',
      details: error.message,
    });
  }
});

// POST /api/paypal/capture-order - Capture PayPal payment
router.post('/capture-order', auth, async (req, res) => {
  try {
    const { orderId, paypalOrderId } = req.body;

    // Find order
    const order = await orderService.findByUserAndOrderId(req.userId, orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found',
      });
    }

    if (order.status === 'completed') {
      return res.status(400).json({
        success: false,
        error: 'Order already completed',
      });
    }

    let captureId = null;
    const paypalClient = client();

    if (paypalClient && !order.paypalOrderId.startsWith('DEMO-')) {
      // Capture real PayPal payment
      const request = new paypal.orders.OrdersCaptureRequest(paypalOrderId);
      request.requestBody({});
      
      const capture = await paypalClient.execute(request);
      
      if (capture.result.status !== 'COMPLETED') {
        return res.status(400).json({
          success: false,
          error: 'Payment not completed',
        });
      }

      captureId = capture.result.purchase_units[0].payments.captures[0].id;
    } else {
      // Demo mode
      captureId = `DEMO-CAP-${Date.now()}`;
    }

    // Update order status
    await orderService.update(orderId, {
      status: 'completed',
      paypalCaptureId: captureId,
      completedAt: new Date().toISOString(),
    });

    // Update event tickets
    await eventService.updateTickets(order.eventId, order.quantity);

    res.json({
      success: true,
      data: {
        orderId: order.orderId,
        captureId,
        status: 'completed',
        message: 'Payment captured successfully',
      },
    });
  } catch (error) {
    console.error('Capture order error:', error);
    res.status(500).json({
      success: false,
      error: 'Error capturing payment',
    });
  }
});

// GET /api/paypal/order/:orderId - Get order status
router.get('/order/:orderId', auth, async (req, res) => {
  try {
    const order = await orderService.findByUserAndOrderId(req.userId, req.params.orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found',
      });
    }

    res.json({
      success: true,
      data: {
        orderId: order.orderId,
        status: order.status,
        amount: {
          subtotalCOP: order.subtotalCOP,
          subtotalUSD: order.subtotalUSD,
          totalUSD: order.totalUSD,
        },
        eventTitle: order.eventTitle,
        quantity: order.quantity,
        createdAt: order.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error fetching order',
    });
  }
});

// POST /api/paypal/demo-payment - Demo payment for testing
router.post('/demo-payment', auth, async (req, res) => {
  try {
    const { orderId } = req.body;

    const order = await orderService.findByUserAndOrderId(req.userId, orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found',
      });
    }

    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 1500));

    const captureId = `DEMO-CAP-${Date.now()}`;

    // Update order
    await orderService.update(orderId, {
      status: 'completed',
      paypalCaptureId: captureId,
      completedAt: new Date().toISOString(),
    });

    // Update event tickets
    await eventService.updateTickets(order.eventId, order.quantity);

    res.json({
      success: true,
      data: {
        orderId: order.orderId,
        transactionId: captureId,
        status: 'completed',
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error processing demo payment',
    });
  }
});

module.exports = router;
