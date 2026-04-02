import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Fallback: all 27 products from catalogue.html (used when Supabase is unreachable)
const FALLBACK_PRODUCTS = [
  {id:'mu1',name:'Cotton Dress Shirt',       photo:'catalogue/men/upper/cotton_shirt_men.jpg',           price_inr:2499,price_usd:28,category:'men',subcategory:'upper',  sizes:['XS','S','M','L','XL','XXL'],in_stock:true,sort_order:1},
  {id:'mu2',name:'Cotton Half-Sleeve Shirt', photo:'catalogue/men/upper/cotton_half_sleeve_shirt.jpg',   price_inr:2499,price_usd:28,category:'men',subcategory:'upper',  sizes:['XS','S','M','L','XL','XXL'],in_stock:true,sort_order:2},
  {id:'mu3',name:'Linen Dress Shirt',        photo:'catalogue/men/upper/linen_shirt_men.jpg',            price_inr:2499,price_usd:28,category:'men',subcategory:'upper',  sizes:['XS','S','M','L','XL','XXL'],in_stock:true,sort_order:3},
  {id:'mu4',name:'Premium White T-Shirt',    photo:'catalogue/men/upper/cotton_white_tshirt.jpg',        price_inr:799, price_usd:9, category:'men',subcategory:'upper',  sizes:['XS','S','M','L','XL','XXL'],in_stock:true,sort_order:4},
  {id:'mu5',name:'Relaxed Cotton Shirt',     photo:'catalogue/men/upper/loose_cotton_men%20shirt.jpg',   price_inr:2499,price_usd:28,category:'men',subcategory:'upper',  sizes:['XS','S','M','L','XL','XXL'],in_stock:true,sort_order:5},
  {id:'mu6',name:'Relaxed Linen Shirt',      photo:'catalogue/men/upper/loose_linen_shirt_men.jpg',      price_inr:2499,price_usd:28,category:'men',subcategory:'upper',  sizes:['XS','S','M','L','XL','XXL'],in_stock:true,sort_order:6},
  {id:'mu7',name:'Linen Short-Sleeve Shirt', photo:'catalogue/men/upper/short_sleeve_lenin_shirt.jpg',   price_inr:2499,price_usd:28,category:'men',subcategory:'upper',  sizes:['XS','S','M','L','XL','XXL'],in_stock:true,sort_order:7},
  {id:'mu8',name:'Linen Short-Sleeve II',    photo:'catalogue/men/upper/short_sleeve_lenin_shirt_2.jpg', price_inr:2499,price_usd:28,category:'men',subcategory:'upper',  sizes:['XS','S','M','L','XL','XXL'],in_stock:true,sort_order:8},
  {id:'mb1',name:'Cotton Tailored Trousers', photo:'catalogue/men/bottom/cotton_pant.jpg',               price_inr:3399,price_usd:38,category:'men',subcategory:'bottom', sizes:['28','30','32','34','36','38'],in_stock:true,sort_order:1},
  {id:'mb2',name:'Korean Style Trousers',    photo:'catalogue/men/bottom/korean_style_pant.jpg',         price_inr:3399,price_usd:38,category:'men',subcategory:'bottom', sizes:['28','30','32','34','36','38'],in_stock:true,sort_order:2},
  {id:'mb3',name:'Linen Tailored Trousers',  photo:'catalogue/men/bottom/lenin_pant.jpg',                price_inr:3399,price_usd:38,category:'men',subcategory:'bottom', sizes:['28','30','32','34','36','38'],in_stock:true,sort_order:3},
  {id:'mb4',name:'Linen Relaxed Chinos',     photo:'catalogue/men/bottom/lenin_pant_style_2.jpg',        price_inr:3399,price_usd:38,category:'men',subcategory:'bottom', sizes:['28','30','32','34','36','38'],in_stock:true,sort_order:4},
  {id:'wu1',name:'Cotton Classic Shirt',     photo:'catalogue/women/upper/cotton_shirt_style_1.jpg',     price_inr:2499,price_usd:28,category:'women',subcategory:'upper',sizes:['XS','S','M','L','XL'],in_stock:true,sort_order:1},
  {id:'wu2',name:'Cotton Half-Sleeve Shirt', photo:'catalogue/women/upper/cotton_half_sleeve_shirt.jpg', price_inr:2499,price_usd:28,category:'women',subcategory:'upper',sizes:['XS','S','M','L','XL'],in_stock:true,sort_order:2},
  {id:'wu3',name:'Relaxed Cotton Shirt',     photo:'catalogue/women/upper/cotton_shirt_style_3.jpg',     price_inr:2499,price_usd:28,category:'women',subcategory:'upper',sizes:['XS','S','M','L','XL'],in_stock:true,sort_order:3},
  {id:'wu4',name:'White Cotton Shirt',       photo:'catalogue/women/upper/cotton_white_shirt_style_2.jpg',price_inr:2499,price_usd:28,category:'women',subcategory:'upper',sizes:['XS','S','M','L','XL'],in_stock:true,sort_order:4},
  {id:'wu5',name:'Linen Half-Sleeve Shirt',  photo:'catalogue/women/upper/linen_half_sleeve_shirt.jpg',  price_inr:2499,price_usd:28,category:'women',subcategory:'upper',sizes:['XS','S','M','L','XL'],in_stock:true,sort_order:5},
  {id:'wu6',name:'Linen Classic Shirt',      photo:'catalogue/women/upper/linen_shirt_style_1.jpg',      price_inr:2499,price_usd:28,category:'women',subcategory:'upper',sizes:['XS','S','M','L','XL'],in_stock:true,sort_order:6},
  {id:'wu7',name:'Premium White T-Shirt',    photo:'catalogue/women/upper/woman_white_tshirt.jpg',       price_inr:799, price_usd:9, category:'women',subcategory:'upper',sizes:['XS','S','M','L','XL'],in_stock:true,sort_order:7},
  {id:'wb1',name:'Cotton Tailored Pants',    photo:'catalogue/women/bottom/cotton_pants.jpg',            price_inr:3399,price_usd:38,category:'women',subcategory:'bottom',sizes:['24','26','28','30','32','34'],in_stock:true,sort_order:1},
  {id:'wb2',name:'Korean Style Pants',       photo:'catalogue/women/bottom/korean_style_cotton_pants.jpg',price_inr:3399,price_usd:38,category:'women',subcategory:'bottom',sizes:['24','26','28','30','32','34'],in_stock:true,sort_order:2},
  {id:'wb3',name:'Linen Straight Pants',     photo:'catalogue/women/bottom/lenin_pants_style_1.jpg',     price_inr:3399,price_usd:38,category:'women',subcategory:'bottom',sizes:['24','26','28','30','32','34'],in_stock:true,sort_order:3},
  {id:'wb4',name:'Palazzo Linen Pants',      photo:'catalogue/women/bottom/plazo_lenin_pants.jpg',       price_inr:3399,price_usd:38,category:'women',subcategory:'bottom',sizes:['24','26','28','30','32','34'],in_stock:true,sort_order:4},
  {id:'tw1',name:'Grand Bath Sheet',         photo:'catalogue/towels/bath_sheets.jpg',                   price_inr:1250,price_usd:21.50,category:'towels',subcategory:null,sizes:[],in_stock:true,sort_order:1},
  {id:'tw2',name:'Signature Bath Towel',     photo:'catalogue/towels/bath_towel.jpg',                    price_inr:850, price_usd:14.25,category:'towels',subcategory:null,sizes:[],in_stock:true,sort_order:2},
  {id:'tw3',name:'Guest Hand Towel',         photo:'catalogue/towels/hand_towel.jpg',                    price_inr:275, price_usd:4.85,category:'towels',subcategory:null,sizes:[],in_stock:true,sort_order:3},
  {id:'tw4',name:'Facial Washcloth',         photo:'catalogue/towels/facial_wash_cloth.jpg',             price_inr:110, price_usd:1.95,category:'towels',subcategory:null,sizes:[],in_stock:true,sort_order:4},
  {id:'tw5',name:'Sculpted Bath Mat',        photo:'catalogue/towels/bath_mat.jpg',                      price_inr:450, price_usd:7.50,category:'towels',subcategory:null,sizes:[],in_stock:true,sort_order:5},
];

