import './App.css'
import {BrowserRouter, Routes, Route} from "react-router-dom"
import Home from './pages/Home'
import Recommendation from './pages/Recommendation'
import TherapistConnect from './pages/TherapistConnect'

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home/>} />
        <Route path="/recommendation" element={<Recommendation/>} />
        <Route path="/therapistconnect" element={<TherapistConnect/>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
