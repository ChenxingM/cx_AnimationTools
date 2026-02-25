/**
 * cx AnimationTools — Host functions (ExtendScript / After Effects)
 * All AE DOM operations are exposed as exported functions,
 * callable from the CEP panel via evalTS().
 */

import type {
  LayerStylePanelState,
  PropState,
  StyleNavState,
  PColorState,
  KeyframeAction,
} from "../../shared/layer-style-types";

// We inline these constants because the shared module uses ES module syntax
// which ExtendScript cannot handle directly.  Bolt CEP's rollup pipeline
// will bundle everything referenced from this file automatically.

interface StyleButtonDef {
  id: string;
  label: string;
  matchName: string;
  fallback: string;
  cmdId: number | null;
}

interface PropDef {
  label: string;
  key: string | string[];
  type: "number" | "color" | "blendMode" | "boolean";
}

interface BlendModeEntry {
  name: string;
  val: number;
}

var STYLE_BUTTONS: StyleButtonDef[] = [
  { id: "innerShadow", label: "内シ", matchName: "innerShadow/enabled", fallback: "ADBE Layer Style Inner Shadow", cmdId: 9001 },
  { id: "bevelEmboss", label: "ベベ", matchName: "bevelEmboss/enabled", fallback: "ADBE Layer Style Bevel Emboss", cmdId: 9004 },
  { id: "dropShadow", label: "ドシ", matchName: "dropShadow/enabled", fallback: "ADBE Layer Style Drop Shadow", cmdId: 9000 },
  { id: "outerGlow", label: "外光", matchName: "outerGlow/enabled", fallback: "ADBE Layer Style Outer Glow", cmdId: 9002 },
  { id: "innerGlow", label: "内光", matchName: "innerGlow/enabled", fallback: "ADBE Layer Style Inner Glow", cmdId: 9003 },
  { id: "chromeFX", label: "サテ", matchName: "chromeFX/enabled", fallback: "ADBE Layer Style Satin", cmdId: 9005 },
  { id: "solidFill", label: "カラ", matchName: "solidFill/enabled", fallback: "ADBE Layer Style Color Overlay", cmdId: 9006 },
  { id: "gradientFill", label: "グラ", matchName: "gradientFill/enabled", fallback: "ADBE Layer Style Gradient Overlay", cmdId: 9007 },
  { id: "frameFX", label: "境界", matchName: "frameFX/enabled", fallback: "ADBE Layer Style Stroke", cmdId: 9008 },
  { id: "masterStyle", label: "全L", matchName: "ADBE Layer Styles", fallback: "ADBE Layer Styles", cmdId: null },
];

var MENU_CMD_MAP: { [id: string]: string[] } = {
  dropShadow: ["ドロップシャドウ", "Drop Shadow"],
  innerShadow: ["シャドウ(内側)", "シャドウ (内側)", "Inner Shadow"],
  outerGlow: ["光彩(外側)", "光彩 (外側)", "Outer Glow"],
  innerGlow: ["光彩(内側)", "光彩 (内側)", "Inner Glow"],
  bevelEmboss: ["ベベルとエンボス", "Bevel and Emboss"],
  chromeFX: ["サテン", "Satin"],
  solidFill: ["カラーオーバーレイ", "Color Overlay"],
  gradientFill: ["グラデーションオーバーレイ", "Gradient Overlay"],
  frameFX: ["境界線", "Stroke"],
};

var blendModes: BlendModeEntry[] = [
  { name: "通常", val: 1 },
  { name: "ﾃﾞｨｻﾞ", val: 2 },
  { name: "比較(暗)", val: 4 },
  { name: "乗算", val: 5 },
  { name: "焼込ｶﾗｰ", val: 6 },
  { name: "焼込ﾘﾆｱ", val: 7 },
  { name: "ｶﾗｰ比較(暗)", val: 8 },
  { name: "比較(明)", val: 10 },
  { name: "ｽｸﾘｰﾝ", val: 11 },
  { name: "覆焼ｶﾗｰ", val: 12 },
  { name: "覆焼ﾘﾆｱ", val: 13 },
  { name: "ｶﾗｰ比較(明)", val: 14 },
  { name: "ｵｰﾊﾞｰﾚｲ", val: 16 },
  { name: "ｿﾌﾄﾗｲﾄ", val: 17 },
  { name: "ﾊｰﾄﾞﾗｲﾄ", val: 18 },
  { name: "ﾋﾞﾋﾞｯﾄﾞ", val: 19 },
  { name: "ﾘﾆｱﾗｲﾄ", val: 20 },
  { name: "ﾋﾟﾝﾗｲﾄ", val: 21 },
  { name: "ﾊｰﾄﾞﾐｯｸｽ", val: 22 },
  { name: "差", val: 24 },
  { name: "除外", val: 25 },
  { name: "色相", val: 27 },
  { name: "彩度", val: 28 },
  { name: "ｶﾗｰ", val: 29 },
  { name: "輝度", val: 30 },
];

