// @include './lib/json2.js'

import { ns } from "../shared/shared";
import {
  getLayerStyleState,
  setPropertyValue,
  setFillOpacity,
  operateKeyframe,
  operateFillOpacityKeyframe,
  addStyle,
  removeStyle,
  renameLayer,
  applyBaseName,
  applyNameSuffix,
  toggleSolo,
  toggleFxEnabled,
  navigateFrame,
  revealKeyframes,
  expandStyleProperty,
  openNativeColorPicker,
  togglePColor,
  openPColorPicker,
} from "./aeft/aeft";

const aeft = {
  getLayerStyleState,
  setPropertyValue,
  setFillOpacity,
  operateKeyframe,
  operateFillOpacityKeyframe,
  addStyle,
  removeStyle,
  renameLayer,
  applyBaseName,
  applyNameSuffix,
  toggleSolo,
  toggleFxEnabled,
  navigateFrame,
  revealKeyframes,
  expandStyleProperty,
  openNativeColorPicker,
  togglePColor,
  openPColorPicker,
};

//@ts-ignore
const host = typeof $ !== "undefined" ? $ : window;
host[ns] = aeft;

export type Scripts = typeof aeft;
