import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';

export interface CertificateData {
  recipientName: string;
  courseName: string;
  courseSlug: string;
  completionDate: number;
  issuedDate: number;
  certificateId: string;
  issuerName: string;
  issuerUrl: string;
  skills: string[];
  xpEarned: number;
  level: number;
  verificationUrl: string;
  qrCodeData?: string;
}

export interface VerifiableCredential {
  '@context': string[];
  id: string;
  type: string[];
  issuer: string;
  issuanceDate: string;
  expirationDate?: string;
  credentialSubject: {
    id: string;
    name: string;
    credential: {
      courseName: string;
      courseSlug: string;
      completionDate: string;
      skills: string[];
      xpEarned: number;
      level: number;
    };
  };
  proof: {
    type: string;
    created: string;
    proofPurpose: string;
    verificationMethod: string;
    jws: string;
  };
}

export interface CertificateTemplate {
  id: string;
  name: string;
  width: number;
  height: number;
  backgroundColor: string;
  backgroundImage?: string;
  fonts: {
    title: { font: string; size: number; color: string };
    subtitle: { font: string; size: number; color: string };
    body: { font: string; size: number; color: string };
    footer: { font: string; size: number; color: string };
  };
  layout: {
    titlePosition: { x: number; y: number };
    subtitlePosition: { x: number; y: number };
    recipientPosition: { x: number; y: number };
    coursePosition: { x: number; y: number };
    datePosition: { x: number; y: number };
    qrCodePosition?: { x: number; y: number; size: number };
    logoPosition?: { x: number; y: number; width: number; height: number };
    signaturePosition?: { x: number; y: number };
  };
  elements: CertificateElement[];
}

export interface CertificateElement {
  type: 'text' | 'line' | 'rect' | 'image' | 'qr';
  position: { x: number; y: number };
  size?: { width: number; height: number };
  style?: {
    color?: string;
    fontSize?: number;
    fontFamily?: string;
    bold?: boolean;
    opacity?: number;
  };
  content?: string;
  dataKey?: string; // Key in certificate data to use
}

export class CertificateGenerator {
  private templates = new Map<string, CertificateTemplate>();
  private defaultTemplate: CertificateTemplate;

  constructor() {
    this.defaultTemplate = this.createDefaultTemplate();
    this.templates.set('default', this.defaultTemplate);
  }

  private createDefaultTemplate(): CertificateTemplate {
    return {
      id: 'default',
      name: 'Default Certificate',
      width: 1000,
      height: 700,
      backgroundColor: '#0d1117',
      fonts: {
        title: { font: 'Helvetica-Bold', size: 36, color: '#58a6ff' },
        subtitle: { font: 'Helvetica', size: 18, color: '#8b949e' },
        body: { font: 'Helvetica', size: 24, color: '#e6edf3' },
        footer: { font: 'Helvetica', size: 12, color: '#8b949e' },
      },
      layout: {
        titlePosition: { x: 500, y: 150 },
        subtitlePosition: { x: 500, y: 200 },
        recipientPosition: { x: 500, y: 300 },
        coursePosition: { x: 500, y: 360 },
        datePosition: { x: 500, y: 420 },
        qrCodePosition: { x: 850, y: 550, size: 100 },
        logoPosition: { x: 500, y: 100, width: 80, height: 80 },
        signaturePosition: { x: 150, y: 580 },
      },
      elements: [
        {
          type: 'text',
          position: { x: 500, y: 150 },
          style: { color: '#58a6ff', fontSize: 36, fontFamily: 'Helvetica-Bold', bold: true },
          dataKey: 'title',
        },
        {
          type: 'text',
          position: { x: 500, y: 200 },
          style: { color: '#8b949e', fontSize: 18, fontFamily: 'Helvetica' },
          dataKey: 'subtitle',
        },
        {
          type: 'text',
          position: { x: 500, y: 300 },
          style: { color: '#e6edf3', fontSize: 28, fontFamily: 'Helvetica-Bold', bold: true },
          dataKey: 'recipientName',
        },
        {
          type: 'text',
          position: { x: 500, y: 360 },
          style: { color: '#e6edf3', fontSize: 20, fontFamily: 'Helvetica' },
          dataKey: 'courseName',
        },
        {
          type: 'text',
          position: { x: 500, y: 420 },
          style: { color: '#8b949e', fontSize: 14, fontFamily: 'Helvetica' },
          dataKey: 'completionDate',
        },
        {
          type: 'qr',
          position: { x: 850, y: 550 },
          size: { width: 100, height: 100 },
        },
      ],
    };
  }

