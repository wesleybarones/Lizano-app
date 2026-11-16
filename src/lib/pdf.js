/*
 * PDFs do app: comprovante do acerto e certificado de garantia.
 * A biblioteca (jsPDF) só é baixada quando a pessoa gera um PDF.
 */
import { kitTotals, itemPrice } from './calc';
import { brl, dateBR, goalText, pct } from './format';
import { BRAND_PHONE } from './terms';

const NAVY = [35, 45, 66];
const NAVY_DEEP = [26, 34, 50];
const GOLD = [201, 168, 105];
const GOLD_LIGHT = [226, 201, 152];
const GOLD_DARK = [168, 134, 74];
const CREAM = [247, 242, 234];
const INK2 = [107, 111, 120];
const TEXT = [69, 72, 79];

async function newDoc() {
  const { jsPDF } = await import('jspdf');
  return new jsPDF({ unit: 'mm', format: 'a5', compress: true });
}

// Símbolo da Lizano (as duas linhas do monograma)
function monogram(doc, x, y, size, color = GOLD) {
  const P = (px, py) => [x + (px / 100) * size, y + (py / 100) * size];
  doc.setDrawColor(...color);
  doc.setLineWidth(size * 0.028);
  doc.setLineCap('round');
  doc.setLineJoin('round');
  const seg = (p1, p2) => doc.line(p1[0], p1[1], p2[0], p2[1]);
  seg(P(50.3, 2), P(3.2, 96.8));
  seg(P(3.2, 96.8), P(58, 96.8));
  seg(P(25.1, 85.2), P(56.1, 22.6));
  seg(P(56.1, 22.6), P(98, 98));
}

function header(doc, brand, kicker, title) {
  const W = doc.internal.pageSize.getWidth();
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, W, 46, 'F');
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.25);
  doc.roundedRect(4, 4, W - 8, 38, 2, 2, 'S');
  monogram(doc, W / 2 - 5, 8, 10);
  doc.setTextColor(...GOLD);
  doc.setFont('times', 'normal');
  doc.setFontSize(15);
  doc.setCharSpace(2.2);
  doc.text(String(brand || 'Lizano').toUpperCase(), W / 2, 25, { align: 'center' });
  doc.setCharSpace(0);
  doc.setTextColor(...GOLD_LIGHT);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setCharSpace(1.2);
  doc.text(kicker.toUpperCase(), W / 2, 31, { align: 'center' });
  doc.setCharSpace(0);
  doc.setTextColor(...CREAM);
  doc.setFont('times', 'bold');
  doc.setFontSize(15);
  doc.text(title, W / 2, 38.5, { align: 'center' });
}

function footer(doc, brand) {
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.2);
  doc.line(10, H - 14, W - 10, H - 14);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...INK2);
  doc.text(`${brand} · WhatsApp ${BRAND_PHONE} · @uselizano · lizano.com.br`, W / 2, H - 9, { align: 'center' });
}

// ------------------------------------------------------------------
// Comprovante do acerto
// ------------------------------------------------------------------
export async function receiptPdf(kit, brand = 'Lizano') {
  const doc = await newDoc();
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const t = kitTotals(kit);
  header(doc, brand, 'Comprovante de acerto', `Maleta nº ${kit.number}`);

  let y = 54;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...TEXT);
  const info = [
    ['Revendedora', kit.reseller?.name || ''],
    ['Envio da maleta', dateBR(kit.sent_at)],
    ['Acerto', kit.settled_at ? dateBR(kit.settled_at) : 'em aberto (prévia)'],
    ['Situação', kit.status !== 'settled' ? 'Maleta na rua' : kit.paid_at ? `Pago em ${dateBR(kit.paid_at)}` : 'Aguardando pagamento'],
  ];
  for (const [k, v] of info) {
    doc.setTextColor(...INK2);
    doc.text(k, 10, y);
    doc.setTextColor(...NAVY);
    doc.setFont('helvetica', 'bold');
    doc.text(String(v), W - 10, y, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    y += 5.5;
  }

  // Peças vendidas agrupadas
  y += 3;
  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...NAVY);
  doc.text('Peças vendidas', 10, y);
  y += 2;
  const groups = {};
  for (const i of kit.items.filter((x) => x.sold)) {
    const key = `${i.piece_id}|${itemPrice(i)}`;
    groups[key] ||= { name: i.piece?.name || 'Peça', code: i.piece?.code || '', price: itemPrice(i), qty: 0 };
    groups[key].qty += 1;
  }
  const rows = Object.values(groups).sort((a, b) => a.name.localeCompare(b.name));
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...GOLD_DARK);
  y += 5;
  doc.text('PEÇA', 10, y);
  doc.text('QTD', W - 52, y, { align: 'right' });
  doc.text('PREÇO', W - 32, y, { align: 'right' });
  doc.text('TOTAL', W - 10, y, { align: 'right' });
  doc.setDrawColor(...GOLD_LIGHT);
  doc.line(10, y + 1.5, W - 10, y + 1.5);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  if (!rows.length) {
    doc.setTextColor(...INK2);
    doc.text('Nenhuma peça vendida.', 10, y);
    y += 6;
  }
  for (const r of rows) {
    if (y > H - 70) {
      footer(doc, brand);
      doc.addPage();
      y = 16;
    }
    doc.setTextColor(...NAVY);
    const name = doc.splitTextToSize(`${r.name}${r.code ? ` (${r.code})` : ''}`, W - 75)[0];
    doc.text(name, 10, y);
    doc.setTextColor(...TEXT);
    doc.text(String(r.qty), W - 52, y, { align: 'right' });
    doc.text(brl(r.price), W - 32, y, { align: 'right' });
    doc.setTextColor(...NAVY);
    doc.text(brl(r.price * r.qty), W - 10, y, { align: 'right' });
    y += 5.5;
  }

  // Resumo
  y += 2;
  if (y > H - 66) {
    footer(doc, brand);
    doc.addPage();
    y = 16;
  }
  const lines = [
    [`Vendido (${t.soldCount} ${t.soldCount === 1 ? 'peça' : 'peças'})`, brl(t.soldTotal)],
    [`Devolvidas ao estoque (${t.leftCount})`, brl(t.returnedTotal)],
    [`Comissão (${pct(t.commissionPct)})`, `- ${brl(t.commission)}`],
    [t.goal > 0 ? `Bônus (meta de ${goalText(t.goalType, t.goal)}${t.goalHit ? ' atingida' : ' não atingida'})` : 'Bônus', `- ${brl(t.bonus)}`],
  ];
  if (t.adjust) lines.push(['Ajuste', `${t.adjust > 0 ? '+ ' : '- '}${brl(Math.abs(t.adjust))}`]);
  doc.setFillColor(...CREAM);
  doc.roundedRect(10, y, W - 20, lines.length * 6 + 4, 2, 2, 'F');
  y += 6;
  doc.setFontSize(8.5);
  for (const [k, v] of lines) {
    doc.setTextColor(...TEXT);
    doc.text(k, 14, y);
    doc.setTextColor(...NAVY);
    doc.text(v, W - 14, y, { align: 'right' });
    y += 6;
  }
  y += 2;
  doc.setFillColor(...NAVY_DEEP);
  doc.roundedRect(10, y, W - 20, 16, 2, 2, 'F');
  doc.setTextColor(...GOLD_LIGHT);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('VALOR A REPASSAR PARA A ' + String(brand).toUpperCase(), 14, y + 6.5);
  doc.setTextColor(...CREAM);
  doc.setFont('times', 'bold');
  doc.setFontSize(16);
  doc.text(brl(t.receivable), W - 14, y + 10.5, { align: 'right' });
  y += 22;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...INK2);
  doc.text(doc.splitTextToSize('O pagamento é combinado fora do app. Este comprovante resume o acerto registrado no sistema de consignado.', W - 20), 10, y);
  footer(doc, brand);
  return doc.output('blob');
}

