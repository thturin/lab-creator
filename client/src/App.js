import logo from './logo.svg';
import './App.css';
import LabBuilder from './components/LabBuilder.jsx';
import LabPreview from './components/LabPreview.jsx';
import {StrictMode, useState} from 'react';
function App() {
  const [currentView, setCurrentView] = useState('builder');
  const [title,setTitle]=useState('Untitled lab');
  const [blocks, setBlocks]=useState([]);
  return (
  <StrictMode>
      <div className="min-h-screen bg-gray-100">
        {/* Navigation */}
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex space-x-8">
              <button
                onClick={() => setCurrentView('builder')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  currentView === 'builder'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                🏗️ Lab Builder
              </button>
              <button
                onClick={() => setCurrentView('preview')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  currentView === 'preview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                📝 Preview Lab
              </button>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        {currentView === 'builder' ? <LabBuilder blocks={blocks} setBlocks={setBlocks} title={title} setTitle={setTitle}/> : <LabPreview title={title} blocks={blocks} />}
      </div>
  </StrictMode>
  );
}
export default App;
