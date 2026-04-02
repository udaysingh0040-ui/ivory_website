import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    customer,
    items,
    total_inr,
  } = req.body;

  // ── Verify Razorpay signature ─────────────────────────
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (expected !== razorpay_signature) {
    return res.status(400).json({ error: 'Invalid payment signature' });
  }

  // ── Save to Supabase ──────────────────────────────────
  let displayId = 'IVY-' + Date.now().toString(36).toUpperCase();

  try {
    // Upsert customer
    const { data: customerData } = await supabase
      .from('customers')
      .upsert(
        { email: customer.email, name: customer.name, phone: customer.phone || null },
        { onConflict: 'email' }
      )
      .select()
      .single();

    const customerId = customerData?.id;

    // Create order
    const { data: orderData } = await supabase
      .from('orders')
      .insert({
        display_id:        displayId,
        customer_id:       customerId,
        total_inr:         Number(total_inr),
        status:            'confirmed',
        payment_method:    'razorpay',
        payment_id:        razorpay_payment_id,
        razorpay_order_id: razorpay_order_id,
        shipping_address:  customer.address || null,
      })
      .select()
      .single();

    const orderId = orderData?.id;

    // Insert order items
    if (orderId && items?.length) {
      await supabase.from('order_items').insert(
        items.map(item => ({
          order_id:     orderId,
          product_id:   item.id,
          product_name: item.name,
          category:     item.category || null,
          size:         item.size || null,
          quantity:     item.qty,
          price_inr:    item.price,
        }))
      );
    }
  } catch (err) {
    // Payment succeeded — don't fail the response, just log
    console.error('[RAZORPAY VERIFY DB]', err.message);
  }

  return res.status(200).json({ success: true, displayId });
}
