/* @ds-bundle: {"format":4,"namespace":"AliceTeixeiraDesignSystem_69f9f3","components":[{"name":"Button","sourcePath":"components/actions/Button.jsx"},{"name":"IconButton","sourcePath":"components/actions/IconButton.jsx"},{"name":"Calendar","sourcePath":"components/calendar/Calendar.jsx"},{"name":"ShiftCard","sourcePath":"components/calendar/ShiftCard.jsx"},{"name":"InfoTile","sourcePath":"components/cards/InfoTile.jsx"},{"name":"KeyValueList","sourcePath":"components/cards/KeyValueList.jsx"},{"name":"MetricCard","sourcePath":"components/cards/MetricCard.jsx"},{"name":"Panel","sourcePath":"components/cards/Panel.jsx"},{"name":"StatCard","sourcePath":"components/cards/StatCard.jsx"},{"name":"AreaChart","sourcePath":"components/charts/AreaChart.jsx"},{"name":"BarChart","sourcePath":"components/charts/BarChart.jsx"},{"name":"ChartTooltip","sourcePath":"components/charts/ChartTooltip.jsx"},{"name":"DonutChart","sourcePath":"components/charts/DonutChart.jsx"},{"name":"Heatmap","sourcePath":"components/charts/Heatmap.jsx"},{"name":"Legend","sourcePath":"components/charts/Legend.jsx"},{"name":"Sparkline","sourcePath":"components/charts/Sparkline.jsx"},{"name":"TickGauge","sourcePath":"components/charts/TickGauge.jsx"},{"name":"Avatar","sourcePath":"components/display/Avatar.jsx"},{"name":"Badge","sourcePath":"components/display/Badge.jsx"},{"name":"ProgressBar","sourcePath":"components/display/ProgressBar.jsx"},{"name":"SegmentedProgress","sourcePath":"components/display/ProgressBar.jsx"},{"name":"Tag","sourcePath":"components/display/Tag.jsx"},{"name":"Chip","sourcePath":"components/forms/ChipGroup.jsx"},{"name":"ChipGroup","sourcePath":"components/forms/ChipGroup.jsx"},{"name":"FileDrop","sourcePath":"components/forms/FileDrop.jsx"},{"name":"FileItem","sourcePath":"components/forms/FileDrop.jsx"},{"name":"SearchInput","sourcePath":"components/forms/SearchInput.jsx"},{"name":"Segmented","sourcePath":"components/forms/Segmented.jsx"},{"name":"TextField","sourcePath":"components/forms/TextField.jsx"},{"name":"Icon","sourcePath":"components/icons/Icon.jsx"},{"name":"Icon3D","sourcePath":"components/icons/Icon.jsx"},{"name":"DataTable","sourcePath":"components/lists/DataTable.jsx"},{"name":"ListRow","sourcePath":"components/lists/ListRow.jsx"},{"name":"RiskItem","sourcePath":"components/lists/RiskItem.jsx"},{"name":"ScheduleItem","sourcePath":"components/lists/ScheduleItem.jsx"},{"name":"TaskCard","sourcePath":"components/lists/ScheduleItem.jsx"},{"name":"AppShell","sourcePath":"components/navigation/AppShell.jsx"},{"name":"BrandMark","sourcePath":"components/navigation/Brand.jsx"},{"name":"Brand","sourcePath":"components/navigation/Brand.jsx"},{"name":"PageHeader","sourcePath":"components/navigation/PageHeader.jsx"},{"name":"NavItem","sourcePath":"components/navigation/Sidebar.jsx"},{"name":"NavGroup","sourcePath":"components/navigation/Sidebar.jsx"},{"name":"QuickTile","sourcePath":"components/navigation/Sidebar.jsx"},{"name":"UserCard","sourcePath":"components/navigation/Sidebar.jsx"},{"name":"Sidebar","sourcePath":"components/navigation/Sidebar.jsx"},{"name":"Breadcrumbs","sourcePath":"components/navigation/Topbar.jsx"},{"name":"OrgSelector","sourcePath":"components/navigation/Topbar.jsx"},{"name":"Topbar","sourcePath":"components/navigation/Topbar.jsx"},{"name":"Modal","sourcePath":"components/overlays/Modal.jsx"},{"name":"ModalSection","sourcePath":"components/overlays/Modal.jsx"}],"sourceHashes":{"components/actions/Button.jsx":"c078c600dc00","components/actions/IconButton.jsx":"173970d2fdde","components/calendar/Calendar.jsx":"ed2775a719a7","components/calendar/ShiftCard.jsx":"d99f4e39b8b3","components/cards/InfoTile.jsx":"3dcaf4e9f5a3","components/cards/KeyValueList.jsx":"78a8c9549174","components/cards/MetricCard.jsx":"6b0c4b094898","components/cards/Panel.jsx":"99bb5c5bc1b0","components/cards/StatCard.jsx":"2cdf973484a7","components/charts/AreaChart.jsx":"27bf02a9b5e5","components/charts/BarChart.jsx":"538449a421c1","components/charts/ChartTooltip.jsx":"474b837b88f5","components/charts/DonutChart.jsx":"a84354924be8","components/charts/Heatmap.jsx":"51d853a9f5f1","components/charts/Legend.jsx":"22ec3111a1eb","components/charts/Sparkline.jsx":"9602e993e722","components/charts/TickGauge.jsx":"53d730c4f047","components/display/Avatar.jsx":"ed090a84f6a3","components/display/Badge.jsx":"3f1e157b1d76","components/display/ProgressBar.jsx":"b46b195821ee","components/display/Tag.jsx":"712add04b675","components/forms/ChipGroup.jsx":"2ac9014e5317","components/forms/FileDrop.jsx":"c9292d2e2c73","components/forms/SearchInput.jsx":"2a1879a22d0e","components/forms/Segmented.jsx":"e3c60a3f8903","components/forms/TextField.jsx":"82101cf097bd","components/icons/Icon.jsx":"a3dc7614ac2f","components/lists/DataTable.jsx":"598096652715","components/lists/ListRow.jsx":"98879f19a094","components/lists/RiskItem.jsx":"bbb6956b2ab7","components/lists/ScheduleItem.jsx":"16b824c0d202","components/navigation/AppShell.jsx":"c75f2d9e0da6","components/navigation/Brand.jsx":"1c0711abeb64","components/navigation/PageHeader.jsx":"3f494e42f132","components/navigation/Sidebar.jsx":"7849d7ec4f28","components/navigation/Topbar.jsx":"c385348447e6","components/overlays/Modal.jsx":"daf8dd7f7e80","ui_kits/admin/AnalyticsScreen.jsx":"35ec4bbf9efc","ui_kits/admin/App.jsx":"5e1c9e20429c","ui_kits/admin/BatchScreen.jsx":"47719bdc1e83","ui_kits/admin/PassScreen.jsx":"d217cb5bcd11","ui_kits/admin/ShiftsScreen.jsx":"22c22e8df6e6","ui_kits/admin/TasksScreen.jsx":"76c8cb7136ad","ui_kits/admin/data.js":"b30f2d6a5017"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.AliceTeixeiraDesignSystem_69f9f3 = window.AliceTeixeiraDesignSystem_69f9f3 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/calendar/Calendar.jsx
try { (() => {
const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
function Calendar({
  year,
  month,
  selected,
  onSelect,
  markers = {},
  cells = {},
  outside = true,
  weekdays = DOW,
  cellHeight = 44,
  gap = 6,
  className = '',
  style
}) {
  const first = new Date(year, month, 1);
  const lead = (first.getDay() + 6) % 7;
  const dim = new Date(year, month + 1, 0).getDate();
  const prevDim = new Date(year, month, 0).getDate();
  const items = [];
  for (let i = 0; i < lead; i++) items.push({
    d: prevDim - lead + 1 + i,
    out: true
  });
  for (let d = 1; d <= dim; d++) items.push({
    d
  });
  return /*#__PURE__*/React.createElement("div", {
    className: 'at-cal ' + className,
    style: Object.assign({
      '--cal-h': cellHeight + 'px',
      '--cal-gap': gap + 'px'
    }, style)
  }, /*#__PURE__*/React.createElement("div", {
    className: "at-cal__grid"
  }, weekdays.map(w => /*#__PURE__*/React.createElement("div", {
    key: w,
    className: "at-cal__dow"
  }, w))), /*#__PURE__*/React.createElement("div", {
    className: "at-cal__grid"
  }, items.map((it, i) => {
    if (it.out) return outside ? /*#__PURE__*/React.createElement("div", {
      key: 'o' + i,
      className: "at-cal__day at-cal__day--muted",
      style: {
        cursor: 'default'
      }
    }, it.d) : /*#__PURE__*/React.createElement("div", {
      key: 'o' + i
    });
    const wd = (lead + it.d - 1) % 7;
    const cell = cells[it.d];
    const cls = ['at-cal__day', wd >= 5 && !cell ? 'at-cal__day--weekend' : '', cell ? 'at-cal__day--' + cell : '', selected === it.d ? 'at-cal__day--sel' : ''].filter(Boolean).join(' ');
    return /*#__PURE__*/React.createElement("button", {
      key: it.d,
      type: "button",
      className: cls,
      onClick: () => onSelect && onSelect(it.d)
    }, it.d, markers[it.d] ? /*#__PURE__*/React.createElement("span", {
      className: "at-cal__mark",
      style: typeof markers[it.d] === 'string' ? {
        background: markers[it.d]
      } : undefined
    }) : null);
  })));
}
Object.assign(__ds_scope, { Calendar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/calendar/Calendar.jsx", error: String((e && e.message) || e) }); }

// components/calendar/ShiftCard.jsx
try { (() => {
function ShiftCard({
  dayLabel,
  dayNumber,
  tone = 'cyan',
  name,
  time,
  zone,
  className = '',
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: className,
    style: Object.assign({
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      minWidth: 0
    }, style)
  }, dayLabel ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      padding: '0 4px',
      fontSize: 'var(--fs-caption)',
      color: 'var(--text-secondary)'
    }
  }, /*#__PURE__*/React.createElement("span", null, dayLabel), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 18,
      color: 'var(--text-primary)'
    }
  }, dayNumber)) : null, /*#__PURE__*/React.createElement("div", {
    className: 'at-shift at-shift--' + tone
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "at-shift__name"
  }, name), time ? /*#__PURE__*/React.createElement("div", {
    className: "at-shift__time"
  }, time) : null), zone ? /*#__PURE__*/React.createElement("div", {
    className: "at-shift__zone"
  }, zone) : null));
}
Object.assign(__ds_scope, { ShiftCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/calendar/ShiftCard.jsx", error: String((e && e.message) || e) }); }

// components/cards/InfoTile.jsx
try { (() => {
function InfoTile({
  label,
  value,
  className = '',
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: 'at-info ' + className,
    style: style
  }, /*#__PURE__*/React.createElement("div", {
    className: "at-info__label"
  }, label), /*#__PURE__*/React.createElement("div", {
    className: "at-info__value"
  }, value));
}
Object.assign(__ds_scope, { InfoTile });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/cards/InfoTile.jsx", error: String((e && e.message) || e) }); }

// components/cards/KeyValueList.jsx
try { (() => {
function KeyValueList({
  items = [],
  variant = 'solid',
  density = 'md',
  ruled = false,
  className = ''
}) {
  const cls = ['at-kv', variant === 'dashed' ? 'at-kv--dashed' : '', density === 'compact' ? 'at-kv--compact' : '', ruled ? 'at-kv--ruled' : '', className].filter(Boolean).join(' ');
  return /*#__PURE__*/React.createElement("dl", {
    className: cls
  }, items.map((it, i) => /*#__PURE__*/React.createElement("div", {
    className: "at-kv__row",
    key: i
  }, /*#__PURE__*/React.createElement("dt", {
    className: "at-kv__k"
  }, it.label), /*#__PURE__*/React.createElement("dd", {
    className: "at-kv__v"
  }, it.value))));
}
Object.assign(__ds_scope, { KeyValueList });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/cards/KeyValueList.jsx", error: String((e && e.message) || e) }); }

// components/cards/Panel.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Panel({
  title,
  subtitle,
  meta,
  actions,
  variant = 'card',
  padding = 'md',
  className = '',
  style,
  children,
  ...rest
}) {
  const cls = ['at-panel', variant !== 'card' ? 'at-panel--' + variant : '', padding === 'sm' ? 'at-panel--compact' : '', padding === 'none' ? 'at-panel--flush' : '', className].filter(Boolean).join(' ');
  const hasHead = title || meta || actions;
  return /*#__PURE__*/React.createElement("section", _extends({
    className: cls,
    style: style
  }, rest), hasHead ? /*#__PURE__*/React.createElement("header", {
    className: "at-panel__head"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, title ? /*#__PURE__*/React.createElement("h3", {
    className: "at-panel__title"
  }, title) : null, subtitle ? /*#__PURE__*/React.createElement("p", {
    className: "at-panel__sub"
  }, subtitle) : null), meta || actions ? /*#__PURE__*/React.createElement("div", {
    className: "at-panel__meta"
  }, meta, actions) : null) : null, children);
}
Object.assign(__ds_scope, { Panel });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/cards/Panel.jsx", error: String((e && e.message) || e) }); }

// components/cards/StatCard.jsx
try { (() => {
function StatCard({
  label,
  value,
  unit,
  variant = 'white',
  size = 'md',
  aside,
  className = '',
  style,
  onClick
}) {
  const cls = ['at-stat', variant !== 'white' ? 'at-stat--' + variant : '', size !== 'md' ? 'at-stat--' + size : '', className].filter(Boolean).join(' ');
  return /*#__PURE__*/React.createElement("div", {
    className: cls,
    style: Object.assign(onClick ? {
      cursor: 'pointer'
    } : {}, style),
    onClick: onClick
  }, /*#__PURE__*/React.createElement("div", {
    className: "at-stat__label"
  }, label), aside ? /*#__PURE__*/React.createElement("div", {
    className: "at-stat__aside"
  }, aside) : null, /*#__PURE__*/React.createElement("div", {
    className: "at-stat__row"
  }, /*#__PURE__*/React.createElement("span", {
    className: "at-stat__value"
  }, value), unit ? /*#__PURE__*/React.createElement("span", {
    className: "at-stat__unit"
  }, unit) : null));
}
Object.assign(__ds_scope, { StatCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/cards/StatCard.jsx", error: String((e && e.message) || e) }); }

// components/charts/DonutChart.jsx
try { (() => {
function DonutChart({
  segments = [],
  size = 220,
  thickness = 34,
  gap = 3,
  value,
  label,
  className = '',
  style
}) {
  const r = (size - thickness) / 2,
    c = 2 * Math.PI * r;
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  let off = 0;
  const hole = size - thickness * 2 - 16;
  return /*#__PURE__*/React.createElement("div", {
    className: 'at-donut ' + className,
    style: Object.assign({
      width: size,
      height: size
    }, style)
  }, /*#__PURE__*/React.createElement("svg", {
    width: size,
    height: size,
    style: {
      transform: 'rotate(-90deg)'
    }
  }, /*#__PURE__*/React.createElement("circle", {
    cx: size / 2,
    cy: size / 2,
    r: r,
    fill: "none",
    stroke: "var(--viz-track)",
    strokeWidth: thickness + 10
  }), segments.map((s, i) => {
    const len = s.value / total * c;
    const gl = segments.length > 1 ? Math.min(gap * 2, len * 0.5) : 0;
    const el = /*#__PURE__*/React.createElement("circle", {
      key: i,
      cx: size / 2,
      cy: size / 2,
      r: r,
      fill: "none",
      stroke: s.color,
      strokeWidth: thickness,
      strokeDasharray: Math.max(0, len - gl) + ' ' + (c - Math.max(0, len - gl)),
      strokeDashoffset: -(off + gl / 2)
    });
    off += len;
    return el;
  })), /*#__PURE__*/React.createElement("span", {
    className: "at-donut__hole",
    style: {
      width: hole,
      height: hole,
      left: (size - hole) / 2,
      top: (size - hole) / 2
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "at-donut__center"
  }, value != null ? /*#__PURE__*/React.createElement("div", {
    className: "at-donut__value"
  }, value) : null, label ? /*#__PURE__*/React.createElement("div", {
    className: "at-donut__label"
  }, label) : null));
}
Object.assign(__ds_scope, { DonutChart });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/charts/DonutChart.jsx", error: String((e && e.message) || e) }); }

// components/charts/Heatmap.jsx
try { (() => {
function Heatmap({
  weeks = [],
  months = [],
  days = ['Mon', '', 'Wed', '', 'Fri', '', ''],
  cellGap = 4,
  className = '',
  style
}) {
  const cols = weeks.length;
  return /*#__PURE__*/React.createElement("div", {
    className: 'at-chart ' + className,
    style: Object.assign({
      display: 'grid',
      gridTemplateColumns: (days ? '36px ' : '') + 'minmax(0,1fr)',
      gap: '8px 8px'
    }, style)
  }, days ? /*#__PURE__*/React.createElement("span", null) : null, /*#__PURE__*/React.createElement("div", {
    className: "at-heat__months",
    style: {
      gridTemplateColumns: 'repeat(' + cols + ',minmax(0,1fr))',
      columnGap: cellGap
    }
  }, months.map((m, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      gridColumn: m.col + 1 + ' / span 3',
      paddingLeft: 2
    }
  }, m.label))), days ? /*#__PURE__*/React.createElement("div", {
    className: "at-heat__days",
    style: {
      gridTemplateRows: 'repeat(7,minmax(0,1fr))',
      rowGap: cellGap,
      alignItems: 'center'
    }
  }, days.map((d, i) => /*#__PURE__*/React.createElement("span", {
    key: i
  }, d))) : null, /*#__PURE__*/React.createElement("div", {
    className: "at-heat",
    style: {
      gridTemplateColumns: 'repeat(' + cols + ',minmax(0,1fr))',
      gridTemplateRows: 'repeat(7,auto)',
      gridAutoFlow: 'column',
      gap: cellGap
    }
  }, weeks.map((w, wi) => w.map((lv, di) => /*#__PURE__*/React.createElement("span", {
    key: wi + '-' + di,
    className: 'at-heat__cell ' + (lv ? 'at-heat__cell--' + lv : '')
  })))));
}
Object.assign(__ds_scope, { Heatmap });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/charts/Heatmap.jsx", error: String((e && e.message) || e) }); }

// components/charts/Legend.jsx
try { (() => {
function Legend({
  items = [],
  className = '',
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: 'at-legend ' + className,
    style: style
  }, items.map((it, i) => /*#__PURE__*/React.createElement("span", {
    className: "at-legend__item",
    key: i
  }, /*#__PURE__*/React.createElement("span", {
    className: 'at-legend__sw ' + (it.shape === 'dot' ? 'at-legend__sw--dot ' : '') + (it.shape === 'hatch' ? 'at-legend__sw--hatch' : ''),
    style: {
      background: it.color
    }
  }), it.label, it.value != null ? /*#__PURE__*/React.createElement("b", null, it.value) : null)));
}
Object.assign(__ds_scope, { Legend });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/charts/Legend.jsx", error: String((e && e.message) || e) }); }

// components/charts/Sparkline.jsx
try { (() => {
function Sparkline({
  data = [],
  color = '#1B9FC0',
  width = 200,
  height = 64,
  fill = true,
  dot = true,
  strokeWidth = 2.5,
  className = '',
  style
}) {
  const gid = React.useMemo(() => 'sg' + Math.random().toString(36).slice(2, 8), []);
  if (data.length < 2) return null;
  const lo = Math.min.apply(null, data),
    hi = Math.max.apply(null, data);
  const pad = 6;
  const x = i => pad + i / (data.length - 1) * (width - pad * 2);
  const y = v => pad + (height - pad * 2) * (1 - (v - lo) / (hi - lo || 1));
  const pts = data.map((v, i) => [x(i), y(v)]);
  let d = 'M' + pts[0][0] + ',' + pts[0][1];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i],
      p1 = pts[i],
      p2 = pts[i + 1],
      p3 = pts[i + 2] || p2;
    d += ' C' + (p1[0] + (p2[0] - p0[0]) / 6) + ',' + (p1[1] + (p2[1] - p0[1]) / 6) + ' ' + (p2[0] - (p3[0] - p1[0]) / 6) + ',' + (p2[1] - (p3[1] - p1[1]) / 6) + ' ' + p2[0] + ',' + p2[1];
  }
  const last = pts[pts.length - 1];
  return /*#__PURE__*/React.createElement("svg", {
    className: 'at-spark ' + className,
    width: width,
    height: height,
    viewBox: '0 0 ' + width + ' ' + height,
    style: style
  }, /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("linearGradient", {
    id: gid,
    x1: "0",
    y1: "0",
    x2: "0",
    y2: "1"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "0",
    stopColor: color,
    stopOpacity: "0.22"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "1",
    stopColor: color,
    stopOpacity: "0"
  }))), fill ? /*#__PURE__*/React.createElement("path", {
    d: d + ' L' + last[0] + ',' + height + ' L' + pts[0][0] + ',' + height + ' Z',
    fill: 'url(#' + gid + ')'
  }) : null, /*#__PURE__*/React.createElement("path", {
    d: d,
    fill: "none",
    stroke: color,
    strokeWidth: strokeWidth,
    strokeLinecap: "round"
  }), dot ? /*#__PURE__*/React.createElement("circle", {
    cx: last[0],
    cy: last[1],
    r: "4",
    fill: color
  }) : null);
}
Object.assign(__ds_scope, { Sparkline });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/charts/Sparkline.jsx", error: String((e && e.message) || e) }); }

// components/charts/TickGauge.jsx
try { (() => {
const PALETTE = {
  ink: {
    on: 'var(--viz-2)',
    lead: '#55C3DC',
    off: 'var(--viz-track)'
  },
  cyan: {
    on: 'var(--cyan-500)',
    lead: '#7FD3E5',
    off: 'var(--viz-track)'
  },
  lime: {
    on: 'var(--lime-500)',
    lead: '#D4EC6E',
    off: 'var(--viz-track)'
  }
};
function TickGauge({
  value = 0,
  variant = 'ring',
  color = 'ink',
  size = 140,
  ticks,
  display,
  unit = '%',
  valueSize,
  className = '',
  style
}) {
  const arc = variant === 'arc';
  const n = ticks || (arc ? 34 : 52);
  const start = arc ? -100 : 0,
    sweep = arc ? 200 : 360;
  const cx = size / 2,
    cy = size / 2,
    R = size / 2 - 3;
  const r1 = arc ? R * 0.66 : R * 0.76;
  const filled = Math.round(Math.max(0, Math.min(100, value)) / 100 * n);
  const p = PALETTE[color] || PALETTE.ink;
  const lines = [];
  for (let i = 0; i < n; i++) {
    const a = (start + sweep * i / (arc ? n - 1 : n)) * Math.PI / 180;
    const sx = cx + Math.sin(a) * r1,
      sy = cy - Math.cos(a) * r1,
      ex = cx + Math.sin(a) * R,
      ey = cy - Math.cos(a) * R;
    const on = i < filled;
    const lead = on && !arc && i >= filled - 4;
    lines.push(/*#__PURE__*/React.createElement("line", {
      key: i,
      x1: sx,
      y1: sy,
      x2: ex,
      y2: ey,
      stroke: on ? lead ? p.lead : p.on : p.off,
      strokeWidth: arc ? size * 0.035 : size * 0.028,
      strokeLinecap: "round"
    }));
  }
  const h = arc ? size * 0.62 : size;
  return /*#__PURE__*/React.createElement("div", {
    className: 'at-gauge ' + className,
    style: Object.assign({
      width: size,
      height: h
    }, style)
  }, /*#__PURE__*/React.createElement("svg", {
    width: size,
    height: h,
    viewBox: '0 0 ' + size + ' ' + h,
    style: {
      display: 'block',
      overflow: 'visible'
    }
  }, lines), /*#__PURE__*/React.createElement("div", {
    className: "at-gauge__center",
    style: arc ? {
      alignItems: 'flex-end',
      paddingBottom: 0
    } : undefined
  }, /*#__PURE__*/React.createElement("span", {
    className: "at-gauge__value",
    style: {
      fontSize: valueSize || Math.round(size * (arc ? 0.2 : 0.18))
    }
  }, display != null ? display : Math.round(value), unit === '%' && !arc ? '%' : null), unit && !(unit === '%' && !arc) ? /*#__PURE__*/React.createElement("span", {
    className: "at-gauge__unit"
  }, unit) : null));
}
Object.assign(__ds_scope, { TickGauge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/charts/TickGauge.jsx", error: String((e && e.message) || e) }); }

// components/display/Avatar.jsx
try { (() => {
function Avatar({
  initials,
  size = 40,
  radius,
  variant = 'gradient',
  className = '',
  style
}) {
  const r = radius != null ? radius : Math.round(size * 0.3);
  return /*#__PURE__*/React.createElement("span", {
    className: 'at-avatar ' + (variant === 'light' ? 'at-avatar--light ' : '') + className,
    style: Object.assign({
      width: size,
      height: size,
      borderRadius: r,
      fontSize: Math.round(size * 0.36)
    }, style)
  }, initials);
}
Object.assign(__ds_scope, { Avatar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/Avatar.jsx", error: String((e && e.message) || e) }); }

// components/display/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Badge({
  tone = 'info',
  size = 'sm',
  dot = false,
  children,
  className = '',
  ...rest
}) {
  return /*#__PURE__*/React.createElement("span", _extends({
    className: 'at-badge at-badge--' + tone + ' ' + (size === 'md' ? 'at-badge--md ' : '') + className
  }, rest), dot ? /*#__PURE__*/React.createElement("span", {
    className: "at-badge__dot"
  }) : null, children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/Badge.jsx", error: String((e && e.message) || e) }); }

// components/charts/ChartTooltip.jsx
try { (() => {
function ChartTooltip({
  title,
  value,
  unit,
  label,
  chip,
  variant = 'big',
  arrow = 'none',
  className = '',
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: 'at-tip ' + (variant === 'line' ? 'at-tip--line ' : '') + (arrow !== 'none' ? 'at-tip--' + arrow + ' ' : '') + className,
    style: style
  }, arrow !== 'none' ? /*#__PURE__*/React.createElement("span", {
    className: "at-tip__arrow"
  }) : null, title ? /*#__PURE__*/React.createElement("div", {
    className: "at-tip__title"
  }, title) : null, /*#__PURE__*/React.createElement("div", {
    className: "at-tip__row"
  }, label ? /*#__PURE__*/React.createElement("span", {
    className: "at-tip__label"
  }, label) : null, /*#__PURE__*/React.createElement("span", {
    className: "at-tip__value"
  }, value), unit ? /*#__PURE__*/React.createElement("span", {
    className: "at-tip__unit"
  }, unit) : null), chip ? /*#__PURE__*/React.createElement(__ds_scope.Badge, {
    tone: "lime",
    className: "at-tip__chip"
  }, chip) : null);
}
Object.assign(__ds_scope, { ChartTooltip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/charts/ChartTooltip.jsx", error: String((e && e.message) || e) }); }

// components/charts/AreaChart.jsx
try { (() => {
function smooth(pts) {
  if (pts.length < 2) return '';
  let d = 'M' + pts[0][0] + ',' + pts[0][1];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i],
      p1 = pts[i],
      p2 = pts[i + 1],
      p3 = pts[i + 2] || p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6,
      c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6,
      c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ' C' + c1x + ',' + c1y + ' ' + c2x + ',' + c2y + ' ' + p2[0] + ',' + p2[1];
  }
  return d;
}
function AreaChart({
  data = [],
  labels = [],
  min,
  max,
  yTicks = 6,
  formatY,
  height = 280,
  color = 'var(--cyan-500)',
  activeIndex,
  renderTooltip,
  className = '',
  style
}) {
  const ref = React.useRef(null);
  const [w, setW] = React.useState(600);
  const [hover, setHover] = React.useState(null);
  React.useEffect(() => {
    if (!ref.current || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(e => setW(Math.max(200, e[0].contentRect.width)));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  const gid = React.useMemo(() => 'ag' + Math.random().toString(36).slice(2, 8), []);
  const lo = min != null ? min : Math.min.apply(null, data),
    hi = max != null ? max : Math.max.apply(null, data);
  const padL = 64,
    padR = 12,
    padT = 12,
    padB = 34;
  const iw = w - padL - padR,
    ih = height - padT - padB;
  const x = i => padL + (data.length > 1 ? i / (data.length - 1) * iw : iw / 2);
  const y = v => padT + ih - (v - lo) / (hi - lo || 1) * ih;
  const pts = data.map((v, i) => [x(i), y(v)]);
  const line = smooth(pts);
  const area = line ? line + ' L' + x(data.length - 1) + ',' + (padT + ih) + ' L' + x(0) + ',' + (padT + ih) + ' Z' : '';
  const ticks = [];
  for (let t = 0; t < yTicks; t++) {
    const v = hi - (hi - lo) / (yTicks - 1) * t;
    ticks.push(v);
  }
  const act = hover != null ? hover : activeIndex;
  const fmt = formatY || (v => Math.round(v).toLocaleString('ru-RU'));
  const onMove = e => {
    const r = ref.current.getBoundingClientRect();
    const px = e.clientX - r.left;
    let best = 0,
      bd = 1e9;
    pts.forEach((p, i) => {
      const dd = Math.abs(p[0] - px);
      if (dd < bd) {
        bd = dd;
        best = i;
      }
    });
    setHover(best);
  };
  return /*#__PURE__*/React.createElement("div", {
    ref: ref,
    className: 'at-chart ' + className,
    style: Object.assign({
      height
    }, style),
    onMouseMove: onMove,
    onMouseLeave: () => setHover(null)
  }, /*#__PURE__*/React.createElement("svg", {
    width: w,
    height: height,
    style: {
      display: 'block',
      overflow: 'visible'
    }
  }, /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("linearGradient", {
    id: gid,
    x1: "0",
    y1: "0",
    x2: "0",
    y2: "1"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "0",
    stopColor: "#1B9FC0",
    stopOpacity: "0.2"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "1",
    stopColor: "#1B9FC0",
    stopOpacity: "0"
  }))), ticks.map((v, i) => /*#__PURE__*/React.createElement("g", {
    key: i
  }, /*#__PURE__*/React.createElement("line", {
    x1: padL,
    x2: w - padR,
    y1: y(v),
    y2: y(v),
    stroke: "var(--viz-grid)",
    strokeWidth: "1"
  }), /*#__PURE__*/React.createElement("text", {
    x: padL - 14,
    y: y(v) + 4,
    textAnchor: "end",
    className: "at-chart__axis"
  }, fmt(v)))), labels.map((l, i) => /*#__PURE__*/React.createElement("text", {
    key: i,
    x: x(i),
    y: height - 8,
    textAnchor: "middle",
    className: "at-chart__axis",
    style: {
      fontSize: 13,
      fill: act === i ? 'var(--text-primary)' : undefined
    }
  }, l)), /*#__PURE__*/React.createElement("path", {
    d: area,
    fill: 'url(#' + gid + ')'
  }), /*#__PURE__*/React.createElement("path", {
    d: line,
    fill: "none",
    stroke: color,
    strokeWidth: "2.5",
    strokeLinecap: "round"
  }), act != null && pts[act] ? /*#__PURE__*/React.createElement("g", null, /*#__PURE__*/React.createElement("line", {
    x1: pts[act][0],
    x2: pts[act][0],
    y1: padT,
    y2: padT + ih,
    stroke: "var(--slate-300)",
    strokeDasharray: "3 4"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: pts[act][0],
    cy: pts[act][1],
    r: "7",
    fill: "var(--surface-card)",
    stroke: color,
    strokeWidth: "2.5"
  })) : null), act != null && pts[act] && renderTooltip ? /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: Math.min(Math.max(pts[act][0], 120), w - 120),
      top: pts[act][1] - 18,
      transform: 'translate(-50%,-100%)',
      zIndex: 2
    }
  }, renderTooltip(data[act], act)) : null);
}
Object.assign(__ds_scope, { AreaChart });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/charts/AreaChart.jsx", error: String((e && e.message) || e) }); }

// components/charts/BarChart.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function BarChart({
  data = [],
  max = 100,
  yTicks,
  height = 300,
  dots = true,
  activeIndex,
  barWidth = 64,
  gap = 14,
  renderTooltip,
  className = '',
  style
}) {
  const [hover, setHover] = React.useState(null);
  const act = hover != null ? hover : activeIndex;
  const pct = v => Math.max(0, Math.min(100, v / max * 100));
  return /*#__PURE__*/React.createElement("div", {
    className: 'at-chart at-bars ' + className,
    style: Object.assign({
      height
    }, style, yTicks ? {} : {
      gridTemplateColumns: '1fr'
    })
  }, yTicks ? /*#__PURE__*/React.createElement("div", {
    className: "at-bars__y"
  }, yTicks.map((t, i) => /*#__PURE__*/React.createElement("span", {
    key: i
  }, t))) : null, /*#__PURE__*/React.createElement("div", {
    className: "at-bars__plot",
    style: {
      '--bar-w': barWidth + 'px',
      '--bar-gap': gap + 'px'
    }
  }, data.map((d, i) => {
    const top = d.total != null ? pct(d.total) : pct(d.value || 0);
    const tip = act === i && (renderTooltip ? renderTooltip(d, i) : d.tooltip ? /*#__PURE__*/React.createElement(__ds_scope.ChartTooltip, _extends({
      arrow: "left"
    }, d.tooltip)) : null);
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      className: 'at-bars__col ' + (act === i || d.highlight ? 'at-bars__col--hl' : ''),
      onMouseEnter: () => setHover(i),
      onMouseLeave: () => setHover(null)
    }, /*#__PURE__*/React.createElement("div", {
      className: "at-bars__stack"
    }, d.empty ? /*#__PURE__*/React.createElement("span", {
      className: "at-bars__empty"
    }) : null, d.total != null && !d.empty ? /*#__PURE__*/React.createElement("span", {
      className: "at-bars__total",
      style: {
        height: pct(d.total) + '%'
      }
    }) : null, d.value != null && !d.empty ? /*#__PURE__*/React.createElement("span", {
      className: 'at-bars__val ' + (d.tone === 'lime' ? 'at-bars__val--lime' : ''),
      style: {
        height: pct(d.value) + '%'
      }
    }) : null, dots && !d.empty && d.dot !== false ? /*#__PURE__*/React.createElement("span", {
      className: "at-bars__dot",
      style: {
        top: 100 - top + '%',
        background: d.tone === 'lime' ? '#fff' : undefined,
        boxShadow: d.tone === 'lime' ? '0 0 0 3px rgba(255,255,255,0.5)' : undefined
      }
    }) : null, tip ? /*#__PURE__*/React.createElement("div", {
      className: "at-bars__tip",
      style: {
        top: 100 - top + '%'
      }
    }, tip) : null), /*#__PURE__*/React.createElement("span", {
      className: "at-bars__x"
    }, d.label));
  })));
}
Object.assign(__ds_scope, { BarChart });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/charts/BarChart.jsx", error: String((e && e.message) || e) }); }

// components/display/ProgressBar.jsx
try { (() => {
function ProgressBar({
  value = 0,
  max = 100,
  tone = 'cyan',
  height = 6,
  className = '',
  style
}) {
  const pct = Math.max(0, Math.min(100, value / max * 100));
  return /*#__PURE__*/React.createElement("div", {
    className: 'at-progress ' + (tone !== 'cyan' ? 'at-progress--' + tone + ' ' : '') + className,
    style: Object.assign({
      height
    }, style),
    role: "progressbar",
    "aria-valuenow": value,
    "aria-valuemax": max
  }, /*#__PURE__*/React.createElement("div", {
    className: "at-progress__fill",
    style: {
      width: pct + '%'
    }
  }));
}
function SegmentedProgress({
  segments = 7,
  filled = [],
  onDark = false,
  className = ''
}) {
  const arr = [];
  for (let i = 0; i < segments; i++) {
    const f = filled[i];
    arr.push(/*#__PURE__*/React.createElement("span", {
      key: i,
      className: 'at-segs__s ' + (f === 2 ? 'at-segs__s--strong' : f ? 'at-segs__s--on' : '')
    }));
  }
  return /*#__PURE__*/React.createElement("div", {
    className: 'at-segs ' + (onDark ? 'at-segs--onDark ' : '') + className
  }, arr);
}
Object.assign(__ds_scope, { ProgressBar, SegmentedProgress });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/ProgressBar.jsx", error: String((e && e.message) || e) }); }

// components/display/Tag.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Tag({
  variant = 'cyan',
  size = 'md',
  round = false,
  sub,
  children,
  className = '',
  ...rest
}) {
  return /*#__PURE__*/React.createElement("span", _extends({
    className: 'at-tag at-tag--' + variant + ' ' + (size === 'sm' ? 'at-tag--sm ' : '') + (round ? 'at-tag--round ' : '') + className
  }, rest), children, sub ? /*#__PURE__*/React.createElement("span", {
    className: "at-tag__sub"
  }, sub) : null);
}
Object.assign(__ds_scope, { Tag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/Tag.jsx", error: String((e && e.message) || e) }); }

// components/forms/ChipGroup.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Chip({
  active = false,
  size = 'md',
  count,
  onClick,
  children,
  className = '',
  ...rest
}) {
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    className: 'at-chip ' + (size === 'sm' ? 'at-chip--sm ' : '') + className,
    "aria-pressed": active,
    onClick: onClick
  }, rest), children, count != null ? /*#__PURE__*/React.createElement("span", {
    className: "at-chip__count"
  }, count) : null);
}
function ChipGroup({
  options = [],
  value,
  onChange,
  size = 'md',
  className = ''
}) {
  const opts = options.map(o => typeof o === 'string' ? {
    value: o,
    label: o
  } : o);
  return /*#__PURE__*/React.createElement("div", {
    className: 'at-chips ' + className,
    role: "group"
  }, opts.map(o => /*#__PURE__*/React.createElement(Chip, {
    key: o.value,
    size: size,
    count: o.count,
    active: o.value === value,
    onClick: () => onChange && onChange(o.value)
  }, o.label)));
}
Object.assign(__ds_scope, { Chip, ChipGroup });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/ChipGroup.jsx", error: String((e && e.message) || e) }); }

// components/forms/Segmented.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Segmented({
  options = [],
  value,
  onChange,
  size = 'md',
  variant = 'caps',
  className = '',
  ...rest
}) {
  const opts = options.map(o => typeof o === 'string' ? {
    value: o,
    label: o
  } : o);
  return /*#__PURE__*/React.createElement("div", _extends({
    className: 'at-seg ' + (size === 'sm' ? 'at-seg--sm ' : '') + (variant === 'text' ? 'at-seg--text ' : '') + className,
    role: "group"
  }, rest), opts.map(o => /*#__PURE__*/React.createElement("button", {
    key: o.value,
    type: "button",
    className: "at-seg__opt",
    "aria-pressed": o.value === value,
    onClick: () => onChange && onChange(o.value)
  }, o.label)));
}
Object.assign(__ds_scope, { Segmented });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Segmented.jsx", error: String((e && e.message) || e) }); }

// components/icons/Icon.jsx
try { (() => {
const LUCIDE = 'https://unpkg.com/lucide-static@0.469.0/icons/';
const SVG_CACHE = {};
const SVG_PENDING = {};
function loadIcon(name) {
  if (SVG_CACHE[name] != null) return Promise.resolve(SVG_CACHE[name]);
  if (!SVG_PENDING[name]) {
    SVG_PENDING[name] = fetch(LUCIDE + name + '.svg').then(r => r.ok ? r.text() : '').catch(() => '').then(t => {
      const clean = t.replace(/<!--[\s\S]*?-->/g, '').replace(/\s(width|height)="24"/g, ' $1="100%"').replace(/class="[^"]*"/, '');
      SVG_CACHE[name] = clean;
      return clean;
    });
  }
  return SVG_PENDING[name];
}

/** Line icon from the Lucide set (fetched from CDN once, inlined as SVG, stroke = currentColor). */
function Icon({
  name,
  size = 18,
  color,
  strokeWidth,
  className = '',
  style,
  title
}) {
  const [svg, setSvg] = React.useState(SVG_CACHE[name] || '');
  React.useEffect(() => {
    let live = true;
    if (SVG_CACHE[name] != null) setSvg(SVG_CACHE[name]);else loadIcon(name).then(s => {
      if (live) setSvg(s);
    });
    return () => {
      live = false;
    };
  }, [name]);
  const html = strokeWidth ? svg.replace(/stroke-width="[^"]*"/, 'stroke-width="' + strokeWidth + '"') : svg;
  return /*#__PURE__*/React.createElement("span", {
    className: 'at-icon ' + className,
    role: title ? 'img' : undefined,
    "aria-label": title,
    "aria-hidden": title ? undefined : true,
    style: Object.assign({
      width: size,
      height: size,
      color: color
    }, style),
    dangerouslySetInnerHTML: {
      __html: html
    }
  });
}

/** Glass 3D illustration icon (PNG). Pass base = path to assets/icons-3d/ from the page. */
function Icon3D({
  name,
  size = 96,
  base = 'assets/icons-3d/',
  alt = '',
  className = '',
  style
}) {
  return /*#__PURE__*/React.createElement("img", {
    className: 'at-icon3d ' + className,
    src: base + name + '.png',
    alt: alt,
    width: size,
    height: size,
    style: Object.assign({
      width: size,
      height: size
    }, style)
  });
}
Object.assign(__ds_scope, { Icon, Icon3D });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/icons/Icon.jsx", error: String((e && e.message) || e) }); }

// components/actions/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Button({
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  block = false,
  disabled = false,
  type = 'button',
  href,
  onClick,
  className = '',
  children,
  ...rest
}) {
  const cls = ['at-btn', 'at-btn--' + variant, 'at-btn--' + size, block ? 'at-btn--block' : '', className].filter(Boolean).join(' ');
  const is = size === 'sm' ? 14 : size === 'lg' ? 18 : 16;
  const inner = [icon ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    key: "i",
    name: icon,
    size: is
  }) : null, children != null ? /*#__PURE__*/React.createElement("span", {
    key: "c"
  }, children) : null, iconRight ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    key: "r",
    name: iconRight,
    size: is
  }) : null];
  if (href) return /*#__PURE__*/React.createElement("a", _extends({
    className: cls,
    href: href,
    onClick: onClick
  }, rest), inner);
  return /*#__PURE__*/React.createElement("button", _extends({
    type: type,
    className: cls,
    disabled: disabled,
    onClick: onClick
  }, rest), inner);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/actions/Button.jsx", error: String((e && e.message) || e) }); }

// components/actions/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function IconButton({
  icon,
  label,
  variant = 'soft',
  size = 'md',
  round = false,
  dot = false,
  disabled = false,
  onClick,
  className = '',
  ...rest
}) {
  const cls = ['at-iconbtn', 'at-iconbtn--' + variant, variant === 'tile' ? '' : 'at-iconbtn--' + size, round ? 'at-iconbtn--round' : '', className].filter(Boolean).join(' ');
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    className: cls,
    "aria-label": label,
    title: label,
    disabled: disabled,
    onClick: onClick
  }, rest), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: size === 'sm' ? 16 : 18
  }), dot ? /*#__PURE__*/React.createElement("span", {
    className: "at-iconbtn__dot"
  }) : null);
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/actions/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/cards/MetricCard.jsx
try { (() => {
function MetricCard({
  icon,
  badge,
  badgeTone = 'info',
  value,
  unit,
  title,
  subtitle,
  segments,
  className = '',
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: 'at-metric ' + className,
    style: style
  }, /*#__PURE__*/React.createElement("div", {
    className: "at-metric__top"
  }, icon ? /*#__PURE__*/React.createElement("span", {
    className: "at-metric__icon"
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 18
  })) : /*#__PURE__*/React.createElement("span", null), badge ? /*#__PURE__*/React.createElement(__ds_scope.Badge, {
    tone: badgeTone
  }, badge) : null), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "at-metric__value"
  }, value, unit ? /*#__PURE__*/React.createElement("span", {
    className: "at-metric__unit"
  }, unit) : null), /*#__PURE__*/React.createElement("div", {
    className: "at-metric__title",
    style: {
      marginTop: 10
    }
  }, title), subtitle ? /*#__PURE__*/React.createElement("div", {
    className: "at-metric__sub"
  }, subtitle) : null), segments ? /*#__PURE__*/React.createElement(__ds_scope.SegmentedProgress, {
    filled: segments
  }) : null);
}
Object.assign(__ds_scope, { MetricCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/cards/MetricCard.jsx", error: String((e && e.message) || e) }); }

// components/forms/FileDrop.jsx
try { (() => {
function FileDrop({
  title = 'Add a scan or PDF',
  hint = 'up to 10 MB, several files allowed',
  onClick,
  className = ''
}) {
  const [over, setOver] = React.useState(false);
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: 'at-drop ' + (over ? 'at-drop--over ' : '') + className,
    onClick: onClick,
    onDragOver: e => {
      e.preventDefault();
      setOver(true);
    },
    onDragLeave: () => setOver(false),
    onDrop: e => {
      e.preventDefault();
      setOver(false);
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "at-drop__well"
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "plus",
    size: 20
  })), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("div", {
    className: "at-drop__title"
  }, title), /*#__PURE__*/React.createElement("div", {
    className: "at-drop__hint"
  }, hint)));
}
function FileItem({
  name,
  meta,
  type = 'PDF',
  actionLabel = 'Open',
  onAction,
  className = ''
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: 'at-file ' + className
  }, /*#__PURE__*/React.createElement("span", {
    className: "at-file__type"
  }, type), /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "at-file__name"
  }, name), /*#__PURE__*/React.createElement("div", {
    className: "at-file__meta"
  }, meta)), actionLabel ? /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "at-file__action",
    onClick: onAction
  }, actionLabel) : null);
}
Object.assign(__ds_scope, { FileDrop, FileItem });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/FileDrop.jsx", error: String((e && e.message) || e) }); }

// components/forms/SearchInput.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function SearchInput({
  value,
  defaultValue,
  onChange,
  placeholder = 'Search',
  variant = 'pill',
  className = '',
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("label", {
    className: 'at-search at-search--' + variant + ' ' + className,
    style: style
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "search",
    size: 16
  }), /*#__PURE__*/React.createElement("input", _extends({
    type: "search",
    value: value,
    defaultValue: defaultValue,
    placeholder: placeholder,
    onChange: onChange ? e => onChange(e.target.value, e) : undefined
  }, rest)));
}
Object.assign(__ds_scope, { SearchInput });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/SearchInput.jsx", error: String((e && e.message) || e) }); }

// components/forms/TextField.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function TextField({
  label,
  value,
  defaultValue,
  onChange,
  placeholder,
  type = 'text',
  icon,
  hint,
  error,
  readOnly,
  disabled,
  id,
  className = '',
  ...rest
}) {
  const fid = id || (label ? 'f-' + String(label).toLowerCase().replace(/[^a-z0-9]+/g, '-') : undefined);
  return /*#__PURE__*/React.createElement("div", {
    className: 'at-field ' + (error ? 'at-field--error ' : '') + className
  }, label ? /*#__PURE__*/React.createElement("label", {
    className: "at-field__label",
    htmlFor: fid
  }, label) : null, /*#__PURE__*/React.createElement("div", {
    className: "at-field__box"
  }, icon ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 18,
    color: "var(--text-secondary)"
  }) : null, /*#__PURE__*/React.createElement("input", _extends({
    id: fid,
    type: type,
    value: value,
    defaultValue: defaultValue,
    placeholder: placeholder,
    readOnly: readOnly,
    disabled: disabled,
    onChange: onChange ? e => onChange(e.target.value, e) : undefined
  }, rest))), error || hint ? /*#__PURE__*/React.createElement("div", {
    className: "at-field__hint"
  }, error || hint) : null);
}
Object.assign(__ds_scope, { TextField });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/TextField.jsx", error: String((e && e.message) || e) }); }

