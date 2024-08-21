import BaseAnnotationTool from '../base/BaseAnnotationTool.js';
import external from './../../externalModules.js';
import pointInsideBoundingBox from './../../util/pointInsideBoundingBox.js';
import toolColors from './../../stateManagement/toolColors.js';
import { getNewContext, draw, setShadow } from './../../drawing/index.js';
import drawTextBox from './../../drawing/drawTextBox.js';
import {
  removeToolState,
  getToolState,
} from './../../stateManagement/toolState.js';
import { textMarkerCursor } from '../cursors/index.js';

/**
 * @public
 * @class TextMarkerTool
 * @memberof Tools.Annotation
 *
 * @classdesc Tool for annotating an image with text markers.
 * @extends Tools.Base.BaseAnnotationTool
 */
export default class TextTool extends BaseAnnotationTool {
  constructor(props = {}) {
    const defaultProps = {
      name: 'Text',
      supportedInteractionTypes: ['Mouse', 'Touch'],
      configuration: {},
      svgCursor: textMarkerCursor,
    };

    super(props, defaultProps);
  }

  createNewMeasurement(eventData) {
    const config = this.configuration;

    if (!config.current) {
      return;
    }

    // Create the measurement data for this tool with the end handle activated
    const measurementData = {
      visible: true,
      active: true,
      text: config.current,
      color: undefined,
      handles: {
        end: {
          x: eventData.currentPoints.image.x,
          y: eventData.currentPoints.image.y,
          highlight: true,
          active: true,
          hasBoundingBox: true,
        },
      },
    };

    // Create a rectangle representing the image
    const imageRect = {
      left: 0,
      top: 0,
      width: eventData.image.width,
      height: eventData.image.height,
    };

    // Check if the current handle is outside the image,
    // If it is, prevent the handle creation
    if (
      !external.cornerstoneMath.point.insideRect(
        measurementData.handles.end,
        imageRect
      )
    ) {
      return;
    }

    return measurementData;
  }

  pointNearTool(element, data, coords) {
    if (data.visible === false) {
      return false;
    }

    if (!data.handles.end.boundingBox) {
      return;
    }

    const distanceToPoint = external.cornerstoneMath.rect.distanceToPoint(
      data.handles.end.boundingBox,
      coords
    );
    const insideBoundingBox = pointInsideBoundingBox(data.handles.end, coords);

    return distanceToPoint < 10 || insideBoundingBox;
  }

  updateCachedStats() {
    // Implementing to satisfy BaseAnnotationTool
  }

  renderToolData(evt) {
    const eventData = evt.detail;
    const config = this.configuration;

    // If we have no toolData for this element, return immediately as there is nothing to do
    const toolData = getToolState(eventData.element, this.name);

    if (!toolData) {
      return;
    }

    // We have tool data for this element - iterate over each one and draw it
    const context = getNewContext(eventData.canvasContext.canvas);

    for (let i = 0; i < toolData.data.length; i++) {
      const data = toolData.data[i];

      if (data.visible === false) {
        continue;
      }

      const color = 'white';

      draw(context, context => {
        setShadow(context, config);

        const textCoords = external.cornerstone.pixelToCanvas(
          eventData.element,
          data.handles.end
        );

        const options = {
          centering: {
            x: false,
            y: false,
          },
        };

        data.handles.end.boundingBox = drawTextBox(
          context,
          data.text,
          textCoords.x,
          textCoords.y,
          color,
          options
        );
      });
    }
  }
}
