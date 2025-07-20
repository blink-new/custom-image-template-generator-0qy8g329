import { useState, useEffect, useCallback } from 'react'
import { TemplateEditor } from '@/components/TemplateEditor'
import { TemplateGallery } from '@/components/TemplateGallery'
import { ImageGenerator } from '@/components/ImageGenerator'
import { Toaster } from '@/components/ui/sonner'
import { blink } from '@/blink/client'
import type { Template } from '@/types/template'

enum View {
  Gallery,
  Editor,
  Generator
}

function App() {
  const [user, setUser] = useState<any>(null)
  const [templates, setTemplates] = useState<Template[]>([])
  const [currentView, setCurrentView] = useState<View>(View.Gallery)
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchTemplates = useCallback(async (userId: string) => {
    try {
      const userTemplates = await blink.db.templates.list({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      })
      
      const parsedTemplates = userTemplates.map((t: any) => ({
        ...t,
        textLayers: typeof t.textLayers === 'string' ? JSON.parse(t.textLayers) : t.textLayers
      }))
      setTemplates(parsedTemplates)
    } catch (error) {
      console.error('Failed to fetch templates:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      if (state.user) {
        fetchTemplates(state.user.id)
      } else {
        setTemplates([])
        setIsLoading(false)
      }
    })
    return unsubscribe
  }, [fetchTemplates])

  const handleTemplateCreated = (newTemplate: Template) => {
    setTemplates(prev => {
      const index = prev.findIndex(t => t.id === newTemplate.id)
      if (index > -1) {
        const updated = [...prev]
        updated[index] = newTemplate
        return updated
      } else {
        return [newTemplate, ...prev]
      }
    })
    setCurrentView(View.Gallery)
  }

  const handleTemplateSelected = (template: Template) => {
    setSelectedTemplate(template)
    setCurrentView(View.Editor)
  }

  const handleNewTemplate = () => {
    setSelectedTemplate(null)
    setCurrentView(View.Editor)
  }

  const handleBackToGallery = () => {
    setSelectedTemplate(null)
    setCurrentView(View.Gallery)
  }

  const renderContent = () => {
    if (isLoading) {
      return <div className="text-center p-12">Loading...</div>
    }

    if (!user) {
      return (
        <div className="text-center p-12">
          <h1 className="text-2xl font-bold">Welcome!</h1>
          <p className="text-gray-600">Please sign in to create and manage your templates.</p>
        </div>
      )
    }

    switch (currentView) {
      case View.Editor:
        return (
          <TemplateEditor
            user={user}
            initialTemplate={selectedTemplate}
            onTemplateCreated={handleTemplateCreated}
            onBackToGallery={handleBackToGallery}
          />
        )
      case View.Generator:
        return <ImageGenerator templates={templates} />
      case View.Gallery:
      default:
        return (
          <TemplateGallery
            templates={templates}
            onTemplateSelected={handleTemplateSelected}
            onTemplatesChanged={() => fetchTemplates(user.id)}
            onNewTemplate={handleNewTemplate}
          />
        )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-image-plus"><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7"/><line x1="16" x2="22" y1="5" y2="5"/><line x1="19" x2="19" y1="2" y2="8"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
            <h1 className="text-xl font-bold text-gray-900">Image Template Generator</h1>
          </div>
          {user && (
            <div className="flex items-center gap-4">
              <Button 
                variant={currentView === View.Gallery ? 'secondary' : 'ghost'}
                onClick={() => setCurrentView(View.Gallery)}
              >
                Gallery
              </Button>
              <Button 
                variant={currentView === View.Generator ? 'secondary' : 'ghost'}
                onClick={() => setCurrentView(View.Generator)}
              >
                Generator
              </Button>
            </div>
          )}
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </main>
      <Toaster />
    </div>
  )
}

export default App