function isAuthorized(req) {
  const auth = req.headers['authorization'] || '';
  return auth === `Bearer ${process.env.ADMIN_SECRET}`;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // GET is public (catalogue.html fetches it)
  if (req.method !== 'GET' && !isAuthorized(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // ── GET: list all products ──────────────────────────
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('category')
        .order('subcategory', { nullsFirst: false })
        .order('sort_order');

      if (error) throw error;
      return res.status(200).json({ products: data, source: 'supabase' });
    } catch (err) {
      // Supabase unreachable — return hardcoded fallback so admin page still works
      console.warn('[products] Supabase unavailable, using fallback data:', err.message);
      return res.status(200).json({ products: FALLBACK_PRODUCTS, source: 'fallback' });
    }
  }

  // ── POST: add new product ───────────────────────────
  if (req.method === 'POST') {
    const { id, name, photo, price_inr, price_usd, category, subcategory, sizes } = req.body;

    if (!id || !name || !photo || !price_inr || !category) {
      return res.status(400).json({ error: 'Missing required fields: id, name, photo, price_inr, category' });
    }

    const { data, error } = await supabase
      .from('products')
      .insert({
        id,
        name,
        photo,
        price_inr: Number(price_inr),
        price_usd: Number(price_usd || 0),
        category,
        subcategory: subcategory || null,
        sizes: sizes || [],
        in_stock: true,
        sort_order: 99,
      })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json({ product: data });
  }

  // ── PATCH: update product ───────────────────────────
  if (req.method === 'PATCH') {
    const { id, ...updates } = req.body;
    if (!id) return res.status(400).json({ error: 'Missing product id' });

    // Only allow safe fields
    const allowed = ['name', 'photo', 'price_inr', 'price_usd', 'sizes', 'in_stock', 'sort_order', 'subcategory'];
    const patch = {};
    for (const key of allowed) {
      if (key in updates) patch[key] = updates[key];
    }

    const { data, error } = await supabase
      .from('products')
      .update(patch)
      .eq('id', id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ product: data });
  }

  // ── DELETE: remove product ──────────────────────────
  if (req.method === 'DELETE') {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'Missing product id' });

    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
