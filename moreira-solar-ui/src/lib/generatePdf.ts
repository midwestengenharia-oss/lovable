// src/lib/pdf/generatePdf.ts
export type PdfGenOptions = {
    filename?: string;
    orientation?: 'portrait' | 'landscape';
};

function waitForImages(root: HTMLElement) {
    const imgs = Array.from(root.querySelectorAll<HTMLImageElement>('img'));
    if (!imgs.length) return Promise.resolve();

    const jobs = imgs.map(img => {
        // ajuda o html2canvas a carregar imagens remotas
        try {
            const url = img.getAttribute('src') || '';
            const isRemote = /^https?:\/\//i.test(url);
            if (isRemote && !img.crossOrigin) img.crossOrigin = 'anonymous';
        } catch { }

        if (img.complete && img.naturalWidth > 0) return Promise.resolve();
        return new Promise<void>(res => {
            const onDone = () => res();
            img.addEventListener('load', onDone, { once: true });
            img.addEventListener('error', onDone, { once: true });
        });
    });

    return Promise.all(jobs);
}

export async function generatePdfFromHtmlString(html: string, opts?: PdfGenOptions) {
    const filename = opts?.filename ?? 'proposta-moreira.pdf';
    const orientation = opts?.orientation ?? 'portrait';

    // 794x1123px ≈ A4 @96dpi — ajuda o html2canvas a paginar previsivelmente
    const wrapper = document.createElement('div');
    wrapper.id = `pdf-root-${Date.now()}`;
    wrapper.style.position = 'fixed';
    wrapper.style.left = '-99999px';
    wrapper.style.top = '0';
    wrapper.style.width = '794px';
    wrapper.style.background = '#fff';
    wrapper.innerHTML = html;

    document.body.appendChild(wrapper);

    try {
        // Aguarda fontes e imagens para evitar “letras trocadas”/imagens em branco
        if ('fonts' in document) {
            // @ts-ignore
            await (document as any).fonts.ready.catch(() => { });
        }
        await waitForImages(wrapper);

        const { default: html2pdf } = await import('html2pdf.js');

        const opt = {
            margin: [0, 0, 0, 0],
            filename,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: {
                scale: 2,                  // qualidade
                useCORS: true,             // carrega imagens remotas
                allowTaint: false,
                backgroundColor: '#ffffff',
                windowWidth: 794,
                windowHeight: 1123,
            },
            jsPDF: { unit: 'mm', format: 'a4', orientation },
            pagebreak: { mode: ['css', 'legacy'] }, // respeita page-break CSS
        } as const;

        await html2pdf().set(opt).from(wrapper).save();
    } finally {
        wrapper.remove(); // limpa do DOM
    }
}
