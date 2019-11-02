import React from 'react';
import ReactDOM from 'react-dom';
//import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';

//import { loadTheme } from 'office-ui-fabric-react';
//import { mergeStyles } from 'office-ui-fabric-react';

import { initializeIcons } from '@uifabric/icons';
initializeIcons();

// Inject some global styles
/*
mergeStyles({
  selectors: {
    ':global(body), :global(html), :global(#app)': {
      margin: 0,
      padding: 0,
      height: '100vh'
    }
  }
});
*/

/*
loadTheme({
  defaultFontStyle: { fontFamily: 'Monaco, Menlo, Consolas', fontWeight: 'regular' },
  fonts: {
    small: {
      fontSize: '11px'
    },
    medium: {
      fontSize: '13px'
    },
    large: {
      fontSize: '20px',
      fontWeight: 'semibold'
    },
    xLarge: {
      fontSize: '22px',
      fontWeight: 'semibold'
    }
  }
});
*/

ReactDOM.render(<App />, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
