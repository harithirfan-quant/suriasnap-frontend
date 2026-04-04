import { lazy, Suspense } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Header from './components/Header'
import Footer from './components/Footer'

const Home   = lazy(() => import('./pages/Home'))
const Scan   = lazy(() => import('./pages/ScanPage'))
const Assess = lazy(() => import('./pages/AssessPage'))
const Result = lazy(() => import('./pages/ResultPage'))

function PageLoader() {
  return (
    <div className="flex-1 flex items-center justify-center py-24">
      <span className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: '#0D7377', borderTopColor: 'transparent' }} />
    </div>
  )
}

export default function App() {
  const location = useLocation()
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <Suspense fallback={<PageLoader />}>
          <AnimatePresence mode="wait" initial={false}>
            <Routes location={location} key={location.pathname}>
              <Route path="/"       element={<Home />}   />
              <Route path="/scan"   element={<Scan />}   />
              <Route path="/assess" element={<Assess />} />
              <Route path="/result" element={<Result />} />
            </Routes>
          </AnimatePresence>
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}
