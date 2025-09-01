/*
  Application bootstrap + Calcite web-component registration
  ----------------------------------------------------------
  Calcite is built with Stencil (web components). In Angular, we should
  explicitly define its custom elements so <calcite-*> tags are recognized.
  This keeps everything framework-friendly without loading CDN scripts.
  Docs: https://developers.arcgis.com/calcite-design-system/components/
*/

import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { defineCustomElements } from '@esri/calcite-components/dist/loader';

// Register all <calcite-*> elements globally
defineCustomElements(window);

// Standard Angular bootstrap (standalone component)
bootstrapApplication(App).catch((err) => console.error(err));
