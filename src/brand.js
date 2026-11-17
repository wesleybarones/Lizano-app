/*
 * Dados da marca que usa o app. Para outra marca, troque este arquivo.
 *
 * O nome que aparece no app vem do banco (brands.name, editável no Perfil);
 * BRAND.name só é usado antes do login e se o banco não tiver nome.
 *
 * A parte visual fixa fica fora do JavaScript e precisa ser trocada à mão:
 *   - index.html            título, cor do navegador e a abertura (logo e letras)
 *   - public/manifest.webmanifest   nome e cores do app instalado
 *   - public/icons/         ícones
 *   - src/styles.css        variáveis de cor (:root)
 *   - src/lib/pdf.js        desenho do monograma no PDF
 */
import { normalizePhone } from './lib/format';

export const BRAND = {
  name: 'Lizano',
  whatsapp: '(21) 98227-1402',
  instagram: '@uselizano',
  site: 'lizano.com.br',
  // mesmas cores de src/styles.css (:root)
  colors: {
    navy: '#232D42',
    navyDeep: '#1A2232',
    gold: '#C9A869',
    goldLight: '#E2C998',
    goldDark: '#A8864A',
    goldPale: '#EFE3C8',
    cream: '#F7F2EA',
    offwhite: '#FBF8F3',
    ink2: '#6B6F78',
    text: '#45484F',
  },
};

// WhatsApp só com dígitos e 55 na frente, para links wa.me
export const BRAND_WA = normalizePhone(BRAND.whatsapp);

const C = BRAND.colors;
// Ordem das cores nos gráficos
export const CHART_COLORS = [C.navy, C.goldDark, C.gold, C.goldLight, C.ink2, C.navyDeep, C.goldPale];

// '#A8864A' -> [168, 134, 74] (o jsPDF usa RGB)
export const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
