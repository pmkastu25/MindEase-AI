import './App.css'
import {BrowserRouter, Routes, Route} from "react-router-dom"
import Home from './pages/Home'
import Recommendation from './pages/Recommendation'
import TherapistConnect from './pages/TherapistConnect'
import AnalyzeeMood from './pages/AnalyzeeMood'
import ResponsiveAppBar from './components/ResponsiveAppBar'

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home/>} />
        <Route path="/recommendation" element={<Recommendation/>} />
        <Route path="/therapistconnect" element={<TherapistConnect/>} />
        <Route path="/analyze-mood" element={<AnalyzeeMood/>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
