export interface InventoryItem {
  id: string
  sku: string
  name: string
  category: 'Raw Materials' | 'Fasteners' | 'Electronics' | 'Fluid Control'
  location: string
  inStock: number
  reserved: number
  reorderPoint: number
  unit: string
  unitCost: number
  status: 'in-stock' | 'low-stock' | 'depleted' | 'quarantined'
  lastAudited: string
  leadTimeDays: number
  supplier: string
}

export interface InboundWorkflow {
  id: string
  shipmentCode: string
  supplier: string
  carrier: string
  expectedArrival: string
  itemCount: number
  priority: 'urgent' | 'high' | 'normal'
  status: 'dock-assigned' | 'inspection' | 'awaiting-intake' | 'cleared'
  dockBay: string
  inspector: string
}

export interface AuditLogEntry {
  id: string
  timestamp: string
  operator: string
  sku: string
  action: 'RECEIVE' | 'ADJUST' | 'RESERVE' | 'AUDIT'
  delta: number
  balanceAfter: number
  reason: string
}

export const NORTHLINE_INVENTORY: InventoryItem[] = [
  {
    id: 'inv-101',
    sku: 'NL-FAST-8821',
    name: 'M8 Stainless Flange Hex Bolt (Pack of 100)',
    category: 'Fasteners',
    location: 'Bay A-04 / Shelf 2',
    inStock: 1420,
    reserved: 350,
    reorderPoint: 400,
    unit: 'pack',
    unitCost: 18.5,
    status: 'in-stock',
    lastAudited: '2026-10-14 09:30',
    leadTimeDays: 4,
    supplier: 'Apex Fastener Works'
  },
  {
    id: 'inv-102',
    sku: 'NL-ELEC-4109',
    name: 'Precision Hall Effect Current Sensor ±50A',
    category: 'Electronics',
    location: 'Sec C-12 / Bin 04',
    inStock: 48,
    reserved: 42,
    reorderPoint: 60,
    unit: 'ea',
    unitCost: 42.0,
    status: 'low-stock',
    lastAudited: '2026-10-15 14:15',
    leadTimeDays: 14,
    supplier: 'Semicon Matrix Corp'
  },
  {
    id: 'inv-103',
    sku: 'NL-FLUD-9204',
    name: 'High-Pressure Viton O-Ring Seal Kit (32pc)',
    category: 'Fluid Control',
    location: 'Bay B-01 / Shelf 4',
    inStock: 0,
    reserved: 0,
    reorderPoint: 25,
    unit: 'kit',
    unitCost: 64.25,
    status: 'depleted',
    lastAudited: '2026-10-16 11:00',
    leadTimeDays: 7,
    supplier: 'HydraTech Dynamics'
  },
  {
    id: 'inv-104',
    sku: 'NL-RAWM-1250',
    name: '6061-T6 Extruded Aluminum Rail 40x40 (2m)',
    category: 'Raw Materials',
    location: 'Rack R-08 / Floor',
    inStock: 310,
    reserved: 95,
    reorderPoint: 100,
    unit: 'bar',
    unitCost: 38.0,
    status: 'in-stock',
    lastAudited: '2026-10-12 16:45',
    leadTimeDays: 5,
    supplier: 'Vulcan Extrusions Ltd'
  },
  {
    id: 'inv-105',
    sku: 'NL-ELEC-5502',
    name: 'Industrial Microstepping Driver 4.2A 24-48V',
    category: 'Electronics',
    location: 'Sec C-11 / Bin 09',
    inStock: 18,
    reserved: 18,
    reorderPoint: 30,
    unit: 'ea',
    unitCost: 89.0,
    status: 'low-stock',
    lastAudited: '2026-10-15 17:00',
    leadTimeDays: 10,
    supplier: 'Kinetic Motion Systems'
  },
  {
    id: 'inv-106',
    sku: 'NL-FLUD-1190',
    name: 'Bi-Directional Brass Ball Valve 1/2" NPT',
    category: 'Fluid Control',
    location: 'Bay B-03 / Shelf 1',
    inStock: 85,
    reserved: 10,
    reorderPoint: 40,
    unit: 'ea',
    unitCost: 26.5,
    status: 'in-stock',
    lastAudited: '2026-10-10 10:20',
    leadTimeDays: 6,
    supplier: 'HydraTech Dynamics'
  },
  {
    id: 'inv-107',
    sku: 'NL-RAWM-7080',
    name: 'Polycarbonate Clear Sheet 1/4" (48x96 in)',
    category: 'Raw Materials',
    location: 'Hold H-02 / Inspection',
    inStock: 14,
    reserved: 0,
    reorderPoint: 15,
    unit: 'sheet',
    unitCost: 115.0,
    status: 'quarantined',
    lastAudited: '2026-10-16 08:30',
    leadTimeDays: 8,
    supplier: 'PlastiForm Polymers'
  }
]

