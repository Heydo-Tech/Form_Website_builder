import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ToastProvider } from './context/ToastContext'
import Dashboard from './pages/Dashboard'
import Builder from './pages/Builder'
import FormView from './pages/FormView'
import Responses from './pages/Responses'
import HardcodedAISampleResults from './pages/HardcodedAISampleResults'
import WebsiteGeneratorForm from './pages/WebsiteGeneratorForm'

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/builder" element={<Builder />} />
          <Route path="/builder/:id" element={<Builder />} />
          <Route path="/form/:id" element={<FormView />} />
          <Route path="/responses/:id" element={<Responses />} />
          <Route path="/results/ai-sample" element={<HardcodedAISampleResults />} />
          <Route path="/website-generator" element={<WebsiteGeneratorForm />} />
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  )
}
