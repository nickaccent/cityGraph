import './style.css';
import { GraphWrapper } from './graphWrapper.js';

document.querySelector('#app').innerHTML = `
    <div id="controls">
      <button id="saveBtn" class="hidden">Save</button>
      <button id="disposeBtn" class="hidden">Clear</button>
      <button id="editorBtn">Editor</button>
    </div>
`;

const graphCanvas = document.querySelector('#graphCanvas');

// const editor = new GraphWrapper(graphCanvas);
const editor = new GraphWrapper();
// const addPointButton = document.querySelector('#addPoint');
// addPointButton.addEventListener('click', editor.addRandomPoint.bind(editor));
