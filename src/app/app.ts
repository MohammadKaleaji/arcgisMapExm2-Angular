/*
  App (root component)
  --------------------
  Purpose
  -------
  Replicates “Using a View with components” in Angular:
    • Renders a Calcite header + ArcGIS WebMap (by item-id)
    • Listens for <arcgis-map> view-ready event
    • Delegates all map/view logic to MapService (clean component)
    • Updates header from the WebMap’s PortalItem and hides the loader

  Requirements / Notes
  --------------------
  • CUSTOM_ELEMENTS_SCHEMA so Angular accepts <arcgis-*> and <calcite-*> tags
  • Map Components must be imported so the custom elements are defined
  • Calcite custom elements are registered once in main.ts (defineCustomElements)
  • We handle both event.detail.view and event.target.view for reliability

  References
  ----------
  Tutorial: https://developers.arcgis.com/javascript/latest/tutorials/using-view-with-components/
*/

import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

/* MapService
   ----------
   Centralizes MapView logic (store view, update header, hide loader, helpers).
   File path: src/app/services/map.ts  */
import { MapService } from './services/map';

/* Map Components used in the template.
   Importing these registers the web components with the browser so that
   Angular can render <arcgis-map>, <arcgis-legend>, and <arcgis-zoom>. */
import '@arcgis/map-components/components/arcgis-map';
import '@arcgis/map-components/components/arcgis-legend';
import '@arcgis/map-components/components/arcgis-zoom';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.html',
  styleUrl: './app.scss',
  // ✅ Required so Angular accepts custom elements (web components)
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class App {
  // Inject our service (providedIn: 'root') to share the MapView across the app
  constructor(private mapSvc: MapService) {}

  /**
   * arcgisViewReadyChange
   * ---------------------
   * Fired by <arcgis-map> when the underlying MapView is ready.
   * We:
   *  1) obtain the MapView from the event (detail.view OR target.view)
   *  2) store it in MapService
   *  3) update Calcite header from the WebMap’s PortalItem
   *  4) hide the loader (immediately + on first layerview-create + fallback)
   *
   * @param event CustomEvent emitted by <arcgis-map>
   * @returns void
   */
  arcgisViewReadyChange(event: CustomEvent): void {
    console.log('📣 arcgisViewReadyChange fired', event);

    // Some versions/paths expose the view on detail.view, others on target.view.
    const view =
      (event as any)?.detail?.view ??
      (event.target as any)?.view as __esri.MapView | undefined;

    if (!view) {
      console.warn('⚠️ MapView not found on event (detail.view/target.view)');
      return;
    }

    console.log('✅ MapView is ready:', view);

    // 1) Keep a reference to the view in our service
    this.mapSvc.setView(view);

    // 2) Update the Calcite header (title/snippet/thumbnail/link)
    this.mapSvc.updateHeaderFromPortalItem();

    // 3) Hide the loader robustly
    this.mapSvc.hideLoader('view ready');            // immediately
    this.mapSvc.hideLoaderOnFirstLayerCreate();      // again when first layer view appears
    setTimeout(() => this.mapSvc.hideLoader('timeout fallback'), 5000); // final fallback

    // (Optional) Example: programmatic navigation later
    // this.mapSvc.goTo([46.6753, 24.7136], 10);
  }
}
