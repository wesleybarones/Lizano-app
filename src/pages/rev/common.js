// Maleta atual da revendedora: a aberta mais recente
export const currentKit = (kits) => kits.find((k) => k.status === 'open') || null;
