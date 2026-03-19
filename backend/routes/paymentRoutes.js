const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const nodemailer = require('nodemailer');

router.post('/create-checkout-session', async (req, res) => {
  try {
    const { issueId, issueTitle, donationAmount, customerEmail } = req.body;
    
    // donationAmount comes in paise, default to Rs 50 (5000 paise) if not provided
    const amount = donationAmount ? parseInt(donationAmount) : 5000;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: customerEmail || undefined,
      line_items: [
        {
          price_data: {
            currency: 'inr',
            product_data: {
              name: `Support Mission for Issue - ${issueTitle || 'Civic Issue'}`,
              description: `Thank you for contributing to the resolution of civic issues in our community.`,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `http://localhost:5173/issue/${issueId}?donate=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `http://localhost:5173/issue/${issueId}?donate=cancel`,
    });

    res.json({ id: session.id, url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/verify-donation', async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ error: 'Session ID is required' });

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (session.payment_status === 'paid') {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD
        }
      });

      const amountRs = session.amount_total / 100;
      const recipientEmail = session.customer_details.email;
      
      const mailOptions = {
        from: `"CiviQ" <${process.env.GMAIL_USER}>`,
        to: recipientEmail,
        subject: 'Thank You for Your Generous Donation! 💖',
        html: `
          <div style="font-family: Arial, sans-serif; background-color: #f9fafb; padding: 40px 20px;">
            <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
              <div style="background-color: #4f46e5; padding: 30px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px;">Donation Successful 🎉</h1>
              </div>
              <div style="padding: 40px 30px; color: #374151;">
                <p style="font-size: 16px; line-height: 1.6;">Hello,</p>
                <p style="font-size: 16px; line-height: 1.6;">We just received your generous donation of <strong>₹${amountRs}</strong>! Thank you so much for supporting our mission to build better, transparent communities through CiviQ.</p>
                <p style="font-size: 16px; line-height: 1.6;">Your contribution directly empowers citizens and authorities to resolve civic issues faster.</p>
                <div style="margin: 30px 0; padding: 20px; background-color: #f3f4f6; border-radius: 8px; text-align: center;">
                  <p style="margin: 0; font-size: 14px; color: #6b7280;">Transaction ID</p>
                  <p style="margin: 5px 0 0 0; font-family: monospace; font-size: 16px; color: #111827;">${session.payment_intent || session.id}</p>
                </div>
                <p style="font-size: 16px; line-height: 1.6;">With deep gratitude,<br><strong>The CiviQ Team</strong></p>
              </div>
            </div>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      return res.json({ success: true, message: 'Receipt sent successfully' });
    } else {
      return res.status(400).json({ error: 'Payment not successful' });
    }
  } catch (error) {
    console.error('Error verifying donation:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
