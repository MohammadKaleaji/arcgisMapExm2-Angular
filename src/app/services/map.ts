/*
  MapService (src/app/services/map.ts)
  ------------------------------------
  Centralizes ArcGIS MapView logic so components stay slim:
    • Store and expose the MapView instance
    • Update Calcite header (title/snippet/thumbnail/link) from WebMap PortalItem
    • Hide the Calcite loader reliably
    • Utilities: goTo, clearGraphics, dropMarker
*/

import { Injectable } from '@angular/core';
import type MapView from '@arcgis/core/views/MapView';
import Graphic from '@arcgis/core/Graphic';
import Point from '@arcgis/core/geometry/Point';

@Injectable({ providedIn: 'root' })
export class MapService {
  // Stored MapView reference (set once when the view is ready)
  private _view?: MapView;

  /* ------------ View lifecycle ------------ */

  /** Save the MapView reference for later use across the app. */
  setView(view: MapView) {
    this._view = view;
  }

  /** Read-only access to the current view (may be undefined before ready). */
  get view(): MapView | undefined {
    return this._view;
  }

  /* ------------ UI helpers (Calcite + tutorial needs) ------------ */

  /** Update the Calcite header logo using the WebMap's PortalItem. */
  updateHeaderFromPortalItem() {
    const webmap = this._view?.map as unknown as __esri.WebMap | undefined;
    const portalItem = webmap?.portalItem;
    const navLogo = document.querySelector('calcite-navigation-logo') as any | null;

    if (!portalItem || !navLogo) return;

    navLogo.heading = portalItem.title;                 // Map title
    navLogo.description = portalItem.snippet ?? '';     // Subtitle/snippet
    navLogo.thumbnail = portalItem.thumbnailUrl;        // Thumbnail image
    navLogo.href = portalItem.itemPageUrl;              // Link to item page
    navLogo.label = 'Thumbnail of map';                 // Accessibility label
  }

  /**
   * Hide the global Calcite loader safely.
   * (Type-agnostic: we don't depend on Calcite types here to avoid path issues.)
   */
  hideLoader(reason = 'view ready') {
    const loader = document.querySelector('calcite-loader') as any | null;
    if (loader && !loader.hidden) {
      loader.hidden = true;
      console.log(`✅ Loader hidden (${reason})`);
    }
  }

  /** Hide loader when the first layer view is created (useful for heavy maps). */
  hideLoaderOnFirstLayerCreate() {
    if (!this._view) return;
    const handle = this._view.on('layerview-create', () => {
      this.hideLoader('layerview-create');
      handle.remove();
    });
  }

  /* ------------ Utility helpers ------------ */

  /** Move the camera to lon/lat with a zoom level. */
  goTo(center: [number, number], zoom = 10) {
    return this._view?.goTo({ center, zoom });
  }

  /** Remove all graphics from the view. */
  clearGraphics() {
    this._view?.graphics.removeAll();
  }

  /**
   * Drop a simple marker with popup at lon/lat.
   * - Adds a Graphic to the view
   * - Opens a popup at the marker position
   */
  dropMarker(lon: number, lat: number, title = 'Point') {
    if (!this._view) return;

    const g = new Graphic({
      geometry: { type: 'point', longitude: lon, latitude: lat },
      symbol: { type: 'simple-marker', size: 10 } as any,
      attributes: { title, lon, lat },
      popupTemplate: {
        title: '{title}',
        content: 'Lon: {lon}<br>Lat: {lat}',
      },
    });

    // Add graphic to the view
    this._view!.graphics.add(g);

    // Open popup at the marker location
    if (!this._view) return; // TypeScript now knows it's defined
    this._view.popup!.open({
      features: [g],
      location: g.geometry as Point, // assert point geometry for TS
    });
  }
}
