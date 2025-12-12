const express = require('express');
const crypto = require('crypto');

const router = express.Router();

// PayPal webhook signature verification
const verifyPayPalWebhook = (req) => {
  // In production, verify the webhook signature using PayPal's verification API
  // For now, we'll do basic validation
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  
  if (!webhookId) {
    console.warn('⚠️  PAYPAL_WEBHOOK_ID not configured');
    return true; // Allow in development
  }

  // PayPal sends these headers for verification
  const transmissionId = req.headers['paypal-transmission-id'];
  const transmissionTime = req.headers['paypal-transmission-time'];
  const certUrl = req.headers['paypal-cert-url'];
  const authAlgo = req.headers['paypal-auth-algo'];
  const transmissionSig = req.headers['paypal-transmission-sig'];

  if (!transmissionId || !transmissionTime || !transmissionSig) {
    return false;
  }

  // In production, you would verify the signature here
  // using PayPal's verification endpoint
  return true;
};

// POST /api/webhooks/paypal - PayPal webhook handler
router.post('/paypal', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    // Verify webhook signature
    if (!verifyPayPalWebhook(req)) {
      console.error('Invalid PayPal webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const event = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const eventType = event.event_type;

    console.log(`📥 PayPal Webhook: ${eventType}`);

    switch (eventType) {
      case 'CHECKOUT.ORDER.APPROVED':
        // Order was approved by buyer
        console.log('Order approved:', event.resource.id);
        // You could auto-capture here or wait for frontend
        break;

      case 'PAYMENT.CAPTURE.COMPLETED':
        // Payment was captured successfully
        const captureId = event.resource.id;
        const orderId = event.resource.supplementary_data?.related_ids?.order_id;
        console.log('Payment captured:', captureId, 'for order:', orderId);
        
        // Here you would:
        // 1. Find the order in your database
        // 2. Update order status to 'completed'
        // 3. Generate the ticket
        // 4. Send confirmation email
        break;

      case 'PAYMENT.CAPTURE.DENIED':
        // Payment was denied
        console.log('Payment denied:', event.resource.id);
        // Update order status to 'failed'
        break;

      case 'PAYMENT.CAPTURE.REFUNDED':
        // Payment was refunded
        console.log('Payment refunded:', event.resource.id);
        // Update ticket status to 'cancelled'
        break;

      case 'CHECKOUT.ORDER.COMPLETED':
        // Entire checkout completed
        console.log('Checkout completed:', event.resource.id);
        break;

      default:
        console.log('Unhandled webhook event:', eventType);
    }

    // Always respond 200 to acknowledge receipt
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    // Still respond 200 to prevent PayPal from retrying
    res.status(200).json({ received: true, error: error.message });
  }
});

// POST /api/webhooks/test - Test webhook endpoint
router.post('/test', (req, res) => {
  console.log('Test webhook received:', req.body);
  res.json({ success: true, received: req.body });
});

module.exports = router;
