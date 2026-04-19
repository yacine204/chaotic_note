import './App.css'
import {Routes, Route, Navigate} from "react-router-dom"
import Note from './pages/note'

function App() {
  return(
    <Routes>
      <Route path='/' element={<Navigate to="/note" />} />
      <Route path='/note' element={<Note/>} />  
      <Route path='/note/:text' element={<Note></Note>}></Route>
    </Routes> 
  )
    
}

export default App
