import './App.css';
import { Route, Routes } from 'react-router-dom';
import VideoRecognizer from './components/VideoRecognizer';

function App() {
  return (
    <>
      <Routes>
        <Route element={<VideoRecognizer />} path="/:userId" />
        <Route element={<VideoRecognizer />} path="/" />
      </Routes>
    </>
  );
}

export default App;
