import './App.css';
import { Route, Routes } from 'react-router-dom';
import VideoRecognizer from './components/VideoRecognizer';

function App() {
  return (
    <>
      <Routes>
        <Route element={<VideoRecognizer />} path="/" />
        <Route element={<VideoRecognizer />} path="/:userId" />
      </Routes>
    </>
  );
}

export default App;
