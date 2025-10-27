export type GerarPdfOptions = {
  filename?: string;
  orientation?: 'portrait' | 'landscape';
  debug?: boolean;          // mostra o HTML invisível na tela para inspeção
  stripImages?: boolean;    // ignora <img> (útil p/ diagnosticar CORS)
};

function escapeRE(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function waitForImages(root: HTMLElement) {
  const imgs = Array.from(root.querySelectorAll<HTMLImageElement>('img'));
  if (!imgs.length) return Promise.resolve();
  return Promise.all(
    imgs.map(img => {
      try {
        const src = img.getAttribute('src') || '';
        if (/^https?:\/\//i.test(src) && !img.crossOrigin) img.crossOrigin = 'anonymous';
      } catch { }
      if (img.complete && img.naturalWidth > 0) return Promise.resolve();
      return new Promise<void>(res => {
        const done = () => res();
        img.addEventListener('load', done, { once: true });
        img.addEventListener('error', done, { once: true });
      });
    })
  );
}

export async function gerarPDF(
  templateName: string,
  data: Record<string, any>,
  options?: GerarPdfOptions
) {
  const filename = options?.filename ?? 'documento.pdf';
  const orientation = options?.orientation ?? 'portrait';
  const debug = !!options?.debug;

  // 1) Carrega template
  const res = await fetch(`/pdf-templates/${templateName}.html`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Erro ao carregar template ${templateName}.html`);
  let html = await res.text();

  // 2) Substituição de placeholders
  //    - [[CHAVE]] primeiro
  //    - depois CHAVE “pura” (borda de palavra)
  for (const [key, raw] of Object.entries(data)) {
    const val = String(raw ?? '');
    html = html.replace(new RegExp(`\\[\\[${escapeRE(key)}\\]\\]`, 'g'), val);
    html = html.replace(new RegExp(`\\b${escapeRE(key)}\\b`, 'g'), val);
  }

  // Garante .hidden
  if (!/\.hidden\s*\{/.test(html)) {
    html = html.replace(/<\/head>/i, `<style>.hidden{display:none!important}</style></head>`);
  }

  // 3) Injeta no DOM — invisível, mas **dentro** da viewport (evita branco)
  const wrapper = document.createElement('div');
  wrapper.id = `pdf-wrapper-${Date.now()}`;
  wrapper.style.position = 'fixed';
  wrapper.style.left = '0';
  wrapper.style.top = '0';
  wrapper.style.opacity = debug ? '0.01' : '0';  // se debug, dá pra ver piscando
  wrapper.style.pointerEvents = 'none';
  wrapper.style.zIndex = '-1';
  wrapper.style.width = '794px'; // ≈ A4 @96dpi
  wrapper.style.background = '#fff';
  wrapper.innerHTML = html;
  document.body.appendChild(wrapper);

  // (Opcional) Remover imagens para diagnosticar CORS
  if (options?.stripImages) {
    wrapper.querySelectorAll('img').forEach(img => img.remove());
  }

  try {
    // 4) Aguarda fontes e imagens
    try {
      // @ts-ignore
      if (document.fonts?.ready) await (document as any).fonts.ready;
    } catch { }
    await waitForImages(wrapper);

    // 5) Import robusto p/ Vite/ESM
    const mod = await import('html2pdf.js');
    const html2pdf = (mod as any).default ?? (mod as any);

    const opt = {
      margin: [0, 0, 0, 0],
      filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        allowTaint: true,          // ajuda em alguns hosts
        backgroundColor: '#ffffff',
        windowWidth: 794,
        windowHeight: 1123,
        // foreignObjectRendering pode ajudar dependendo do CSS:
        // foreignObjectRendering: true,
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation },
      pagebreak: { mode: ['css', 'legacy'] },
    } as const;

    // 6) Gera e salva
    await html2pdf().set(opt).from(wrapper).save();
  } finally {
    if (!debug) wrapper.remove();
  }
}
