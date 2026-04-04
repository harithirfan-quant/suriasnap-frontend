import { Link, useLocation } from 'react-router-dom'
import { Sun } from 'lucide-react'

const links = [
  { to: '/',       label: 'Home'   },
  { to: '/scan',   label: 'Scan Bill' },
  { to: '/assess', label: 'Assess'    },
]

export default function Header() {
  const { pathname } = useLocation()
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
               style={{ background: '#0D7377' }}>
            <Sun size={18} color="white" strokeWidth={2.5} />
          </div>
          <span className="font-semibold text-lg tracking-tight"
                style={{ color: '#16213E' }}>
            Suria<span style={{ color: '#0D7377' }}>Snap</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          {links.map(({ to, label }) => (
            <Link key={to} to={to}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                pathname === to
                  ? 'text-white'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}
              style={pathname === to ? { background: '#0D7377' } : {}}>
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}
