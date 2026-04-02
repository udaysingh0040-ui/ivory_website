import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const resend = new Resend(process.env.RESEND_API_KEY);

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
    // Send emails (non-blocking)
    resend.emails.send({
      from: 'IVORY <onboarding@resend.dev>',
      to: customer.email,
      subject: `Order Confirmed — #${displayId}`,
      html: customerEmailHtml({ customer, items, total_inr, displayId }),
    }).catch(err => console.error('Customer email failed:', err.message));

    resend.emails.send({
      from: 'IVORY Orders <onboarding@resend.dev>',
      to: 'support.ivory@gmail.com',
      subject: `New Order #${displayId} — ₹${Number(total_inr).toLocaleString('en-IN')} from ${customer.name}`,
      html: adminEmailHtml({ customer, items, total_inr, displayId, razorpay_payment_id }),
    }).catch(err => console.error('Admin email failed:', err.message));

  } catch (err) {
    // Payment succeeded — don't fail the response, just log
    console.error('[RAZORPAY VERIFY DB]', err.message);
  }

  return res.status(200).json({ success: true, displayId });
}

function fmt(n) {
  return '₹' + Number(n).toLocaleString('en-IN');
}

function customerEmailHtml({ customer, items, total_inr, displayId }) {
  const itemRows = items.map(i => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #f0f0e8;font-size:13px;color:#131111;">${i.name}${i.size ? ` <span style="color:#888;font-size:11px;">(${i.size})</span>` : ''}</td>
      <td style="padding:10px 0;border-bottom:1px solid #f0f0e8;font-size:13px;color:#131111;text-align:center;">${i.qty}</td>
      <td style="padding:10px 0;border-bottom:1px solid #f0f0e8;font-size:13px;color:#131111;text-align:right;">${fmt(i.price * i.qty)}</td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#FAFAF8;font-family:'Georgia',serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border:1px solid #e8e8e0;">
    <div style="background:#131111;padding:32px 40px;">
      <p style="margin:0;font-size:22px;letter-spacing:0.2em;color:#FAFAF8;font-weight:400;">IVORY</p>
    </div>
    <div style="padding:40px;">
      <h2 style="margin:0 0 8px;font-size:24px;font-weight:400;color:#131111;">Order Confirmed</h2>
      <p style="margin:0 0 32px;font-size:12px;letter-spacing:0.15em;color:#888;text-transform:uppercase;">Order #${displayId}</p>
      <p style="font-size:14px;color:#444;line-height:1.7;margin:0 0 32px;">Dear ${customer.name},<br>Thank you for your order. We're preparing your IVORY essentials and will update you once they ship.</p>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <thead>
          <tr>
            <th style="text-align:left;font-size:9px;letter-spacing:0.2em;text-transform:uppercase;color:#888;padding-bottom:12px;border-bottom:2px solid #131111;">Item</th>
            <th style="text-align:center;font-size:9px;letter-spacing:0.2em;text-transform:uppercase;color:#888;padding-bottom:12px;border-bottom:2px solid #131111;">Qty</th>
            <th style="text-align:right;font-size:9px;letter-spacing:0.2em;text-transform:uppercase;color:#888;padding-bottom:12px;border-bottom:2px solid #131111;">Amount</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
        <tfoot>
          <tr>
            <td colspan="2" style="padding:16px 0 0;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#131111;font-weight:600;">Total</td>
            <td style="padding:16px 0 0;font-size:15px;color:#131111;text-align:right;font-weight:600;">${fmt(total_inr)}</td>
          </tr>
        </tfoot>
      </table>
      <div style="background:#f0f0e8;padding:20px;margin-bottom:32px;">
        <p style="margin:0 0 6px;font-size:9px;letter-spacing:0.2em;text-transform:uppercase;color:#888;">Payment Method</p>
        <p style="margin:0;font-size:13px;color:#131111;">Razorpay (UPI / Card / Net Banking)</p>
      </div>
      <p style="font-size:12px;color:#888;line-height:1.7;margin:0;">Questions? Write to <a href="mailto:support.ivory@gmail.com" style="color:#131111;">support.ivory@gmail.com</a></p>
    </div>
    <div style="background:#f0f0e8;padding:20px 40px;text-align:center;">
      <p style="margin:0;font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:#888;">IVORY — Crafted in India</p>
    </div>
  </div>
</body>
</html>`;
}

function adminEmailHtml({ customer, items, total_inr, displayId, razorpay_payment_id }) {
  const itemList = items.map(i =>
    `<li style="margin:4px 0;font-size:13px;color:#333;">${i.qty}× ${i.name}${i.size ? ` (${i.size})` : ''} — ${fmt(i.price * i.qty)}</li>`
  ).join('');

  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
  <div style="max-width:520px;margin:32px auto;background:#fff;border:1px solid #ddd;padding:32px;">
    <h2 style="margin:0 0 4px;font-size:20px;color:#131111;">New Order — #${displayId}</h2>
    <p style="margin:0 0 24px;font-size:13px;color:#888;">${fmt(total_inr)} · Razorpay · Payment ID: ${razorpay_payment_id}</p>
    <h3 style="margin:0 0 8px;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#888;">Customer</h3>
    <p style="margin:0 0 4px;font-size:14px;color:#131111;">${customer.name}</p>
    <p style="margin:0 0 4px;font-size:13px;color:#555;">${customer.email}</p>
    ${customer.phone ? `<p style="margin:0 0 4px;font-size:13px;color:#555;">${customer.phone}</p>` : ''}
    ${customer.address ? `<p style="margin:0 0 24px;font-size:13px;color:#555;">${customer.address}</p>` : '<br>'}
    <h3 style="margin:0 0 8px;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#888;">Items</h3>
    <ul style="margin:0 0 24px;padding-left:20px;">${itemList}</ul>
    <div style="background:#f9f9f9;padding:16px;border-left:3px solid #131111;">
      <p style="margin:0;font-size:13px;color:#131111;font-weight:600;">Total: ${fmt(total_inr)}</p>
    </div>
  </div>
</body>
</html>`;
}
