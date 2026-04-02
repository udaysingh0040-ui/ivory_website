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
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!isAuthorized(req)) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Today's revenue + order count
    const { data: todayOrders } = await supabase
      .from('orders')
      .select('total_inr, status')
      .gte('created_at', todayStart)
      .neq('status', 'cancelled');

    const todayRevenue = (todayOrders || []).reduce((s, o) => s + Number(o.total_inr), 0);
    const todayCount = (todayOrders || []).length;

    // 7-day revenue
    const { data: weekOrders } = await supabase
      .from('orders')
      .select('total_inr, status, created_at')
      .gte('created_at', sevenDaysAgo)
      .neq('status', 'cancelled');

    const weekRevenue = (weekOrders || []).reduce((s, o) => s + Number(o.total_inr), 0);

    // Order counts by status
    const { data: allOrders } = await supabase
      .from('orders')
      .select('status');

    const statusCounts = (allOrders || []).reduce((acc, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1;
      return acc;
    }, {});

    // Daily revenue for last 7 days (for chart)
    const dailyMap = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      dailyMap[key] = 0;
    }
    (weekOrders || []).forEach(o => {
      const key = o.created_at.slice(0, 10);
      if (key in dailyMap) dailyMap[key] += Number(o.total_inr);
    });

    const dailyChart = Object.entries(dailyMap).map(([date, revenue]) => ({ date, revenue }));

    return res.status(200).json({
      todayRevenue,
      todayCount,
      weekRevenue,
      statusCounts,
      dailyChart,
    });

  } catch (err) {
    console.error('[STATS ERROR]', err);
    return res.status(500).json({ error: 'Failed to fetch stats' });
  }
}
