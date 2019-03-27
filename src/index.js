import * as d3 from "d3";
import { NODE_TYPE, CONFIG_NODE, CONFIG_D3 as d3Config } from "../config";
import { filter } from "lodash";
import faker from "faker/locale/pt_BR";

// mouse event vars
let selectedNode = null,
  mousedownLink = null,
  mousedownNode = null,
  mouseupNode = null,
  nodesVNF = [];

// SVG
const height = 550,
  width = 770;
// Data
var nodeData = [
  {
    id: "teste1",
    type: "VNF",
    x: 317,
    y: 211,
    extra_info: {
      version: "1.2.1",
      name: "vnf name",
      sub_name: "Vendor name"
    }
  },
  {
    id: "teste2",
    type: "start",
    x: 125,
    y: 250
  },
  {
    id: "teste3",
    type: "stop",
    x: 600,
    y: 257
  },
  {
    id: "teste4",
    type: "VNF",
    x: 372,
    y: 44,
    extra_info: {
      version: "2.0.1",
      name: "vnf name 2",
      sub_name: "Vendor name 2"
    }
  },
  {
    id: "teste5",
    type: "VNF",
    x: 371,
    y: 366,
    extra_info: {
      version: "1.0.1",
      name: "vnf name 1",
      sub_name: "Vendor name 1"
    }
  }
];

// Create Object D3 Nodes
let nodes = nodeData.map(node => {
  switch (node.type) {
    case "start":
      return {
        ...node,
        fill: NODE_TYPE.START.color,
        w: NODE_TYPE.START.w,
        h: NODE_TYPE.START.h,
        border: NODE_TYPE.START.border,
        right: {
          x: NODE_TYPE.START.w,
          y: NODE_TYPE.START.h / 2,
          isLink: false
        }
      };
    case "stop":
      return {
        ...node,
        fill: NODE_TYPE.STOP.color,
        h: NODE_TYPE.STOP.h,
        w: NODE_TYPE.STOP.w,
        border: NODE_TYPE.STOP.border,
        left: { x: 0, y: NODE_TYPE.STOP.h / 2, isLink: false }
      };
    case "VNF":
      return {
        ...node,
        h: NODE_TYPE.VNF.h,
        w: NODE_TYPE.VNF.w,
        fill: NODE_TYPE.VNF.color,
        border: NODE_TYPE.VNF.border,
        left: { x: 0, y: NODE_TYPE.VNF.h / 2, isLink: false },
        right: {
          x: NODE_TYPE.VNF.w,
          y: NODE_TYPE.VNF.h / 2,
          isLink: false
        },
        top: { x: NODE_TYPE.VNF.w / 2, y: 0, isLink: false },
        bottom: {
          x: NODE_TYPE.VNF.w / 2,
          y: NODE_TYPE.VNF.h,
          isLink: false
        },
        isOpen: false
      };
  }
});

// *** LINK BY IDS *** //
var links = [
  {
    source: "teste1",
    target: "teste2",
    sourcePosition: "left",
    targetPosition: "right"
  },
  {
    source: "teste1",
    target: "teste3",
    sourcePosition: "right",
    targetPosition: "left"
  },
  {
    source: "teste1",
    target: "teste4",
    sourcePosition: "top",
    targetPosition: "left"
  },
  {
    source: "teste1",
    target: "teste5",
    sourcePosition: "bottom",
    targetPosition: "left"
  }
];

// find by Id
const findById = links => {
  links.forEach(link => {
    link.source = nodes.find(node => node.id === link.source);
    link.target = nodes.find(node => node.id === link.target);
    link.source[link.sourcePosition].isLink = true;
    link.target[link.targetPosition].isLink = true;
    const changeNodeSource = nodes.find(
      node => node.id === link.source.id || node.id === link.target.id
    );
    if (changeNodeSource) {
      changeNodeSource[link.sourcePosition].isLink = true;
    }
  });
};
findById(links);

