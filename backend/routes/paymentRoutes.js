const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

router.post('/create-checkout-session', async (req, res) => {
  try {
    const { issueId, issueTitle, donationAmount } = req.body;
    
    // donationAmount comes in paise, default to Rs 50 (5000 paise) if not provided
    const amount = donationAmount ? parseInt(donationAmount) : 5000;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
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
      success_url: `http://localhost:5173/issue/${issueId}?donate=success`,
      cancel_url: `http://localhost:5173/issue/${issueId}?donate=cancel`,
    });

    res.json({ id: session.id, url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
