import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import ProjectPage from '@/pages/Project'
import TrafficPage from '@/pages/Traffic'
import SubgradePage from '@/pages/Subgrade'
import MaterialsPage from '@/pages/Materials'
import FlexiblePage from '@/pages/Flexible'
import RigidPage from '@/pages/Rigid'
import CombinedPage from '@/pages/Combined'
import ResultsPage from '@/pages/Results'
import AboutPage from '@/pages/About'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<ProjectPage />} />
          <Route path="traffic" element={<TrafficPage />} />
          <Route path="subgrade" element={<SubgradePage />} />
          <Route path="materials" element={<MaterialsPage />} />
          <Route path="flexible" element={<FlexiblePage />} />
          <Route path="rigid" element={<RigidPage />} />
          <Route path="combined" element={<CombinedPage />} />
          <Route path="results" element={<ResultsPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="*" element={<ProjectPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