var PROP_DEF: { [styleId: string]: PropDef[] } = {
  dropShadow: [
    { label: "描画モード", key: ["blendMode2", "blendMode"], type: "blendMode" },
    { label: "不透明度", key: "Opacity", type: "number" },
    { label: "角度", key: "Angle", type: "number" },
    { label: "距離", key: "Distance", type: "number" },
    { label: "スプレッド", key: "ChokeMatte", type: "number" },
    { label: "サイズ", key: "Blur", type: "number" },
    { label: "ノイズ", key: "Noise", type: "number" },
    { label: "カラー", key: "Color", type: "color" },
  ],
  innerShadow: [
    { label: "描画モード", key: ["blendMode2", "blendMode"], type: "blendMode" },
    { label: "不透明度", key: "Opacity", type: "number" },
    { label: "角度", key: "Angle", type: "number" },
    { label: "距離", key: "Distance", type: "number" },
    { label: "チョーク", key: "ChokeMatte", type: "number" },
    { label: "サイズ", key: "Blur", type: "number" },
    { label: "ノイズ", key: "Noise", type: "number" },
    { label: "カラー", key: "Color", type: "color" },
  ],
  outerGlow: [
    { label: "描画モード", key: ["blendMode2", "blendMode"], type: "blendMode" },
    { label: "不透明度", key: "Opacity", type: "number" },
    { label: "ノイズ", key: "Noise", type: "number" },
    { label: "カラー", key: "Color", type: "color" },
    { label: "スプレッド", key: "ChokeMatte", type: "number" },
    { label: "サイズ", key: "Blur", type: "number" },
    { label: "範囲", key: "Range", type: "number" },
    { label: "ジッター", key: ["Shading Noise", "Jitter"], type: "number" },
  ],
  innerGlow: [
    { label: "描画モード", key: ["blendMode2", "blendMode"], type: "blendMode" },
    { label: "不透明度", key: "Opacity", type: "number" },
    { label: "ノイズ", key: "Noise", type: "number" },
    { label: "カラー", key: "Color", type: "color" },
    { label: "チョーク", key: "ChokeMatte", type: "number" },
    { label: "サイズ", key: "Blur", type: "number" },
    { label: "範囲", key: "Range", type: "number" },
    { label: "ジッター", key: ["Shading Noise", "Jitter"], type: "number" },
  ],
  bevelEmboss: [
    { label: "深さ", key: "Strength Ratio", type: "number" },
    { label: "サイズ", key: "Blur", type: "number" },
    { label: "角度", key: "Angle", type: "number" },
    { label: "Hモード", key: "highlightMode", type: "blendMode" },
    { label: "H不透明度", key: "highlightOpacity", type: "number" },
    { label: "Hカラー", key: "highlightColor", type: "color" },
    { label: "Sモード", key: "shadowMode", type: "blendMode" },
    { label: "S不透明度", key: "shadowOpacity", type: "number" },
    { label: "Sカラー", key: "shadowColor", type: "color" },
  ],
  chromeFX: [
    { label: "描画モード", key: ["blendMode2", "blendMode"], type: "blendMode" },
    { label: "不透明度", key: "Opacity", type: "number" },
    { label: "角度", key: "Angle", type: "number" },
    { label: "距離", key: "Distance", type: "number" },
    { label: "サイズ", key: "Blur", type: "number" },
    { label: "反転(0/1)", key: "Invert", type: "boolean" },
    { label: "カラー", key: "Color", type: "color" },
  ],
  solidFill: [
    { label: "描画モード", key: ["blendMode2", "blendMode"], type: "blendMode" },
    { label: "不透明度", key: "Opacity", type: "number" },
    { label: "カラー", key: "Color", type: "color" },
  ],
  gradientFill: [
    { label: "描画モード", key: ["blendMode2", "blendMode"], type: "blendMode" },
    { label: "不透明度", key: "Opacity", type: "number" },
    { label: "角度", key: "Angle", type: "number" },
    { label: "スケール", key: "Scale", type: "number" },
  ],
  frameFX: [
    { label: "描画モード", key: ["blendMode2", "blendMode"], type: "blendMode" },
    { label: "位置(外1/内2/中3)", key: ["Position", "Style"], type: "number" },
    { label: "サイズ", key: "Size", type: "number" },
    { label: "不透明度", key: "Opacity", type: "number" },
    { label: "カラー", key: "Color", type: "color" },
  ],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getActiveLayer(): AVLayer | null {
  var comp = app.project ? app.project.activeItem as CompItem : null;
  if (!comp || comp.selectedLayers.length === 0) return null;
  return comp.selectedLayers[0] as AVLayer;
}

function getStyleGroup(layer: AVLayer): PropertyGroup | null {
  try {
    return layer.property("ADBE Layer Styles") as PropertyGroup;
  } catch (e) {
    return null;
  }
}

function getStyleGroupProp(styleGroup: PropertyGroup, styleDef: StyleButtonDef): PropertyBase | null {
  if (!styleGroup) return null;
  if (styleDef.id === "masterStyle") return styleGroup;
  for (var i = 1; i <= styleGroup.numProperties; i++) {
    var p = styleGroup.property(i);
    if (p.matchName === styleDef.matchName || p.matchName === styleDef.fallback) return p;
  }
  return null;
}

function findStyleDef(styleId: string): StyleButtonDef | null {
  for (var i = 0; i < STYLE_BUTTONS.length; i++) {
    if (STYLE_BUTTONS[i].id === styleId) return STYLE_BUTTONS[i];
  }
  return null;
}

function findPropInGroup(group: PropertyGroup, keySuffixes: string[]): Property | null {
  for (var k = 0; k < keySuffixes.length; k++) {
    var sfx = keySuffixes[k];
    try {
      var found = (group.property("ADBE " + sfx) || group.property(sfx)) as Property;
      if (found) return found;
    } catch (e) { /* ignore */ }
    // Fallback: search by matchName/name substring
    for (var j = 1; j <= group.numProperties; j++) {
      try {
        var child = group.property(j);
        if (child.matchName.toLowerCase().indexOf(sfx.toLowerCase()) !== -1
          || child.name.toLowerCase().indexOf(sfx.toLowerCase()) !== -1) {
          return child as Property;
        }
      } catch (e) { /* ignore */ }
    }
  }
  return null;
}

function getKeyframeInfo(prop: Property, t: number): { onKey: boolean; hasPrev: boolean; hasNext: boolean } {
  var result = { onKey: false, hasPrev: false, hasNext: false };
  if (!prop.canVaryOverTime || prop.numKeys === 0) return result;
  var idx = prop.nearestKeyIndex(t);
  var kt = prop.keyTime(idx);
  result.onKey = Math.abs(kt - t) < 0.005;
  if (result.onKey) {
    result.hasPrev = (idx > 1);
    result.hasNext = (idx < prop.numKeys);
  } else if (kt < t) {
    result.hasPrev = true;
    result.hasNext = (idx < prop.numKeys);
  } else if (kt > t) {
    result.hasNext = true;
    result.hasPrev = (idx > 1);
  }
  return result;
}

function getLayerHash(layer: AVLayer): string {
  if (!layer) return "";
  var hash = (layer.containingComp ? layer.containingComp.id : "0") + "_" + layer.index;
  var sg = layer.property("ADBE Layer Styles") as PropertyGroup;
  if (sg) {
    hash += "_S" + sg.numProperties;
    for (var i = 1; i <= sg.numProperties; i++) {
      try { hash += (sg.property(i).enabled ? "1" : "0"); } catch (e) { /* ignore */ }
    }
  }
  var fxGrp = layer.property("ADBE Effect Parade") as PropertyGroup;
  if (fxGrp) hash += "_F" + fxGrp.numProperties;
  return hash;
}

// ---------------------------------------------------------------------------
// Exported host functions
// ---------------------------------------------------------------------------

/**
 * Core polling function — returns complete panel state as JSON.
 */
export var getLayerStyleState = function (styleId: string): LayerStylePanelState {
  var layer = getActiveLayer();

  var emptyState: LayerStylePanelState = {
    hasLayer: false,
    layerName: "",
    currentStyleId: styleId,
    styleNav: [],
    fillOpacity: null,
    fillOpacityCanVary: false,
    fillOpacityNumKeys: 0,
    fillOpacityOnKey: false,
    fillOpacityHasPrev: false,
    fillOpacityHasNext: false,
    props: [],
    pColors: [],
    compTime: 0,
    isSoloActive: false,
    layerHash: "",
  };

  if (!layer) return emptyState;

  var comp = layer.containingComp;
  var t = comp.time;
  var styleGroup = getStyleGroup(layer);
  var hash = getLayerHash(layer);

  // Auto-select first enabled style if current is invalid
  var currentDef = findStyleDef(styleId);
  var currentProp = styleGroup && currentDef ? getStyleGroupProp(styleGroup, currentDef) : null;
  if (styleGroup && (!currentProp || (currentDef && currentDef.id !== "masterStyle" && !currentProp.enabled))) {
    for (var s = 0; s < STYLE_BUTTONS.length; s++) {
      if (STYLE_BUTTONS[s].id === "masterStyle") continue;
      var p = getStyleGroupProp(styleGroup, STYLE_BUTTONS[s]);
      if (p && p.enabled) {
        styleId = STYLE_BUTTONS[s].id;
        currentDef = STYLE_BUTTONS[s];
        currentProp = p;
        break;
      }
    }
  }

  // Style navigation states
  var navStates: StyleNavState[] = [];
  for (var i = 0; i < STYLE_BUTTONS.length; i++) {
    var sb = STYLE_BUTTONS[i];
    var sp = styleGroup ? getStyleGroupProp(styleGroup, sb) : null;
    var existing = (sp !== null);
    var enabled = false;
    if (sb.id === "masterStyle") {
      enabled = existing;
    } else if (sp) {
      try { enabled = sp.enabled; } catch (e) { /* ignore */ }
    }
    navStates.push({ id: sb.id, isExisting: existing, isEnabled: enabled });
  }

  // Fill opacity from Blend Options
  var fillOpacity: number | null = null;
  var fillCanVary = false;
  var fillNumKeys = 0;
  var fillOnKey = false;
  var fillHasPrev = false;
  var fillHasNext = false;
  if (styleGroup) {
    try {
      var blendOptions = styleGroup.property("ADBE Blend Options Group") as PropertyGroup;
      var advGroup = blendOptions ? blendOptions.property("ADBE Adv Blend Group") as PropertyGroup : null;
      var fillProp = advGroup
        ? (advGroup.property("ADBE Layer Fill Opacity2") || advGroup.property("ADBE Layer Fill Opacity")) as Property
        : null;
      if (fillProp) {
        fillOpacity = Math.round(fillProp.value * 10) / 10;
        fillCanVary = fillProp.canVaryOverTime;
        fillNumKeys = fillProp.numKeys;
        var fki = getKeyframeInfo(fillProp, t);
        fillOnKey = fki.onKey;
        fillHasPrev = fki.hasPrev;
        fillHasNext = fki.hasNext;
      }
    } catch (e) { /* ignore */ }
  }

  // Property states for the selected style
  var propStates: PropState[] = [];
  var defs = PROP_DEF[styleId];
  var activeProp = currentProp as PropertyGroup;
  if (defs && activeProp && activeProp.enabled) {
    for (var di = 0; di < defs.length; di++) {
      var def = defs[di];
      var keySuffixes = typeof def.key === "string" ? [def.key as string] : def.key as string[];
      var prop = findPropInGroup(activeProp, keySuffixes);
      if (!prop) continue;
      try {
        var val = prop.value;
        var propVal: any;
        if (def.type === "color") {
          propVal = [val[0], val[1], val[2]];
        } else if (def.type === "boolean") {
          propVal = val ? true : false;
        } else if (def.type === "blendMode") {
          propVal = val;
        } else {
          propVal = Math.round(val * 10) / 10;
        }

        var ki = getKeyframeInfo(prop, t);
        propStates.push({
          label: def.label,
          type: def.type,
          value: propVal,
          canVaryOverTime: prop.canVaryOverTime,
          numKeys: prop.numKeys,
          onKeyframe: ki.onKey,
          hasPrev: ki.hasPrev,
          hasNext: ki.hasNext,
        });
      } catch (e) { /* ignore */ }
    }
  }

  // P_Color states
  var pColors: PColorState[] = [];
  var fxGrp = layer.property("ADBE Effect Parade") as PropertyGroup;
  var pColorFx = fxGrp
    ? (fxGrp.property("P_ColorSelection") || fxGrp.property("ColorSelection")) as PropertyGroup
    : null;
  if (pColorFx) {
    var cIdx = 0;
    for (var pi = 1; pi <= pColorFx.numProperties && cIdx < 8; pi++) {
      var pp = pColorFx.property(pi) as Property;
      if (pp.propertyValueType === PropertyValueType.COLOR) {
        var c = pp.value;
        var isDisabled = false;
        var enableIdx = pi - 1;
        if (pi > 1 && (pColorFx.property(pi - 1) as Property).propertyValueType === PropertyValueType.OneD) {
          var enableProp = pColorFx.property(pi - 1) as Property;
          isDisabled = (enableProp.value === 0 || enableProp.value === false);
        }
        pColors.push({
          color: [c[0], c[1], c[2]],
          isDisabled: isDisabled,
          effectName: pColorFx.name,
          propIdx: pi,
          enableIdx: enableIdx,
        });
        cIdx++;
      }
    }
  }

  return {
    hasLayer: true,
    layerName: layer.name,
    currentStyleId: styleId,
    styleNav: navStates,
    fillOpacity: fillOpacity,
    fillOpacityCanVary: fillCanVary,
    fillOpacityNumKeys: fillNumKeys,
    fillOpacityOnKey: fillOnKey,
    fillOpacityHasPrev: fillHasPrev,
    fillOpacityHasNext: fillHasNext,
    props: propStates,
    pColors: pColors,
    compTime: t,
    isSoloActive: layer.solo,
    layerHash: hash,
  };
};

/**
 * Set a property value by its index in the current style's prop list.
 */
export var setPropertyValue = function (styleId: string, propIndex: number, value: any): void {
  var layer = getActiveLayer();
  if (!layer) return;
  var styleGroup = getStyleGroup(layer);
  if (!styleGroup) return;
  var styleDef = findStyleDef(styleId);
  if (!styleDef) return;
  var activeProp = getStyleGroupProp(styleGroup, styleDef) as PropertyGroup;
  if (!activeProp || !activeProp.enabled) return;
  var defs = PROP_DEF[styleId];
  if (!defs || propIndex >= defs.length) return;

  var def = defs[propIndex];
  var keySuffixes = typeof def.key === "string" ? [def.key as string] : def.key as string[];
  var prop = findPropInGroup(activeProp, keySuffixes);
  if (!prop) return;

  var comp = layer.containingComp;
  app.beginUndoGroup("Change Value");
  try {
    if (prop.numKeys > 0) prop.setValueAtTime(comp.time, value);
    else prop.setValue(value);
  } catch (e) { /* ignore */ }
  app.endUndoGroup();
};

/**
 * Set fill opacity value.
 */
export var setFillOpacity = function (value: number): void {
  var layer = getActiveLayer();
  if (!layer) return;
  var styleGroup = getStyleGroup(layer);
  if (!styleGroup) return;
  try {
    var blendOptions = styleGroup.property("ADBE Blend Options Group") as PropertyGroup;
    var advGroup = blendOptions ? blendOptions.property("ADBE Adv Blend Group") as PropertyGroup : null;
    var fillProp = advGroup
      ? (advGroup.property("ADBE Layer Fill Opacity2") || advGroup.property("ADBE Layer Fill Opacity")) as Property
      : null;
    if (!fillProp) return;
    var comp = layer.containingComp;
    app.beginUndoGroup("Change Fill Opacity");
    if (fillProp.numKeys > 0) fillProp.setValueAtTime(comp.time, value);
    else fillProp.setValue(value);
    app.endUndoGroup();
  } catch (e) { /* ignore */ }
};

/**
 * Keyframe operations on a style property.
 */
export var operateKeyframe = function (styleId: string, propIndex: number, action: string): void {
  var layer = getActiveLayer();
  if (!layer) return;
  var styleGroup = getStyleGroup(layer);
  if (!styleGroup) return;
  var styleDef = findStyleDef(styleId);
  if (!styleDef) return;
  var activeProp = getStyleGroupProp(styleGroup, styleDef) as PropertyGroup;
  if (!activeProp || !activeProp.enabled) return;
  var defs = PROP_DEF[styleId];
  if (!defs || propIndex >= defs.length) return;

  var def = defs[propIndex];
  var keySuffixes = typeof def.key === "string" ? [def.key as string] : def.key as string[];
  var prop = findPropInGroup(activeProp, keySuffixes);
  if (!prop || !prop.canVaryOverTime) return;

  var comp = layer.containingComp;
  var t = comp.time;

  app.beginUndoGroup("K-Frame");
  try {
    if (action === "add") {
      prop.setValueAtTime(t, prop.value);
    } else if (action === "remove") {
      if (prop.numKeys > 0) {
        var idx = prop.nearestKeyIndex(t);
        if (Math.abs(prop.keyTime(idx) - t) < 0.005) prop.removeKey(idx);
      }
    } else if (action === "prev") {
      if (prop.numKeys > 0) {
        var idx = prop.nearestKeyIndex(t);
        if (prop.keyTime(idx) >= t - 0.001) idx--;
        if (idx > 0) comp.time = prop.keyTime(idx);
      }
    } else if (action === "next") {
      if (prop.numKeys > 0) {
        var idx = prop.nearestKeyIndex(t);
        if (prop.keyTime(idx) <= t + 0.001) idx++;
        if (idx <= prop.numKeys) comp.time = prop.keyTime(idx);
      }
    } else if (action === "hold_all") {
      var kCount = prop.numKeys;
      if (kCount > 0) {
        for (var k = 1; k <= kCount; k++) {
          prop.setInterpolationTypeAtKey(k, KeyframeInterpolationType.HOLD, KeyframeInterpolationType.HOLD);
        }
      }
    }
  } catch (e) { /* ignore */ }
  app.endUndoGroup();
};

/**
 * Keyframe operations on fill opacity.
 */
export var operateFillOpacityKeyframe = function (action: string): void {
  var layer = getActiveLayer();
  if (!layer) return;
  var styleGroup = getStyleGroup(layer);
  if (!styleGroup) return;
  try {
    var blendOptions = styleGroup.property("ADBE Blend Options Group") as PropertyGroup;
    var advGroup = blendOptions ? blendOptions.property("ADBE Adv Blend Group") as PropertyGroup : null;
    var prop = advGroup
      ? (advGroup.property("ADBE Layer Fill Opacity2") || advGroup.property("ADBE Layer Fill Opacity")) as Property
      : null;
    if (!prop || !prop.canVaryOverTime) return;

    var comp = layer.containingComp;
    var t = comp.time;
    app.beginUndoGroup("K-Frame Fill");
    if (action === "add") {
      prop.setValueAtTime(t, prop.value);
    } else if (action === "remove") {
      if (prop.numKeys > 0) {
        var idx = prop.nearestKeyIndex(t);
        if (Math.abs(prop.keyTime(idx) - t) < 0.005) prop.removeKey(idx);
      }
    } else if (action === "prev") {
      if (prop.numKeys > 0) {
        var idx = prop.nearestKeyIndex(t);
        if (prop.keyTime(idx) >= t - 0.001) idx--;
        if (idx > 0) comp.time = prop.keyTime(idx);
      }
    } else if (action === "next") {
      if (prop.numKeys > 0) {
        var idx = prop.nearestKeyIndex(t);
        if (prop.keyTime(idx) <= t + 0.001) idx++;
        if (idx <= prop.numKeys) comp.time = prop.keyTime(idx);
      }
    } else if (action === "hold_all") {
      var kCount = prop.numKeys;
      if (kCount > 0) {
        for (var k = 1; k <= kCount; k++) {
          prop.setInterpolationTypeAtKey(k, KeyframeInterpolationType.HOLD, KeyframeInterpolationType.HOLD);
        }
      }
    }
    app.endUndoGroup();
  } catch (e) { /* ignore */ }
};

/**
 * Add a layer style via menu command.
 */
export var addStyle = function (styleId: string): void {
  var layer = getActiveLayer();
  if (!layer) return;
  var comp = layer.containingComp;
  app.beginUndoGroup("Add Layer Style");
  try {
    var sel = comp.selectedLayers;
    for (var s = 0; s < sel.length; s++) sel[s].selected = false;
    layer.selected = true;

    var cmds = MENU_CMD_MAP[styleId];
    var executed = false;
    if (cmds) {
      for (var c = 0; c < cmds.length; c++) {
        var cmdId = app.findMenuCommandId(cmds[c]);
        if (cmdId !== 0) {
          app.executeCommand(cmdId);
          executed = true;
          break;
        }
      }
    }
    if (!executed) {
      var def = findStyleDef(styleId);
      if (def && def.cmdId) app.executeCommand(def.cmdId);
    }
  } catch (e) { /* ignore */ }
  app.endUndoGroup();
};

/**
 * Remove a style by selecting it and pressing delete.
 */
export var removeStyle = function (styleId: string): void {
  var layer = getActiveLayer();
  if (!layer) return;
  var styleGroup = getStyleGroup(layer);
  if (!styleGroup) return;
  var styleDef = findStyleDef(styleId);
  if (!styleDef) return;
  var targetProp = getStyleGroupProp(styleGroup, styleDef);
  if (!targetProp || !targetProp.enabled) return;

  var comp = layer.containingComp;
  app.beginUndoGroup("Remove Layer Style");
  try {
    var sel = comp.selectedLayers;
    for (var s = 0; s < sel.length; s++) sel[s].selected = false;
    layer.selected = true;
    targetProp.selected = true;
    app.executeCommand(18); // Edit > Clear
  } catch (e) { /* ignore */ }
  app.endUndoGroup();
};

/**
 * Rename the selected layer.
 */
export var renameLayer = function (name: string): void {
  var layer = getActiveLayer();
  if (!layer) return;
  app.beginUndoGroup("Rename");
  try { layer.name = name; } catch (e) { /* ignore */ }
  app.endUndoGroup();
};

/**
 * Replace layer name with a base name.
 */
export var applyBaseName = function (baseName: string): void {
  var layer = getActiveLayer();
  if (!layer) return;
  app.beginUndoGroup("Replace Layer Name");
  try { layer.name = baseName; } catch (e) { /* ignore */ }
  app.endUndoGroup();
};

/**
 * Append a suffix to the layer name, stripping trailing numbers.
 */
export var applyNameSuffix = function (suffix: string): void {
  var layer = getActiveLayer();
  if (!layer) return;
  app.beginUndoGroup("Rename Suffix");
  try {
    var n = layer.name;
    n = n.replace(/\s+\d+$/, "");
    layer.name = n + suffix;
  } catch (e) { /* ignore */ }
  app.endUndoGroup();
};

/**
 * Toggle solo on the selected layer.
 */
export var toggleSolo = function (): void {
  var layer = getActiveLayer();
  if (!layer) return;
  app.beginUndoGroup("Toggle Solo");
  try { layer.solo = !layer.solo; } catch (e) { /* ignore */ }
  app.endUndoGroup();
};

/**
 * Toggle FX (all non-color-key effects).
 */
export var toggleFxEnabled = function (): void {
  var layer = getActiveLayer();
  if (!layer) return;
  var fxGroup = layer.property("ADBE Effect Parade") as PropertyGroup;
  if (!fxGroup || fxGroup.numProperties === 0) return;
  app.beginUndoGroup("FX Toggle");
  var targetState: boolean | null = null;
  for (var i = 1; i <= fxGroup.numProperties; i++) {
    var fx = fxGroup.property(i);
    if (fx.name.indexOf("カラーキー") === -1 && fx.name.indexOf("Color Key") === -1) {
      if (targetState === null) targetState = !fx.enabled;
      try { fx.enabled = targetState!; } catch (e) { /* ignore */ }
    }
  }
  app.endUndoGroup();
};

/**
 * Navigate frame (delta = -1 or +1).
 */
export var navigateFrame = function (delta: number): void {
  var comp = app.project.activeItem as CompItem;
  if (!comp) return;
  var newTime = comp.time + delta * comp.frameDuration;
  comp.time = Math.max(0, Math.min(comp.duration, newTime));
};

/**
 * Reveal keyframes (U shortcut).
 */
export var revealKeyframes = function (): void {
  var layer = getActiveLayer();
  if (!layer) return;
  var comp = layer.containingComp;
  app.beginUndoGroup("Reveal Keyframes");
  try {
    for (var i = 1; i <= comp.numLayers; i++) comp.layer(i).selected = false;
    layer.selected = true;
    app.executeCommand(2387);
  } catch (e) { /* ignore */ }
  app.endUndoGroup();
};

/**
 * Expand / reveal the style property in the timeline.
 */
export var expandStyleProperty = function (styleId: string): void {
  var layer = getActiveLayer();
  if (!layer) return;
  var styleGroup = getStyleGroup(layer);
  if (!styleGroup) return;
  var comp = layer.containingComp;
  app.beginUndoGroup("Expand");
  try {
    for (var i = 1; i <= comp.numLayers; i++) comp.layer(i).selected = false;
    layer.selected = true;
    var styleDef = findStyleDef(styleId);
    var activeProp = styleDef ? getStyleGroupProp(styleGroup, styleDef) : null;
    if (activeProp) activeProp.selected = true;
    else styleGroup.selected = true;
    app.executeCommand(
      app.findMenuCommandId("Reveal Selected Properties")
      || app.findMenuCommandId("選択したプロパティを表示")
      || 2771
    );
  } catch (e) { /* ignore */ }
  app.endUndoGroup();
};

/**
 * Open the native AE color picker for a style property.
 */
export var openNativeColorPicker = function (styleId: string, propIndex: number): void {
  var layer = getActiveLayer();
  if (!layer) return;
  var styleGroup = getStyleGroup(layer);
  if (!styleGroup) return;
  var styleDef = findStyleDef(styleId);
  if (!styleDef) return;
  var activeProp = getStyleGroupProp(styleGroup, styleDef) as PropertyGroup;
  if (!activeProp || !activeProp.enabled) return;
  var defs = PROP_DEF[styleId];
  if (!defs || propIndex >= defs.length) return;

  var def = defs[propIndex];
  var keySuffixes = typeof def.key === "string" ? [def.key as string] : def.key as string[];
  var prop = findPropInGroup(activeProp, keySuffixes);
  if (!prop) return;

  var comp = layer.containingComp;
  try {
    var selLayers = comp.selectedLayers;
    for (var i = 0; i < selLayers.length; i++) selLayers[i].selected = false;
    layer.selected = true;
    prop.selected = true;
    app.executeCommand(app.findMenuCommandId("Edit Value...") || 2240);
    for (var i = 0; i < selLayers.length; i++) selLayers[i].selected = true;
  } catch (e) { /* ignore */ }
};

/**
 * Toggle P_Color enable/disable.
 */
export var togglePColor = function (effectName: string, enableIdx: number): void {
  var layer = getActiveLayer();
  if (!layer) return;
  var comp = layer.containingComp;
  try {
    var fxGrp = layer.property("ADBE Effect Parade") as PropertyGroup;
    var effect = fxGrp.property(effectName) as PropertyGroup;
    var enableProp = effect.property(enableIdx) as Property;
    app.beginUndoGroup("Toggle P_Color");
    var newVal = (enableProp.value === 1 || enableProp.value === true) ? 0 : 1;
    if (enableProp.numKeys > 0) enableProp.setValueAtTime(comp.time, newVal);
    else enableProp.setValue(newVal);
    app.endUndoGroup();
  } catch (e) { /* ignore */ }
};

/**
 * Open P_Color native picker (auto-enables if disabled).
 */
export var openPColorPicker = function (effectName: string, propIdx: number, enableIdx: number): void {
  var layer = getActiveLayer();
  if (!layer) return;
  var comp = layer.containingComp;
  try {
    var fxGrp = layer.property("ADBE Effect Parade") as PropertyGroup;
    var effect = fxGrp.property(effectName) as PropertyGroup;
    var enableProp = effect.property(enableIdx) as Property;
    var colorProp = effect.property(propIdx) as Property;

    // Auto-enable if disabled
    if (enableProp.value === 0 || enableProp.value === false) {
      app.beginUndoGroup("Auto-Enable P_Color");
      if (enableProp.numKeys > 0) enableProp.setValueAtTime(comp.time, 1);
      else enableProp.setValue(1);
      app.endUndoGroup();
    }

    // Open native picker
    var selLayers = comp.selectedLayers;
    for (var i = 0; i < selLayers.length; i++) selLayers[i].selected = false;
    layer.selected = true;
    colorProp.selected = true;
    app.executeCommand(app.findMenuCommandId("Edit Value...") || 2240);
    for (var i = 0; i < selLayers.length; i++) selLayers[i].selected = true;
  } catch (e) { /* ignore */ }
};