var zoom = d3
  .zoom()
  .scaleExtent([d3Config.zoom.min_zoom, d3Config.zoom.max_zoom])
  .on("zoom", zoomed);

// Area
const svg = d3
  .select("body")
  .append("svg")
  .attr("width", width)
  .attr("height", height);
//.attr('oncontextmenu', 'return false;')

const gZoom = svg.append("g").call(zoom);

// handles to link and node element groups
let path = gZoom.append("svg:g").selectAll("path");
let groupStart = gZoom.append("svg:g").selectAll("g .group_start");
let groupStop = gZoom.append("svg:g").selectAll("g .group_stop");
let groupVNF = gZoom.append("svg:g").selectAll("g .group_VNF");

// Drag and drop
const drag = d3
  .drag()
  .on("start", d => {
    d3.select(`#${d.id}`).classed("active", false);
  })
  .on("drag", d => {
    d.x = d3.event.x;
    d.y = d3.event.y;
    tick();
  })
  .on("end", d => {
    d3.select(`#${d.id}`).classed("active", false);
  });

function tick() {
  // draw directed edges
  path
    .attr("x1", d => {
      return d.source.x + d.source[d.sourcePosition].x;
    })
    .attr("y1", d => {
      return d.source.y + d.source[d.sourcePosition].y;
    })
    .attr("x2", d => {
      return d.target.x + d.target[d.targetPosition].x;
    })
    .attr("y2", d => {
      return d.target.y + d.target[d.targetPosition].y;
    });
  groupStart.attr("transform", d => `translate(${d.x},${d.y})`);

  groupStop.attr("transform", d => `translate(${d.x},${d.y})`);

  groupVNF.attr("transform", d => `translate(${d.x},${d.y})`);
}

// Add VNF
function add(node) {
  nodes.push(node);
  restart();
}

