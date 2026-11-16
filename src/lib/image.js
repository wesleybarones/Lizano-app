/*
 * Prepara a foto antes de enviar:
 *  - HEIC/HEIF (padrão de iPhones e vários Androids) vira JPG, porque os
 *    navegadores não mostram HEIC;
 *  - reduz para no máximo 1200 px no lado maior, em JPG (~150-300 KB).
 */
const MAX = 1200;

function isHeic(file) {
  return /image\/hei[cf]/i.test(file.type) || /\.hei[cf]$/i.test(file.name || '');
}

function loadImage(blob) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => resolve({ img, url });
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Não foi possível ler esta foto. Tente outra ou tire pela câmera.'));
    };
    img.src = url;
  });
}

export async function prepareImage(file, max = MAX) {
  let blob = file;
  if (isHeic(file)) {
    const { default: heic2any } = await import('heic2any'); // só baixa quando precisa
    const out = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 });
    blob = Array.isArray(out) ? out[0] : out;
  }
  const { img, url } = await loadImage(blob);
  try {
    const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff'; // PNG com transparência fica com fundo branco
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const jpg = await new Promise((r) => canvas.toBlob(r, 'image/jpeg', 0.85));
    if (!jpg) throw new Error('Não foi possível preparar a foto.');
    return new File([jpg], 'foto.jpg', { type: 'image/jpeg' });
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function blobToDataUrl(blob) {
  return new Promise((resolve) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.readAsDataURL(blob);
  });
}
