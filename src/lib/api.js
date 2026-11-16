/*
 * Camada de dados. Duas implementações com a mesma interface:
 *  - Supabase (quando VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY existem)
 *  - Demonstração (dados de exemplo salvos no navegador)
 */
import { createClient } from '@supabase/supabase-js';
import { isEmail, loginToEmail, normalizePhone } from './format';
import { createDemoApi } from './demo';
import { prepareImage } from './image';

const URL = import.meta.env.VITE_SUPABASE_URL;
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const IS_DEMO = !URL || !KEY;

const KIT_SELECT =
  '*, reseller:profiles!kits_reseller_id_fkey(id,name,login,commission_pct,bonus_amount,goal_amount,goal_type), items:kit_items(*, piece:pieces(*))';

function createSupabaseApi() {
  const sb = createClient(URL, KEY);
  const must = ({ data, error }) => {
    if (error) throw new Error(traduz(error.message));
    return data;
  };

  async function profileOf(userId) {
    const p = must(await sb.from('profiles').select('*, brand:brands(name,logo_url)').eq('id', userId).maybeSingle());
    if (!p || !p.active) return null;
    return { ...p, brand_name: p.brand?.name || '', brand_logo: p.brand?.logo_url || '' };
  }

  return {
    auth: {
      async signIn(login, password) {
        let email = loginToEmail(login);
        if (!email) throw new Error('Informe o celular ou e-mail.');
        // celular cadastrado numa conta de e-mail (ex.: o dono): descobre o e-mail
        if (!isEmail(login)) {
          const { data } = await sb.rpc('login_email', { p_phone: normalizePhone(login) });
          if (data) email = data;
        }
        const { data, error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw new Error('Login ou senha incorretos.');
        const me = await profileOf(data.user.id);
        if (!me) {
          await sb.auth.signOut();
          throw new Error('Este acesso ainda não foi liberado pela marca.');
        }
        return me;
      },
      async signOut() {
        await sb.auth.signOut();
      },
      async current() {
        const { data } = await sb.auth.getSession();
        return data.session ? profileOf(data.session.user.id) : null;
      },
      async changePassword(password) {
        if (!password || password.length < 6) throw new Error('A senha precisa ter pelo menos 6 caracteres.');
        const { error } = await sb.auth.updateUser({ password });
        if (error) throw new Error(traduz(error.message));
      },
    },

    brand: {
      // Perfil da empresa (só o dono altera)
      async save({ name, logo_url }, brandId) {
        must(await sb.from('brands').update({ name: name.trim(), logo_url: logo_url || null }).eq('id', brandId));
      },
    },

    pieces: {
      async list() {
        return must(await sb.from('pieces').select('*').eq('archived', false).order('name'));
      },
      async save(p, brandId) {
        const row = {
          code: p.code.trim(),
          name: p.name.trim(),
          photo_url: p.photo_url || null,
          cost: Number(p.cost) || 0,
          price: Number(p.price) || 0,
          stock_qty: Number(p.stock_qty) || 0,
          category: p.category || 'outro',
        };
        if (p.id) return must(await sb.from('pieces').update(row).eq('id', p.id).select().single());
        return must(await sb.from('pieces').insert({ ...row, brand_id: brandId }).select().single());
      },
      // 'deleted' (apagada) ou 'archived' (tinha histórico: some das listas)
      async remove(id) {
        return must(await sb.rpc('delete_piece', { p_piece: id }));
      },
      async uploadPhoto(file, brandId) {
        const jpg = await prepareImage(file);
        const path = `${brandId}/${crypto.randomUUID()}.jpg`;
        must(await sb.storage.from('pecas').upload(path, jpg, { contentType: 'image/jpeg', cacheControl: '31536000' }));
        return sb.storage.from('pecas').getPublicUrl(path).data.publicUrl;
      },
    },

    resellers: {
      async list() {
        return must(await sb.from('profiles').select('*').eq('role', 'reseller').order('name'));
      },
      async save(r, brandId, password) {
        const rules = {
          name: r.name.trim(),
          login: r.login.trim(),
          commission_pct: Number(r.commission_pct) || 0,
          bonus_amount: Number(r.bonus_amount) || 0,
          goal_amount: Number(r.goal_amount) || 0,
          goal_type: r.goal_type === 'value' ? 'value' : 'pieces',
        };
        if (r.id) {
          return must(await sb.from('profiles').update({ ...rules, active: r.active !== false }).eq('id', r.id).select().single());
        }
        if (!loginToEmail(r.login)) throw new Error('Informe o celular ou e-mail da revendedora.');
        if (!password || password.length < 6) throw new Error('A senha precisa ter pelo menos 6 caracteres.');
        // conta criada pelo banco (só o dono pode); o cadastro público do Supabase fica desligado
        must(
          await sb.rpc('create_reseller', {
            p_name: rules.name,
            p_login: rules.login,
            p_password: password,
            p_commission: rules.commission_pct,
            p_bonus: rules.bonus_amount,
            p_goal: rules.goal_amount,
            p_goal_type: rules.goal_type,
          }),
        );
        return rules;
      },
    },

    kits: {
      async list() {
        return must(await sb.from('kits').select(KIT_SELECT).order('number', { ascending: false }));
      },
      async create({ reseller_id, sent_at, due_at, pieceIds }, brandId) {
        const kit = must(
          await sb.from('kits').insert({ brand_id: brandId, reseller_id, sent_at, due_at: due_at || null }).select().single(),
        );
        if (pieceIds?.length) await this.addItems(kit.id, pieceIds, brandId);
        return kit;
      },
      async addItems(kitId, pieceIds, brandId) {
        must(await sb.from('kit_items').insert(pieceIds.map((piece_id) => ({ kit_id: kitId, piece_id, brand_id: brandId }))));
      },
      async removeItem(itemId) {
        must(await sb.from('kit_items').delete().eq('id', itemId));
      },
      async markSold(itemIds, sold) {
        must(await sb.rpc('mark_sold', { item_ids: itemIds, is_sold: sold }));
      },
      async settle(kitId, adjust) {
        must(await sb.rpc('settle_kit', { p_kit: kitId, p_adjust: Number(adjust) || 0 }));
      },
      async markPaid(kitId, paid = true) {
        must(await sb.rpc('mark_paid', { p_kit: kitId, p_paid: paid }));
      },
    },

    // Avisa quando peças, maletas ou vendas mudam (preço novo aparece na hora)
    subscribe(cb) {
      const ch = sb
        .channel('mudancas')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'pieces' }, cb)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'kits' }, cb)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'kit_items' }, cb)
        .subscribe();
      return () => sb.removeChannel(ch);
    },
  };
}

function traduz(msg = '') {
  if (/already registered|already exists|Já existe/i.test(msg)) return 'Já existe um acesso com esse celular ou e-mail.';
  if (/duplicate key.*code/i.test(msg)) return 'Já existe uma peça com esse código.';
  if (/should be different/i.test(msg)) return 'A nova senha precisa ser diferente da atual.';
  if (/password/i.test(msg)) return 'Senha inválida (mínimo de 6 caracteres).';
  if (/network|fetch/i.test(msg)) return 'Sem conexão. Tente de novo.';
  return msg;
}

export const api = IS_DEMO ? createDemoApi() : createSupabaseApi();
