import { useState, useRef, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Upload, Plus, Trash2, Download, Save, Shuffle, Grid3X3 } from 'lucide-react'
import { blink } from '@/blink/client'
import { toast } from 'sonner'
import type { Template, TextLayer } from '@/types/template'

interface TemplateEditorProps {
  user: any
  onTemplateCreated: (template: Template) => void
  onBackToGallery: () => void
  initialTemplate?: Template | null
}

const PREMIUM_FONTS = [
  { name: 'Inter', category: 'Sans Serif' },
  { name: 'Playfair Display', category: 'Serif' },
  { name: 'Montserrat', category: 'Sans Serif' },
  { name: 'Roboto', category: 'Sans Serif' },
  { name: 'Open Sans', category: 'Sans Serif' },
  { name: 'Lato', category: 'Sans Serif' },
  { name: 'Poppins', category: 'Sans Serif' },
  { name: 'Oswald', category: 'Sans Serif' },
  { name: 'Merriweather', category: 'Serif' },
  { name: 'Raleway', category: 'Sans Serif' },
  { name: 'Source Sans Pro', category: 'Sans Serif' },
  { name: 'Nunito', category: 'Sans Serif' },
  { name: 'Crimson Text', category: 'Serif' },
  { name: 'Libre Baskerville', category: 'Serif' },
  { name: 'Dancing Script', category: 'Script' },
  { name: 'Pacifico', category: 'Script' },
  { name: 'Lobster', category: 'Script' },
  { name: 'Bebas Neue', category: 'Display' },
  { name: 'Anton', category: 'Display' },
  { name: 'Righteous', category: 'Display' }
]