const restart = () => {
  /**LINKS**/
  path = path.data(links);

  // Remove old links
  path.exit().remove();

  // Add new links
  path = path
    .enter()
    .append("svg:line")
    .attr("class", `link`)
    .attr("stroke", "#fff")
    .attr("stroke-width", 2)
    .on("click", d => {
      alert("click link");
    })
    .on("mousedown", d => {
      // select link
      mousedownLink = d;
      selectedNode = null;
      restart();
    })
    .merge(path);

  nodesVNF = nodes.filter(node => node.type === "VNF" && node);

  groupVNF = groupVNF.data(nodesVNF, d => d.id);

  // Update Group
  groupVNF.selectAll(".group_VNF").attr("id", d => d.id);

  // remove old VNF
  groupVNF.exit().remove();

  // Add NEW GROUP
  const gVNF = groupVNF
    .enter()
    .append("svg:g")
    .attr("class", "group_VNF")
    .attr("id", d => d.id)
    .attr("transform", d => `translate(${d.x || 0}, ${d.y || 0})`)
    .attr("y", d => d.y)
    .on("mouseover", d => {
      set_focus(d);
      const options = ["right", "left", "top", "bottom"];
      options.forEach(option => {
        if (!d[option].isLink) {
          return d3
            .selectAll(`g #${d.id} .option_VNF_${option}`)
            .classed("hidden", false);
        }
      });
    })
    .on("mouseout", d => {
      unset_focus(d);
      const options = ["right", "left", "top", "bottom"];
      options.forEach(option => {
        if (!d[option].isLink) {
          return d3
            .selectAll(`g #${d.id} .option_VNF_${option}`)
            .classed("hidden", true);
        }
      });
    });
  // Create RECT GRoup
  gVNF
    .append("svg:rect")
    .attr("class", "rect_VNF")
    .attr("r", d => d.radius)
    .attr("width", d => d.w)
    .attr("height", d => d.h)
    .attr("rx", d => d.border)
    .attr("fill", d => d.fill)
    .on("mousedown", d => onMouseDown(d, null));

  // Circle Info
  gVNF
    .append("svg:circle")
    .attr("r", d => 24)
    .attr("cx", d => d.w / 2)
    .attr("cy", d => 40)
    .attr("fill", d => "#B8D0DF")
    .on("mousedown", d => onMouseDown(d, null));
  gVNF
    .append("svg:text")
    .attr("class", "title")
    .attr("text-anchor", "middle")
    .attr("x", d => d.w / 2)
    .attr("y", 44)
    .text("vnf")
    .on("mousedown", d => onMouseDown(d, null));
  // NAME
  gVNF
    .append("svg:text")
    .attr("class", "name")
    .attr("text-anchor", "middle")
    .attr("x", d => d.w / 2)
    .attr("y", d => d.h - 30)
    .text(d => d.extra_info.name)
    .on("mousedown", d => onMouseDown(d, null));
  // SUBNAME
  gVNF
    .append("svg:text")
    .attr("class", "sub_name")
    .attr("text-anchor", "middle")
    .attr("x", d => d.w / 2)
    .attr("y", d => d.h - 15)
    .text(d => d.extra_info.sub_name);
  // VERSION
  gVNF
    .append("svg:text")
    .attr("class", "version")
    .attr("text-anchor", "middle")
    .attr("x", d => 18)
    .attr("y", 15)
    .text(d => d.extra_info.version);
  // Options Right
  gVNF
    .append("svg:circle")
    .attr("class", d => {
      if (d.right.isLink) {
        return "option_VNF_right";
      } else {
        return "option_VNF_right hidden ";
      }
    })
    .attr("fill", CONFIG_NODE.color)
    .attr("stroke", CONFIG_NODE.stroke)
    .attr("stroke-width", CONFIG_NODE.stroke_width)
    .attr("r", CONFIG_NODE.r)
    .attr("cx", d => d.w)
    .attr("cy", d => d.h / 2)
    .on("mousedown", d => {
      onMouseDown(d, "right");
    })
    .on("mouseup", d => {
      mouseUpConfig(d, "right");
    });

  // Options Left
  gVNF
    .append("svg:circle")
    .attr("class", d => {
      if (d.left.isLink) {
        return "option_VNF_left ";
      } else {
        return "option_VNF_left hidden ";
      }
    })
    .attr("fill", CONFIG_NODE.color)
    .attr("stroke", CONFIG_NODE.stroke)
    .attr("stroke-width", CONFIG_NODE.stroke_width)
    .attr("r", CONFIG_NODE.r)
    .attr("cx", 0)
    .attr("cy", d => d.h / 2)
    .on("mousedown", d => {
      onMouseDown(d, "left");
    })
    .on("mouseup", d => {
      mouseUpConfig(d, "left");
    });
  // Options Bottom
  gVNF
    .append("svg:circle")
    .attr("class", d => {
      if (d.bottom.isLink) {
        return "option_VNF_bottom ";
      } else {
        return "option_VNF_bottom hidden";
      }
    })
    .attr("fill", CONFIG_NODE.color)
    .attr("stroke", CONFIG_NODE.stroke)
    .attr("stroke-width", CONFIG_NODE.stroke_width)
    .attr("r", CONFIG_NODE.r)
    .attr("cx", d => d.w / 2)
    .attr("cy", d => d.h)
    .on("mousedown", d => {
      onMouseDown(d, "bottom");
    })
    .on("mouseup", d => {
      mouseUpConfig(d, "bottom");
    });

  // Options Top
  gVNF
    .append("svg:circle")
    .attr("class", d => {
      if (d.top.isLink) {
        return "option_VNF_top ";
      } else {
        return "option_VNF_top hidden ";
      }
    })
    .attr("fill", CONFIG_NODE.color)
    .attr("stroke", CONFIG_NODE.stroke)
    .attr("stroke-width", CONFIG_NODE.stroke_width)
    .attr("r", CONFIG_NODE.r)
    .attr("cx", d => d.w / 2)
    .attr("cy", 0)
    .attr("r", 5)
    .on("mousedown", d => {
      onMouseDown(d, "top");
    })
    .on("mouseup", d => {
      mouseUpConfig(d, "top");
    });

  const groupVNFMenu = gVNF.append("svg:g").attr("class", "group_VNF_menu");
  groupVNFMenu
    .append("svg:rect")
    .attr("class", "menu")
    .attr("fill", "transparent")
    .attr("width", 35)
    .attr("height", 35)
    .attr("rx", "5%")
    .attr("ry", "100%")
    .attr("x", 86)
    .attr("y", 0)
    .on("click", d => showTooltip(d));
  groupVNFMenu
    .append("svg:rect")
    .attr("class", "menu_otpions visibility")
    .attr("fill", "#404F57")
    .attr("width", 200)
    .attr("height", 40)
    .attr("rx", 5)
    .attr("x", 106)
    .attr("y", 0)
    .on("click", d => {
      console.info("Settings");
      deleteNodes();
    });
  groupVNFMenu
    .append("svg:text")
    .attr("class", "menu_otpions visibility")
    .attr("x", 150)
    .attr("y", 25)
    .text("Settings")
    .attr("font-family", "sans-serif")
    .attr("font-size", "14px")
    .attr("font-weight", "bold")
    .attr("fill", "#fff");
  groupVNFMenu
    .append("svg:rect")
    .attr("class", "menu_otpions visibility")
    .attr("fill", "#404F57")
    .attr("width", 200)
    .attr("height", 40)
    .attr("rx", 5)
    .attr("x", 106)
    .attr("y", 40)
    .on("click", d => {
      console.info("remove");
      deleteNodes();
    });
  groupVNFMenu
    .append("svg:text")
    .attr("class", "menu_otpions visibility")
    .attr("x", 150)
    .attr("y", 60)
    .text("Remove")
    .attr("font-family", "sans-serif")
    .attr("font-size", "14px")
    .attr("font-weight", "bold")
    .attr("fill", "#fff");
  // MENU
  groupVNFMenu
    .append("svg:circle")
    .attr("class", "option_menu hidden")
    .attr("r", 2)
    .attr("fill", "white")
    .attr("cx", 94)
    .attr("cy", 12);
  // MENU
  groupVNFMenu
    .append("svg:circle")
    .attr("class", "option_menu hidden")
    .attr("r", 2)
    .attr("fill", "white")
    .attr("cx", 94)
    .attr("cy", 18);
  // MENU
  groupVNFMenu
    .append("svg:circle")
    .attr("class", "option_menu hidden")
    .attr("r", 2)
    .attr("fill", "white")
    .attr("cx", 94)
    .attr("cy", 24);

  groupVNF = gVNF.merge(groupVNF);

  const nodesStart = nodes.filter(node => node.type === "start");

  groupStart = groupStart.data(nodesStart, d => d.id);

  // Update Group
  groupStart.selectAll("g g .group_start").attr("id", d => d.id);

  // remove old nodes
  groupStart.exit().remove();

  // Create Group Start
  let gStart = groupStart
    .enter()
    .append("svg:g")
    .attr("class", "group_start")
    .attr("transform", d => `translate(${d.x || 0}, ${d.y || 0})`)
    .attr("id", d => d.id)
    .on("mouseover", d => {
      set_focus(d);
      if (!d.right.isLink) {
        d3.select(`g #${d.id} .option_start`).classed("hidden", false);
      }
    })
    .on("mouseout", d => {
      unset_focus(d);
      if (!d.right.isLink) {
        d3.select(`g #${d.id} .option_start`).classed("hidden", true);
      }
    });

  // Create Rect
  gStart
    .append("svg:rect")
    .attr("class", "rect_start")
    .attr("r", d => d.radius)
    .attr("width", d => d.w)
    .attr("height", d => d.h)
    .attr("rx", d => d.border)
    .attr("fill", d => d.fill)
    .on("mousedown", d => onMouseDown(d, "groupStart"));

  // add option right
  gStart
    .append("svg:circle")
    .attr("fill", CONFIG_NODE.color)
    .attr("stroke", CONFIG_NODE.stroke)
    .attr("stroke-width", CONFIG_NODE.stroke_width)
    .attr("r", CONFIG_NODE.r)
    .attr("cx", d => d.w)
    .attr("cy", d => d.h / 2)
    .attr("class", d => {
      if (d.right.isLink) {
        return "option_start";
      } else {
        return "option_start hidden";
      }
    })
    .on("mousedown", d => onMouseDown(d, "right"))
    .on("mouseup", d => mouseUpConfig(d, "right"));

  // Play Button
  gStart
    .append("svg:circle")
    .attr("fill", "white")
    .attr("r", 10)
    .attr("cx", d => d.w / 2)
    .attr("cy", d => d.h / 2)
    .on("mousedown", d => onMouseDown(d, "groupStart"));
  // Create Triangle
  const triangle = d3
    .symbol()
    .type(d3.symbolTriangle)
    .size(50);

  gStart
    .append("path")
    .attr("d", triangle)
    .attr("fill", NODE_TYPE.START.color)
    .attr("transform", d => `translate(${d.w / 2},${d.h / 2}) rotate(90)`)
    .on("mousedown", d => onMouseDown(d, "groupStart"));

  groupStart = gStart.merge(groupStart);

  const nodesStop = nodes.filter(node => node.type === "stop");

  groupStop = groupStop.data(nodesStop, d => d.id);

  // Update Group
  groupStop.selectAll(".group_stop").attr("id", d => d.id);

  // remove old nodes
  groupStop.exit().remove();
  //Add new options
  const gStop = groupStop
    .enter()
    .append("svg:g")
    .attr("class", "group_stop")
    .attr("transform", d => `translate(${d.x || 0}, ${d.y || 0})`)
    .attr("id", d => d.id)
    .on("mouseover", d => {
      set_focus(d);
      if (!d.left.isLink) {
        d3.select(`g #${d.id} .option_stop`).classed("hidden", false);
      }
    })
    .on("mouseout", d => {
      unset_focus(d);
      if (!d.left.isLink) {
        d3.select(`g #${d.id} .option_stop`).classed("hidden", true);
      }
    });

  // Create Stop Rect
  gStop
    .append("svg:rect")
    .attr("class", "rect_stop")
    .attr("r", d => d.radius)
    .attr("width", d => d.w)
    .attr("height", d => d.h)
    .attr("rx", d => d.border)
    .attr("fill", d => d.fill)
    .on("mousedown", d => onMouseDown(d, "groupStop"));
  // show node options
  gStop
    .append("svg:circle")
    .attr("class", d => (d.left.isLink ? "option_stop" : "option_stop hidden"))
    .attr("id", d => d.id)
    .attr("fill", CONFIG_NODE.color)
    .attr("stroke", CONFIG_NODE.stroke)
    .attr("stroke-width", CONFIG_NODE.stroke_width)
    .attr("r", CONFIG_NODE.r)
    .attr("cx", d => 0)
    .attr("cy", d => d.h / 2)
    .on("mousedown", d => onMouseDown(d, "left"))
    .on("mouseup", d => {
      mouseUpConfig(d, "left");
    });
  // Stop Button
  gStop
    .append("svg:circle")
    .attr("class", "option_stop hidden")
    .attr("id", d => d.id)
    .attr("fill", "white")
    .attr("r", 10)
    .attr("cx", d => d.w / 2)
    .attr("cy", d => d.h / 2)
    .attr("id", d => d.id)
    .attr("class", d => "stop")
    .on("mousedown", d => onMouseDown(d, "groupStop"));
  groupStop = gStop.merge(groupStop);

  tick();
};

