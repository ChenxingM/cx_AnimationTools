// ---------------------------------------------------------------------------
// Shared types for Layer Style Controller (Panel ↔ Host)
// No AE API dependencies — pure data interfaces and constants
// ---------------------------------------------------------------------------

export interface StyleButtonDef {
  id: string;
  label: string;
  matchName: string;
  fallback: string;
  cmdId: number | null;
}

export interface PropDef {
  label: string;
  key: string | string[];
  type: "number" | "color" | "blendMode" | "boolean";
}

export interface BlendModeEntry {
  name: string;
  val: number;
}

export type KeyframeAction = "add" | "remove" | "prev" | "next" | "hold_all";

// ---------------------------------------------------------------------------
// Panel ↔ Host communication data structures
// ---------------------------------------------------------------------------

export interface PropState {
  label: string;
  type: PropDef["type"];
  value: number | [number, number, number] | boolean;
  canVaryOverTime: boolean;
  numKeys: number;
  onKeyframe: boolean;
  hasPrev: boolean;
  hasNext: boolean;
}

export interface StyleNavState {
  id: string;
  isExisting: boolean;
  isEnabled: boolean;
}

export interface PColorState {
  color: [number, number, number];
  isDisabled: boolean;
  effectName: string;
  propIdx: number;
  enableIdx: number;
}

export interface LayerStylePanelState {
  hasLayer: boolean;
  layerName: string;
  currentStyleId: string;
  styleNav: StyleNavState[];
  fillOpacity: number | null;
  fillOpacityCanVary: boolean;
  fillOpacityNumKeys: number;
  fillOpacityOnKey: boolean;
  fillOpacityHasPrev: boolean;
  fillOpacityHasNext: boolean;
  props: PropState[];
  pColors: PColorState[];
  compTime: number;
  isSoloActive: boolean;
  layerHash: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const STYLE_BUTTONS: StyleButtonDef[] = [
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

export const MENU_CMD_MAP: { [id: string]: string[] } = {
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

export const blendModes: BlendModeEntry[] = [
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

export const blendModeNames: string[] = blendModes.map((m) => m.name);

export const PROP_DEF: { [styleId: string]: PropDef[] } = {
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

export const BASE_NAMES = ["名▼", "line", "瞳", "肌", "服", "髪", "襟", "歯"];
export const SUFFIXES = ["影", "ハイライト", "照り返し", "リムライト", "ベース"];
