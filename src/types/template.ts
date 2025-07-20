export interface TextLayer {
  id: string
  text: string
  x: number
  y: number
  fontSize: number
  fontFamily: string
  color: string
  fontWeight: 'normal' | 'bold'
  textAlign: 'left' | 'center' | 'right'
  isVariable: boolean
  variableName?: string
  textShadow?: {
    enabled: boolean
    color: string
    offsetX: number
    offsetY: number
    blur: number
  }
  textStroke?: {
    enabled: boolean
    color: string
    width: number
  }
  opacity?: number
  rotation?: number
}

export interface Template {
  id: string
  name: string
  backgroundImage: string
  textLayers: TextLayer[]
  width: number
  height: number
  createdAt: string
  updatedAt: string
}

export interface TemplateGeneration {
  templateId: string
  variables: Record<string, string>
  generatedImageUrl?: string
}