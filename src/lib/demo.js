/*
 * Modo demonstração: mesma interface da API do Supabase, com dados de
 * exemplo guardados no navegador (localStorage). Nomes, peças e valores
 * são inventados, só para mostrar o funcionamento.
 *   Dono:        login "dono"         senha "123456"
 *   Revendedora: login "carla"        senha "123456"
 */
import { addDays, guessCategory, isEmail, normalizePhone, today } from './format';
import { blobToDataUrl, prepareImage } from './image';

const KEY = 'barones-consignado-demo-v5';
const listeners = new Set();
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2));
const wait = (v) => new Promise((r) => setTimeout(() => r(structuredClone(v)), 120));

function seed() {
  const brand = { id: 'b1', name: 'Lizano', logo_url: null };
  const admin = { id: 'u-dono', brand_id: 'b1', role: 'admin', name: 'Dono da Lizano', login: 'dono', phone: '5521900000000', active: true };
  const rev = (id, name, login, c, b, g) => ({
    id, brand_id: 'b1', role: 'reseller', name, login, commission_pct: c, bonus_amount: b, goal_amount: g,
    goal_type: 'pieces', active: true,
  });
  const profiles = [
    admin,
    rev('u-carla', 'Carla Mendes', 'carla', 30, 50, 15),
    rev('u-juliana', 'Juliana Reis', 'juliana', 30, 50, 15),
    rev('u-patricia', 'Patrícia Lima', 'patricia', 25, 40, 12),
    rev('u-simone', 'Simone Alves', 'simone', 30, 0, 0),
  ];
  const pc = (id, code, name, cost, price, stock) => ({
    id, brand_id: 'b1', code, name, photo_url: null, cost, price, stock_qty: stock, category: guessCategory(name) || 'outro',
  });
  const pieces = [
    pc('p1', 'CL-031', 'Colar ponto de luz', 32, 89.9, 30),
    pc('p2', 'BR-102', 'Brinco argola dourada', 21, 59.9, 40),
    pc('p3', 'PL-017', 'Pulseira elos', 27, 74.9, 25),
    pc('p4', 'AN-044', 'Anel solitário', 17, 49.9, 30),
    pc('p5', 'TZ-008', 'Tornozeleira estrela', 13, 39.9, 20),
    pc('p6', 'CJ-021', 'Conjunto pérola', 46, 129.9, 12),
  ];
  const price = Object.fromEntries(pieces.map((p) => [p.id, p.price]));
  const kits = [];
  const items = [];
  let n = 0;
  const t = today();
  function kit(reseller, sentDaysAgo, plan, settled, paid) {
    n += 1;
    const r = profiles.find((p) => p.id === reseller);
    const k = {
      id: `k${n}`, brand_id: 'b1', number: n, reseller_id: reseller,
      sent_at: addDays(t, -sentDaysAgo), due_at: addDays(t, -sentDaysAgo + 30),
      status: settled ? 'settled' : 'open', adjust_amount: 0,
      commission_pct: settled ? r.commission_pct : null, bonus_amount: settled ? r.bonus_amount : null,
      goal_amount: settled ? r.goal_amount : null, goal_type: settled ? r.goal_type : null,
      settled_at: settled ? `${addDays(t, -sentDaysAgo + 30)}T15:00:00Z` : null,
      paid_at: paid ? `${addDays(t, -sentDaysAgo + 32)}T15:00:00Z` : null,
    };
    kits.push(k);
    for (const [pid, qty, soldQty] of plan) {
      for (let i = 0; i < qty; i++) {
        const sold = i < soldQty;
        items.push({
          id: uid(), kit_id: k.id, brand_id: 'b1', piece_id: pid,
          price: settled ? price[pid] : null, sold,
          sold_at: sold ? `${addDays(k.sent_at, 3 + i)}T12:00:00Z` : null,
        });
      }
    }
  }
  const full = (f) => [['p1', 6, Math.round(5 * f)], ['p2', 6, Math.round(4 * f)], ['p3', 4, Math.round(3 * f)], ['p4', 4, Math.round(2 * f)], ['p5', 3, Math.round(2 * f)], ['p6', 2, Math.round(1 * f)]];
  // histórico: acertos fechados nos meses anteriores
  kit('u-carla', 190, full(0.6), true, true);
  kit('u-juliana', 160, full(0.7), true, true);
  kit('u-patricia', 130, full(0.8), true, true);
  kit('u-carla', 100, full(0.8), true, true);
  kit('u-simone', 70, full(0.9), true, true);
  kit('u-juliana', 45, full(1), true, false);
  // maletas na rua
  kit('u-carla', 14, full(0.75), false, false);
  kit('u-juliana', 10, full(0.6), false, false);
  kit('u-patricia', 6, full(0.4), false, false);
  return { brand, profiles, pieces, kits, items, invites: [], session: null };
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* sem armazenamento: usa dados novos */ }
  return seed();
}

