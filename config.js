export const NODE_TYPE = {
  VNF: { w: 106, h: 122, max_conections: 4, color: "#879195", border: 10 },
  START: { max_conections: 1, color: "#8CC14E", w: 32, h: 32, border: 5 },
  STOP: { max_conections: 1, color: "#D84F4F", w: 32, h: 32, border: 5 }
};

export const CONFIG_D3 = {
  zoom: { min_zoom: 0.2, max_zoom: 3 }
};

export const CONFIG_NODE = {
  color: "rgba(55,71,79,1)",
  stroke: "rgba(239,242,247,1)",
  r: 5,
  stroke_width: 2
};

export const OPTIONS = [{ text: "Settings" }, { text: "Remove" }];