export function TemplateEditor({ user, onTemplateCreated, initialTemplate, onBackToGallery }: TemplateEditorProps) {
  const [template, setTemplate] = useState<Template | null>(initialTemplate || null)
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const canvasRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (initialTemplate) {
      setTemplate(initialTemplate)
    }
  }, [initialTemplate])

  const selectedLayer = template?.textLayers.find(layer => layer.id === selectedLayerId)

  const saveTemplate = useCallback(async (silent = false) => {
    if (!template || !user) return

    setIsSaving(true)
    try {
      const templateData = {
        id: template.id,
        name: template.name,
        backgroundImage: template.backgroundImage,
        textLayers: JSON.stringify(template.textLayers),
        width: template.width,
        height: template.height,
        userId: user.id,
        createdAt: template.createdAt,
        updatedAt: new Date().toISOString(),
      }

      await blink.db.templates.upsert(templateData, { onConflict: ['id'] })
      if (!silent) {
        toast.success('Template saved successfully!')
        onTemplateCreated(template)
      }
    } catch (error) {
      console.error('Failed to save template:', error)
      if (!silent) {
        toast.error('Failed to save template')
      }
    } finally {
      setIsSaving(false)
    }
  }, [template, user, onTemplateCreated])

  // Auto-save template when it changes
  useEffect(() => {
    if (template && template.textLayers.length > 0) {
      const timeoutId = setTimeout(() => {
        saveTemplate(true) // Auto-save silently
      }, 2000)
      return () => clearTimeout(timeoutId)
    }
  }, [template, saveTemplate])

  const createNewTemplate = useCallback((backgroundImage: string, width: number, height: number) => {
    const newTemplate: Template = {
      id: `template-${Date.now()}`,
      name: 'Untitled Template',
      backgroundImage,
      textLayers: [],
      width,
      height,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    setTemplate(newTemplate)
  }, [])

  const processImageFile = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string
      
      const img = new Image()
      img.onload = () => {
        if (template) {
          const updatedTemplate = {
            ...template,
            backgroundImage: imageUrl,
            width: img.width,
            height: img.height,
            updatedAt: new Date().toISOString()
          }
          setTemplate(updatedTemplate)
        } else {
          createNewTemplate(imageUrl, img.width, img.height)
        }
      }
      img.src = imageUrl
    }
    reader.readAsDataURL(file)
  }, [template, createNewTemplate])

  const handleBackgroundUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    processImageFile(file)
  }, [processImageFile])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      processImageFile(file)
      toast.success('Background image uploaded!')
    }
  }, [processImageFile])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const addTextLayer = useCallback(() => {
    if (!template) return

    const newLayer: TextLayer = {
      id: `layer-${Date.now()}`,
      text: 'New Text',
      x: 100,
      y: 100,
      fontSize: 24,
      fontFamily: 'Inter',
      color: '#000000',
      fontWeight: 'normal',
      textAlign: 'left',
      isVariable: false,
      textShadow: {
        enabled: false,
        color: '#000000',
        offsetX: 2,
        offsetY: 2,
        blur: 4
      },
      textStroke: {
        enabled: false,
        color: '#000000',
        width: 1
      },
      opacity: 1,
      rotation: 0
    }

    const updatedTemplate = {
      ...template,
      textLayers: [...template.textLayers, newLayer],
      updatedAt: new Date().toISOString()
    }
    setTemplate(updatedTemplate)
    setSelectedLayerId(newLayer.id)
  }, [template])

  const updateTextLayer = useCallback((layerId: string, updates: Partial<TextLayer>) => {
    if (!template) return

    const updatedTemplate = {
      ...template,
      textLayers: template.textLayers.map(layer =>
        layer.id === layerId ? { ...layer, ...updates } : layer
      ),
      updatedAt: new Date().toISOString()
    }
    setTemplate(updatedTemplate)
  }, [template])

  const deleteTextLayer = useCallback((layerId: string) => {
    if (!template) return

    const updatedTemplate = {
      ...template,
      textLayers: template.textLayers.filter(layer => layer.id !== layerId),
      updatedAt: new Date().toISOString()
    }
    setTemplate(updatedTemplate)
    setSelectedLayerId(null)
  }, [template])

  // Enhanced drag and drop for text layers is now handled by framer-motion

  const autoArrangeTexts = useCallback(() => {
    if (!template || template.textLayers.length === 0) return

    const padding = 40
    const lineHeight = 60
    let currentY = padding

    const updatedLayers = template.textLayers.map((layer, index) => {
      const x = padding
      const y = currentY + (index * lineHeight)
      currentY = y
      
      return {
        ...layer,
        x,
        y: Math.min(y, template.height - 50)
      }
    })

    const updatedTemplate = {
      ...template,
      textLayers: updatedLayers,
      updatedAt: new Date().toISOString()
    }
    setTemplate(updatedTemplate)
    toast.success('Text layers arranged automatically!')
  }, [template])

  const gridArrangeTexts = useCallback(() => {
    if (!template || template.textLayers.length === 0) return

    const cols = Math.ceil(Math.sqrt(template.textLayers.length))
    const rows = Math.ceil(template.textLayers.length / cols)
    const cellWidth = (template.width - 80) / cols
    const cellHeight = (template.height - 80) / rows

    const updatedLayers = template.textLayers.map((layer, index) => {
      const col = index % cols
      const row = Math.floor(index / cols)
      const x = 40 + (col * cellWidth) + (cellWidth / 4)
      const y = 40 + (row * cellHeight) + (cellHeight / 2)
      
      return {
        ...layer,
        x: Math.min(x, template.width - 100),
        y: Math.min(y, template.height - 50)
      }
    })

    const updatedTemplate = {
      ...template,
      textLayers: updatedLayers,
      updatedAt: new Date().toISOString()
    }
    setTemplate(updatedTemplate)
    toast.success('Text layers arranged in grid!')
  }, [template])

  const exportImage = async () => {
    if (!template || !canvasRef.current) return

    try {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      canvas.width = template.width
      canvas.height = template.height

      if (template.backgroundImage) {
        const img = new Image()
        img.onload = () => {
          ctx.drawImage(img, 0, 0, template.width, template.height)
          
          template.textLayers.forEach(layer => {
            ctx.save()
            
            ctx.translate(layer.x, layer.y + layer.fontSize)
            ctx.rotate((layer.rotation || 0) * Math.PI / 180)
            ctx.globalAlpha = layer.opacity || 1
            
            ctx.font = `${layer.fontWeight} ${layer.fontSize}px "${layer.fontFamily}"`
            ctx.fillStyle = layer.color
            ctx.textAlign = layer.textAlign as CanvasTextAlign
            
            if (layer.textShadow?.enabled) {
              ctx.shadowColor = layer.textShadow.color
              ctx.shadowOffsetX = layer.textShadow.offsetX
              ctx.shadowOffsetY = layer.textShadow.offsetY
              ctx.shadowBlur = layer.textShadow.blur
            }
            
            if (layer.textStroke?.enabled) {
              ctx.strokeStyle = layer.textStroke.color
              ctx.lineWidth = layer.textStroke.width
              ctx.strokeText(layer.isVariable ? `{{${layer.variableName || layer.text}}}` : layer.text, 0, 0)
            }
            
            const text = layer.isVariable ? `{{${layer.variableName || layer.text}}}` : layer.text
            ctx.fillText(text, 0, 0)
            
            ctx.restore()
          })

          canvas.toBlob((blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `${template.name}.png`
              a.click()
              URL.revokeObjectURL(url)
            }
          })
        }
        img.src = template.backgroundImage
      }
    } catch (error) {
      console.error('Failed to export image:', error)
      toast.error('Failed to export image')
    }
  }

  if (!template) {
    return (
      <div 
        className="flex items-center justify-center h-96 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border-2 border-dashed border-gray-300 hover:border-primary/50 transition-all duration-300"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <div className="text-center">
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Create Your First Template</h3>
          <p className="text-gray-500 mb-4">Drag & drop an image here or click to upload</p>
          <Button onClick={() => fileInputRef.current?.click()} className="bg-primary hover:bg-primary/90">
            <Upload className="w-4 h-4 mr-2" />
            Upload Background
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleBackgroundUpload}
            className="hidden"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full gap-6">
      {/* Canvas Area */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1 mr-4 flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={onBackToGallery}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-left"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
            </Button>
            <Input
              value={template.name}
              onChange={(e) => setTemplate({ ...template, name: e.target.value })}
              className="text-xl font-semibold border-none p-0 h-auto bg-transparent focus:ring-0"
              placeholder="Template name..."
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => autoArrangeTexts()} size="sm">
              <Shuffle className="w-4 h-4 mr-2" />
              Auto Arrange
            </Button>
            <Button variant="outline" onClick={() => gridArrangeTexts()} size="sm">
              <Grid3X3 className="w-4 h-4 mr-2" />
              Grid Layout
            </Button>
            <Button variant="outline" onClick={() => saveTemplate()} disabled={isSaving}>
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
            <Button onClick={exportImage}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        <div className="flex-1 bg-white rounded-lg border shadow-sm overflow-auto p-4">
          <div className="flex items-center justify-center min-h-full">
            <div
              ref={canvasRef}
              className="relative bg-gray-100 shadow-lg cursor-crosshair"
              style={{
                width: Math.min(template.width, 800),
                height: Math.min(template.height, (template.height / template.width) * 800),
                maxWidth: '100%'
              }}
            >
              {/* Background Image */}
              {template.backgroundImage && (
                <img
                  src={template.backgroundImage}
                  alt="Background"
                  className="absolute inset-0 w-full h-full object-cover"
                  draggable={false}
                />
              )}

              {/* Text Layers */}
              <div
                className="absolute inset-0"
                style={{
                  transform: `scale(${Math.min(800 / template.width, 1)})`,
                  transformOrigin: 'top left'
                }}
              >
                {template.textLayers.map((layer) => {
                  const textShadow = layer.textShadow?.enabled 
                    ? `${layer.textShadow.offsetX}px ${layer.textShadow.offsetY}px ${layer.textShadow.blur}px ${layer.textShadow.color}`
                    : 'none'
                  
                  const textStroke = layer.textStroke?.enabled
                    ? `-webkit-text-stroke: ${layer.textStroke.width}px ${layer.textStroke.color};`
                    : ''

                  return (
                    <motion.div
                      key={layer.id}
                      drag
                      dragMomentum={false}
                      dragConstraints={canvasRef}
                      onDragEnd={(_event, info) => {
                        const scale = Math.min(800 / template.width, 1)
                        updateTextLayer(layer.id, { 
                          x: layer.x + info.offset.x / scale,
                          y: layer.y + info.offset.y / scale
                        })
                      }}
                      className={`absolute cursor-move select-none transition-all duration-200 hover:scale-105 ${ 
                        selectedLayerId === layer.id 
                          ? 'ring-2 ring-primary ring-offset-2 bg-primary/10' 
                          : 'hover:ring-1 hover:ring-gray-300 hover:bg-gray-50/50'
                      }`}
                      style={{
                        left: layer.x,
                        top: layer.y,
                        fontSize: layer.fontSize,
                        fontFamily: `"${layer.fontFamily}", sans-serif`,
                        color: layer.color,
                        fontWeight: layer.fontWeight,
                        textAlign: layer.textAlign,
                        textShadow,
                        opacity: layer.opacity || 1,
                        transform: `rotate(${layer.rotation || 0}deg)`,
                        padding: '4px 8px',
                        borderRadius: '4px',
                        minWidth: '50px',
                        minHeight: '30px',
                        ...textStroke && { WebkitTextStroke: `${layer.textStroke?.width}px ${layer.textStroke?.color}` }
                      }}
                      onClick={() => setSelectedLayerId(layer.id)}
                    >
                      {layer.isVariable ? `{{${layer.variableName || layer.text}}}` : layer.text}
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls Panel */}
      <div className="w-80 space-y-6">
        {/* Background Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Background</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-4 h-4 mr-2" />
              Change Background
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleBackgroundUpload}
              className="hidden"
            />
            <div className="text-xs text-gray-500">
              Dimensions: {template.width} × {template.height}
            </div>
          </CardContent>
        </Card>

        {/* Text Layers */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center justify-between">
              Text Layers ({template.textLayers.length})
              <Button size="sm" onClick={addTextLayer}>
                <Plus className="w-4 h-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {template.textLayers.map((layer, index) => (
              <div
                key={layer.id}
                className={`p-3 rounded border cursor-pointer transition-all duration-200 ${ 
                  selectedLayerId === layer.id 
                    ? 'border-primary bg-primary/5 shadow-sm' 
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => setSelectedLayerId(layer.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {layer.isVariable ? `{{${layer.variableName || layer.text}}}` : layer.text}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {layer.fontFamily} • {layer.fontSize}px
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteTextLayer(layer.id)
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
            {template.textLayers.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">
                No text layers yet. Click + to add one.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Layer Properties */}
        {selectedLayer && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Layer Properties</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs defaultValue="content" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="content">Content</TabsTrigger>
                  <TabsTrigger value="style">Style</TabsTrigger>
                  <TabsTrigger value="effects">Effects</TabsTrigger>
                </TabsList>
                
                <TabsContent value="content" className="space-y-4">
                  <div>
                    <Label htmlFor="text">Text</Label>
                    <Input
                      id="text"
                      value={selectedLayer.text}
                      onChange={(e) => updateTextLayer(selectedLayer.id, { text: e.target.value })}
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={selectedLayer.isVariable}
                      onCheckedChange={(checked) => updateTextLayer(selectedLayer.id, { isVariable: checked })}
                    />
                    <Label>Make Variable</Label>
                  </div>
                  
                  {selectedLayer.isVariable && (
                    <div>
                      <Label htmlFor="variableName">Variable Name</Label>
                      <Input
                        id="variableName"
                        value={selectedLayer.variableName || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateTextLayer(selectedLayer.id, { variableName: e.target.value })}
                        placeholder="e.g., name, title, date"
                      />
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="style" className="space-y-4">
                  <div>
                    <Label>Font Size: {selectedLayer.fontSize}px</Label>
                    <Slider
                      value={[selectedLayer.fontSize]}
                      onValueChange={([value]: number[]) => updateTextLayer(selectedLayer.id, { fontSize: value })}
                      min={12}
                      max={120}
                      step={1}
                      className="mt-2"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="fontFamily">Font Family</Label>
                    <Select
                      value={selectedLayer.fontFamily}
                      onValueChange={(value: string) => updateTextLayer(selectedLayer.id, { fontFamily: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {PREMIUM_FONTS.map((font) => (
                          <SelectItem key={font.name} value={font.name}>
                            <div className="flex items-center justify-between w-full">
                              <span style={{ fontFamily: `"${font.name}", sans-serif` }}>
                                {font.name}
                              </span>
                              <span className="text-xs text-gray-500 ml-2">
                                {font.category}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="color">Color</Label>
                    <Input
                      id="color"
                      type="color"
                      value={selectedLayer.color}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateTextLayer(selectedLayer.id, { color: e.target.value })}
                      className="h-10"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="fontWeight">Font Weight</Label>
                    <Select
                      value={selectedLayer.fontWeight}
                      onValueChange={(value: 'normal' | 'bold') => updateTextLayer(selectedLayer.id, { fontWeight: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="bold">Bold</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="textAlign">Text Align</Label>
                    <Select
                      value={selectedLayer.textAlign}
                      onValueChange={(value: 'left' | 'center' | 'right') => updateTextLayer(selectedLayer.id, { textAlign: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">Left</SelectItem>
                        <SelectItem value="center">Center</SelectItem>
                        <SelectItem value="right">Right</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>
                
                <TabsContent value="effects" className="space-y-4">
                  <div>
                    <Label>Opacity: {Math.round((selectedLayer.opacity || 1) * 100)}%</Label>
                    <Slider
                      value={[(selectedLayer.opacity || 1) * 100]}
                      onValueChange={([value]) => updateTextLayer(selectedLayer.id, { opacity: value / 100 })}
                      min={0}
                      max={100}
                      step={1}
                      className="mt-2"
                    />
                  </div>
                  
                  <div>
                    <Label>Rotation: {selectedLayer.rotation || 0}°</Label>
                    <Slider
                      value={[selectedLayer.rotation || 0]}
                      onValueChange={([value]) => updateTextLayer(selectedLayer.id, { rotation: value })}
                      min={-180}
                      max={180}
                      step={1}
                      className="mt-2"
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={selectedLayer.textShadow?.enabled || false}
                        onCheckedChange={(checked) => updateTextLayer(selectedLayer.id, { 
                          textShadow: { 
                            ...selectedLayer.textShadow,
                            enabled: checked,
                            color: selectedLayer.textShadow?.color || '#000000',
                            offsetX: selectedLayer.textShadow?.offsetX || 2,
                            offsetY: selectedLayer.textShadow?.offsetY || 2,
                            blur: selectedLayer.textShadow?.blur || 4
                          } 
                        })}
                      />
                      <Label>Text Shadow</Label>
                    </div>
                    
                    {selectedLayer.textShadow?.enabled && (
                      <div className="space-y-3 pl-6">
                        <div>
                          <Label htmlFor="shadowColor">Shadow Color</Label>
                          <Input
                            id="shadowColor"
                            type="color"
                            value={selectedLayer.textShadow?.color || '#000000'}
                            onChange={(e) => updateTextLayer(selectedLayer.id, { 
                              textShadow: { ...selectedLayer.textShadow!, color: e.target.value } 
                            })}
                            className="h-8"
                          />
                        </div>
                        <div>
                          <Label>Offset X: {selectedLayer.textShadow?.offsetX || 0}px</Label>
                          <Slider
                            value={[selectedLayer.textShadow?.offsetX || 0]}
                            onValueChange={([value]) => updateTextLayer(selectedLayer.id, { 
                              textShadow: { ...selectedLayer.textShadow!, offsetX: value } 
                            })}
                            min={-20}
                            max={20}
                            step={1}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>Offset Y: {selectedLayer.textShadow?.offsetY || 0}px</Label>
                          <Slider
                            value={[selectedLayer.textShadow?.offsetY || 0]}
                            onValueChange={([value]) => updateTextLayer(selectedLayer.id, { 
                              textShadow: { ...selectedLayer.textShadow!, offsetY: value } 
                            })}
                            min={-20}
                            max={20}
                            step={1}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>Blur: {selectedLayer.textShadow?.blur || 0}px</Label>
                          <Slider
                            value={[selectedLayer.textShadow?.blur || 0]}
                            onValueChange={([value]) => updateTextLayer(selectedLayer.id, { 
                              textShadow: { ...selectedLayer.textShadow!, blur: value } 
                            })}
                            min={0}
                            max={20}
                            step={1}
                            className="mt-1"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={selectedLayer.textStroke?.enabled || false}
                        onCheckedChange={(checked) => updateTextLayer(selectedLayer.id, { 
                          textStroke: { 
                            ...selectedLayer.textStroke,
                            enabled: checked,
                            color: selectedLayer.textStroke?.color || '#000000',
                            width: selectedLayer.textStroke?.width || 1
                          } 
                        })}
                      />
                      <Label>Text Stroke</Label>
                    </div>
                    
                    {selectedLayer.textStroke?.enabled && (
                      <div className="space-y-3 pl-6">
                        <div>
                          <Label htmlFor="strokeColor">Stroke Color</Label>
                          <Input
                            id="strokeColor"
                            type="color"
                            value={selectedLayer.textStroke?.color || '#000000'}
                            onChange={(e) => updateTextLayer(selectedLayer.id, { 
                              textStroke: { ...selectedLayer.textStroke!, color: e.target.value } 
                            })}
                            className="h-8"
                          />
                        </div>
                        <div>
                          <Label>Width: {selectedLayer.textStroke?.width || 0}px</Label>
                          <Slider
                            value={[selectedLayer.textStroke?.width || 0]}
                            onValueChange={([value]) => updateTextLayer(selectedLayer.id, { 
                              textStroke: { ...selectedLayer.textStroke!, width: value } 
                            })}
                            min={0}
                            max={10}
                            step={0.5}
                            className="mt-1"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}