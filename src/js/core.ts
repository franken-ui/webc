// src/js/lit-bundle.js
import * as Lit from 'lit';
import * as LitDecorators from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

//@ts-ignore
import 'uikit';

window.Lit = Lit;
window.LitDecorators = LitDecorators;
window.LitRepeat = { repeat };

export * from './components/index.ts';