// components/lists/DataTable.jsx
try { (() => {
function DataTable({
  columns = [],
  rows = [],
  onRowClick,
  chevron = false,
  density = 'md',
  stackOnMobile = true,
  rowKey,
  className = ''
}) {
  const cls = ['at-table', onRowClick ? 'at-table--clickable' : '', density === 'compact' ? 'at-table--compact' : '', stackOnMobile ? 'at-table--stack' : ''].filter(Boolean).join(' ');
  return /*#__PURE__*/React.createElement("div", {
    className: 'at-table-wrap ' + className
  }, /*#__PURE__*/React.createElement("table", {
    className: cls
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, columns.map(c => /*#__PURE__*/React.createElement("th", {
    key: c.key,
    style: {
      textAlign: c.align || 'left',
      width: c.width
    }
  }, c.label)), chevron ? /*#__PURE__*/React.createElement("th", {
    className: "at-table__chev"
  }) : null)), /*#__PURE__*/React.createElement("tbody", null, rows.map((r, i) => /*#__PURE__*/React.createElement("tr", {
    key: rowKey ? r[rowKey] : i,
    onClick: onRowClick ? () => onRowClick(r, i) : undefined
  }, columns.map(c => /*#__PURE__*/React.createElement("td", {
    key: c.key,
    "data-label": typeof c.label === 'string' ? c.label : '',
    className: c.numeric ? 'at-table__num' : undefined,
    style: {
      textAlign: c.align || 'left'
    }
  }, c.render ? c.render(r[c.key], r, i) : r[c.key])), chevron ? /*#__PURE__*/React.createElement("td", {
    className: "at-table__chev"
  }, /*#__PURE__*/React.createElement("span", {
    className: "at-iconbtn at-iconbtn--sm at-iconbtn--tinted at-iconbtn--round",
    style: {
      display: 'inline-flex'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "chevron-right",
    size: 16
  }))) : null)))));
}
Object.assign(__ds_scope, { DataTable });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/lists/DataTable.jsx", error: String((e && e.message) || e) }); }

// components/lists/ListRow.jsx
try { (() => {
function ListRow({
  icon,
  title,
  subtitle,
  trailing,
  chevron = true,
  onClick,
  className = ''
}) {
  const Tag = onClick ? 'button' : 'div';
  return /*#__PURE__*/React.createElement(Tag, {
    type: onClick ? 'button' : undefined,
    className: 'at-row ' + className,
    onClick: onClick
  }, icon ? /*#__PURE__*/React.createElement("span", {
    className: "at-row__icon"
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 18
  })) : null, /*#__PURE__*/React.createElement("span", {
    className: "at-row__body"
  }, /*#__PURE__*/React.createElement("div", {
    className: "at-row__title"
  }, title), subtitle ? /*#__PURE__*/React.createElement("div", {
    className: "at-row__sub"
  }, subtitle) : null), trailing, chevron && !trailing ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "chevron-right",
    size: 16,
    className: "at-row__chev"
  }) : null);
}
Object.assign(__ds_scope, { ListRow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/lists/ListRow.jsx", error: String((e && e.message) || e) }); }

// components/lists/RiskItem.jsx
try { (() => {
const WELL = {
  danger: ['var(--status-danger-bg)', 'var(--status-danger-fg)'],
  warning: ['var(--status-warning-bg)', 'var(--status-warning-fg)'],
  info: ['var(--status-info-bg)', 'var(--status-info-fg)'],
  success: ['var(--status-success-bg)', 'var(--status-success-fg)']
};
function RiskItem({
  icon,
  tone = 'danger',
  title,
  unit,
  meta,
  badge,
  onClick,
  className = ''
}) {
  const w = WELL[tone] || WELL.info;
  return /*#__PURE__*/React.createElement("div", {
    className: 'at-risk ' + className,
    onClick: onClick,
    style: onClick ? {
      cursor: 'pointer'
    } : undefined
  }, /*#__PURE__*/React.createElement("span", {
    className: "at-risk__icon",
    style: {
      background: w[0],
      color: w[1]
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon || (tone === 'danger' ? 'triangle-alert' : 'refresh-cw'),
    size: 18
  })), /*#__PURE__*/React.createElement("div", {
    className: "at-risk__body"
  }, /*#__PURE__*/React.createElement("div", {
    className: "at-risk__title"
  }, title), unit ? /*#__PURE__*/React.createElement("div", {
    className: "at-risk__unit"
  }, unit) : null, meta ? /*#__PURE__*/React.createElement("div", {
    className: "at-risk__meta"
  }, meta) : null), badge ? /*#__PURE__*/React.createElement("span", {
    className: "at-risk__badge"
  }, /*#__PURE__*/React.createElement(__ds_scope.Badge, {
    tone: tone
  }, badge)) : null);
}
Object.assign(__ds_scope, { RiskItem });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/lists/RiskItem.jsx", error: String((e && e.message) || e) }); }

// components/lists/ScheduleItem.jsx
try { (() => {
const BAR = {
  info: 'var(--cyan-500)',
  success: 'var(--lime-500)',
  warning: 'var(--amber-500)',
  danger: 'var(--red-500)',
  active: 'var(--cyan-500)',
  neutral: 'var(--slate-300)'
};
function ScheduleItem({
  time,
  title,
  subtitle,
  tone = 'info',
  bar,
  badge,
  badgeTone,
  onClick,
  className = ''
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: 'at-sched ' + className,
    onClick: onClick,
    style: onClick ? {
      cursor: 'pointer'
    } : undefined
  }, time ? /*#__PURE__*/React.createElement("span", {
    className: "at-sched__time"
  }, time) : null, /*#__PURE__*/React.createElement("span", {
    className: "at-sched__bar",
    style: {
      background: bar || BAR[tone]
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "at-sched__body"
  }, /*#__PURE__*/React.createElement("div", {
    className: "at-sched__title"
  }, title), subtitle ? /*#__PURE__*/React.createElement("div", {
    className: "at-sched__sub"
  }, subtitle) : null), badge ? /*#__PURE__*/React.createElement(__ds_scope.Badge, {
    tone: badgeTone || tone
  }, badge) : null);
}
function TaskCard({
  title,
  subtitle,
  tone = 'info',
  className = '',
  onClick
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: 'at-taskcard ' + className,
    style: {
      '--bar': BAR[tone],
      cursor: onClick ? 'pointer' : undefined
    },
    onClick: onClick
  }, /*#__PURE__*/React.createElement("div", {
    className: "at-taskcard__title"
  }, title), subtitle ? /*#__PURE__*/React.createElement("div", {
    className: "at-taskcard__sub"
  }, subtitle) : null);
}
Object.assign(__ds_scope, { ScheduleItem, TaskCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/lists/ScheduleItem.jsx", error: String((e && e.message) || e) }); }

// components/navigation/AppShell.jsx
try { (() => {
function AppShell({
  sidebar,
  drawerOpen = false,
  onDrawerClose,
  className = '',
  style,
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: 'at-shell ' + (drawerOpen ? 'at-shell--open ' : '') + className,
    style: style
  }, /*#__PURE__*/React.createElement("div", {
    className: "at-shell__side"
  }, sidebar), /*#__PURE__*/React.createElement("div", {
    className: "at-shell__scrim",
    onClick: onDrawerClose
  }), /*#__PURE__*/React.createElement("main", {
    className: "at-shell__main"
  }, children));
}
Object.assign(__ds_scope, { AppShell });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/AppShell.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Brand.jsx
try { (() => {
const MARK = 'M2005 2653 c32 -82 68 -173 81 -203 12 -30 35 -86 49 -125 15 -38 33 -81 40 -95 7 -14 16 -39 19 -57 7 -30 4 -33 -41 -59 -26 -15 -55 -33 -64 -41 -21 -17 -27 -9 -62 82 -57 150 -139 361 -147 383 -19 44 -35 20 -81 -116 -26 -75 -63 -182 -84 -237 -20 -55 -45 -122 -55 -150 -10 -27 -27 -74 -39 -103 -34 -85 -34 -85 67 -80 101 5 189 38 313 115 240 149 340 199 460 233 112 31 219 36 332 16 89 -16 100 -21 174 -76 138 -101 200 -207 210 -358 15 -235 -115 -423 -335 -483 -80 -23 -153 -24 -245 -4 -89 19 -159 57 -228 126 -70 70 -108 136 -180 313 l-57 141 20 22 c11 12 18 29 15 37 -5 13 -25 6 -109 -38 -159 -84 -241 -109 -373 -112 -60 -2 -113 -3 -116 -3 -13 -2 -49 -139 -49 -187 0 -73 25 -99 113 -118 15 -4 27 -11 27 -16 0 -12 -335 -12 -365 -1 -17 7 -16 9 13 15 53 12 127 86 137 137 3 12 11 29 20 39 15 17 55 122 55 146 0 8 -15 21 -32 30 -99 50 -185 172 -180 253 2 27 0 32 -7 21 -9 -13 -11 -13 -11 3 0 9 5 17 11 17 6 0 9 9 6 19 -6 23 35 112 75 163 48 61 178 108 244 88 l29 -8 -31 -1 c-117 -3 -217 -79 -247 -187 -23 -80 -21 -113 6 -177 24 -52 105 -137 133 -137 7 0 19 -2 26 -5 10 -4 18 7 27 37 6 24 16 52 20 63 5 11 23 57 40 103 68 180 94 248 106 282 27 75 58 156 71 185 7 17 27 70 44 119 50 140 47 136 74 136 22 0 29 -14 81 -147z m1303 134 c9 -10 27 -213 24 -262 -2 -29 -23 -7 -55 59 -68 137 -140 176 -324 176 l-103 0 0 -255 c0 -161 -4 -255 -10 -255 -5 0 -29 4 -52 10 -24 5 -55 12 -71 15 l-27 5 6 183 c4 100 4 208 0 240 l-7 57 -93 0 c-110 0 -181 -17 -237 -56 -44 -30 -103 -112 -115 -158 -4 -17 -13 -26 -25 -26 -10 0 -19 3 -19 6 0 16 31 251 35 262 7 18 1058 18 1073 -1z m-2608 -2123 c0 -227 1 -236 20 -241 33 -9 23 -26 -11 -19 -17 3 -48 6 -68 6 -26 0 -32 3 -21 10 12 8 16 44 18 199 4 192 -2 231 -33 231 -45 0 29 41 88 49 4 1 7 -105 7 -235z m-388 145 c16 -40 41 -101 57 -134 15 -33 45 -100 67 -149 25 -58 47 -92 61 -99 12 -5 20 -14 17 -18 -7 -13 -174 -11 -174 1 0 6 6 10 14 10 31 0 36 25 14 83 l-21 57 -91 0 c-50 0 -95 -4 -101 -8 -5 -4 -18 -29 -27 -57 -18 -51 -12 -75 19 -75 8 0 11 -4 8 -10 -7 -11 -118 -14 -128 -4 -3 4 5 15 18 26 25 20 95 155 95 183 0 9 9 33 19 53 11 20 39 79 63 130 23 51 47 91 52 89 5 -2 22 -37 38 -78z m2062 34 c14 -89 -4 -114 -31 -43 -9 22 -23 42 -32 44 -26 8 -86 10 -97 4 -11 -7 -18 -320 -8 -381 5 -32 11 -39 35 -44 60 -12 26 -23 -70 -23 -97 0 -139 12 -82 23 38 8 41 28 41 248 l0 179 -48 0 c-56 0 -87 -19 -106 -63 -14 -32 -14 -32 -15 31 l-1 62 204 0 203 0 7 -37z m-1447 -191 c-4 -49 -4 -119 0 -156 5 -59 9 -69 30 -77 12 -4 23 -10 23 -11 0 -2 -44 -4 -98 -4 -72 -1 -89 1 -65 7 23 7 33 16 37 37 23 121 14 221 -22 237 -21 9 -19 11 25 32 77 35 77 35 70 -65z m362 61 c42 -32 38 -82 -6 -83 -7 0 -21 17 -30 38 -15 31 -23 37 -54 40 -30 3 -41 -2 -63 -28 -14 -17 -27 -37 -27 -43 -1 -7 -3 -23 -4 -37 -5 -41 13 -96 41 -124 41 -41 97 -37 146 11 28 28 38 33 38 20 0 -10 -20 -38 -45 -62 -40 -41 -49 -45 -93 -45 -111 0 -165 94 -127 221 16 51 25 64 64 90 39 26 53 30 90 26 24 -3 55 -14 70 -24z m326 3 c30 -19 51 -51 60 -88 l7 -28 -111 0 -111 0 0 -29 c0 -75 42 -121 113 -121 34 0 87 36 87 60 0 5 7 10 16 10 23 0 -23 -78 -61 -102 -34 -20 -102 -24 -140 -6 -57 26 -90 132 -65 211 32 102 126 145 205 93z m1036 1 c33 -22 49 -46 64 -94 6 -23 6 -23 -110 -23 l-116 0 7 -37 c15 -84 44 -113 115 -113 35 0 47 6 76 36 44 47 54 37 18 -17 -35 -49 -71 -69 -125 -69 -56 0 -96 23 -120 70 -75 147 67 331 191 247z m995 -19 c19 -19 34 -46 36 -63 l3 -30 -107 -3 c-120 -3 -118 -1 -98 -74 14 -50 52 -78 104 -78 41 1 86 28 99 61 3 9 6 7 6 -7 1 -11 -16 -39 -37 -62 -36 -39 -43 -42 -91 -42 -104 0 -146 53 -139 176 3 65 7 77 33 105 64 67 135 74 191 17z m559 26 c35 -35 -4 -63 -57 -40 -12 5 -22 0 -35 -20 -14 -23 -18 -48 -18 -128 0 -94 1 -101 23 -112 42 -21 36 -24 -46 -24 -77 0 -107 11 -62 23 19 5 20 14 20 130 0 121 -1 125 -22 132 -21 6 -19 8 21 27 l44 20 18 -23 17 -23 32 27 c37 31 43 32 65 11z m260 2 c18 -8 38 -23 44 -34 6 -12 11 -70 11 -131 l0 -111 25 0 c30 0 34 -25 6 -40 -29 -15 -71 -12 -77 5 -8 19 -24 19 -60 0 -68 -35 -134 -9 -134 54 0 48 41 91 115 122 55 22 55 23 55 65 0 42 -17 64 -49 64 -20 0 -51 -40 -51 -64 0 -30 -9 -37 -38 -29 -45 11 -21 72 39 97 43 19 71 20 114 2z m-1563 -143 c3 -143 4 -148 26 -158 40 -18 23 -25 -58 -25 -47 0 -80 4 -80 10 0 6 7 10 15 10 25 0 35 45 35 156 0 94 -2 104 -18 104 -36 0 -33 15 5 32 74 32 72 36 75 -129z m254 134 c-16 -12 -17 -18 -7 -50 12 -36 13 -37 41 -22 30 15 48 51 33 65 -4 4 -17 10 -28 13 -11 3 14 5 55 5 65 1 72 0 52 -11 -28 -16 -77 -75 -86 -105 -6 -17 4 -40 46 -102 29 -44 61 -83 71 -86 35 -11 4 -24 -59 -24 -57 0 -84 12 -52 22 15 5 -15 78 -42 103 -15 14 -19 11 -50 -36 -27 -43 -31 -55 -22 -70 11 -17 8 -19 -38 -18 -28 1 -50 2 -50 3 0 1 22 25 49 54 26 28 54 66 61 83 12 28 11 36 -11 76 -26 48 -53 81 -85 100 -16 10 -5 12 60 12 69 1 77 -1 62 -12z m721 -14 c-1 -16 0 -84 1 -151 2 -115 4 -124 22 -129 44 -12 16 -23 -55 -23 -43 0 -75 4 -75 10 0 6 7 10 15 10 27 0 36 38 33 152 -3 112 -3 113 -28 117 -24 3 -24 4 10 22 53 28 78 25 77 -8z m-1784 -480 c44 -23 56 -41 57 -90 0 -56 -16 -88 -56 -109 -67 -36 -154 20 -154 99 0 55 54 113 108 116 7 1 27 -6 45 -16z m-603 -11 c25 -12 39 -28 47 -55 17 -49 8 -81 -29 -112 -25 -21 -40 -25 -99 -25 -66 0 -69 1 -59 19 13 24 13 115 1 159 l-10 32 57 0 c34 0 71 -7 92 -18z M2522 2115 c-94 -26 -148 -55 -195 -103 l-47 -48 24 -59 c13 -33 34 -82 46 -110 12 -27 33 -84 47 -125 37 -109 66 -161 128 -232 78 -88 128 -112 230 -112 86 0 146 20 212 70 67 51 55 54 -192 54 -143 0 -225 4 -225 10 0 6 6 10 13 10 6 0 29 5 50 11 69 19 71 29 77 329 l5 265 64 0 c37 0 66 5 68 11 11 32 -216 54 -305 29z M2866 2002 c-2 -4 -3 -111 -2 -238 1 -264 1 -263 84 -284 26 -6 50 -16 53 -22 11 -18 56 41 81 107 26 70 31 184 9 257 -11 39 -25 55 -92 110 -74 59 -124 85 -133 70z M220 742 c0 -10 -11 -45 -24 -78 -13 -32 -22 -62 -19 -66 2 -5 35 -8 74 -8 78 0 81 4 52 68 -9 20 -20 51 -23 67 -4 24 -11 31 -32 33 -22 3 -28 -1 -28 -16z M2007 205 c-23 -22 -27 -34 -27 -78 0 -71 20 -99 68 -95 49 4 77 49 67 110 -7 41 -43 88 -67 88 -7 0 -26 -11 -41 -25z M1396 212 c-4 -7 -9 -118 -7 -164 2 -30 58 -23 92 11 42 43 37 112 -10 148 -18 14 -67 17 -75 5z';
function BrandMark({
  height = 32,
  color = 'currentColor',
  className = '',
  style,
  title = 'Alice Teixeira'
}) {
  return /*#__PURE__*/React.createElement("svg", {
    className: 'at-brand__mark ' + className,
    viewBox: "116 -6 228 170",
    height: height,
    width: height * 228 / 170,
    role: "img",
    "aria-label": title,
    style: Object.assign({
      color
    }, style)
  }, /*#__PURE__*/React.createElement("g", {
    transform: "translate(0,281) scale(0.1,-0.1)",
    fill: "currentColor",
    fillRule: "evenodd"
  }, /*#__PURE__*/React.createElement("path", {
    d: MARK
  })));
}
function Brand({
  name = 'Alice Teixeira',
  size = 34,
  showName = true,
  color,
  className = '',
  style
}) {
  return /*#__PURE__*/React.createElement("span", {
    className: 'at-brand ' + className,
    style: Object.assign(color ? {
      color
    } : {}, style)
  }, /*#__PURE__*/React.createElement(BrandMark, {
    height: size
  }), showName ? /*#__PURE__*/React.createElement("span", {
    className: "at-brand__name"
  }, name) : null);
}
Object.assign(__ds_scope, { BrandMark, Brand });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Brand.jsx", error: String((e && e.message) || e) }); }

// components/navigation/PageHeader.jsx
try { (() => {
function PageHeader({
  title,
  subtitle,
  actions,
  className = ''
}) {
  return /*#__PURE__*/React.createElement("header", {
    className: 'at-pagehead ' + className
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("h1", {
    className: "at-pagehead__title"
  }, title), subtitle ? /*#__PURE__*/React.createElement("p", {
    className: "at-pagehead__sub"
  }, subtitle) : null), actions ? /*#__PURE__*/React.createElement("div", {
    className: "at-pagehead__actions"
  }, actions) : null);
}
Object.assign(__ds_scope, { PageHeader });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/PageHeader.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Sidebar.jsx
try { (() => {
function NavItem({
  icon,
  label,
  active = false,
  count,
  onClick
}) {
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "at-nav",
    "aria-current": active ? 'page' : undefined,
    onClick: onClick,
    title: label
  }, icon ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 16
  }) : null, /*#__PURE__*/React.createElement("span", {
    className: "at-nav__text"
  }, label), count != null ? /*#__PURE__*/React.createElement("span", {
    className: "at-nav__count"
  }, count) : null);
}
function NavGroup({
  label,
  defaultOpen = true,
  children
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  return /*#__PURE__*/React.createElement("div", {
    className: 'at-group ' + (open ? '' : 'at-group--closed')
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "at-group__head",
    onClick: () => setOpen(!open),
    "aria-expanded": open
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "chevron-down",
    size: 14
  }), /*#__PURE__*/React.createElement("span", null, label)), /*#__PURE__*/React.createElement("div", {
    className: "at-group__items"
  }, children));
}
function QuickTile({
  icon,
  label,
  active = false,
  onClick
}) {
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "at-quick",
    "aria-current": active ? 'page' : undefined,
    onClick: onClick,
    title: label
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 18
  }), /*#__PURE__*/React.createElement("span", {
    className: "at-quick__label"
  }, label));
}
function UserCard({
  initials,
  name,
  role,
  onClick
}) {
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "at-user",
    onClick: onClick
  }, /*#__PURE__*/React.createElement(__ds_scope.Avatar, {
    initials: initials,
    size: 38,
    radius: 11
  }), /*#__PURE__*/React.createElement("span", {
    className: "at-user__text"
  }, /*#__PURE__*/React.createElement("div", {
    className: "at-user__name"
  }, name), /*#__PURE__*/React.createElement("div", {
    className: "at-user__role"
  }, role)));
}
function Sidebar({
  brand,
  search = true,
  quickLabel = 'Quick access',
  quick = [],
  groups = [],
  active,
  onNavigate,
  user,
  notifications = false,
  onNotifications,
  onLogout,
  collapsed = false,
  className = '',
  style
}) {
  const go = id => () => onNavigate && onNavigate(id);
  return /*#__PURE__*/React.createElement("aside", {
    className: 'at-side ' + (collapsed ? 'at-side--collapsed ' : '') + className,
    style: style
  }, /*#__PURE__*/React.createElement("div", {
    className: "at-side__head"
  }, brand || /*#__PURE__*/React.createElement(__ds_scope.Brand, null)), /*#__PURE__*/React.createElement("div", {
    className: "at-side__scroll"
  }, search ? /*#__PURE__*/React.createElement(__ds_scope.SearchInput, {
    variant: "bare"
  }) : null, quick.length ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "at-side__label"
  }, quickLabel), /*#__PURE__*/React.createElement("div", {
    className: "at-side__quick"
  }, quick.map(q => /*#__PURE__*/React.createElement(QuickTile, {
    key: q.id,
    icon: q.icon,
    label: q.label,
    active: active === q.id,
    onClick: go(q.id)
  })))) : null, groups.map(g => /*#__PURE__*/React.createElement(NavGroup, {
    key: g.id || g.label,
    label: g.label,
    defaultOpen: g.defaultOpen !== false
  }, (g.items || []).map(it => /*#__PURE__*/React.createElement(NavItem, {
    key: it.id,
    icon: it.icon,
    label: it.label,
    count: it.count,
    active: active === it.id,
    onClick: go(it.id)
  }))))), /*#__PURE__*/React.createElement("div", {
    className: "at-side__foot"
  }, /*#__PURE__*/React.createElement("div", {
    className: "at-side__tools"
  }, /*#__PURE__*/React.createElement(__ds_scope.IconButton, {
    variant: "tile",
    icon: "bell",
    label: "Notifications",
    dot: notifications,
    onClick: onNotifications
  }), /*#__PURE__*/React.createElement(__ds_scope.IconButton, {
    variant: "tile",
    icon: "log-out",
    label: "Log out",
    onClick: onLogout
  })), user ? /*#__PURE__*/React.createElement(UserCard, {
    initials: user.initials,
    name: user.name,
    role: user.role,
    onClick: user.onClick
  }) : null));
}
Object.assign(__ds_scope, { NavItem, NavGroup, QuickTile, UserCard, Sidebar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Sidebar.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Topbar.jsx
try { (() => {
function Breadcrumbs({
  items = [],
  onNavigate
}) {
  return /*#__PURE__*/React.createElement("nav", {
    className: "at-crumbs",
    "aria-label": "Breadcrumb"
  }, items.map((it, i) => {
    const last = i === items.length - 1;
    return /*#__PURE__*/React.createElement(React.Fragment, {
      key: i
    }, i > 0 ? /*#__PURE__*/React.createElement("span", {
      className: "at-crumbs__sep"
    }, "/") : null, /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: 'at-crumbs__item ' + (last ? 'at-crumbs__item--current' : ''),
      "aria-current": last ? 'page' : undefined,
      onClick: !last && onNavigate ? () => onNavigate(it.id || it.label) : undefined
    }, it.label));
  }));
}
function OrgSelector({
  label,
  icon = 'building-2',
  onClick
}) {
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "at-org",
    onClick: onClick
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 16
  }), /*#__PURE__*/React.createElement("span", null, label));
}
function Topbar({
  crumbs = [],
  onNavigate,
  onToggleSidebar,
  sidebarCollapsed = false,
  langs = ['PT', 'EN'],
  lang,
  onLang,
  theme = 'light',
  onToggleTheme,
  org,
  onOrg,
  right,
  className = ''
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: 'at-top ' + className
  }, /*#__PURE__*/React.createElement("div", {
    className: "at-top__left"
  }, onToggleSidebar ? /*#__PURE__*/React.createElement(__ds_scope.IconButton, {
    icon: sidebarCollapsed ? 'chevrons-right' : 'chevrons-left',
    label: sidebarCollapsed ? 'Open menu' : 'Collapse menu',
    onClick: onToggleSidebar
  }) : null, /*#__PURE__*/React.createElement(Breadcrumbs, {
    items: crumbs,
    onNavigate: onNavigate
  })), /*#__PURE__*/React.createElement("div", {
    className: "at-top__right"
  }, right, langs && langs.length ? /*#__PURE__*/React.createElement(__ds_scope.Segmented, {
    options: langs,
    value: lang || langs[langs.length - 1],
    onChange: onLang
  }) : null, onToggleTheme ? /*#__PURE__*/React.createElement(__ds_scope.IconButton, {
    icon: theme === 'dark' ? 'moon' : 'sun',
    label: "Switch theme",
    round: true,
    onClick: onToggleTheme
  }) : null, org ? /*#__PURE__*/React.createElement(OrgSelector, {
    label: org,
    onClick: onOrg
  }) : null));
}
Object.assign(__ds_scope, { Breadcrumbs, OrgSelector, Topbar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Topbar.jsx", error: String((e && e.message) || e) }); }

// components/overlays/Modal.jsx
try { (() => {
function Modal({
  open = true,
  onClose,
  title,
  subtitle,
  art,
  lead,
  footer,
  width = 600,
  plain = false,
  inline = false,
  className = '',
  children
}) {
  React.useEffect(() => {
    if (!open || inline || !onClose) return;
    const k = e => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [open, inline, onClose]);
  if (!open) return null;
  return /*#__PURE__*/React.createElement("div", {
    className: 'at-modal-layer ' + (inline ? 'at-modal-layer--inline' : ''),
    onMouseDown: e => {
      if (!inline && e.target === e.currentTarget && onClose) onClose();
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: 'at-modal ' + (plain ? 'at-modal--plain ' : '') + className,
    role: "dialog",
    "aria-modal": !inline,
    "aria-label": typeof title === 'string' ? title : undefined,
    style: {
      '--modal-w': width + 'px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "at-modal__head"
  }, lead ? /*#__PURE__*/React.createElement("div", {
    className: "at-modal__lead"
  }, lead) : null, /*#__PURE__*/React.createElement("div", {
    className: "at-modal__titles"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "at-modal__title"
  }, title), subtitle ? /*#__PURE__*/React.createElement("p", {
    className: "at-modal__sub"
  }, subtitle) : null), art ? /*#__PURE__*/React.createElement("img", {
    className: "at-modal__art",
    src: art,
    alt: ""
  }) : null, onClose ? /*#__PURE__*/React.createElement(__ds_scope.IconButton, {
    className: "at-modal__close",
    icon: "x",
    label: "Close",
    round: true,
    onClick: onClose
  }) : null), /*#__PURE__*/React.createElement("div", {
    className: "at-modal__body"
  }, children), footer ? /*#__PURE__*/React.createElement("div", {
    className: "at-modal__foot"
  }, footer) : null));
}
function ModalSection({
  title,
  children,
  className = ''
}) {
  return /*#__PURE__*/React.createElement("section", {
    className: 'at-modal__section ' + className
  }, title ? /*#__PURE__*/React.createElement("div", {
    className: "at-modal__eyebrow"
  }, title) : null, children);
}
Object.assign(__ds_scope, { Modal, ModalSection });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/overlays/Modal.jsx", error: String((e && e.message) || e) }); }

// ui_kits/admin/AnalyticsScreen.jsx
try { (() => {
(() => {
  const {
    PageHeader,
    Button,
    Panel,
    MetricCard,
    DataTable,
    Badge,
    SearchInput,
    ChipGroup,
    Icon,
    IconButton
  } = window.AliceTeixeiraDesignSystem_69f9f3;
  function HeroCard() {
    const cells = [['layers', 'Batches in progress', '12'], ['shield-check', 'Zone grade', 'A'], ['clock', 'Without deviations', '24 days'], ['calendar', 'Inspection', '18.09']];
    return /*#__PURE__*/React.createElement("div", {
      className: "kit-hero"
    }, /*#__PURE__*/React.createElement("div", {
      className: "kit-hero__art"
    }), /*#__PURE__*/React.createElement("div", {
      className: "kit-hero__top"
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontSize: 13,
        color: 'rgba(255,255,255,0.72)'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: 'var(--cyan-400)'
      }
    }), "Cleanliness index \xB7 updated 12 minutes ago"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'baseline',
        gap: 6
      }
    }, /*#__PURE__*/React.createElement("span", {
      className: "at-num",
      style: {
        fontSize: 68,
        lineHeight: 1
      }
    }, "87"), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 22,
        color: 'rgba(255,255,255,0.6)'
      }
    }, "/100")), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 26,
        fontWeight: 600,
        lineHeight: 1.15,
        letterSpacing: '-0.01em'
      }
    }, "Production in a", /*#__PURE__*/React.createElement("br", null), "stable zone"), /*#__PURE__*/React.createElement("span", {
      style: {
        alignSelf: 'flex-start',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        height: 30,
        padding: '0 12px',
        borderRadius: 999,
        background: 'rgba(27,159,192,0.22)',
        color: '#8FDDEC',
        fontSize: 14
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "arrow-up",
      size: 14
    }), "3 this week"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.7)',
        marginTop: 'auto'
      }
    }, "All 6 control loops are running steadily.")), /*#__PURE__*/React.createElement("div", {
      className: "kit-hero__grid"
    }, cells.map(c => /*#__PURE__*/React.createElement("div", {
      className: "kit-hero__cell",
      key: c[1]
    }, /*#__PURE__*/React.createElement("span", {
      className: "kit-hero__well"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: c[0],
      size: 16
    })), c[1], /*#__PURE__*/React.createElement("b", null, c[2])))));
  }
  function AnalyticsScreen() {
    const D = window.ATData;
    const [q, setQ] = React.useState('');
    const [f, setF] = React.useState('all');
    const rows = D.events.filter(e => (f === 'all' || e.kind === f) && (!q || (e.event + e.section).toLowerCase().includes(q.toLowerCase())));
    return /*#__PURE__*/React.createElement("div", {
      className: "kit-page"
    }, /*#__PURE__*/React.createElement(PageHeader, {
      title: "Analytics",
      subtitle: "Cleanroom status overview for the Dubna plant.",
      actions: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
        variant: "secondary"
      }, "Export report"), /*#__PURE__*/React.createElement(Button, null, "New round"))
    }), /*#__PURE__*/React.createElement("div", {
      className: "kit-row",
      style: {
        gridTemplateColumns: 'minmax(0,1.05fr) minmax(0,1fr)'
      }
    }, /*#__PURE__*/React.createElement(HeroCard, null), /*#__PURE__*/React.createElement("div", {
      className: "kit-metrics"
    }, /*#__PURE__*/React.createElement(MetricCard, {
      icon: "refresh-cw",
      badge: "within limits",
      value: "98",
      unit: "%",
      title: "Validation on schedule",
      subtitle: "Cycle no. 4412 overdue",
      segments: [1, 1, 1, 1, 1, 1, 2]
    }), /*#__PURE__*/React.createElement(MetricCard, {
      icon: "gauge",
      badge: "2 deviations",
      badgeTone: "warning",
      value: "76",
      unit: "%",
      title: "Environmental monitoring",
      subtitle: "Airlock P-2 \xB7 pressure below limit",
      segments: [1, 1, 1, 1, 1, 0, 0]
    }), /*#__PURE__*/React.createElement(MetricCard, {
      icon: "clock",
      badge: "within limits",
      value: "4,1",
      unit: "d",
      title: "Sample turnaround",
      subtitle: "Limit \u2014 5 days",
      segments: [1, 1, 1, 1, 2, 0, 0]
    }), /*#__PURE__*/React.createElement(MetricCard, {
      icon: "lock",
      badge: "within limits",
      value: "100",
      unit: "%",
      title: "Cleanroom access",
      subtitle: "Airlock P-1 \xB7 214 entries",
      segments: [1, 1, 1, 1, 1, 1, 2]
    }))), /*#__PURE__*/React.createElement(Panel, null, /*#__PURE__*/React.createElement("div", {
      className: "kit-toolbar"
    }, /*#__PURE__*/React.createElement(SearchInput, {
      placeholder: "Search the table",
      value: q,
      onChange: setQ
    }), /*#__PURE__*/React.createElement(ChipGroup, {
      value: f,
      onChange: setF,
      options: [{
        value: 'all',
        label: 'All events'
      }, {
        value: 'drop',
        label: 'Index drop'
      }, {
        value: 'growth',
        label: 'Growth'
      }]
    }), /*#__PURE__*/React.createElement("span", {
      className: "kit-toolbar__end"
    }, /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      icon: "download"
    }, "Export"))), /*#__PURE__*/React.createElement(DataTable, {
      chevron: true,
      onRowClick: () => {},
      rows: rows,
      columns: [{
        key: 'date',
        label: 'Date',
        width: 140
      }, {
        key: 'event',
        label: 'Event',
        render: v => /*#__PURE__*/React.createElement("span", {
          style: {
            whiteSpace: 'normal'
          }
        }, v)
      }, {
        key: 'section',
        label: 'Section'
      }, {
        key: 'impact',
        label: 'Impact',
        width: 90,
        render: v => /*#__PURE__*/React.createElement(Badge, {
          tone: v < 0 ? 'danger' : v > 0 ? 'info' : 'neutral',
          size: "md"
        }, v > 0 ? '+' + v : v < 0 ? '−' + Math.abs(v) : '0')
      }]
    }), rows.length === 0 ? /*#__PURE__*/React.createElement("div", {
      style: {
        padding: '24px 0',
        textAlign: 'center',
        color: 'var(--text-secondary)'
      }
    }, "No events match this filter.") : null));
  }
  window.AnalyticsScreen = AnalyticsScreen;
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/admin/AnalyticsScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/admin/App.jsx
try { (() => {
(() => {
  const NS = window.AliceTeixeiraDesignSystem_69f9f3;
  const {
    AppShell,
    Sidebar,
    Topbar,
    Modal,
    ModalSection,
    InfoTile,
    TextField,
    FileDrop,
    FileItem,
    Button,
    ScheduleItem,
    Panel,
    Icon3D
  } = NS;
  const SCREENS = {
    analytics: 'AnalyticsScreen',
    tasks: 'TasksScreen',
    batch: 'BatchScreen',
    shifts: 'ShiftsScreen',
    pass: 'PassScreen'
  };
  const ROLE_OF = {
    analytics: 'admin',
    batch: 'admin',
    shifts: 'employee',
    pass: 'employee'
  };
  const MONTH = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const WD = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  function readHash() {
    const h = (location.hash || '').replace('#', '');
    return h || 'tasks';
  }
  function RecordModal({
    onClose
  }) {
    return /*#__PURE__*/React.createElement(Modal, {
      title: "Medical record book",
      subtitle: "Medical section",
      art: "../../assets/icons-3d/records-files.png",
      onClose: onClose,
      width: 640,
      footer: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
        variant: "secondary",
        onClick: onClose
      }, "Cancel"), /*#__PURE__*/React.createElement(Button, {
        onClick: onClose
      }, "Save"))
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))',
        gap: 10
      }
    }, /*#__PURE__*/React.createElement(InfoTile, {
      label: "Status",
      value: "Valid"
    }), /*#__PURE__*/React.createElement(InfoTile, {
      label: "Remaining",
      value: "5 months"
    }), /*#__PURE__*/React.createElement(InfoTile, {
      label: "Access",
      value: "Zones A/B, C, D"
    })), /*#__PURE__*/React.createElement(ModalSection, {
      title: "Document"
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))',
        gap: 14
      }
    }, /*#__PURE__*/React.createElement(TextField, {
      label: "Number",
      defaultValue: "Medical Book No. 77-0421"
    }), /*#__PURE__*/React.createElement(TextField, {
      label: "Issued",
      defaultValue: "14.02.2026"
    }), /*#__PURE__*/React.createElement(TextField, {
      label: "Valid through",
      defaultValue: "14.02.2027"
    }), /*#__PURE__*/React.createElement(TextField, {
      label: "Medical centre",
      defaultValue: "Profmed Medical Center, Dubna"
    }))), /*#__PURE__*/React.createElement(ModalSection, {
      title: "Attachments"
    }, /*#__PURE__*/React.createElement(FileDrop, null), /*#__PURE__*/React.createElement(FileItem, {
      name: "Medical book, spreads",
      meta: "2.4 MB \xB7 14.02.2026"
    })));
  }
  function DayModal({
    day,
    onClose
  }) {
    const d = new Date(2026, 8, day);
    const items = window.ATData.day;
    return /*#__PURE__*/React.createElement(Modal, {
      plain: true,
      title: WD[d.getDay()] + ', ' + MONTH[8] + ' ' + day,
      subtitle: items.length + ' tasks · ' + (day === 9 ? 'today' : 'planned'),
      lead: /*#__PURE__*/React.createElement("div", {
        className: "at-modal__date"
      }, day),
      onClose: onClose,
      width: 560,
      footer: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
        variant: "secondary",
        onClick: onClose
      }, "Close"), /*#__PURE__*/React.createElement(Button, {
        icon: "plus"
      }, "Add task"))
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 8
      }
    }, items.map(t => /*#__PURE__*/React.createElement(ScheduleItem, {
      key: t.time,
      time: t.time,
      title: t.title,
      subtitle: t.sub,
      tone: t.tone,
      badge: t.badge,
      badgeTone: t.badgeTone
    }))));
  }
  function QRModal({
    onClose
  }) {
    return /*#__PURE__*/React.createElement(Modal, {
      plain: true,
      title: "Pass \u2116 0421-7714",
      subtitle: "Present the QR code at the relevant access point.",
      onClose: onClose,
      width: 440,
      footer: /*#__PURE__*/React.createElement(Button, {
        onClick: onClose
      }, "Close")
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'center',
        padding: '8px 0 4px'
      }
    }, /*#__PURE__*/React.createElement("img", {
      src: "../../assets/imagery/qr-sample.png",
      alt: "Pass QR code",
      style: {
        width: 240,
        height: 240,
        borderRadius: 24,
        boxShadow: 'var(--shadow-md)'
      }
    })));
  }
  function NotInKit({
    label
  }) {
    return /*#__PURE__*/React.createElement(Panel, {
      variant: "tint",
      style: {
        alignItems: 'center',
        textAlign: 'center',
        padding: '56px 24px'
      }
    }, /*#__PURE__*/React.createElement(Icon3D, {
      name: "library",
      size: 112,
      base: "../../assets/icons-3d/"
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 20,
        fontWeight: 500
      }
    }, label), /*#__PURE__*/React.createElement("div", {
      style: {
        color: 'var(--text-secondary)',
        maxWidth: 420
      }
    }, "This section was not part of the reference screens, so it is intentionally left blank in the UI kit."));
  }
  function App() {
    const D = window.ATData;
    const [page, setPage] = React.useState(readHash());
    const [role, setRole] = React.useState(ROLE_OF[readHash()] || 'admin');
    const [theme, setTheme] = React.useState(localStorage.getItem('at-kit-theme') || 'light');
    const [lang, setLang] = React.useState('EN');
    const [collapsed, setCollapsed] = React.useState(false);
    const [drawer, setDrawer] = React.useState(false);
    const [modal, setModal] = React.useState(null);
    const mq = React.useMemo(() => window.matchMedia('(max-width: 1023px)'), []);
    React.useEffect(() => {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('at-kit-theme', theme);
    }, [theme]);
    React.useEffect(() => {
      const on = () => {
        const h = readHash();
        setPage(h);
        if (ROLE_OF[h]) setRole(ROLE_OF[h]);
      };
      window.addEventListener('hashchange', on);
      return () => window.removeEventListener('hashchange', on);
    }, []);
    const go = id => {
      location.hash = id;
      setPage(id);
      setDrawer(false);
      window.scrollTo(0, 0);
    };
    const r = D.roles[role];
    const allItems = r.quick.concat(...r.groups.map(g => g.items));
    const cur = allItems.find(i => i.id === page);
    const crumbs = (D.crumbs[page] || [role === 'admin' ? 'Workspace' : 'My day', cur ? cur.label : 'Overview']).map(label => ({
      label
    }));
    const Screen = SCREENS[page] ? window[SCREENS[page]] : null;
    const openDay = d => setModal({
      type: 'day',
      day: typeof d === 'number' ? d : 9
    });
    return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(AppShell, {
      drawerOpen: drawer,
      onDrawerClose: () => setDrawer(false),
      sidebar: /*#__PURE__*/React.createElement(Sidebar, {
        collapsed: collapsed && !mq.matches,
        active: page,
        onNavigate: go,
        notifications: true,
        quick: r.quick,
        groups: r.groups,
        user: Object.assign({}, r.user, {
          onClick: () => {
            const nr = role === 'admin' ? 'employee' : 'admin';
            setRole(nr);
            go(nr === 'admin' ? 'tasks' : 'shifts');
          }
        })
      })
    }, /*#__PURE__*/React.createElement(Topbar, {
      crumbs: crumbs,
      sidebarCollapsed: mq.matches ? !drawer : collapsed,
      onToggleSidebar: () => mq.matches ? setDrawer(true) : setCollapsed(!collapsed),
      lang: lang,
      onLang: setLang,
      theme: theme,
      onToggleTheme: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
      org: role === 'admin' ? 'Farmavex JSC, Dubna plant' : undefined
    }), Screen ? /*#__PURE__*/React.createElement(Screen, {
      onOpenDay: openDay,
      onOpenRecord: () => setModal({
        type: 'record'
      }),
      onShowQR: () => setModal({
        type: 'qr'
      })
    }) : /*#__PURE__*/React.createElement(NotInKit, {
      label: cur ? cur.label : page
    })), modal && modal.type === 'record' ? /*#__PURE__*/React.createElement(RecordModal, {
      onClose: () => setModal(null)
    }) : null, modal && modal.type === 'day' ? /*#__PURE__*/React.createElement(DayModal, {
      day: modal.day,
      onClose: () => setModal(null)
    }) : null, modal && modal.type === 'qr' ? /*#__PURE__*/React.createElement(QRModal, {
      onClose: () => setModal(null)
    }) : null);
  }
  ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(App, null));
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/admin/App.jsx", error: String((e && e.message) || e) }); }

