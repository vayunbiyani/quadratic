import { renderWebWorker } from '@/app/web-workers/renderWebWorker/renderWebWorker';
import { Container, Rectangle, Sprite } from 'pixi.js';
import { pixiApp } from '../pixiApp/PixiApp';
import { CellsArray } from './CellsArray';
import { CellsBorders } from './CellsBorders';
import { CellsFills } from './CellsFills';
import { CellsImage } from './cellsImages/CellsImage';
import { CellsImages } from './cellsImages/CellsImages';
import { CellsLabels } from './cellsLabel/CellsLabels';
import { CellsMarkers } from './CellsMarkers';
import { CellsSearch } from './CellsSearch';
import { events } from '@/app/events/events';
import { JsValidationWarning } from '@/app/quadratic-core-types';

export interface ErrorMarker {
  triangle?: Sprite;
  symbol?: Sprite;
}

export interface ErrorValidation {
  x: number;
  y: number;
  validationId: string;
  value?: string;
}

export class CellsSheet extends Container {
  private cellsFills: CellsFills;
  private cellsBorders: CellsBorders;
  cellsArray: CellsArray;
  cellsImages: CellsImages;

  cellsMarkers: CellsMarkers;
  cellsLabels: CellsLabels;

  sheetId: string;

  constructor(sheetId: string) {
    super();
    this.sheetId = sheetId;
    this.cellsFills = this.addChild(new CellsFills(this));

    // may need to clean this up if we ever move to a SPA
    this.addChild(new CellsSearch(sheetId));

    this.cellsLabels = this.addChild(new CellsLabels(this));
    this.cellsArray = this.addChild(new CellsArray(this));
    this.cellsBorders = this.addChild(new CellsBorders(this));
    this.cellsMarkers = this.addChild(new CellsMarkers());
    this.cellsImages = new CellsImages(this);
    this.visible = false;

    events.on('renderValidationWarnings', this.renderValidations);
  }

  // used to render all cellsTextHashes to warm up the GPU
  showAll() {
    this.visible = true;
    this.cellsLabels.showAll();
  }

  show(bounds: Rectangle): void {
    this.visible = true;
    this.cellsLabels.show(bounds);
    this.cellsArray.visible = true;
    this.cellsArray.cheapCull(bounds);
    this.cellsFills.cheapCull(bounds);
    this.cellsImages.cheapCull(bounds);
    pixiApp.changeCellImages(this.cellsImages);
  }

  hide(): void {
    this.visible = false;
  }

  toggleOutlines(off?: boolean) {
    this.cellsArray.visible = off ?? true;
    this.cellsMarkers.visible = off ?? true;
  }

  showLabel(x: number, y: number, show: boolean) {
    renderWebWorker.showLabel(this.sheetId, x, y, show);
  }

  unload(hashX: number, hashY: number) {
    this.cellsLabels.unload(hashX, hashY);
  }

  adjustOffsets() {
    this.cellsBorders.draw();
  }

  updateCellsArray() {
    this.cellsArray.updateCellsArray();
  }

  getCellsImages(): CellsImage[] {
    return this.cellsImages.children;
  }

  update() {
    this.cellsFills.update();
  }

  private renderValidations = (
    sheetId: string,
    hashX: number | undefined,
    hashY: number | undefined,
    validationWarnings: JsValidationWarning[]
  ) => {
    if (sheetId === this.sheetId) {
      if (hashX === undefined || hashY === undefined) {
        this.cellsLabels.renderValidationUpdates(validationWarnings);
      } else {
        this.cellsLabels.renderValidations(hashX, hashY, validationWarnings);
      }
    }
  };

  getErrorMarker(x: number, y: number): ErrorMarker | undefined {
    return this.cellsMarkers.getErrorMarker(x, y) || this.cellsLabels.getErrorMarker(x, y);
  }

  getErrorMarkerValidation(x: number, y: number): boolean {
    return this.cellsLabels.getErrorMarker(x, y) !== undefined;
  }
}
