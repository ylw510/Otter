import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { initSelectionMenu } from '../content/selectionMenu'
import { PdfViewerApp } from './PdfViewerApp'
import './pdf-viewer.css'

document.documentElement.dataset.otterPdfViewer = 'true'

initSelectionMenu({ mode: 'pdf' })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PdfViewerApp />
  </StrictMode>,
)