// ui_kits/admin/BatchScreen.jsx
try { (() => {
(() => {
  const {
    PageHeader,
    Button,
    Panel,
    StatCard,
    AreaChart,
    ChartTooltip,
    TickGauge,
    KeyValueList,
    DataTable,
    Badge,
    SearchInput,
    ChipGroup
  } = window.AliceTeixeiraDesignSystem_69f9f3;
  function BatchScreen() {
    const D = window.ATData;
    const [q, setQ] = React.useState('');
    const [f, setF] = React.useState('all');
    const rows = D.batches.filter(b => (f === 'all' || b.type === f) && (!q || (b.op + b.doc + b.area).toLowerCase().includes(q.toLowerCase())));
    const out = [17720, 17980, 18160, 18040, 17860, 17930, 18250, 18470, 18380];
    const labels = ['Mon', '', 'Tue', 'Wed', 'Thu', '', 'Fri', 'Sat', 'Sun'];
    const dates = ['Mon, 28 Aug', '', 'Tue, 29 Aug', 'Wed, 30 Aug', 'Thu, 31 Aug', '', 'Fri, 1 Sep', 'Sat, 2 Sep', 'Sun, 3 Sep'];
    return /*#__PURE__*/React.createElement("div", {
      className: "kit-page"
    }, /*#__PURE__*/React.createElement(PageHeader, {
      title: "Batch movement",
      subtitle: "Start, transfer and release of production batches across areas.",
      actions: /*#__PURE__*/React.createElement(Button, {
        variant: "secondary"
      }, "Export")
    }), /*#__PURE__*/React.createElement("div", {
      className: "kit-kpis"
    }, /*#__PURE__*/React.createElement(StatCard, {
      variant: "cyan",
      label: "Started this week",
      value: "+12",
      unit: "batches"
    }), /*#__PURE__*/React.createElement(StatCard, {
      label: "Released",
      value: "9",
      unit: "batches"
    }), /*#__PURE__*/React.createElement(StatCard, {
      label: "Rejects",
      value: "0,18",
      unit: "% \xB7 limit 0.4%"
    }), /*#__PURE__*/React.createElement(StatCard, {
      variant: "ink",
      label: "In progress",
      value: "12",
      unit: "batches"
    })), /*#__PURE__*/React.createElement("div", {
      className: "kit-row"
    }, /*#__PURE__*/React.createElement(Panel, {
      title: "Product output",
      meta: /*#__PURE__*/React.createElement(Badge, {
        tone: "neutral",
        size: "md"
      }, "7 days")
    }, /*#__PURE__*/React.createElement(AreaChart, {
      data: out,
      labels: labels,
      min: 17600,
      max: 18600,
      yTicks: 6,
      height: 300,
      activeIndex: 3,
      renderTooltip: (v, i) => /*#__PURE__*/React.createElement(ChartTooltip, {
        variant: "line",
        title: dates[i] || 'Week 35',
        label: "Output",
        value: v.toLocaleString('ru-RU'),
        unit: "units"
      })
    })), /*#__PURE__*/React.createElement(Panel, {
      title: "Area workload"
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 28,
        padding: '6px 0 4px'
      }
    }, /*#__PURE__*/React.createElement(TickGauge, {
      value: 84,
      size: 150
    }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 34,
        fontWeight: 500,
        letterSpacing: '-0.02em',
        lineHeight: 1.1
      }
    }, "21 of 25"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        color: 'var(--text-secondary)',
        marginTop: 4
      }
    }, "shifts loaded"))), /*#__PURE__*/React.createElement(KeyValueList, {
      ruled: true,
      items: [{
        label: 'Free',
        value: '4 shifts'
      }, {
        label: 'Validation · R-207',
        value: '1 shift'
      }, {
        label: 'Stopped · R-101',
        value: '0'
      }]
    }))), /*#__PURE__*/React.createElement(Panel, null, /*#__PURE__*/React.createElement("div", {
      className: "kit-toolbar"
    }, /*#__PURE__*/React.createElement(SearchInput, {
      placeholder: "Search the table",
      value: q,
      onChange: setQ
    }), /*#__PURE__*/React.createElement(ChipGroup, {
      value: f,
      onChange: setF,
      options: [{
        value: 'all',
        label: 'All operations'
      }, {
        value: 'start',
        label: 'Starts'
      }, {
        value: 'release',
        label: 'Release'
      }]
    })), /*#__PURE__*/React.createElement(DataTable, {
      rows: rows,
      onRowClick: () => {},
      columns: [{
        key: 'date',
        label: 'Date'
      }, {
        key: 'op',
        label: 'Operation'
      }, {
        key: 'area',
        label: 'Area'
      }, {
        key: 'qty',
        label: 'Quantity',
        numeric: true
      }, {
        key: 'doc',
        label: 'Document'
      }, {
        key: 'status',
        label: 'Status',
        render: v => /*#__PURE__*/React.createElement(Badge, {
          tone: v === 'Review' ? 'warning' : 'info'
        }, v)
      }]
    })));
  }
  window.BatchScreen = BatchScreen;
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/admin/BatchScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/admin/PassScreen.jsx
try { (() => {
(() => {
  const {
    PageHeader,
    Panel,
    Button,
    Badge,
    Tag,
    Avatar,
    ListRow,
    BrandMark,
    Icon
  } = window.AliceTeixeiraDesignSystem_69f9f3;
  function PassScreen({
    onOpenRecord,
    onShowQR
  }) {
    return /*#__PURE__*/React.createElement("div", {
      className: "kit-page"
    }, /*#__PURE__*/React.createElement(PageHeader, {
      title: "My pass",
      subtitle: "Digital cleanroom pass and pass history",
      actions: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
        variant: "secondary"
      }, "Report loss"), /*#__PURE__*/React.createElement(Button, {
        icon: "qr-code",
        onClick: onShowQR
      }, "Show QR"))
    }), /*#__PURE__*/React.createElement("div", {
      className: "kit-row kit-row--even"
    }, /*#__PURE__*/React.createElement("div", {
      className: "kit-pass"
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        fontSize: 17,
        fontWeight: 500
      }
    }, /*#__PURE__*/React.createElement(BrandMark, {
      height: 22,
      color: "#fff"
    }), "Alice Teixeira"), /*#__PURE__*/React.createElement(Badge, {
      tone: "onDark",
      size: "md",
      dot: true
    }, "Enabled")), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 16
      }
    }, /*#__PURE__*/React.createElement(Avatar, {
      initials: "EP",
      size: 72,
      radius: 20
    }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 22,
        fontWeight: 500
      }
    }, "Elena Panova"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.7)'
      }
    }, "Sterile filling line operator"))), /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: "kit-pass__qr",
      onClick: onShowQR,
      "aria-label": "Show QR",
      style: {
        border: 0,
        cursor: 'pointer'
      }
    }), /*#__PURE__*/React.createElement("dl", null, /*#__PURE__*/React.createElement("dt", null, "Pass"), /*#__PURE__*/React.createElement("dt", null, "Valid until"), /*#__PURE__*/React.createElement("dt", null, "Production"), /*#__PURE__*/React.createElement("dd", null, "\u2116 0421-7714"), /*#__PURE__*/React.createElement("dd", null, "22.03.2027"), /*#__PURE__*/React.createElement("dd", null, "Filling area")), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: 8
      }
    }, /*#__PURE__*/React.createElement(Tag, {
      round: true,
      style: {
        width: 'auto',
        padding: '0 14px'
      }
    }, "A/B"), /*#__PURE__*/React.createElement(Tag, {
      round: true
    }, "C"), /*#__PURE__*/React.createElement(Tag, {
      round: true
    }, "D"), /*#__PURE__*/React.createElement(Tag, {
      variant: "ghostDark"
    }, "Animal facility"))), /*#__PURE__*/React.createElement("div", {
      className: "kit-page"
    }, /*#__PURE__*/React.createElement(Panel, null, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 12
      }
    }, /*#__PURE__*/React.createElement("span", {
      className: "kit-datepill"
    }, "February 14 ", /*#__PURE__*/React.createElement("b", null, "2027"))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 17,
        fontWeight: 500
      }
    }, "Periodic medical check"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 14,
        color: 'var(--text-secondary)',
        marginTop: 4
      }
    }, "Valid until 14.02.2027")), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }
    }, /*#__PURE__*/React.createElement(Badge, {
      tone: "info",
      size: "md"
    }, "Valid"), /*#__PURE__*/React.createElement(Button, {
      variant: "accent-outline",
      size: "sm",
      onClick: onOpenRecord
    }, "Learn more"))), /*#__PURE__*/React.createElement(Panel, {
      padding: "sm",
      style: {
        gap: 0
      }
    }, /*#__PURE__*/React.createElement(ListRow, {
      icon: "graduation-cap",
      title: "Qualification",
      subtitle: "Zone B entry confirmed",
      onClick: onOpenRecord
    }), /*#__PURE__*/React.createElement(ListRow, {
      icon: "file-text",
      title: "Biosafety briefing",
      subtitle: "Completed 18.08.2026",
      onClick: onOpenRecord
    })), /*#__PURE__*/React.createElement(Panel, {
      title: "Last pass",
      meta: /*#__PURE__*/React.createElement("a", {
        href: "#pass",
        style: {
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 14
        }
      }, "All entries ", /*#__PURE__*/React.createElement(Icon, {
        name: "arrow-right",
        size: 14
      }))
    }, /*#__PURE__*/React.createElement("div", {
      className: "kit-entries"
    }, /*#__PURE__*/React.createElement("span", null, "02.09.2026"), /*#__PURE__*/React.createElement("span", null, "13:02"), /*#__PURE__*/React.createElement("span", null, "Exit"), /*#__PURE__*/React.createElement("span", null, "Airlock P-1"), /*#__PURE__*/React.createElement("span", {
      className: "m",
      style: {
        marginTop: 10
      }
    }, "02.09.2026"), /*#__PURE__*/React.createElement("span", {
      className: "m",
      style: {
        marginTop: 10
      }
    }, "09:14"), /*#__PURE__*/React.createElement("span", {
      className: "m"
    }, "Entry"), /*#__PURE__*/React.createElement("span", {
      className: "m"
    }, "Airlock P-1"))))));
  }
  window.PassScreen = PassScreen;
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/admin/PassScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/admin/ShiftsScreen.jsx
try { (() => {
(() => {
  const {
    PageHeader,
    Panel,
    StatCard,
    ShiftCard,
    Calendar,
    Legend,
    Badge,
    Button,
    ListRow
  } = window.AliceTeixeiraDesignSystem_69f9f3;
  function ShiftsScreen({
    onOpenDay
  }) {
    const [sel, setSel] = React.useState(null);
    const M = 'cyan',
      L = 'lime';
    const cells = {
      1: M,
      2: L,
      3: M,
      4: M,
      7: M,
      8: L,
      9: M,
      10: M,
      11: L,
      13: 'ring',
      14: L,
      15: M,
      16: M,
      17: L,
      18: M,
      21: M,
      22: M,
      23: L,
      24: M,
      25: M,
      28: M,
      29: L,
      30: M
    };
    const week = [['Mon', 7, 'cyan', 'Morning', '07:00–15:30', 'Grade A/B · line 2'], ['Tue', 8, 'cyan', 'Morning', '07:00–15:30', 'Grade A/B · line 2'], ['Wed', 9, 'lime', 'Day', '11:00–19:30', 'Grade C · washing'], ['Thu', 10, 'cyan', 'Morning', '07:00–15:30', 'Grade A/B · line 2'], ['Fri', 11, 'lime', 'Day', '11:00–19:30', 'Grade C · washing'], ['Sat', 12, 'off', 'Day off'], ['Sun', 13, 'off', 'Day off']];
    return /*#__PURE__*/React.createElement("div", {
      className: "kit-page"
    }, /*#__PURE__*/React.createElement(PageHeader, {
      title: "Shift schedule",
      subtitle: "Shifts, work zones and shift swaps"
    }), /*#__PURE__*/React.createElement("div", {
      className: "kit-kpis kit-kpis--3"
    }, /*#__PURE__*/React.createElement(StatCard, {
      label: "Shifts in September",
      value: "18"
    }), /*#__PURE__*/React.createElement(StatCard, {
      label: "Scheduled hours",
      value: "153",
      unit: "h"
    }), /*#__PURE__*/React.createElement(StatCard, {
      variant: "ink",
      label: "Next shift",
      value: "Mon, 07:00"
    })), /*#__PURE__*/React.createElement(Panel, {
      title: "This week"
    }, /*#__PURE__*/React.createElement("div", {
      className: "kit-week"
    }, week.map(w => /*#__PURE__*/React.createElement(ShiftCard, {
      key: w[1],
      dayLabel: w[0],
      dayNumber: w[1],
      tone: w[2],
      name: w[3],
      time: w[4],
      zone: w[5]
    }))), /*#__PURE__*/React.createElement(Legend, {
      items: [{
        label: 'Morning · 07:00–15:30',
        color: 'var(--cyan-400)'
      }, {
        label: 'Day · 11:00–19:30',
        color: 'var(--lime-400)'
      }, {
        label: 'Day off',
        color: 'transparent'
      }]
    })), /*#__PURE__*/React.createElement("div", {
      className: "kit-row"
    }, /*#__PURE__*/React.createElement(Panel, {
      title: "September 2026",
      meta: /*#__PURE__*/React.createElement(Badge, {
        tone: "neutral",
        size: "md"
      }, "18 shifts \xB7 153 h")
    }, /*#__PURE__*/React.createElement(Calendar, {
      year: 2026,
      month: 8,
      outside: false,
      cells: cells,
      selected: sel,
      onSelect: d => {
        setSel(d);
        onOpenDay(d);
      },
      cellHeight: 44,
      gap: 8
    })), /*#__PURE__*/React.createElement(Panel, {
      title: "Shift swap",
      style: {
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(ListRow, {
      title: "Thu, 17.09 \xB7 Morning \u2192 Day",
      subtitle: "Swap with A. Sokolova",
      trailing: /*#__PURE__*/React.createElement(Badge, {
        tone: "warning"
      }, "Review")
    }), /*#__PURE__*/React.createElement(ListRow, {
      title: "Mon, 31.08 \xB7 Day \u2192 Morning",
      subtitle: "Swap with D. Morozov",
      trailing: /*#__PURE__*/React.createElement(Badge, {
        tone: "success"
      }, "Approved")
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 'auto',
        paddingTop: 12
      }
    }, /*#__PURE__*/React.createElement(Button, {
      variant: "accent-outline",
      icon: "plus"
    }, "New request")))));
  }
  window.ShiftsScreen = ShiftsScreen;
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/admin/ShiftsScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/admin/TasksScreen.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
(() => {
  const {
    PageHeader,
    Button,
    Panel,
    StatCard,
    BarChart,
    DonutChart,
    Legend,
    Badge,
    TaskCard,
    RiskItem,
    Icon,
    ChartTooltip
  } = window.AliceTeixeiraDesignSystem_69f9f3;
  function TasksScreen({
    onOpenDay
  }) {
    const D = window.ATData;
    const days = [{
      label: 'Mon',
      total: 2.9
    }, {
      label: 'Tue',
      total: 5,
      tooltip: {
        title: 'Tuesday, 08.09',
        value: '5',
        unit: 'tasks closed',
        chip: '+1.7 vs average'
      }
    }, {
      label: 'Wed',
      total: 2
    }, {
      label: 'Thu',
      total: 3.8
    }, {
      label: 'Fri',
      total: 5.8
    }, {
      label: 'Sat',
      total: 1,
      highlight: true
    }, {
      label: 'Sun',
      value: 1.9,
      tone: 'lime'
    }];
    const cols = ['Planned', 'In progress', 'Review', 'Closed'];
    return /*#__PURE__*/React.createElement("div", {
      className: "kit-page"
    }, /*#__PURE__*/React.createElement(PageHeader, {
      title: "Tasks",
      subtitle: "Site tasks by unit: workload, flow and risks.",
      actions: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
        variant: "secondary"
      }, "Export"), /*#__PURE__*/React.createElement(Button, {
        onClick: onOpenDay
      }, "Create task"))
    }), /*#__PURE__*/React.createElement("div", {
      className: "kit-kpis"
    }, /*#__PURE__*/React.createElement(StatCard, {
      variant: "ink",
      label: "Overdue",
      value: "1",
      unit: "needs action"
    }), /*#__PURE__*/React.createElement(StatCard, {
      label: "Due today",
      value: "3"
    }), /*#__PURE__*/React.createElement(StatCard, {
      label: "In progress",
      value: "7"
    }), /*#__PURE__*/React.createElement(StatCard, {
      variant: "lime",
      label: "Closed this week",
      value: "14"
    })), /*#__PURE__*/React.createElement("div", {
      className: "kit-row"
    }, /*#__PURE__*/React.createElement(Panel, {
      title: "Tasks closed per day",
      meta: /*#__PURE__*/React.createElement(Badge, {
        tone: "neutral",
        size: "md"
      }, "7 days")
    }, /*#__PURE__*/React.createElement(BarChart, {
      max: 6,
      height: 330,
      yTicks: ['6', '4', '2', '0'],
      activeIndex: 1,
      data: days,
      barWidth: 66
    })), /*#__PURE__*/React.createElement(Panel, {
      title: "Tasks by status",
      meta: /*#__PURE__*/React.createElement(Badge, {
        tone: "neutral",
        size: "md"
      }, "now")
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'center',
        padding: '8px 0'
      }
    }, /*#__PURE__*/React.createElement(DonutChart, {
      size: 236,
      thickness: 38,
      value: "25",
      label: "total tasks",
      segments: [{
        value: 14,
        color: 'var(--viz-2)'
      }, {
        value: 7,
        color: 'var(--cyan-500)'
      }, {
        value: 3,
        color: 'var(--lime-500)'
      }, {
        value: 1,
        color: 'var(--red-500)'
      }]
    })), /*#__PURE__*/React.createElement(Legend, {
      style: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '14px 28px',
        fontSize: 15,
        color: 'var(--text-primary)'
      },
      items: [{
        label: 'In progress',
        color: 'var(--cyan-500)',
        shape: 'dot',
        value: 7
      }, {
        label: 'Due today',
        color: 'var(--lime-500)',
        shape: 'dot',
        value: 3
      }, {
        label: 'Overdue',
        color: 'var(--red-500)',
        shape: 'dot',
        value: 1
      }, {
        label: 'Closed this week',
        color: 'var(--viz-2)',
        shape: 'dot',
        value: 14
      }]
    }))), /*#__PURE__*/React.createElement("div", {
      className: "kit-row kit-row--wide"
    }, /*#__PURE__*/React.createElement(Panel, {
      title: "Task flow",
      meta: /*#__PURE__*/React.createElement(Badge, {
        tone: "neutral",
        size: "md"
      }, "by unit")
    }, /*#__PURE__*/React.createElement("div", {
      className: "kit-flow"
    }, /*#__PURE__*/React.createElement("div", {
      className: "kit-flow__grid"
    }, /*#__PURE__*/React.createElement("span", null), cols.map(c => /*#__PURE__*/React.createElement("div", {
      className: "kit-flow__col",
      key: c
    }, c.toUpperCase())), D.flow.map(r => /*#__PURE__*/React.createElement(React.Fragment, {
      key: r.unit
    }, /*#__PURE__*/React.createElement("div", {
      className: "kit-flow__unit"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: r.icon,
      size: 16
    }), r.unit), r.cells.map((c, i) => /*#__PURE__*/React.createElement("div", {
      className: "kit-flow__cell",
      key: i
    }, c ? /*#__PURE__*/React.createElement(TaskCard, {
      title: c.title,
      subtitle: c.sub,
      tone: c.tone,
      onClick: onOpenDay
    }) : null))))))), /*#__PURE__*/React.createElement(Panel, {
      title: "Risks",
      meta: /*#__PURE__*/React.createElement(Badge, {
        tone: "neutral",
        size: "md"
      }, D.risks.length),
      style: {
        gap: 4
      }
    }, /*#__PURE__*/React.createElement("div", null, D.risks.map(r => /*#__PURE__*/React.createElement(RiskItem, _extends({
      key: r.title
    }, r)))))));
  }
  window.TasksScreen = TasksScreen;
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/admin/TasksScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/admin/data.js
try { (() => {
// Sample content transcribed from the reference screens (Klaris case study).
window.ATData = {
  roles: {
    admin: {
      user: {
        initials: 'IV',
        name: 'I. Vorontsov',
        role: 'System administrator'
      },
      quick: [{
        id: 'analytics',
        label: 'Analytics',
        icon: 'activity'
      }, {
        id: 'tasks',
        label: 'Tasks',
        icon: 'square-check'
      }, {
        id: 'micro',
        label: 'Microbiology',
        icon: 'atom'
      }, {
        id: 'env',
        label: 'Environmental monitoring',
        icon: 'shield-check'
      }],
      groups: [{
        label: 'Analytics',
        items: [{
          id: 'contractor',
          label: 'Contractor access',
          icon: 'log-in'
        }, {
          id: 'zones',
          label: 'Zone classification',
          icon: 'scan'
        }]
      }, {
        label: 'Production and control',
        items: [{
          id: 'batch',
          label: 'Batch movement',
          icon: 'layout-grid'
        }, {
          id: 'validation',
          label: 'Validation cycles',
          icon: 'refresh-cw'
        }, {
          id: 'pest',
          label: 'Pest control',
          icon: 'radio'
        }, {
          id: 'waste',
          label: 'Production waste',
          icon: 'trash-2'
        }]
      }, {
        label: 'Equipment',
        defaultOpen: false,
        items: [{
          id: 'assets',
          label: 'Assets & PPE',
          icon: 'shirt'
        }, {
          id: 'filters',
          label: 'HEPA filters',
          icon: 'gauge'
        }]
      }, {
        label: 'Documents and access',
        defaultOpen: false,
        items: [{
          id: 'records',
          label: 'Records & files',
          icon: 'file-text'
        }, {
          id: 'permissions',
          label: 'Permissions',
          icon: 'key-round'
        }]
      }, {
        label: 'Administration',
        defaultOpen: false,
        items: [{
          id: 'audit',
          label: 'Audit log',
          icon: 'history'
        }, {
          id: 'settings',
          label: 'Settings',
          icon: 'settings'
        }]
      }]
    },
    employee: {
      user: {
        initials: 'EP',
        name: 'E. Panova',
        role: 'Employee'
      },
      quick: [{
        id: 'tasks',
        label: 'Tasks',
        icon: 'square-check'
      }, {
        id: 'training',
        label: 'Training',
        icon: 'graduation-cap'
      }, {
        id: 'pass',
        label: 'My pass',
        icon: 'id-card'
      }, {
        id: 'shifts',
        label: 'Shift schedule',
        icon: 'calendar-days'
      }],
      groups: [{
        label: 'Zone work',
        items: [{
          id: 'sop',
          label: 'Instructions & SOP',
          icon: 'file-text'
        }, {
          id: 'ppe',
          label: 'Workwear & PPE',
          icon: 'shirt'
        }, {
          id: 'deviation',
          label: 'Report a deviation',
          icon: 'triangle-alert'
        }]
      }]
    }
  },
  crumbs: {
    analytics: ['Analytics', 'Analytics'],
    tasks: ['Production and control', 'Tasks'],
    batch: ['Production and control', 'Batch movement'],
    shifts: ['My day', 'Shift schedule'],
    pass: ['My day', 'My pass']
  },
  events: [{
    date: '02.09.2026',
    event: 'Pressure differential in airlock P-2 below limit for 6 hours',
    section: 'Environmental monitoring',
    impact: -4,
    kind: 'drop'
  }, {
    date: '01.09.2026',
    event: 'Validation cycle no. 4412 closed',
    section: 'Validation cycles',
    impact: 6,
    kind: 'growth'
  }, {
    date: '31.08.2026',
    event: 'Medical check expired: A. Sokolov',
    section: 'Users',
    impact: -3,
    kind: 'drop'
  }, {
    date: '29.08.2026',
    event: 'Pest control points inspected on time',
    section: 'Pest control',
    impact: 2,
    kind: 'growth'
  }, {
    date: '28.08.2026',
    event: 'External visit: HVAC service engineer',
    section: 'Contractor access',
    impact: 0,
    kind: 'neutral'
  }],
  batches: [{
    date: '02.09.2026',
    op: 'Batch start',
    type: 'start',
    area: 'R-205',
    qty: '318 000',
    doc: 'BATCH-4412-09',
    status: 'Recorded'
  }, {
    date: '02.09.2026',
    op: 'Transfer to packaging',
    type: 'start',
    area: 'R-207',
    qty: '120 400',
    doc: 'BATCH-4409-03',
    status: 'Recorded'
  }, {
    date: '01.09.2026',
    op: 'Batch release',
    type: 'release',
    area: 'R-101',
    qty: '96 000',
    doc: 'BATCH-4398-11',
    status: 'Review'
  }, {
    date: '31.08.2026',
    op: 'Batch release',
    type: 'release',
    area: 'R-205',
    qty: '210 500',
    doc: 'BATCH-4391-02',
    status: 'Recorded'
  }],
  risks: [{
    tone: 'danger',
    title: 'Swabs R-207',
    unit: 'Laboratory',
    meta: 'Was due 03.09.2026',
    badge: 'Overdue'
  }, {
    tone: 'warning',
    icon: 'refresh-cw',
    title: 'Pressure P-2',
    unit: 'Quality unit',
    meta: 'Due 05.09.2026',
    badge: 'Due soon'
  }, {
    tone: 'danger',
    title: 'Sokolov clearance',
    unit: 'Personnel',
    meta: '9 days overdue',
    badge: 'Overdue'
  }, {
    tone: 'warning',
    icon: 'refresh-cw',
    title: 'Particle counter',
    unit: 'Quality unit',
    meta: 'Due 12.09.2026',
    badge: 'Due soon'
  }, {
    tone: 'info',
    icon: 'gauge',
    title: 'HEPA filter',
    unit: 'Production',
    meta: 'Next check 20.09.2026',
    badge: 'Monitored'
  }],
  flow: [{
    unit: 'Laboratory',
    icon: 'atom',
    cells: [{
      title: 'Swabs R-207',
      sub: 'Surface monitoring',
      tone: 'info'
    }, null, null, null]
  }, {
    unit: 'Quality unit',
    icon: 'shield-check',
    cells: [null, {
      title: 'Pressure P-2',
      sub: 'Parameter check',
      tone: 'info'
    }, null, null]
  }, {
    unit: 'Production',
    icon: 'package',
    cells: [null, null, {
      title: 'Waste report',
      sub: 'Approval',
      tone: 'warning'
    }, null]
  }, {
    unit: 'Personnel',
    icon: 'users',
    cells: [{
      title: 'Renew the medical check',
      sub: '9 days overdue',
      tone: 'danger'
    }, null, null, {
      title: 'CAPA-026',
      sub: 'Actions in progress',
      tone: 'success'
    }]
  }],
  day: [{
    time: '09:00',
    title: 'Take swabs, R-207',
    sub: 'Microbiological control',
    tone: 'success',
    badge: 'Due today',
    badgeTone: 'info'
  }, {
    time: '11:30',
    title: 'Check pressure, P-2',
    sub: 'Utility systems',
    tone: 'info',
    badge: 'In progress',
    badgeTone: 'active'
  }, {
    time: '14:00',
    title: 'Renew the medical check',
    sub: 'Personnel',
    tone: 'danger',
    badge: 'Overdue',
    badgeTone: 'danger'
  }, {
    time: '16:30',
    title: 'Waste disposal report',
    sub: 'Production waste',
    tone: 'warning',
    badge: 'Review',
    badgeTone: 'warning'
  }]
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/admin/data.js", error: String((e && e.message) || e) }); }

__ds_ns.Button = __ds_scope.Button;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.Calendar = __ds_scope.Calendar;

__ds_ns.ShiftCard = __ds_scope.ShiftCard;

__ds_ns.InfoTile = __ds_scope.InfoTile;

__ds_ns.KeyValueList = __ds_scope.KeyValueList;

__ds_ns.MetricCard = __ds_scope.MetricCard;

__ds_ns.Panel = __ds_scope.Panel;

__ds_ns.StatCard = __ds_scope.StatCard;

__ds_ns.AreaChart = __ds_scope.AreaChart;

__ds_ns.BarChart = __ds_scope.BarChart;

__ds_ns.ChartTooltip = __ds_scope.ChartTooltip;

__ds_ns.DonutChart = __ds_scope.DonutChart;

__ds_ns.Heatmap = __ds_scope.Heatmap;

__ds_ns.Legend = __ds_scope.Legend;

__ds_ns.Sparkline = __ds_scope.Sparkline;

__ds_ns.TickGauge = __ds_scope.TickGauge;

__ds_ns.Avatar = __ds_scope.Avatar;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.ProgressBar = __ds_scope.ProgressBar;

__ds_ns.SegmentedProgress = __ds_scope.SegmentedProgress;

__ds_ns.Tag = __ds_scope.Tag;

__ds_ns.Chip = __ds_scope.Chip;

__ds_ns.ChipGroup = __ds_scope.ChipGroup;

__ds_ns.FileDrop = __ds_scope.FileDrop;

__ds_ns.FileItem = __ds_scope.FileItem;

__ds_ns.SearchInput = __ds_scope.SearchInput;

__ds_ns.Segmented = __ds_scope.Segmented;

__ds_ns.TextField = __ds_scope.TextField;

__ds_ns.Icon = __ds_scope.Icon;

__ds_ns.Icon3D = __ds_scope.Icon3D;

__ds_ns.DataTable = __ds_scope.DataTable;

__ds_ns.ListRow = __ds_scope.ListRow;

__ds_ns.RiskItem = __ds_scope.RiskItem;

__ds_ns.ScheduleItem = __ds_scope.ScheduleItem;

__ds_ns.TaskCard = __ds_scope.TaskCard;

__ds_ns.AppShell = __ds_scope.AppShell;

__ds_ns.BrandMark = __ds_scope.BrandMark;

__ds_ns.Brand = __ds_scope.Brand;

__ds_ns.PageHeader = __ds_scope.PageHeader;

__ds_ns.NavItem = __ds_scope.NavItem;

__ds_ns.NavGroup = __ds_scope.NavGroup;

__ds_ns.QuickTile = __ds_scope.QuickTile;

__ds_ns.UserCard = __ds_scope.UserCard;

__ds_ns.Sidebar = __ds_scope.Sidebar;

__ds_ns.Breadcrumbs = __ds_scope.Breadcrumbs;

__ds_ns.OrgSelector = __ds_scope.OrgSelector;

__ds_ns.Topbar = __ds_scope.Topbar;

__ds_ns.Modal = __ds_scope.Modal;

__ds_ns.ModalSection = __ds_scope.ModalSection;

})();
