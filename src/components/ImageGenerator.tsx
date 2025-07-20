import { useState, useRef, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Download, RefreshCw, Package, FileText, Grid } from 'lucide-react'
import { toast } from 'sonner'
import type { Template } from '@/types/template'

interface ImageGeneratorProps {
  template: Template
  user: any
}

export function ImageGenerator({ template, user }: ImageGeneratorProps) {
  const [variables, setVariables] = useState<Record<string, string>>({})
  const [isGenerating, setIsGenerating] = useState(false)
  const [batchData, setBatchData] = useState('')
  const [generatedImages, setGeneratedImages] = useState<Array<{ id: string; dataUrl: string; variables: Record<string, string> }>>([])
  const canvasRef = useRef<HTMLDivElement>(null)

  // Extract variable names from template
  const variableNames = useMemo(() => 
    template.textLayers
      .filter(layer => layer.isVariable && layer.variableName)
      .map(layer => layer.variableName!)
      .filter((name, index, arr) => arr.indexOf(name) === index), // Remove duplicates
    [template.textLayers]
  )

  // Initialize variables state
  useEffect(() => {
    const initialVariables: Record<string, string> = {}
    variableNames.forEach(name => {
      initialVariables[name] = ''
    })
    setVariables(initialVariables)
  }, [template.id, variableNames])

  const handleVariableChange = (name: string, value: string) => {
    setVariables(prev => ({ ...prev, [name]: value }))
  }

  const generateImageCanvas = async (imageVariables: Record<string, string>) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    canvas.width = template.width
    canvas.height = template.height

    return new Promise<string>((resolve) => {
      if (template.backgroundImage) {
        const img = new Image()
        img.onload = () => {
          ctx.drawImage(img, 0, 0, template.width, template.height)
          
          // Draw text layers with variables
          template.textLayers.forEach(layer => {
            ctx.font = `${layer.fontWeight} ${layer.fontSize}px ${layer.fontFamily}`
            ctx.fillStyle = layer.color
            ctx.textAlign = layer.textAlign as CanvasTextAlign
            
            let text = layer.text
            if (layer.isVariable && layer.variableName && imageVariables[layer.variableName]) {
              text = imageVariables[layer.variableName]
            } else if (layer.isVariable) {
              text = `{{${layer.variableName || layer.text}}}`
            }
            
            ctx.fillText(text, layer.x, layer.y + layer.fontSize)
          })

          resolve(canvas.toDataURL('image/png'))
        }
        img.src = template.backgroundImage
      } else {
        // No background image
        template.textLayers.forEach(layer => {
          ctx.font = `${layer.fontWeight} ${layer.fontSize}px ${layer.fontFamily}`
          ctx.fillStyle = layer.color
          ctx.textAlign = layer.textAlign as CanvasTextAlign
          
          let text = layer.text
          if (layer.isVariable && layer.variableName && imageVariables[layer.variableName]) {
            text = imageVariables[layer.variableName]
          } else if (layer.isVariable) {
            text = `{{${layer.variableName || layer.text}}}`
          }
          
          ctx.fillText(text, layer.x, layer.y + layer.fontSize)
        })
        
        resolve(canvas.toDataURL('image/png'))
      }
    })
  }

  const handleGenerate = async () => {
    setIsGenerating(true)
    try {
      const dataUrl = await generateImageCanvas(variables)
      if (dataUrl) {
        const a = document.createElement('a')
        a.href = dataUrl
        a.download = `${template.name}-generated.png`
        a.click()
        toast.success('Image generated and downloaded!')
      }
    } catch (error) {
      console.error('Failed to generate image:', error)
      toast.error('Failed to generate image')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleBatchGenerate = async () => {
    if (!batchData.trim()) {
      toast.error('Please enter batch data')
      return
    }

    setIsGenerating(true)
    try {
      const lines = batchData.trim().split('\n')
      const headers = lines[0].split(',').map(h => h.trim())
      const dataRows = lines.slice(1)

      const newGeneratedImages: Array<{ id: string; dataUrl: string; variables: Record<string, string> }> = []

      for (const row of dataRows) {
        const values = row.split(',').map(v => v.trim())
        const rowVariables: Record<string, string> = {}
        
        headers.forEach((header, index) => {
          if (variableNames.includes(header)) {
            rowVariables[header] = values[index] || ''
          }
        })

        const dataUrl = await generateImageCanvas(rowVariables)
        if (dataUrl) {
          newGeneratedImages.push({
            id: `batch-${Date.now()}-${Math.random()}`,
            dataUrl,
            variables: rowVariables
          })
        }
      }

      setGeneratedImages(newGeneratedImages)
      toast.success(`Generated ${newGeneratedImages.length} images!`)
    } catch (error) {
      console.error('Failed to generate batch images:', error)
      toast.error('Failed to generate batch images')
    } finally {
      setIsGenerating(false)
    }
  }

  const downloadAllImages = () => {
    generatedImages.forEach((img, index) => {
      const a = document.createElement('a')
      a.href = img.dataUrl
      a.download = `${template.name}-batch-${index + 1}.png`
      a.click()
    })
    toast.success('All images downloaded!')
  }

  const renderPreview = (previewVariables = variables) => {
    return template.textLayers.map((layer) => {
      let displayText = layer.text
      
      if (layer.isVariable && layer.variableName && previewVariables[layer.variableName]) {
        displayText = previewVariables[layer.variableName]
      } else if (layer.isVariable) {
        displayText = `{{${layer.variableName || layer.text}}}`
      }

      const textShadow = layer.textShadow?.enabled 
        ? `${layer.textShadow.offsetX}px ${layer.textShadow.offsetY}px ${layer.textShadow.blur}px ${layer.textShadow.color}`
        : 'none'

      return (
        <div
          key={layer.id}
          className="absolute select-none"
          style={{
            left: layer.x,
            top: layer.y,
            fontSize: layer.fontSize,
            fontFamily: layer.fontFamily,
            color: layer.color,
            fontWeight: layer.fontWeight,
            textAlign: layer.textAlign,
            textShadow,
            opacity: layer.opacity || 1,
            transform: `rotate(${layer.rotation || 0}deg)`,
            padding: '4px 8px',
            borderRadius: '4px',
            ...(layer.textStroke?.enabled && { 
              WebkitTextStroke: `${layer.textStroke.width}px ${layer.textStroke.color}` 
            })
          }}
        >
          {displayText}
        </div>
      )
    })
  }

  const sampleBatchData = variableNames.length > 0 
    ? `${variableNames.join(',')}\nJohn Doe,Software Engineer\nJane Smith,Product Manager\nMike Johnson,Designer`
    : 'name,title\nJohn Doe,Software Engineer\nJane Smith,Product Manager\nMike Johnson,Designer'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Generate Images</h1>
          <p className="text-gray-600">Create single images or batch generate multiple variations</p>
        </div>
      </div>

      <Tabs defaultValue="single" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="single" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Single Generation
          </TabsTrigger>
          <TabsTrigger value="batch" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Batch Generation
          </TabsTrigger>
        </TabsList>

        <TabsContent value="single" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Variables Panel */}
            <div className="lg:col-span-1 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center justify-between">
                    Template Variables
                    <Badge variant="secondary">{variableNames.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {variableNames.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      This template has no variables. All text is static.
                    </p>
                  ) : (
                    variableNames.map((name) => (
                      <div key={name}>
                        <Label htmlFor={name} className="capitalize">
                          {name.replace(/([A-Z])/g, ' $1').trim()}
                        </Label>
                        <Input
                          id={name}
                          value={variables[name] || ''}
                          onChange={(e) => handleVariableChange(name, e.target.value)}
                          placeholder={`Enter ${name}...`}
                        />
                      </div>
                    ))
                  )}
                  
                  <Button onClick={handleGenerate} disabled={isGenerating} className="w-full">
                    {isGenerating ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4 mr-2" />
                    )}
                    {isGenerating ? 'Generating...' : 'Generate & Download'}
                  </Button>
                </CardContent>
              </Card>

              {/* Template Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Template Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium">{template.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Dimensions:</span>
                    <span className="font-medium">{template.width} × {template.height}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Text Layers:</span>
                    <span className="font-medium">{template.textLayers.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Variables:</span>
                    <span className="font-medium">{variableNames.length}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Preview Panel */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Live Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-center">
                    <div
                      ref={canvasRef}
                      className="relative bg-white shadow-lg"
                      style={{
                        width: Math.min(template.width, 600),
                        height: Math.min(template.height, (template.height / template.width) * 600),
                        maxWidth: '100%'
                      }}
                    >
                      {/* Background Image */}
                      {template.backgroundImage && (
                        <img
                          src={template.backgroundImage}
                          alt="Background"
                          className="absolute inset-0 w-full h-full object-cover rounded"
                          draggable={false}
                        />
                      )}

                      {/* Text Layers with Variables */}
                      <div
                        className="absolute inset-0"
                        style={{
                          transform: `scale(${Math.min(600 / template.width, 1)})`,
                          transformOrigin: 'top left'
                        }}
                      >
                        {renderPreview()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 text-center">
                    <p className="text-sm text-gray-500">
                      Preview updates automatically as you type
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="batch" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Batch Input Panel */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Batch Data (CSV Format)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="batchData">CSV Data</Label>
                    <Textarea
                      id="batchData"
                      value={batchData}
                      onChange={(e) => setBatchData(e.target.value)}
                      placeholder={sampleBatchData}
                      className="min-h-[200px] font-mono text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      First row should contain column headers matching your template variables
                    </p>
                  </div>
                  
                  <Button onClick={handleBatchGenerate} disabled={isGenerating} className="w-full">
                    {isGenerating ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Package className="w-4 h-4 mr-2" />
                    )}
                    {isGenerating ? 'Generating...' : 'Generate Batch'}
                  </Button>
                </CardContent>
              </Card>

              {/* Expected Variables */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Expected Variables</CardTitle>
                </CardHeader>
                <CardContent>
                  {variableNames.length === 0 ? (
                    <p className="text-sm text-gray-500">No variables in this template</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {variableNames.map((name) => (
                        <Badge key={name} variant="outline">{name}</Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Generated Images Panel */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center justify-between">
                    Generated Images
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{generatedImages.length}</Badge>
                      {generatedImages.length > 0 && (
                        <Button size="sm" onClick={downloadAllImages}>
                          <Download className="w-4 h-4 mr-2" />
                          Download All
                        </Button>
                      )}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {generatedImages.length === 0 ? (
                    <div className="text-center py-8">
                      <Grid className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-sm text-gray-500">No images generated yet</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                      {generatedImages.map((img, index) => (
                        <div key={img.id} className="space-y-2">
                          <div className="relative bg-gray-100 rounded-lg overflow-hidden">
                            <img
                              src={img.dataUrl}
                              alt={`Generated ${index + 1}`}
                              className="w-full h-24 object-cover"
                            />
                          </div>
                          <div className="text-xs text-gray-500">
                            {Object.entries(img.variables).map(([key, value]) => (
                              <div key={key} className="truncate">
                                <span className="font-medium">{key}:</span> {value}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}