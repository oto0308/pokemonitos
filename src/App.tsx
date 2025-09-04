import { useState } from 'react'
import { Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
//import './App.css'

const HomePage = lazy(() => import('./pages/HomePage'))
const Card = lazy(() => import('./features/properties/ui/Card/Card'))
const Loading = lazy(() => import('./shared/ui/LoadingSpinner'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <Router>
        <Suspense fallback={<Loading/>}>
          <Routes>
            <Route path='/' element={<HomePage/>}/>
            <Route path='/card' element ={<Card/>}/>
            <Route path='*' element={<NotFoundPage/>}/>
          </Routes>
        </Suspense>
      </Router>
    </>
  )
}

export default App
