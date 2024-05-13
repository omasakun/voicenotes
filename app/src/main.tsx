/* @refresh reload */
import { attachDevtoolsOverlay } from '@solid-devtools/overlay'
import { render } from 'solid-js/web'

import { App } from './app'
import './main.css'

attachDevtoolsOverlay()
render(() => <App />, document.getElementById('root') as HTMLElement)