  registerTemplate(template: CertificateTemplate): void {
    this.templates.set(template.id, template);
  }

  async generateCertificate(data: CertificateData, templateId = 'default'): Promise<Uint8Array> {
    const template = this.templates.get(templateId) || this.defaultTemplate;
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([template.width, template.height]);

    // Draw background
    page.drawRectangle({
      x: 0,
      y: 0,
      width: template.width,
      height: template.height,
      color: rgb(...this.hexToRgb(template.backgroundColor)),
    });

    // Load fonts
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Generate QR code if verification URL provided
    let qrCodeImage: any = null;
    if (data.verificationUrl) {
      const qrCodeDataUrl = await QRCode.toDataURL(data.verificationUrl, {
        width: template.layout.qrCodePosition?.size || 100,
        margin: 1,
        color: {
          dark: '#58a6ff',
          light: '#0d1117',
        },
      });
      const qrCodeBytes = this.dataUrlToBytes(qrCodeDataUrl);
      qrCodeImage = await pdfDoc.embedPng(qrCodeBytes);
    }

    // Draw elements
    for (const element of template.elements) {
      await this.drawElement(page, element, data, template, helvetica, helveticaBold, qrCodeImage);
    }

    // Add border
    page.drawRectangle({
      x: 20,
      y: 20,
      width: template.width - 40,
      height: template.height - 40,
      borderColor: rgb(0.34, 0.65, 1),
      borderWidth: 2,
    });

    // Add decorative corners
    this.drawCornerDecorations(page, template);

    return pdfDoc.save();
  }

  private async drawElement(
    page: any,
    element: CertificateElement,
    data: CertificateData,
    template: CertificateTemplate,
    helvetica: any,
    helveticaBold: any,
    qrCodeImage: any
  ): Promise<void> {
    const font = element.style?.bold ? helveticaBold : helvetica;
    const fontSize = element.style?.fontSize || template.fonts.body.size;
    const color = element.style?.color ? this.hexToRgb(element.style.color) : this.hexToRgb(template.fonts.body.color);
    const x = element.position.x;
    const y = template.height - element.position.y; // PDF coordinates are bottom-up

    switch (element.type) {
      case 'text':
        let text = element.content || '';
        if (element.dataKey && data[element.dataKey as keyof CertificateData]) {
          const value = data[element.dataKey as keyof CertificateData];
          text = Array.isArray(value) ? value.join(', ') : String(value);
        }
        if (element.dataKey === 'completionDate' || element.dataKey === 'issuedDate') {
          text = new Date(Number(text)).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });
        }
        page.drawText(text, {
          x: x - (element.style?.fontSize || 12) * text.length * 0.3, // Rough centering
          y,
          size: fontSize,
          font,
          color: rgb(...color),
          opacity: element.style?.opacity || 1,
        });
        break;

      case 'qr':
        if (qrCodeImage && template.layout.qrCodePosition) {
          const qrPos = template.layout.qrCodePosition;
          page.drawImage(qrCodeImage, {
            x: qrPos.x,
            y: template.height - qrPos.y - qrPos.size,
            width: qrPos.size,
            height: qrPos.size,
          });
        }
        break;

      case 'line':
        page.drawLine({
          start: { x: element.position.x, y: template.height - element.position.y },
          end: { x: element.position.x + (element.size?.width || 100), y: template.height - element.position.y },
          thickness: element.style?.fontSize || 1,
          color: rgb(...color),
          opacity: element.style?.opacity || 1,
        });
        break;