const onMouseDown = (d, target) => {
  switch (target) {
    case "right":
      d3.event.stopPropagation();
      mouseDownConfig(d, target);
      break;
    case "left":
      d3.event.stopPropagation();
      mouseDownConfig(d, target);
      break;
    case "top":
      d3.event.stopPropagation();
      mouseDownConfig(d, target);
      break;
    case "bottom":
      d3.event.stopPropagation();
      mouseDownConfig(d, target);
      break;
    case "groupStart":
      groupStart.call(drag);
      break;
    case "groupStop":
      groupStop.call(drag);
      break;
    default:
      groupVNF.call(drag);
      break;
  }
};

// line displayed when dragging new nodes
const dragLine = svg
  .append("g svg:path")
  .attr("class", "link dragline hidden")
  .attr("d", "M0,0L0,0");

const mouseDownConfig = (d, target) => {
  // select node
  mousedownNode = d;
  selectedNode = mousedownNode === selectedNode ? null : mousedownNode;
  d.optionSelect = target;
  d[target].isLink = true;
  // reposition drag line
  dragLine.classed("hidden", false).attr("d", d => {
    `M${mousedownNode.x + mousedownNode.w},${mousedownNode.y}L${
      mousedownNode.x
    },${mousedownNode.y}`;
  });
  restart();
};

