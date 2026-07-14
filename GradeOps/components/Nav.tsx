'use client'

import Link from 'next/link'
import { BookOpen, Plus } from 'lucide-react'

export default function Nav() {
  return (
    <header
      style={{
        position: 'sticky', top: 0, zIndex: 10,
        borderBottom: '1px solid var(--border)',
        background: 'rgba(10,10,15,0.85)', backdropFilter: 'blur(10px)',
      }}
    >
      <div
        style={{
          maxWidth: 1080, margin: '0 auto', padding: '0.9rem 1.5rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}
      >
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none' }}>
          <div
            style={{
              width: 32, height: 32, borderRadius: 9,
              background: 'linear-gradient(135deg, var(--accent), #4f46e5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 16px var(--accent-glow)',
            }}
          >
            <BookOpen size={16} color="#fff" />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            GradeOps
          </span>
        </Link>

        <Link
          href="/assignments/new"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.5rem 0.9rem', borderRadius: 9, fontSize: '0.85rem', fontWeight: 600,
            color: '#fff', background: 'var(--accent)', textDecoration: 'none',
            boxShadow: '0 0 16px var(--accent-glow)',
          }}
        >
          <Plus size={15} /> New Assignment
        </Link>
      </div>
    </header>
  )
}
