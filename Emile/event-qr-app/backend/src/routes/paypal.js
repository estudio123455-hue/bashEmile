const express = require('express');
const paypal = require('@paypal/checkout-server-sdk');
const { v4: uuidv4 } = require('uuid');
const { auth } = require('../middleware/auth');
const { client } = require('../config/paypal');
const { eventService, orderService } = require('../services/firebaseService');

const router = express.Router();

// Exchange rate COP to USD (in production, use a real API)
const COP_TO_USD_RATE = 0.00025;

// Calculate fees
const calculateFees = (amountCOP, quantity) => {
  const subtotalCOP = amountCOP * quantity;
  const subtotalUSD = Math.round(subtotalCOP * COP_TO_USD_RATE * 100) / 100;
  const paypalFee = Math.round((subtotalUSD * 0.0499 + 0.49) * 100) / 100;
  const platformFeePercent = parseFloat(process.env.PLATFORM_FEE_PERCENT || 8) / 100;
  const platformFee = Math.round(subtotalUSD * platformFeePercent * 100) / 100;
  const totalUSD = Math.round((subtotalUSD + paypalFee) * 100) / 100;

  return {
    subtotalCOP,
    subtotalUSD,
    paypalFee,
    platformFee,
    totalUSD,
  };
};

// POST /api/paypal/create-order - Create PayPal order
router.post('/create-order', auth, async (req, res) => {
  try {
    const { eventId, quantity } = req.body;

    // Validate input
    if (!eventId || !quantity || quantity < 1 || quantity > 10) {
      return res.status(400).json({
        success: false,
        error: 'Invalid event ID or quantity',
      });
    }

    // Find event
    const event = await eventService.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found',
      });
    }

    // Check availability
    if (event.availableTickets < quantity) {
      return res.status(400).json({
        success: false,
        error: 'Not enough tickets available',
      });
    }

    // Calculate fees
    const fees = calculateFees(event.price, quantity);

    // Create internal order
    const orderId = `ORD-${Date.now()}-${uuidv4().substring(0, 8)}`;
    
    const order = {
      orderId,
      userId: req.userId,
      eventId: event.id,
      eventTitle: event.title,
      quantity,
      ...fees,
      status: 'created',
      paypalOrderId: null,
      createdAt: new Date().toISOString(),
    };

    // Try to create PayPal order if configured
    const paypalClient = client();
    
    if (paypalClient) {
      const request = new paypal.orders.OrdersCreateRequest();
      request.prefer('return=representation');
      request.requestBody({
        intent: 'CAPTURE',
        purchase_units: [{
          reference_id: orderId,
          description: `${quantity}x ${event.title}`,
          amount: {
            currency_code: 'USD',
            value: fees.totalUSD.toFixed(2),
            breakdown: {
              item_total: {
                currency_code: 'USD',
                value: fees.subtotalUSD.toFixed(2),
              },
              handling: {
                currency_code: 'USD',
                value: fees.paypalFee.toFixed(2),
              },
            },
          },
          items: [{
            name: event.title,
            description: `Entrada para ${event.title}`,
            unit_amount: {
              currency_code: 'USD',
              value: (fees.subtotalUSD / quantity).toFixed(2),
            },
            quantity: quantity.toString(),
            category: 'DIGITAL_GOODS',
          }],
        }],
        application_context: {
          brand_name: 'EventQR',
          landing_page: 'NO_PREFERENCE',
          user_action: 'PAY_NOW',
          return_url: `${process.env.FRONTEND_URL || 'http://localhost:8081'}/payment/success`,
          cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:8081'}/payment/cancel`,
        },
      });

      const paypalOrder = await paypalClient.execute(request);
      order.paypalOrderId = paypalOrder.result.id;
      order.approvalUrl = paypalOrder.result.links.find(l => l.rel === 'approve')?.href;
    } else {
      // Demo mode without PayPal
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
        quantity,
      },
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      error: 'Error creating order',
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

// ============ PREMIUM SUBSCRIPTION ENDPOINTS ============

const PREMIUM_PRICE_USD = 12.99; // Premium price in USD

// POST /api/paypal/create-premium-order - Create PayPal order for Premium subscription
router.post('/create-premium-order', auth, async (req, res) => {
  try {
    // Check if user is already premium
    const existingUser = await require('../services/firebaseService').userService.findById(req.userId);
    if (existingUser?.isPremium) {
      return res.status(400).json({
        success: false,
        error: 'User is already Premium',
      });
    }

    const orderId = `PREM-${Date.now()}-${uuidv4().substring(0, 8)}`;
    
    const order = {
      orderId,
      userId: req.userId,
      type: 'premium',
      amountUSD: PREMIUM_PRICE_USD,
      status: 'created',
      paypalOrderId: null,
      createdAt: new Date().toISOString(),
    };

    const paypalClient = client();
    
    if (paypalClient) {
      const request = new paypal.orders.OrdersCreateRequest();
      request.prefer('return=representation');
      request.requestBody({
        intent: 'CAPTURE',
        purchase_units: [{
          reference_id: orderId,
          description: 'EventQR Premium - Publish unlimited events',
          amount: {
            currency_code: 'USD',
            value: PREMIUM_PRICE_USD.toFixed(2),
          },
          items: [{
            name: 'EventQR Premium',
            description: 'Lifetime access to publish events',
            unit_amount: {
              currency_code: 'USD',
              value: PREMIUM_PRICE_USD.toFixed(2),
            },
            quantity: '1',
            category: 'DIGITAL_GOODS',
          }],
        }],
        application_context: {
          brand_name: 'EventQR',
          landing_page: 'NO_PREFERENCE',
          user_action: 'PAY_NOW',
          return_url: `${process.env.FRONTEND_URL || 'http://localhost:8081'}/premium`,
          cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:8081'}/premium`,
        },
      });

      const paypalOrder = await paypalClient.execute(request);
      order.paypalOrderId = paypalOrder.result.id;
      order.approvalUrl = paypalOrder.result.links.find(l => l.rel === 'approve')?.href;
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
        amountUSD: PREMIUM_PRICE_USD,
      },
    });
  } catch (error) {
    console.error('Create premium order error:', error);
    res.status(500).json({
      success: false,
      error: 'Error creating premium order',
    });
  }
});

// POST /api/paypal/capture-premium-order - Capture Premium payment and activate isPremium
router.post('/capture-premium-order', auth, async (req, res) => {
  try {
    const { orderId, paypalOrderId } = req.body;

    const order = await orderService.findByUserAndOrderId(req.userId, orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found',
      });
    }

    if (order.type !== 'premium') {
      return res.status(400).json({
        success: false,
        error: 'Invalid order type',
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

    // SECURITY: Activate Premium from backend only after payment verification
    const { userService } = require('../services/firebaseService');
    await userService.activatePremium(req.userId);

    console.log('Premium activated for user:', req.userId);

    res.json({
      success: true,
      data: {
        orderId: order.orderId,
        captureId,
        status: 'completed',
        message: 'Premium activated successfully',
      },
    });
  } catch (error) {
    console.error('Capture premium order error:', error);
    res.status(500).json({
      success: false,
      error: 'Error capturing premium payment',
    });
  }
});

module.exports = router;
