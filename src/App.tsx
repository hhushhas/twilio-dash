import { Routes, Route } from 'react-router-dom'
import { AccountProvider } from './context/AccountContext'
import { ToastProvider } from './context/ToastContext'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Numbers from './pages/Numbers'
import Calls from './pages/Calls'
import Messages from './pages/Messages'
import Alerts from './pages/Alerts'
import ToastContainer from './components/Toast'

export default function App() {
  return (
    <AccountProvider>
      <ToastProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/numbers" element={<Numbers />} />
            <Route path="/calls" element={<Calls />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/alerts" element={<Alerts />} />
          </Routes>
        </Layout>
        <ToastContainer />
      </ToastProvider>
    </AccountProvider>
  )
}
