import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function isAuthorized(req) {
  const auth = req.headers['authorization'] || '';
  return auth === `Bearer ${process.env.ADMIN_SECRET}`;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (!isAuthorized(req)) return res.status(401).json({ error: 'Unauthorized' });

  // ── GET: list orders ────────────────────────────────────────
  if (req.method === 'GET') {
    const { status, limit = 50, offset = 0 } = req.query;

    let query = supabase
      .from('orders')
      .select(`
        id,
        status,
        total_inr,
        payment_method,
        created_at,
        updated_at,
        customers ( name, email, phone ),
        order_items ( id, product_name, size, quantity, price_inr )
      `)
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query;
    if (error) return res.status(500).json({ error: error.message });

    return res.status(200).json({ orders: data, count });
  }

  // ── PATCH: update order status ──────────────────────────────
  if (req.method === 'PATCH') {
    const { orderId, status } = req.body;
    const validStatuses = ['confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

    if (!orderId || !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid orderId or status' });
    }

    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId)
      .select('id, status, updated_at')
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ order: data });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