const mouseUpConfig = (d, target) => {
  if (!mousedownNode) return;

  // hidden drag line
  dragLine.classed("hidden", true);

  // check for drag-to-self
  mouseupNode = d;
  if (mouseupNode === mousedownNode) {
    resetMouseVars();
    return;
  }
  // check if is linked
  let node = d[target].isLink;
  if (node) {
    alert("is linked");
    resetMouseVars();
    return;
  } else {
    node = true;
  }
  // unenlarge target node
  d3.select(this).attr("transform", "");
  d.optionSelect = target;
  selectedNode = null;
  createLink();
};

// Draw initial
const tooltip = d3
  .select("body")
  .append("div")
  .attr("id", "tooltip")
  .style("opacity", 0);

svg
  .append("svg:circle")
  .style("fill", NODE_TYPE.VNF.color)
  .attr("class", "VNF")
  .attr("r", 20)
  .attr("cy", 470)
  .attr("cx", 30)
  .on("click", function() {
    const newVNF = {
      id: `test${faker.random.number()}`,
      type: "VNF",
      extra_info: {
        version: faker.random.number(),
        name: faker.random.words(),
        sub_name: faker.random.word()
      },
      h: NODE_TYPE.VNF.h,
      w: NODE_TYPE.VNF.w,
      fill: NODE_TYPE.VNF.color,
      border: NODE_TYPE.VNF.border,
      left: { x: 0, y: NODE_TYPE.VNF.h / 2 },
      right: {
        x: NODE_TYPE.VNF.w,
        y: NODE_TYPE.VNF.h / 2
      },
      top: { x: NODE_TYPE.VNF.w / 2, y: 0 },
      bottom: {
        x: NODE_TYPE.VNF.w / 2,
        y: NODE_TYPE.VNF.h
      }
    };
    add(newVNF);
  });
