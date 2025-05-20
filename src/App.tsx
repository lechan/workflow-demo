import './App.css'
import ConductorWorkflowGraph from './pages/ConductorWorkflowGraph/index';

function App() {
  return (
    <div className="app-container">
      <header className="app-header">
        <h1>工作流编排画布</h1>
      </header>
      <main>
        <ConductorWorkflowGraph />
      </main>
    </div>
  )
}

export default App
