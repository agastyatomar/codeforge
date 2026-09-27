export interface PreviewConfig {
  buildId: string;
  entryPoint: string;
  files: Map<string, { content: string; language: string }>;
  assets: Map<string, { data: string; type: string }>;
}

export interface PreviewResult {
  html: string;
  urls: Map<string, string>;
}

export class PreviewRenderer {
  private config: PreviewConfig;
  private serviceWorkerCode: string;

  constructor(config: PreviewConfig) {
    this.config = config;
    this.serviceWorkerCode = this.generateServiceWorker();
  }

  render(): PreviewResult {
    const entryFile = this.config.files.get(this.config.entryPoint);
    if (!entryFile) {
      throw new Error(`Entry point not found: ${this.config.entryPoint}`);
    }

    let html = entryFile.content;

    if (this.config.entryPoint.endsWith('.html')) {
      html = this.processHtml(html);
    }

    const urls = new Map<string, string>();
    for (const [path, file] of this.config.files) {
      if (path !== this.config.entryPoint) {
        urls.set(path, `/preview/${this.config.buildId}/${path}`);
      }
    }
    for (const [path, asset] of this.config.assets) {
      urls.set(path, `/preview/${this.config.buildId}/${path}`);
    }

    return { html, urls };
  }

  private processHtml(html: string): string {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const links = doc.querySelectorAll('link[rel="stylesheet"]');
    for (const link of links) {
      const href = link.getAttribute('href');
      if (href && !href.startsWith('http') && !href.startsWith('/')) {
        link.setAttribute('href', `/preview/${this.config.buildId}/${href}`);
      }
    }

    const scripts = doc.querySelectorAll('script[src]');
    for (const script of scripts) {
      const src = script.getAttribute('src');
      if (src && !src.startsWith('http') && !src.startsWith('/')) {
        script.setAttribute('src', `/preview/${this.config.buildId}/${src}`);
      }
    }

    const images = doc.querySelectorAll('img[src]');
    for (const img of images) {
      const src = img.getAttribute('src');
      if (src && !src.startsWith('http') && !src.startsWith('/') && !src.startsWith('data:')) {
        img.setAttribute('src', `/preview/${this.config.buildId}/${src}`);
      }
    }

    const base = doc.createElement('base');
    base.setAttribute('href', `/preview/${this.config.buildId}/`);
    if (doc.head) {
      doc.head.insertBefore(base, doc.head.firstChild);
    }

    const swScript = doc.createElement('script');
    swScript.textContent = `
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/preview/${this.config.buildId}/sw.js', {
          scope: '/preview/${this.config.buildId}/'
        }).catch(console.error);
      }
    `;
    if (doc.head) {
      doc.head.appendChild(swScript);
    }

    return doc.documentElement.outerHTML;
  }

  private generateServiceWorker(): string {
    const fileMap: Record<string, { content: string; language: string }> = {};
    for (const [path, file] of this.config.files) {
      fileMap[path] = file;
    }

    const assetMap: Record<string, { data: string; type: string }> = {};
    for (const [path, asset] of this.config.assets) {
      assetMap[path] = asset;
    }

    return `
const FILE_MAP = ${JSON.stringify(fileMap)};
const ASSET_MAP = ${JSON.stringify(assetMap)};

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const path = url.pathname.replace('/preview/${this.config.buildId}/', '');

  if (FILE_MAP[path]) {
    const file = FILE_MAP[path];
    const mimeType = getMimeType(path);
    event.respondWith(new Response(file.content, {
      headers: { 'Content-Type': mimeType, 'Cache-Control': 'no-cache' }
    }));
    return;
  }

  if (ASSET_MAP[path]) {
    const asset = ASSET_MAP[path];
    const binary = atob(asset.data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    event.respondWith(new Response(bytes, {
      headers: { 'Content-Type': asset.type, 'Cache-Control': 'public, max-age=31536000' }
    }));
    return;
  }

  event.respondWith(new Response('Not found', { status: 404 }));
});

function getMimeType(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase();
  const types: Record<string, string> = {
    html: 'text/html',
    css: 'text/css',
    js: 'application/javascript',
    mjs: 'application/javascript',
    json: 'application/json',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    svg: 'image/svg+xml',
    webp: 'image/webp',
    ico: 'image/x-icon',
    woff: 'font/woff',
    woff2: 'font/woff2',
    ttf: 'font/ttf',
    eot: 'application/vnd.ms-fontobject',
    wasm: 'application/wasm',
  };
  return types[ext || ''] || 'text/plain';
}
    `;
  }

  getServiceWorkerCode(): string {
    return this.serviceWorkerCode;
  }
}

export class LivePreviewManager {
  private iframe: HTMLIFrameElement | null = null;
  private renderer: PreviewRenderer;
  private updateTimeout: ReturnType<typeof setTimeout> | null = null;
  private pendingUpdates = new Map<string, string>();

  constructor(renderer: PreviewRenderer) {
    this.renderer = renderer;
  }

  attach(iframe: HTMLIFrameElement): void {
    this.iframe = iframe;
    this.reload();
  }

  detach(): void {
    this.iframe = null;
  }

  updateFile(path: string, content: string): void {
    this.pendingUpdates.set(path, content);

    if (this.updateTimeout) {
      clearTimeout(this.updateTimeout);
    }

    this.updateTimeout = setTimeout(() => {
      this.applyUpdates();
    }, 50);
  }

  private applyUpdates(): void {
    for (const [path, content] of this.pendingUpdates) {
      const file = this.renderer['config'].files.get(path);
      if (file) {
        file.content = content;
      }
    }
    this.pendingUpdates.clear();
    this.reload();
  }

  reload(): void {
    if (!this.iframe) return;

    const result = this.renderer.render();
    const blob = new Blob([result.html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    this.iframe.src = url;
  }

  destroy(): void {
    if (this.updateTimeout) {
      clearTimeout(this.updateTimeout);
    }
    if (this.iframe) {
      this.iframe.src = 'about:blank';
    }
  }
}

export function createPreviewRenderer(config: PreviewConfig): PreviewRenderer {
  return new PreviewRenderer(config);
}

export function createLivePreviewManager(renderer: PreviewRenderer): LivePreviewManager {
  return new LivePreviewManager(renderer);
}