svg
  .append("svg:circle")
  .style("fill", NODE_TYPE.START.color)
  .attr("class", "start")
  .attr("r", 20)
  .attr("cy", 420)
  .attr("cx", 30)
  .on("click", function() {
    const newStart = {
      id: `test${faker.random.number()}`,
      type: "start",
      x: 300,
      y: 200,
      fill: NODE_TYPE.START.color,
      w: NODE_TYPE.START.w,
      h: NODE_TYPE.START.h,
      border: NODE_TYPE.START.border,
      right: {
        x: NODE_TYPE.START.w,
        y: NODE_TYPE.START.h / 2
      }
    };
    add(newStart);
  });
svg
  .append("svg:circle")
  .style("fill", NODE_TYPE.STOP.color)
  .attr("class", "stop")
  .attr("r", 20)
  .attr("cy", 370)
  .attr("cx", 30)
  .on("click", function() {
    const newStop = {
      id: `test${faker.random.number()}`,
      type: "stop",
      x: 30,
      y: 100,
      fill: NODE_TYPE.STOP.color,
      h: NODE_TYPE.STOP.h,
      w: NODE_TYPE.STOP.w,
      border: NODE_TYPE.STOP.border,
      left: { x: 0, y: NODE_TYPE.STOP.h / 2 }
    };
    add(newStop);
  });

