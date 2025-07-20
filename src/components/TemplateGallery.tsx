import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Edit, Trash2, Copy } from 'lucide-react'
import { blink } from '@/blink/client'
import { toast } from 'sonner'
import type { Template } from '@/types/template'

interface TemplateGalleryProps {
  templates: Template[]
  onTemplateSelected: (template: Template) => void
  onTemplatesChanged: () => void
  onNewTemplate: () => void
}

export function TemplateGallery({
  templates,
  onTemplateSelected,
  onTemplatesChanged,
  onNewTemplate
}: TemplateGalleryProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleDeleteTemplate = async (templateId: string) => {
    setIsDeleting(templateId)
    try {
      await blink.db.templates.delete(templateId)
      toast.success('Template deleted successfully')
      onTemplatesChanged()
    } catch (error) {
      console.error('Failed to delete template:', error)
      toast.error('Failed to delete template')
    } finally {
      setIsDeleting(null)
    }
  }

  const handleDuplicateTemplate = async (template: Template) => {
    try {
      const duplicatedTemplate = {
        ...template,
        id: `template-${Date.now()}`,
        name: `${template.name} (Copy)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      // Use camelCase for database fields - SDK will convert
      const templateData = {
        id: duplicatedTemplate.id,
        name: duplicatedTemplate.name,
        backgroundImage: duplicatedTemplate.backgroundImage, // Use camelCase - SDK will convert
        textLayers: JSON.stringify(duplicatedTemplate.textLayers), // Use camelCase - SDK will convert
        width: duplicatedTemplate.width,
        height: duplicatedTemplate.height,
        userId: (template as any).userId || '', // Use camelCase - SDK will convert
        createdAt: duplicatedTemplate.createdAt, // Use camelCase - SDK will convert
      }

      await blink.db.templates.create(templateData)
      toast.success('Template duplicated successfully')
      onTemplatesChanged()
    } catch (error) {
      console.error('Failed to duplicate template:', error)
      toast.error('Failed to duplicate template')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Template Gallery</h1>
          <p className="text-gray-600">Browse and manage your image templates</p>
        </div>
        <Button onClick={onNewTemplate}>
          <Plus className="w-4 h-4 mr-2" />
          New Template
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Search templates..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <div className="text-center py-12">
          {templates.length === 0 ? (
            <div>
              <div className="mx-auto w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                <Plus className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No templates yet</h3>
              <p className="text-gray-500 mb-4">Create your first template to get started</p>
              <Button onClick={onNewTemplate}>Create Template</Button>
            </div>
          ) : (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
              <p className="text-gray-500">Try adjusting your search query</p>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="group hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-0">
                {/* Template Preview */}
                <div 
                  className="relative aspect-video bg-gray-100 rounded-t-lg overflow-hidden"
                  onClick={() => onTemplateSelected(template)}
                >
                  {template.backgroundImage ? (
                    <img
                      src={template.backgroundImage}
                      alt={template.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-gray-400 text-center">
                        <Plus className="w-8 h-8 mx-auto mb-2" />
                        <span className="text-sm">No background</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Overlay with text layers preview */}
                  <div className="absolute inset-0">
                    {template.textLayers.slice(0, 3).map((layer, index) => (
                      <div
                        key={layer.id}
                        className="absolute text-xs opacity-80"
                        style={{
                          left: `${(layer.x / template.width) * 100}%`,
                          top: `${(layer.y / template.height) * 100}%`,
                          color: layer.color,
                          fontWeight: layer.fontWeight,
                          fontSize: Math.max(8, (layer.fontSize / template.width) * 200)
                        }}
                      >
                        {layer.isVariable ? `{{${layer.variableName || layer.text}}}` : layer.text}
                      </div>
                    ))}
                  </div>

                  {/* Action buttons overlay */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDuplicateTemplate(template)
                        }}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={isDeleting === template.id}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteTemplate(template.id)
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Template Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-gray-900 truncate">{template.name}</h3>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onTemplateSelected(template)}
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{template.width} × {template.height}</span>
                    <Badge variant="secondary" className="text-xs">
                      {template.textLayers.length} layers
                    </Badge>
                  </div>
                  
                  <div className="mt-2 text-xs text-gray-400">
                    Updated {new Date(template.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}