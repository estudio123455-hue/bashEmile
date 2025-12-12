const express = require('express');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');
const crypto = require('crypto');
const { auth } = require('../middleware/auth');
const { eventService, orderService, ticketService } = require('../services/firebaseService');

const router = express.Router();

// Generate secure QR token
const generateQRToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// POST /api/tickets/generate - Generate ticket after payment
router.post('/generate', auth, async (req, res) => {
  try {
    const { orderId } = req.body;

    // Find completed order
    const order = await orderService.findByUserAndOrderId(req.userId, orderId);
    if (!order || order.status !== 'completed') {
      return res.status(404).json({
        success: false,
        error: 'Completed order not found',
      });
    }

    // Check if ticket already generated
    const existingTicket = await ticketService.findByOrderId(orderId);
    if (existingTicket) {
      return res.json({
        success: true,
        data: existingTicket,
      });
    }

    // Find event
    const event = await eventService.findById(order.eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found',
      });
    }

    // Generate ticket
    const ticketId = `TKT-${Date.now()}-${uuidv4().substring(0, 8)}`;
    const qrToken = generateQRToken();
    
    // QR data
    const qrData = JSON.stringify({
      ticketId,
      eventId: event.id,
      userId: req.userId,
      token: qrToken,
      timestamp: Date.now(),
    });

    // Generate QR code as base64
    const qrCodeBase64 = await QRCode.toDataURL(qrData, {
      width: 300,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });

    const ticket = await ticketService.create({
      ticketId,
      orderId: order.orderId,
      userId: req.userId,
      eventId: event.id,
      eventTitle: event.title,
      eventDate: event.date,
      eventTime: event.time,
      eventLocation: event.location,
      quantity: order.quantity,
      totalPrice: order.totalUSD,
      currency: 'USD',
      status: 'valid',
      qrCode: qrCodeBase64,
      qrToken,
      qrTokenExpiry: new Date(Date.now() + 30000).toISOString(),
      purchaseDate: order.completedAt,
    });

    res.json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    console.error('Generate ticket error:', error);
    res.status(500).json({
      success: false,
      error: 'Error generating ticket',
    });
  }
});

// GET /api/tickets - Get user's tickets
router.get('/', auth, async (req, res) => {
  try {
    const { status } = req.query;
    const userTickets = await ticketService.findByUserId(req.userId, status);

    res.json({
      success: true,
      data: userTickets,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error fetching tickets',
    });
  }
});

// GET /api/tickets/:id - Get single ticket
router.get('/:id', auth, async (req, res) => {
  try {
    const ticket = await ticketService.findByUserAndTicketId(req.userId, req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Ticket not found',
      });
    }

    res.json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error fetching ticket',
    });
  }
});

// POST /api/tickets/:id/refresh-qr - Refresh QR token
router.post('/:id/refresh-qr', auth, async (req, res) => {
  try {
    const ticket = await ticketService.findByUserAndTicketId(req.userId, req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Ticket not found',
      });
    }

    if (ticket.status !== 'valid') {
      return res.status(400).json({
        success: false,
        error: 'Ticket is not valid',
      });
    }

    // Generate new QR token
    const newQrToken = generateQRToken();
    const qrData = JSON.stringify({
      ticketId: ticket.ticketId,
      eventId: ticket.eventId,
      userId: req.userId,
      token: newQrToken,
      timestamp: Date.now(),
    });

    // Generate new QR code
    const qrCodeBase64 = await QRCode.toDataURL(qrData, {
      width: 300,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });

    const expiresAt = new Date(Date.now() + 30000).toISOString();

    // Update ticket
    await ticketService.update(ticket.ticketId, {
      qrToken: newQrToken,
      qrTokenExpiry: expiresAt,
      qrCode: qrCodeBase64,
    });

    res.json({
      success: true,
      data: {
        qrCode: qrCodeBase64,
        qrToken: newQrToken,
        expiresAt,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error refreshing QR code',
    });
  }
});

// POST /api/tickets/:id/validate - Validate ticket (for event staff)
router.post('/:id/validate', async (req, res) => {
  try {
    const { token } = req.body;
    const ticketId = req.params.id;

    const ticket = await ticketService.findByTicketId(ticketId);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Ticket not found',
        valid: false,
      });
    }

    // Check status
    if (ticket.status === 'used') {
      return res.json({
        success: true,
        valid: false,
        status: 'used',
        message: 'Ticket already used',
        usedAt: ticket.usedAt,
      });
    }

    if (ticket.status === 'cancelled') {
      return res.json({
        success: true,
        valid: false,
        status: 'cancelled',
        message: 'Ticket has been cancelled',
      });
    }

    // Check event date
    const eventDate = new Date(ticket.eventDate);
    const now = new Date();
    if (eventDate < now.setHours(0, 0, 0, 0)) {
      await ticketService.update(ticketId, { status: 'expired' });
      return res.json({
        success: true,
        valid: false,
        status: 'expired',
        message: 'Event has passed',
      });
    }

    // Validate token
    if (ticket.qrToken !== token) {
      return res.json({
        success: true,
        valid: false,
        status: 'invalid_token',
        message: 'Invalid or expired QR code',
      });
    }

    // Check token expiry
    if (new Date(ticket.qrTokenExpiry) < new Date()) {
      return res.json({
        success: true,
        valid: false,
        status: 'token_expired',
        message: 'QR code has expired, please refresh',
      });
    }

    // Mark as used
    await ticketService.update(ticketId, {
      status: 'used',
      usedAt: new Date().toISOString(),
    });

    res.json({
      success: true,
      valid: true,
      status: 'valid',
      message: 'Ticket validated successfully',
      ticket: {
        eventTitle: ticket.eventTitle,
        quantity: ticket.quantity,
        eventDate: ticket.eventDate,
        eventTime: ticket.eventTime,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error validating ticket',
    });
  }
});

module.exports = router;