      case 'rect':
        page.drawRectangle({
          x: element.position.x,
          y: template.height - element.position.y - (element.size?.height || 10),
          width: element.size?.width || 100,
          height: element.size?.height || 10,
          color: rgb(...color),
          opacity: element.style?.opacity || 1,
        });
        break;
    }
  }

  private drawCornerDecorations(page: any, template: CertificateTemplate): void {
    const cornerSize = 30;
    const color = rgb(0.34, 0.65, 1);
    
    // Top-left
    page.drawLine({ start: { x: 30, y: template.height - 30 }, end: { x: 30 + cornerSize, y: template.height - 30 }, thickness: 2, color });
    page.drawLine({ start: { x: 30, y: template.height - 30 }, end: { x: 30, y: template.height - 30 - cornerSize }, thickness: 2, color });
    
    // Top-right
    page.drawLine({ start: { x: template.width - 30, y: template.height - 30 }, end: { x: template.width - 30 - cornerSize, y: template.height - 30 }, thickness: 2, color });
    page.drawLine({ start: { x: template.width - 30, y: template.height - 30 }, end: { x: template.width - 30, y: template.height - 30 - cornerSize }, thickness: 2, color });
    
    // Bottom-left
    page.drawLine({ start: { x: 30, y: 30 }, end: { x: 30 + cornerSize, y: 30 }, thickness: 2, color });
    page.drawLine({ start: { x: 30, y: 30 }, end: { x: 30, y: 30 + cornerSize }, thickness: 2, color });
    
    // Bottom-right
    page.drawLine({ start: { x: template.width - 30, y: 30 }, end: { x: template.width - 30 - cornerSize, y: 30 }, thickness: 2, color });
    page.drawLine({ start: { x: template.width - 30, y: 30 }, end: { x: template.width - 30, y: 30 + cornerSize }, thickness: 2, color });
  }

  private hexToRgb(hex: string): [number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16) / 255,
      parseInt(result[2], 16) / 255,
      parseInt(result[3], 16) / 255,
    ] : [0, 0, 0];
  }

  private dataUrlToBytes(dataUrl: string): Uint8Array {
    const base64 = dataUrl.split(',')[1];
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
}

export class CredentialManager {
  async createVerifiableCredential(data: CertificateData): Promise<VerifiableCredential> {
    const credential: VerifiableCredential = {
      '@context': [
        'https://www.w3.org/2018/credentials/v1',
        'https://www.w3.org/2018/credentials/examples/v1',
      ],
      id: `urn:uuid:${data.certificateId}`,
      type: ['VerifiableCredential', 'CourseCompletionCredential'],
      issuer: data.issuerUrl,
      issuanceDate: new Date(data.issuedDate).toISOString(),
      credentialSubject: {
        id: `did:codeforge:${data.recipientName.toLowerCase().replace(/\s+/g, '-')}`,
        name: data.recipientName,
        credential: {
          courseName: data.courseName,
          courseSlug: data.courseSlug,
          completionDate: new Date(data.completionDate).toISOString(),
          skills: data.skills,
          xpEarned: data.xpEarned,
          level: data.level,
        },
      },
      proof: {
        type: 'Ed25519Signature2020',
        created: new Date().toISOString(),
        proofPurpose: 'assertionMethod',
        verificationMethod: `${data.issuerUrl}#key-1`,
        jws: '', // Would be signed with private key
      },
    };

    return credential;
  }

  async verifyCredential(credential: VerifiableCredential): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Check required fields
    if (!credential['@context'] || !credential['@context'].includes('https://www.w3.org/2018/credentials/v1')) {
      errors.push('Invalid @context');
    }
    if (!credential.type || !credential.type.includes('VerifiableCredential')) {
      errors.push('Missing VerifiableCredential type');
    }
    if (!credential.issuer) {
      errors.push('Missing issuer');
    }
    if (!credential.credentialSubject) {
      errors.push('Missing credentialSubject');
    }
    if (!credential.proof || !credential.proof.jws) {
      errors.push('Missing or invalid proof');
    }

    // Verify signature (would use public key in production)
    // const isValid = await this.verifySignature(credential);
    // if (!isValid) errors.push('Invalid signature');

    return { valid: errors.length === 0, errors };
  }
}

export function createCertificateGenerator(): CertificateGenerator {
  return new CertificateGenerator();
}

export function createCredentialManager(): CredentialManager {
  return new CredentialManager();
}

// Built-in certificate templates
export const CERTIFICATE_TEMPLATES: Record<string, any> = {
  modern: {
    id: 'modern',
    name: 'Modern Dark',
    backgroundColor: '#0d1117',
    primaryColor: '#58a6ff',
    accentColor: '#bc8cff',
  },
  classic: {
    id: 'classic',
    name: 'Classic Light',
    backgroundColor: '#ffffff',
    primaryColor: '#0969da',
    accentColor: '#8250df',
  },
  minimal: {
    id: 'minimal',
    name: 'Minimal',
    backgroundColor: '#fafafa',
    primaryColor: '#24292f',
    accentColor: '#0969da',
  },
};