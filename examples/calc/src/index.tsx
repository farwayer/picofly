import {createRoot} from 'react-dom/client'
import {App} from './app.tsx'

let app = document.getElementById('app')!
createRoot(app).render(<App/>)