svg
  .append("svg:rect")
  .attr("x", 700)
  .attr("y", 500)
  .attr("width", 20)
  .attr("height", 20)
  .attr("rx", 6)
  .attr("fill", "#879195")
  .on("click", d => {
    fixZoom();
  });
const fixZoom = () => {
  gZoom.call(zoom.transform, d3.zoomIdentity);
};

const resetMouseVars = () => {
  mousedownNode = null;
  mouseupNode = null;
  mousedownLink = null;
};

const spliceLinksForNode = node => {
  const toSplice = links.filter(l => l.source === node || l.target === node);
  for (const l of toSplice) {
    links.splice(links.indexOf(l), 1);
  }
};
const createLink = () => {
  // add link to graph (update if exists)
  const target = mouseupNode;
  const source = mousedownNode;
  const source_exist = links.find(
    link =>
      (link.sourcePosition === source.optionSelect &&
        link.source.id === source.id) ||
      (link.targetPosition === source.optionSelect &&
        link.target.id === source.id)
  );
  const target_exist = links.find(
    link =>
      (link.sourcePosition === target.optionSelect &&
        link.source.id === target.id) ||
      (link.targetPosition === target.optionSelect &&
        link.target.id === target.id)
  );
  if (
    !source_exist &&
    !target_exist &&
    source.optionSelect &&
    target.optionSelect
  ) {
    links.push({
      source: source,
      target: target,
      sourcePosition: source.optionSelect,
      targetPosition: target.optionSelect
    });
    source[source.optionSelect].isLink = true;
    target[target.optionSelect].isLink = true;
  } else {
    alert("error pass max connections");
  }
  source.optionSelect = null;
  target.optionSelect = null;
  resetMouseVars();
  restart();
};

const set_focus = d => {
  if (d.type === "VNF" && !d.isOpen) {
    d3.selectAll(`g #${d.id} .option_menu`).classed("hidden", false);
    d3.select(`g #${d.id} rect`).style("filter", "url(#shadow)");
  }
};

const unset_focus = d => {
  if (d.type === "VNF" && !d.isOpen) {
    d3.selectAll(`g #${d.id} .option_menu`).classed("hidden", true);
  }
  d3.select(`g #${d.id} rect`).style("filter", "");
};

// Open info
const showTooltip = node => {
  node.isOpen = !node.isOpen;
  if (node.isOpen) {
    d3.selectAll(`g #${node.id} .group_VNF_menu rect.menu`).attr(
      "fill",
      "#404F57"
    );
    d3.selectAll(`g #${node.id} .menu_otpions`).classed("visibility", false);
    d3.select(`g #${node.id} rect`).style("filter", "");
    selectedNode = node;
  } else {
    d3.selectAll(`g #${node.id} .group_VNF_menu rect.menu`).attr(
      "fill",
      "transparent"
    );
    d3.selectAll(`g #${node.id} .menu_otpions`).classed("visibility", true);
    tooltip.style("opacity", 0);
  }
};