// ------------------------------------------------------------------
// Certificado de garantia (1 ano, defeito de fabricação)
// ------------------------------------------------------------------
export async function warrantyPdf({ piece, soldAt, reseller, client, brand = 'Lizano' }) {
  const doc = await newDoc();
  const W = doc.internal.pageSize.getWidth();
  header(doc, brand, 'Certificado de garantia', '1 ano contra defeito de fabricação');

  let y = 54;
  const field = (label, value, x, w) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(...GOLD_DARK);
    doc.text(label.toUpperCase(), x, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(...NAVY);
    doc.text(doc.splitTextToSize(value || ' ', w)[0], x, y + 5);
    doc.setDrawColor(...GOLD);
    doc.setLineWidth(0.25);
    doc.line(x, y + 6.8, x + w, y + 6.8);
  };
  const half = (W - 26) / 2;
  field('Cliente', client, 10, half);
  field('Data da compra', dateBR(soldAt), 16 + half, half);
  y += 13;
  field('Peça', `${piece?.name || ''}${piece?.code ? ` (${piece.code})` : ''}`, 10, half);
  field('Revendedora', reseller, 16 + half, half);
  y += 16;

  const h2 = (txt) => {
    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...NAVY);
    doc.text(txt, 10, y);
    y += 5;
  };
  const para = (txt, size = 8) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(size);
    doc.setTextColor(...TEXT);
    const l = doc.splitTextToSize(txt, W - 20);
    doc.text(l, 10, y);
    y += l.length * (size * 0.42) + 1.5;
  };
  h2('O que a garantia cobre');
  para(`Defeitos de fabricação da peça, por 1 ano a partir da data da compra. Com o defeito confirmado na avaliação, a peça é trocada.`);
  para('Não cobre: mau uso e falta dos cuidados abaixo; quedas, batidas, amassados ou peças arrebentadas por puxão; desgaste natural do uso; consertos ou ajustes feitos por terceiros.');
  y += 1;
  h2('Cuidados para manter a garantia');
  para('• Perfumes e cremes: aplique antes e espere a pele secar totalmente antes de colocar as peças.');
  para('• Água e suor: retire as peças antes do banho, piscina, mar e atividades físicas.');
  para('• Produtos químicos: evite contato com produtos de limpeza doméstica.');
  para('• Armazenamento: guarde as peças separadas, em locais secos e arejados (nunca no banheiro).');
  para('• Limpeza: lave apenas com água morna e sabão neutro, seque muito bem e finalize com uma flanela macia.');
  y += 1;
  const boxText = doc.splitTextToSize(
    `Importante: a troca é feita somente em caso de defeito de fabricação, após avaliação da peça. Danos causados por mau uso não são cobertos. Para acionar, fale com sua revendedora ou com a ${brand} e apresente a peça com este certificado.`,
    W - 28,
  );
  doc.setFillColor(...NAVY);
  doc.roundedRect(10, y, W - 20, boxText.length * 3.6 + 6, 2, 2, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.8);
  doc.setTextColor(...CREAM);
  doc.text(boxText, 14, y + 5.2);
  footer(doc, brand);
  return doc.output('blob');
}

// Envia o arquivo pelo menu de compartilhar do celular (WhatsApp etc.);
// sem esse recurso (computador), baixa o arquivo.
export async function shareOrDownload(blob, filename, text) {
  const file = new File([blob], filename, { type: blob.type || 'application/pdf' });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: filename, text });
      return 'shared';
    } catch (e) {
      if (e?.name === 'AbortError') return 'cancelled';
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return 'downloaded';
}
