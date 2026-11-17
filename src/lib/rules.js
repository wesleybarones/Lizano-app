/*
 * Regras simples usadas em várias telas e nas duas APIs (Supabase e demonstração).
 * O banco repete algumas delas; quando mudar aqui, confira também:
 *   - senha mínima: supabase/migrations/007 (create_reseller) e 008 (reset_reseller_password)
 *   - estoque mínimo padrão: supabase/migrations/011 (default da coluna min_stock)
 */

export const PASSWORD_MIN = 6;
export function checkPassword(password) {
  if (!password || password.length < PASSWORD_MIN) {
    throw new Error(`A senha precisa ter pelo menos ${PASSWORD_MIN} caracteres.`);
  }
}

// Estoque mínimo da peça (aviso "Repor"). 0 = sem aviso.
export const DEFAULT_MIN_STOCK = 2;
export const minStockOf = (p) => Math.max(0, Math.floor(Number(p?.min_stock ?? DEFAULT_MIN_STOCK)) || 0);
export const needsRestock = (p) => minStockOf(p) > 0 && p.stock_qty <= minStockOf(p);