const deleteNodes = () => {
  if (selectedNode) {
    nodes.splice(nodes.indexOf(selectedNode), 1);
    // decrement connections on links
    const foundLinks = filter(
      links,
      link =>
        link.source.id === selectedNode.id || link.target.id === selectedNode.id
    );
    foundLinks.forEach(link => {
      if (link.source.id !== selectedNode.id) {
        const id = link.source.id;
        const node = nodes.find(node => node.id === id);
        node[link.sourcePosition].isLink = false;
        removeIsLink(node, link.sourcePosition);
      } else {
        const id = link.target.id;
        const node = nodes.find(node => node.id === id);
        node[link.targetPosition].isLink = false;
        removeIsLink(node, link.targetPosition);
      }
    });
    spliceLinksForNode(selectedNode);
  }
  selectedNode = null;
  restart();
};
/**
 * remove option
 * @param Node
 * @param Position
 */
const removeIsLink = (node, position) => {
  switch (node.type) {
    case "start":
      return d3.select(`g #${node.id} .option_start`).classed("hidden", true);
      return;
    case "stop":
      return d3.select(`g #${node.id} .option_stop`).classed("hidden", true);
    default:
      return d3
        .select(`g #${node.id} .option_VNF_${position}`)
        .classed("hidden", true);
  }
};

// Zoom
function zoomed() {
  gZoom.attr("transform", d3.event.transform);
}

// Shadow VNF
// create filter with id #drop-shadow
// height=130% so that the shadow is not clipped
var shadow = svg
  .append("filter")
  .attr("id", "shadow")
  .attr("height", "130%");

// SourceAlpha refers to opacity of graphic that this filter will be applied to
// convolve that with a Gaussian with standard deviation 3 and store result
// in blur
shadow
  .append("feGaussianBlur")
  .attr("in", "SourceAlpha")
  .attr("stdDeviation", 1.7)
  .attr("result", "blur");

// ADD color to background
shadow
  .append("feFlood")
  .attr("flood-color", "#5A666D")
  .attr("flood-opacity", "0.9")
  .attr("result", "offsetColor");

// translate output of Gaussian blur to the right and downwards with 2px
// store result in offsetBlur
shadow
  .append("feOffset")
  .attr("in", "blur")
  .attr("dx", 5)
  .attr("dy", 5)
  .attr("result", "offsetBlur");

shadow
  .append("feComposite")
  .attr("in", "offsetColor")
  .attr("in2", "offsetBlur")
  .attr("operator", "in")
  .attr("result", "offsetBlur");

// overlay original SourceGraphic over translated blurred opacity by using
// feMerge filter. Order of specifying inputs is important!
var feMerge = shadow.append("feMerge");

feMerge.append("feMergeNode").attr("in", "offsetBlur");
feMerge.append("feMergeNode").attr("in", "SourceGraphic");

// app starts here
function mousemove() {
  if (!mousedownNode) return;
  let coordinates = d3.mouse(this);
  let x = coordinates[0];
  let y = coordinates[1];
  // update drag line
  dragLine.attr("d", () => {
    switch (mousedownNode.optionSelect) {
      case "left":
        return `M${mousedownNode.x},${mousedownNode.y +
          mousedownNode.h / 2}L${x},${y}`;
      case "right":
        return `M${mousedownNode.x + mousedownNode.w},${mousedownNode.y +
          mousedownNode.h / 2}L${x},${y}`;
      case "top":
        return `M${mousedownNode.x + mousedownNode.w / 2},${
          mousedownNode.y
        }L${x},${y}`;
      case "bottom":
        return `M${mousedownNode.x + mousedownNode.w / 2},${mousedownNode.y +
          mousedownNode.h}L${x},${y}`;
      default:
        return `M${mousedownNode.x},${mousedownNode.y}L${x},${y}`;
    }
  });
  restart();
}

function mouseup(d) {
  dragLine.classed("hidden", true);
  // clear mouse event vars
  resetMouseVars();
}

function mousedown() {
  if (mousedownNode || mousedownLink) return;
  restart();
}

svg
  .on("mousedown", mousedown)
  .on("mousemove", mousemove)
  .on("mouseup", mouseup);

restart();
