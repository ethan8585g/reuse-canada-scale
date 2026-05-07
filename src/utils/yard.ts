// Reuse Canada yard location. The customerDashboard map, employee dashboard
// mini-map, route planner, and junk-removal route calculator all need this;
// without a single source of truth one of them ends up pointing at downtown
// Edmonton (~10 km off) when somebody updates the address but forgets a site.

export const YARD_ADDRESS = '13140 24 St NE, Edmonton, Alberta, Canada'
export const YARD_LAT = 53.6125
export const YARD_LNG = -113.4106