export const NORTHLINE_WORKFLOWS: InboundWorkflow[] = [
  {
    id: 'wf-801',
    shipmentCode: 'SHP-2026-8801',
    supplier: 'Semicon Matrix Corp',
    carrier: 'FastFreight Priority',
    expectedArrival: 'Today, 14:00',
    itemCount: 120,
    priority: 'urgent',
    status: 'inspection',
    dockBay: 'Bay 03',
    inspector: 'H. Davis'
  },
  {
    id: 'wf-802',
    shipmentCode: 'SHP-2026-8802',
    supplier: 'Vulcan Extrusions Ltd',
    carrier: 'Midwest Haulers',
    expectedArrival: 'Today, 16:30',
    itemCount: 450,
    priority: 'high',
    status: 'dock-assigned',
    dockBay: 'Bay 01',
    inspector: 'M. Chen'
  },
  {
    id: 'wf-803',
    shipmentCode: 'SHP-2026-8803',
    supplier: 'Apex Fastener Works',
    carrier: 'GroundRoute Express',
    expectedArrival: 'Tomorrow, 09:00',
    itemCount: 2200,
    priority: 'normal',
    status: 'awaiting-intake',
    dockBay: 'Unassigned',
    inspector: 'Pending'
  },
  {
    id: 'wf-804',
    shipmentCode: 'SHP-2026-8799',
    supplier: 'HydraTech Dynamics',
    carrier: 'Vanguard Logistics',
    expectedArrival: 'Yesterday, 17:00',
    itemCount: 85,
    priority: 'normal',
    status: 'cleared',
    dockBay: 'Bay 02',
    inspector: 'K. Patel'
  }
]

export const NORTHLINE_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'aud-401',
    timestamp: '2026-10-16 11:00',
    operator: 'R. Hadinata',
    sku: 'NL-FLUD-9204',
    action: 'AUDIT',
    delta: -2,
    balanceAfter: 0,
    reason: 'Zero balance confirmed during quarterly cycle count'
  },
  {
    id: 'aud-402',
    timestamp: '2026-10-16 08:30',
    operator: 'H. Davis',
    sku: 'NL-RAWM-7080',
    action: 'ADJUST',
    delta: 14,
    balanceAfter: 14,
    reason: 'Quarantine hold initiated pending surface scratch inspection'
  },
  {
    id: 'aud-403',
    timestamp: '2026-10-15 14:15',
    operator: 'M. Chen',
    sku: 'NL-ELEC-4109',
    action: 'RESERVE',
    delta: -24,
    balanceAfter: 6,
    reason: 'Allocated to Work Order #WO-9921 assembly'
  },
  {
    id: 'aud-404',
    timestamp: '2026-10-14 09:30',
    operator: 'R. Hadinata',
    sku: 'NL-FAST-8821',
    action: 'RECEIVE',
    delta: 500,
    balanceAfter: 1420,
    reason: 'Standard stock replenishment PO #PO-5510'
  }
]
