import { Graphics, Sprite, Texture } from "pixi.js";
import { Viewport } from "pixi-viewport";
import { NOTE_TYPES } from "../constants/note-types";

export const GraphicsManager = app => {
  const overlayGraphics = new Graphics();
  const graphics = new Graphics();
  const viewport = new Viewport({
    screenWidth: window.innerWidth,
    screenHeight: window.innerHeight,
    worldWidth: 1200,
    worldHeight: 640,
    interaction: app.renderer.plugins.interaction
  })
    .drag({
      direction: "x"
    })
    .clamp({
      left: -25,
      right: 1200
    });

  viewport.addChild(graphics);
  app.stage.addChild(viewport);
  app.stage.addChild(overlayGraphics);

  return {
    beatWidth: 120,
    viewportOffsetY: 20,
    viewport: viewport,
    graphics: graphics,
    overlayGraphics: overlayGraphics,
    sprites: {},

    getKeyAtY(y) {
      return Math.round((y - this.getStartY()) / this.getNoteLaneHeight());
    },

    getStartY() {
      return -viewport.worldHeight / 2;
    },

    getNoteLaneHeight() {
      return (this.viewport.worldHeight - this.viewportOffsetY) / 8;
    },

    drawNoteCursor(placementPoint, noteType, noteWidth) {
      const overlayGraphics = this.overlayGraphics;
      overlayGraphics.clear();
      overlayGraphics.moveTo(placementPoint.x, placementPoint.y);
      let fillColor = 0xffffff;
      if (noteType == NOTE_TYPES.SLIDE) {
        fillColor = 0xffff00;
      }
      overlayGraphics.beginFill(fillColor);
      overlayGraphics.drawRect(
        placementPoint.x - 2,
        placementPoint.y,
        5,
        this.getNoteLaneHeight() * noteWidth
      );
      overlayGraphics.endFill();
    },

    destroyNote(note) {
      const noteCoord = note.getCoordinates();
      if (this.sprites[noteCoord]) {
        this.sprites[noteCoord].sprite.destroy();
        delete this.sprites[noteCoord];
      }
    },

    createNote(note, bpm) {
      if (note.isValid() && !this.sprites[note.getCoordinates()]) {
        const noteSprite = new Sprite(Texture.WHITE);
        noteSprite.width = 5 + this.getNoteWidth(note, bpm);
        noteSprite.height = this.getNoteLaneHeight() * note.width - 2;
        noteSprite.tint = this.getNoteTint(note);
        noteSprite.x = note.x * this.getXUnitsPerMillisecond(bpm) - 2.5;
        noteSprite.y = note.y * this.getNoteLaneHeight() + this.getStartY() + 1;
        this.sprites[note.getCoordinates()] = {
          sprite: noteSprite,
          originalTint: noteSprite.tint
        };
        this.viewport.addChild(noteSprite);
      }
    },

    deselectNote(note) {
      const noteCoord = note.getCoordinates();
      this.sprites[noteCoord].sprite.tint = this.sprites[
        noteCoord
      ].originalTint;
    },

    selectNote(note) {
      this.sprites[note.getCoordinates()].sprite.tint = 0x0000ff;
    },

    updateNote(note, bpm) {
      const noteCoord = note.getCoordinates();
      if (this.sprites[noteCoord]) {
        this.sprites[noteCoord].originalTint = this.getNoteTint(note);
        this.sprites[noteCoord].sprite.width = 5 + this.getNoteWidth(note, bpm);
      }
    },

    getXUnitsPerMillisecond(bpm) {
      return (bpm * this.beatWidth) / 60000;
    },

    getNoteWidth(note, bpm) {
      return note.duration * this.getXUnitsPerMillisecond(bpm);
    },

    getNoteTint(note) {
      if (note.type == NOTE_TYPES.SLIDE) {
        return 0xffff00;
      }
      return 0xffffff;
    },

    zoomX(zoomAmount) {
      const newX = this.viewport.transform.scale.x - zoomAmount;
      this.viewport.transform.scale.set(newX, 1);
    },

    renderGridLines(bpm, duration, snapInterval) {
      if (bpm && duration) {
        const graphics = this.graphics;
        const viewport = this.viewport;
        const startY = this.getStartY();
        // const startY = 0;
        // const endY = viewport.worldHeight;
        // clear old snap lines
        graphics.clear();

        // calculate map width
        const numBeats = (bpm / 60) * duration;
        const mapWidth = this.beatWidth * numBeats;
        viewport.worldWidth = mapWidth;
        viewport.clamp({
          left: -25,
          right: mapWidth
        });

        // draw horizontal lines
        graphics.lineStyle(1, 0x008800);
        const noteSize = this.getNoteLaneHeight();
        for (let i = 0; i < 9; i += 1) {
          const y = i * noteSize + startY;
          graphics.moveTo(0, y);
          graphics.lineTo(mapWidth, y);
        }

        // draw vertical lines
        graphics.lineStyle(
          Math.max(1, 1 / viewport.transform.scale.x),
          0x008800
        );
        const endY = startY + noteSize * 8;
        const numLines = numBeats * snapInterval;
        const intervalSize = this.beatWidth / snapInterval;
        for (let i = 0; i < numLines; i += 1) {
          let x = i * intervalSize;
          graphics.moveTo(x, startY);
          graphics.lineTo(x, endY);
        }
      }
    }
  };
};
