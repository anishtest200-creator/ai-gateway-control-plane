import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import LandingPage from './pages/LandingPage'
import PricingPage from './pages/PricingPage'
import DocsPage from './pages/DocsPage'
import DemoPage from './pages/DemoPage'
import GovernanceDashboard from './pages/GovernanceDashboard'
import TestConsole from './pages/TestConsole'
import Traffic from './pages/Traffic'
import Credentials from './pages/Credentials'
import Assets from './pages/Assets'
import Routing from './pages/Routing'
import Policies from './pages/Policies'
import Observability from './pages/Observability'
import Logs from './pages/Logs'
import Namespaces from './pages/Namespaces'
import Access from './pages/Access'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  if (!isAuthenticated) {
    const authProps = {
      onLogin: () => setIsAuthenticated(true),
      onSignup: () => setIsAuthenticated(true),
    }
    return (
      <Routes>
        <Route path="/pricing" element={<PricingPage {...authProps} />} />
        <Route path="/docs" element={<DocsPage {...authProps} />} />
        <Route path="/demo" element={<DemoPage {...authProps} />} />
        <Route path="*" element={<LandingPage {...authProps} />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<Layout onSignOut={() => setIsAuthenticated(false)} />}>
        <Route index element={<GovernanceDashboard />} />
        <Route path="traffic" element={<Traffic />} />
        <Route path="routing" element={<Routing />} />
        <Route path="policies" element={<Policies />} />
        <Route path="credentials" element={<Credentials />} />
        <Route path="assets" element={<Assets />} />
        <Route path="observability" element={<Observability />} />
        <Route path="logs" element={<Logs />} />
        <Route path="namespaces" element={<Namespaces />} />
        <Route path="access" element={<Access />} />
        <Route path="test-console" element={<TestConsole />} />
      </Route>
    </Routes>
  )
}

export default App
