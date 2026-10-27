import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { HomePage } from '@/pages/home'
import { ArticlePage } from '@/components/article-page'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/articles/:slug" element={<ArticlePage />} />
        <Route path="/blogs/:slug" element={<ArticlePage />} />
      </Routes>
      <Analytics />
    </BrowserRouter>
  )
}