export function createDemoApi() {
  let db = load();
  const save = () => {
    try { localStorage.setItem(KEY, JSON.stringify(db)); } catch { /* ignora */ }
    listeners.forEach((cb) => setTimeout(cb, 0));
  };
  const me = () => db.profiles.find((p) => p.id === db.session);
  const isAdmin = () => me()?.role === 'admin';
  const meFull = () => {
    const p = me();
    return p ? { ...p, brand_name: db.brand.name, brand_logo: db.brand.logo_url || '' } : null;
  };
  const piece = (id) => db.pieces.find((p) => p.id === id);
  const kitFull = (k) => ({
    ...k,
    reseller: db.profiles.find((p) => p.id === k.reseller_id),
    items: db.items.filter((i) => i.kit_id === k.id).map((i) => ({ ...i, piece: piece(i.piece_id) })),
  });
  const guardAdmin = () => {
    if (!isAdmin()) throw new Error('Apenas o ADM pode fazer isso.');
  };

  return {
    demo: true,
    reset() {
      db = seed();
      save();
    },
    auth: {
      async signIn(login, password) {
        const l = String(login).trim().toLowerCase();
        const tel = isEmail(l) ? '' : normalizePhone(l);
        const p = db.profiles.find(
          (x) => x.active && (x.login?.toLowerCase() === l || (tel && (x.phone === tel || normalizePhone(x.login) === tel))),
        );
        if (!p || password !== (p.password || '123456')) throw new Error('Login ou senha incorretos.');
        db.session = p.id;
        save();
        return wait(meFull());
      },
      async signOut() {
        db.session = null;
        save();
      },
      async current() {
        return wait(meFull());
      },
      async changePassword(password) {
        if (!password || password.length < 6) throw new Error('A senha precisa ter pelo menos 6 caracteres.');
        me().password = password;
        save();
      },
    },
    brand: {
      async save({ name, logo_url }) {
        guardAdmin();
        db.brand.name = name.trim();
        db.brand.logo_url = logo_url || null;
        save();
      },
    },
    pieces: {
      async list() {
        if (isAdmin()) return wait(db.pieces.filter((p) => !p.archived).sort((a, b) => a.name.localeCompare(b.name)));
        const mine = new Set(db.kits.filter((k) => k.reseller_id === db.session).map((k) => k.id));
        const ids = new Set(db.items.filter((i) => mine.has(i.kit_id)).map((i) => i.piece_id));
        return wait(db.pieces.filter((p) => ids.has(p.id)));
      },
      async save(p) {
        guardAdmin();
        const code = p.code.trim();
        if (db.pieces.some((x) => x.code.toLowerCase() === code.toLowerCase() && x.id !== p.id)) {
          throw new Error('Já existe uma peça com esse código.');
        }
        const row = {
          code, name: p.name.trim(), photo_url: p.photo_url || null,
          cost: Number(p.cost) || 0, price: Number(p.price) || 0, stock_qty: Number(p.stock_qty) || 0,
          category: p.category || 'outro',
        };
        if (p.id) Object.assign(piece(p.id), row);
        else db.pieces.push({ id: uid(), brand_id: 'b1', ...row });
        save();
        return wait(row);
      },
      async remove(id) {
        guardAdmin();
        const items = db.items.filter((i) => i.piece_id === id);
        const naRua = items.some((i) => !i.sold && db.kits.find((k) => k.id === i.kit_id)?.status === 'open');
        if (naRua) throw new Error('Esta peça está numa maleta na rua. Tire da maleta antes de excluir.');
        let r = 'deleted';
        if (items.length) {
          piece(id).archived = true;
          r = 'archived';
        } else db.pieces = db.pieces.filter((p) => p.id !== id);
        save();
        return r;
      },
      async uploadPhoto(file) {
        return blobToDataUrl(await prepareImage(file, 360)); // pequeno: fica guardado no navegador
      },
    },
    resellers: {
      async list() {
        guardAdmin();
        return wait(db.profiles.filter((p) => p.role === 'reseller').sort((a, b) => a.name.localeCompare(b.name)));
      },
      async save(r, _brand, password) {
        guardAdmin();
        const rules = {
          name: r.name.trim(), login: r.login.trim(),
          commission_pct: Number(r.commission_pct) || 0, bonus_amount: Number(r.bonus_amount) || 0,
          goal_amount: Number(r.goal_amount) || 0,
          goal_type: r.goal_type === 'value' ? 'value' : 'pieces',
        };
        if (r.id) {
          Object.assign(db.profiles.find((p) => p.id === r.id), rules, { active: r.active !== false });
        } else {
          if (db.profiles.some((p) => p.login?.toLowerCase() === rules.login.toLowerCase())) {
            throw new Error('Já existe um acesso com esse celular ou e-mail.');
          }
          if (!password || password.length < 6) throw new Error('A senha precisa ter pelo menos 6 caracteres.');
          db.profiles.push({ id: uid(), brand_id: 'b1', role: 'reseller', active: true, password, ...rules });
        }
        save();
        return wait(rules);
      },
      async resetPassword(id, password) {
        guardAdmin();
        if (!password || password.length < 6) throw new Error('A senha precisa ter pelo menos 6 caracteres.');
        db.profiles.find((p) => p.id === id).password = password;
        save();
      },
    },
    kits: {
      async list() {
        const ks = isAdmin() ? db.kits : db.kits.filter((k) => k.reseller_id === db.session);
        return wait([...ks].sort((a, b) => b.number - a.number).map(kitFull));
      },
      async create({ reseller_id, sent_at, due_at, pieceIds }) {
        guardAdmin();
        const number = Math.max(0, ...db.kits.map((k) => k.number)) + 1;
        const k = {
          id: uid(), brand_id: 'b1', number, reseller_id, sent_at, due_at: due_at || null, status: 'open',
          adjust_amount: 0, commission_pct: null, bonus_amount: null, goal_amount: null, goal_type: null, settled_at: null, paid_at: null,
        };
        db.kits.push(k);
        save();
        if (pieceIds?.length) await this.addItems(k.id, pieceIds);
        return wait(k);
      },
      async addItems(kitId, pieceIds) {
        guardAdmin();
        for (const pid of pieceIds) {
          db.items.push({ id: uid(), kit_id: kitId, brand_id: 'b1', piece_id: pid, price: null, sold: false, sold_at: null });
          piece(pid).stock_qty -= 1;
        }
        save();
      },
      async removeItem(itemId) {
        guardAdmin();
        const it = db.items.find((i) => i.id === itemId);
        const k = db.kits.find((x) => x.id === it.kit_id);
        if (k.status === 'open') piece(it.piece_id).stock_qty += 1;
        db.items = db.items.filter((i) => i.id !== itemId);
        save();
      },
      async markSold(itemIds, sold) {
        for (const it of db.items) {
          if (!itemIds.includes(it.id)) continue;
          const k = db.kits.find((x) => x.id === it.kit_id);
          if (k.status !== 'open' || (!isAdmin() && k.reseller_id !== db.session)) continue;
          it.sold = sold;
          it.sold_at = sold ? new Date().toISOString() : null;
        }
        save();
      },
      async settle(kitId, adjust) {
        guardAdmin();
        const k = db.kits.find((x) => x.id === kitId);
        if (k.status !== 'open') throw new Error('Maleta já acertada.');
        const r = db.profiles.find((p) => p.id === k.reseller_id);
        for (const it of db.items.filter((i) => i.kit_id === kitId)) {
          it.price = piece(it.piece_id).price;
          if (!it.sold) piece(it.piece_id).stock_qty += 1;
        }
        Object.assign(k, {
          status: 'settled', settled_at: new Date().toISOString(), adjust_amount: Number(adjust) || 0,
          commission_pct: r.commission_pct, bonus_amount: r.bonus_amount, goal_amount: r.goal_amount,
          goal_type: r.goal_type,
        });
        save();
      },
      async markPaid(kitId, paid = true) {
        guardAdmin();
        db.kits.find((x) => x.id === kitId).paid_at = paid ? new Date().toISOString() : null;
        save();
      },
      async remove(kitId) {
        guardAdmin();
        const k = db.kits.find((x) => x.id === kitId);
        if (k.status === 'open') {
          for (const it of db.items.filter((i) => i.kit_id === kitId && !i.sold)) piece(it.piece_id).stock_qty += 1;
        }
        db.items = db.items.filter((i) => i.kit_id !== kitId);
        db.kits = db.kits.filter((x) => x.id !== kitId);
        save();
      },
    },
    subscribe(cb) {
      listeners.add(cb);
      const onStorage = (e) => {
        if (e.key === KEY) {
          db = load();
          cb();
        }
      };
      window.addEventListener('storage', onStorage);
      return () => {
        listeners.delete(cb);
        window.removeEventListener('storage', onStorage);
      };
    },
  };
}
