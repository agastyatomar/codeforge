import { Palette, ChevronRight, ChevronLeft, Check, X, User, Shirt, Glasses, Hat, Sparkles, RotateCcw, Download, Upload } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useState } from 'react';
import { AvatarComposer, createAvatarComposer, DEFAULT_ASSETS } from '@codeforge/avatar/composer';
import { AvatarPreviewGenerator, createAvatarPreviewGenerator } from '@codeforge/avatar/preview';

export function AvatarCustomizer() {
  const [config, setConfig] = useState({
    skinTone: 0,
    hairStyle: 0,
    hairColor: 0,
    outfitStyle: 0,
    outfitColor: 0,
    background: 0,
  });
  const [preview, setPreview] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  const composer = createAvatarComposer(DEFAULT_ASSETS);
  const previewGenerator = createAvatarPreviewGenerator(composer);

  const generatePreview = async () => {
    setIsGenerating(true);
    try {
      const dataUrl = await previewGenerator.generatePreview(config, { size: 256 });
      setPreview(dataUrl);
    } catch (error) {
      console.error('Failed to generate preview:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleChange = (key: string, value: number) => {
    setConfig(prev => ({ ...prev, [key]: value }));
    generatePreview();
  };

  const getOptions = (category: keyof typeof DEFAULT_ASSETS, subCategory?: string) => {
    if (category === 'skinTones') return DEFAULT_ASSETS.skinTones;
    if (category === 'hairStyles') {
      const style = DEFAULT_ASSETS.hairStyles[config.hairStyle];
      return subCategory === 'colors' ? style.colors : DEFAULT_ASSETS.hairStyles.map((s, i) => ({ id: i, name: s.base }));
    }
    if (category === 'outfits') {
      const outfit = DEFAULT_ASSETS.outfits[config.outfitStyle];
      return subCategory === 'colors' ? outfit.colors : DEFAULT_ASSETS.outfits.map((o, i) => ({ id: i, name: o.base }));
    }
    if (category === 'backgrounds') return DEFAULT_ASSETS.backgrounds.map((b, i) => ({ id: i, name: b }));
    return [];
  };

  const renderColorOptions = (colors: string[], selected: number, onChange: (index: number) => void) => (
    <div className="flex flex-wrap gap-2">
      {colors.map((color, i) => (
        <button
          key={i}
          onClick={() => onChange(i)}
          className={`w-8 h-8 rounded-full border-2 transition-all ${
            i === selected ? 'border-primary scale-110' : 'border-transparent hover:border-primary/50'
          }`}
          style={{ backgroundColor: color }}
          aria-label={`Color ${i + 1}`}
        />
      ))}
    </div>
  );

  const renderStyleOptions = (styles: { id: number; name: string }[], selected: number, onChange: (index: number) => void) => (
    <div className="flex flex-wrap gap-2">
      {styles.map((style, i) => (
        <button
          key={i}
          onClick={() => onChange(i)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            i === selected
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-accent'
          }`}
        >
          {style.name}
        </button>
      ))}
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Sparkles className="text-primary" />
            Avatar Customizer
          </h1>
          <p className="text-muted-foreground mt-1">Create your unique character for CodeForge Worlds</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => generatePreview()}>
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
          <Button variant="outline" onClick={() => { /* upload logic */ }}>
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Preview Panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card p-6">
            <h3 className="font-semibold mb-4">Preview</h3>
            <div className="aspect-square bg-muted rounded-xl flex items-center justify-center relative overflow-hidden">
              {preview ? (
                <img src={preview} alt="Avatar preview" className="w-full h-full object-cover" />
              ) : (
                <div className="w-64 h-64 mx-auto bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-full flex items-center justify-center text-8xl">
                  👤
                </div>
              )}
              {isGenerating && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-xl">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-4">
              <Button variant="outline" className="flex-1" onClick={() => { /* rotate */ }}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Rotate
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => { /* randomize */ }}>
                <Sparkles className="w-4 h-4 mr-2" />
                Random
              </Button>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="font-semibold mb-4">Quick Stats</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Skin Tones</span>
                <span className="font-medium">{DEFAULT_ASSETS.skinTones.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Hair Styles</span>
                <span className="font-medium">{DEFAULT_ASSETS.hairStyles.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Hair Colors</span>
                <span className="font-medium">{DEFAULT_ASSETS.hairStyles[0]?.colors.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Outfits</span>
                <span className="font-medium">{DEFAULT_ASSETS.outfits.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Outfit Colors</span>
                <span className="font-medium">{DEFAULT_ASSETS.outfits[0]?.colors.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Backgrounds</span>
                <span className="font-medium">{DEFAULT_ASSETS.backgrounds.length}</span>
              </div>
              <div className="flex justify-between border-t pt-3">
                <span className="font-medium">Total Combinations</span>
                <span className="font-bold text-primary">10,000+</span>
              </div>
            </div>
          </div>
        </div>

        {/* Customization Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Skin Tone */}
          <div className="card p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Skin Tone
            </h3>
            <div className="flex flex-wrap gap-3">
              {DEFAULT_ASSETS.skinTones.map((color, i) => (
                <button
                  key={i}
                  onClick={() => handleChange('skinTone', i)}
                  className={`w-14 h-14 rounded-full border-3 transition-all ${
                    i === config.skinTone ? 'border-primary scale-110' : 'border-transparent hover:border-primary/50'
                  }`}
                  style={{ backgroundColor: color }}
                  aria-label={`Skin tone ${i + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Hair Style */}
          <div className="card p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Hair Style
            </h3>
            {renderStyleOptions(
              DEFAULT_ASSETS.hairStyles.map((s, i) => ({ id: i, name: s.base.charAt(0).toUpperCase() + s.base.slice(1) })),
              config.hairStyle,
              (i) => handleChange('hairStyle', i)
            )}
            <div className="mt-4">
              <label className="label">Hair Color</label>
              {renderColorOptions(
                DEFAULT_ASSETS.hairStyles[config.hairStyle].colors,
                config.hairColor,
                (i) => handleChange('hairColor', i)
              )}
            </div>
          </div>

          {/* Outfit */}
          <div className="card p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Shirt className="w-5 h-5 text-primary" />
              Outfit
            </h3>
            {renderStyleOptions(
              DEFAULT_ASSETS.outfits.map((o, i) => ({ id: i, name: o.base.replace('outfit-', '').charAt(0).toUpperCase() + o.base.replace('outfit-', '').slice(1) })),
              config.outfitStyle,
              (i) => handleChange('outfitStyle', i)
            )}
            <div className="mt-4">
              <label className="label">Outfit Color</label>
              {renderColorOptions(
                DEFAULT_ASSETS.outfits[config.outfitStyle].colors,
                config.outfitColor,
                (i) => handleChange('outfitColor', i)
              )}
            </div>
          </div>

          {/* Background */}
          <div className="card p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Background
            </h3>
            <div className="flex flex-wrap gap-3">
              {DEFAULT_ASSETS.backgrounds.map((bg, i) => (
                <button
                  key={i}
                  onClick={() => handleChange('background', i)}
                  className={`w-20 h-20 rounded-lg border-3 transition-all flex items-center justify-center ${
                    i === config.background ? 'border-primary scale-110' : 'border-transparent hover:border-primary/50'
                  }`}
                  style={{ background: `linear-gradient(135deg, #0d1117, #161b22)` }}
                  aria-label={`Background ${i + 1}`}
                >
                  <span className="text-3xl">🎨</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Save Section */}
      <div className="card p-6 border-primary/20 bg-primary/5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Ready to save your avatar?</h3>
            <p className="text-muted-foreground">Your avatar will be used in CodeForge Worlds and your profile</p>
          </div>
          <Button size="lg" onClick={() => { /* save logic */ }}>
            <Sparkles className="w-4 h-4 mr-2" />
            Save Avatar
          </Button>
        </div>
      </div>
    </div>
  );
}