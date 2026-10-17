'use client'

import React, { useState } from 'react'
import {
  Activity,
  Terminal,
  Cpu,
  Server,
  Zap,
  ShieldAlert,
  RotateCw,
  Monitor,
  Tablet,
  Smartphone,
  ChevronRight,
  Filter,
} from 'lucide-react'

export type TechnicalArchetypeId = 'telemetry-desk' | 'cluster-grid' | 'packet-inspector'

export function PrecisionTechnicalShowcase() {
  const [activeArchetype, setActiveArchetype] = useState<TechnicalArchetypeId>('telemetry-desk')
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [activeNode, setActiveNode] = useState<string>('node-ap-se-1')
  const [packetFilter, setPacketFilter] = useState<'ALL' | 'ERRORS' | 'TRACE'>('ALL')

  const archetypes: { id: TechnicalArchetypeId; label: string; desc: string }[] = [
    {
      id: 'telemetry-desk',
      label: 'Telemetry & Instrument Desk',
      desc: 'High-density telemetry panel with micro-readouts, units, and signal thresholds',
    },
    {
      id: 'cluster-grid',
      label: 'Distributed Node Topology',
      desc: 'Cluster health matrix with thread saturation and deterministic status tokens',
    },
    {
      id: 'packet-inspector',
      label: 'Frame & Protocol Inspector',
      desc: 'Packet stream with timestamp offsets, protocol flags, and payload hex inspection',
    },
  ]

  const nodes = [
    { id: 'node-eu-west-1', region: 'eu-west-1a', load: '41.2%', latency: '18.4 ms', status: 'HEALTHY', memory: '12.8 / 32 GB' },
    { id: 'node-ap-se-1', region: 'ap-southeast-1b', load: '78.9%', latency: '44.1 ms', status: 'DEGRADED', memory: '28.1 / 32 GB' },
    { id: 'node-us-east-2', region: 'us-east-2c', load: '22.0%', latency: '12.0 ms', status: 'HEALTHY', memory: '8.4 / 32 GB' },
    { id: 'node-sa-east-1', region: 'sa-east-1a', load: '94.6%', latency: '112.5 ms', status: 'CRITICAL', memory: '31.2 / 32 GB' },
  ]

  const packets = [
    { seq: '004182', ts: '+00:00:01.042', proto: 'TLS_1.3', src: '10.244.1.84:443', dst: '172.16.0.4:9092', bytes: '1,420 B', flag: 'ACK', status: 'OK' },
    { seq: '004183', ts: '+00:00:01.048', proto: 'GRPC_H2', src: '10.244.2.19:50051', dst: '172.16.0.4:9092', bytes: '840 B', flag: 'FRAME_STREAM', status: 'OK' },
    { seq: '004184', ts: '+00:00:01.091', proto: 'TCP_SYN', src: '192.168.4.12:8080', dst: '172.16.0.4:9092', bytes: '64 B', flag: 'SYN_RETRY', status: 'WARN' },
    { seq: '004185', ts: '+00:00:01.120', proto: 'QUIC_V1', src: '10.244.1.84:443', dst: '172.16.0.4:9092', bytes: '1,280 B', flag: 'RST_STREAM', status: 'ERR' },
  ]

  return (
    <div className="bg-[#0E1216] text-[#E4ECEE] border border-[#35424A] rounded-[8px] overflow-hidden shadow-xs font-sans">
      {/* Precision Technical Control Band */}
      <div className="bg-[#161C21] border-b border-[#35424A] px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Terminal className="size-4 text-[#58B3C2]" />
          <span className="font-mono text-xs font-bold text-[#58B3C2]">
            PRECISION TECHNICAL
          </span>
          <span className="text-[#35424A]">/</span>
          <span className="text-[11px] font-mono text-[#A2B0B5] uppercase">
            Instrument Telemetry v0.1.0
          </span>
        </div>

        {/* Archetype switcher */}
        <div className="flex items-center gap-1 bg-[#222B31] p-1 rounded-[4px] border border-[#35424A]">
          {archetypes.map((arch) => (
            <button
              key={arch.id}
              type="button"
              onClick={() => setActiveArchetype(arch.id)}
              className={`px-3 py-1.5 text-xs font-mono rounded-[2px] transition-all ${
                activeArchetype === arch.id
                  ? 'bg-[#58B3C2] text-[#0E1216] font-bold'
                  : 'text-[#A2B0B5] hover:text-[#E4ECEE]'
              }`}
            >
              {arch.label}
            </button>
          ))}
        </div>

        {/* Viewport switcher */}
        <div className="flex items-center gap-1 bg-[#222B31] p-1 rounded-[4px] border border-[#35424A]">
          <button
            type="button"
            onClick={() => setViewport('desktop')}
            className={`p-1.5 rounded-[2px] ${
              viewport === 'desktop'
                ? 'bg-[#58B3C2] text-[#0E1216]'
                : 'text-[#A2B0B5] hover:text-[#E4ECEE]'
            }`}
            title="Desktop 100%"
          >
            <Monitor className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setViewport('tablet')}
            className={`p-1.5 rounded-[2px] ${
              viewport === 'tablet'
                ? 'bg-[#58B3C2] text-[#0E1216]'
                : 'text-[#A2B0B5] hover:text-[#E4ECEE]'
            }`}
            title="Tablet 768px"
          >
            <Tablet className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setViewport('mobile')}
            className={`p-1.5 rounded-[2px] ${
              viewport === 'mobile'
                ? 'bg-[#58B3C2] text-[#0E1216]'
                : 'text-[#A2B0B5] hover:text-[#E4ECEE]'
            }`}
            title="Mobile 375px"
          >
            <Smartphone className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Viewport Frame */}
      <div className="p-4 sm:p-6 lg:p-8 bg-[#080A0D] flex justify-center overflow-x-auto min-h-[550px]">
        <div
          className={`bg-[#0E1216] transition-all duration-300 border border-[#35424A] ${
            viewport === 'desktop'
              ? 'w-full max-w-5xl'
              : viewport === 'tablet'
              ? 'w-[768px]'
              : 'w-[375px]'
          } rounded-[4px] overflow-hidden flex flex-col`}
        >
          {/* Header Bar */}
          <div className="bg-[#161C21] border-b border-[#35424A] px-4 py-2.5 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-[#74BEA0]">
                <span className="size-2 rounded-full bg-[#74BEA0] animate-pulse" />
                SYSTEM_NOMINAL
              </span>
              <span className="text-[#35424A]">|</span>
              <span className="text-[#A2B0B5]">EPOCH: 1776419200.412</span>
            </div>
            <div className="flex items-center gap-2 text-[#A2B0B5]">
              <span>SAMPLE_RATE: 200 Hz</span>
              <RotateCw className="size-3 text-[#58B3C2] cursor-pointer" />
            </div>
          </div>

          {/* Archetype Screen 1: Telemetry Desk */}
          {activeArchetype === 'telemetry-desk' && (
            <div className="p-5 space-y-6">
              {/* Stat Readouts */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono">
                <div className="bg-[#161C21] p-3.5 rounded-[2px] border border-[#35424A] space-y-1">
                  <span className="text-[10px] uppercase text-[#A2B0B5] block">
                    Throughput (Ingress)
                  </span>
                  <div className="flex items-baseline gap-1">
                    <strong className="text-xl sm:text-2xl text-[#E4ECEE] font-bold tabular-nums">
                      4,892.4
                    </strong>
                    <span className="text-xs text-[#58B3C2]">req/s</span>
                  </div>
                  <span className="text-[10px] text-[#74BEA0] block">Δ +4.2% vs baseline</span>
                </div>

                <div className="bg-[#161C21] p-3.5 rounded-[2px] border border-[#35424A] space-y-1">
                  <span className="text-[10px] uppercase text-[#A2B0B5] block">
                    p99 Latency (RTT)
                  </span>
                  <div className="flex items-baseline gap-1">
                    <strong className="text-xl sm:text-2xl text-[#E4ECEE] font-bold tabular-nums">
                      18.24
                    </strong>
                    <span className="text-xs text-[#58B3C2]">ms</span>
                  </div>
                  <span className="text-[10px] text-[#74BEA0] block">Jitter σ: 0.81 ms</span>
                </div>

                <div className="bg-[#161C21] p-3.5 rounded-[2px] border border-[#35424A] space-y-1">
                  <span className="text-[10px] uppercase text-[#A2B0B5] block">
                    Cluster Saturation
                  </span>
                  <div className="flex items-baseline gap-1">
                    <strong className="text-xl sm:text-2xl text-[#E4AF63] font-bold tabular-nums">
                      64.8
                    </strong>
                    <span className="text-xs text-[#A2B0B5]">%</span>
                  </div>
                  <div className="w-full bg-[#222B31] h-1.5 rounded-[1px] mt-1 overflow-hidden">
                    <div className="bg-[#E4AF63] h-full w-[64.8%]" />
                  </div>
                </div>

                <div className="bg-[#161C21] p-3.5 rounded-[2px] border border-[#35424A] space-y-1">
                  <span className="text-[10px] uppercase text-[#A2B0B5] block">
                    Error Budget (30d)
                  </span>
                  <div className="flex items-baseline gap-1">
                    <strong className="text-xl sm:text-2xl text-[#74BEA0] font-bold tabular-nums">
                      99.982
                    </strong>
                    <span className="text-xs text-[#A2B0B5]">%</span>
                  </div>
                  <span className="text-[10px] text-[#A2B0B5] block">Consumed: 18 ppm</span>
                </div>
              </div>

              {/* Real-time Oscilloscope / Trace Monitor */}
              <div className="bg-[#161C21] border border-[#35424A] rounded-[2px] p-4 space-y-3 font-mono">
                <div className="flex items-center justify-between border-b border-[#35424A] pb-2 text-xs">
                  <div className="flex items-center gap-2">
                    <Activity className="size-3.5 text-[#58B3C2]" />
                    <span className="font-bold text-[#E4ECEE]">
                      BUFFER_DEPTH_WAVEFORM // CH01 (INGRESS FIFO)
                    </span>
                  </div>
                  <span className="text-[10px] text-[#A2B0B5]">SCALE: 50ms/DIV • GAIN 1.0</span>
                </div>

                {/* Simulated Waveform SVG */}
                <div className="h-28 w-full bg-[#0E1216] border border-[#35424A] rounded-[2px] relative overflow-hidden flex items-center">
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#35424A15_1px,transparent_1px),linear-gradient(to_bottom,#35424A15_1px,transparent_1px)] bg-[size:16px_16px]" />
                  <svg className="w-full h-full relative z-10" preserveAspectRatio="none" viewBox="0 0 400 100">
                    <polyline
                      fill="none"
                      stroke="#58B3C2"
                      strokeWidth="1.5"
                      points="0,50 30,52 60,45 80,48 100,20 110,85 120,48 150,50 180,46 210,54 240,15 250,75 260,50 300,52 340,48 380,51 400,50"
                    />
                  </svg>
                  <div className="absolute bottom-2 left-2 text-[10px] text-[#58B3C2] bg-[#0E1216]/80 px-1 border border-[#35424A]">
                    PEAK: +3.8σ (FRAME_BURST)
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Archetype Screen 2: Cluster Grid */}
          {activeArchetype === 'cluster-grid' && (
            <div className="p-5 space-y-4 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-[#35424A] pb-3">
                <span className="text-xs font-bold text-[#E4ECEE]">
                  TOPOLOGY MATRIX (4 NODES ACTIVE)
                </span>
                <span className="text-[11px] text-[#A2B0B5]">PROTOCOL: RAFT_CONSENSUS_V2</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {nodes.map((node) => {
                  const isSelected = activeNode === node.id
                  return (
                    <div
                      key={node.id}
                      onClick={() => setActiveNode(node.id)}
                      className={`p-4 rounded-[2px] border cursor-pointer transition-colors ${
                        isSelected
                          ? 'border-[#58B3C2] bg-[#161C21]'
                          : 'border-[#35424A] bg-[#12171C] hover:border-[#A2B0B5]'
                      }`}
                    >
                      <div className="flex items-center justify-between border-b border-[#35424A] pb-2">
                        <span className="font-bold text-[#E4ECEE]">{node.id}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-[1px] font-bold ${
                            node.status === 'HEALTHY'
                              ? 'bg-[#74BEA0]/20 text-[#74BEA0]'
                              : node.status === 'DEGRADED'
                              ? 'bg-[#E4AF63]/20 text-[#E4AF63]'
                              : 'bg-[#E47F7F]/20 text-[#E47F7F]'
                          }`}
                        >
                          {node.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-3 text-[11px]">
                        <div>
                          <span className="text-[#A2B0B5] block">Region:</span>
                          <span className="text-[#E4ECEE]">{node.region}</span>
                        </div>
                        <div>
                          <span className="text-[#A2B0B5] block">Load Avg:</span>
                          <span className="text-[#E4ECEE] font-bold">{node.load}</span>
                        </div>
                        <div>
                          <span className="text-[#A2B0B5] block">RTT Latency:</span>
                          <span className="text-[#58B3C2]">{node.latency}</span>
                        </div>
                        <div>
                          <span className="text-[#A2B0B5] block">Heap Saturation:</span>
                          <span className="text-[#E4ECEE]">{node.memory}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Archetype Screen 3: Packet Inspector */}
          {activeArchetype === 'packet-inspector' && (
            <div className="p-5 space-y-4 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-[#35424A] pb-2">
                <span className="font-bold text-[#E4ECEE]">
                  FRAME_TRACE // INTERFACE eth0 (RX RING BUFFER)
                </span>
                <div className="flex items-center gap-1">
                  {(['ALL', 'ERRORS', 'TRACE'] as const).map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setPacketFilter(filter)}
                      className={`px-2 py-0.5 text-[10px] rounded-[2px] border ${
                        packetFilter === filter
                          ? 'border-[#58B3C2] bg-[#58B3C2] text-[#0E1216] font-bold'
                          : 'border-[#35424A] text-[#A2B0B5]'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto border border-[#35424A] rounded-[2px]">
                <table className="w-full text-left text-[11px] border-collapse">
                  <thead className="bg-[#161C21] border-b border-[#35424A] text-[#A2B0B5]">
                    <tr>
                      <th className="p-2 border-r border-[#35424A]">SEQ</th>
                      <th className="p-2 border-r border-[#35424A]">OFFSET_TS</th>
                      <th className="p-2 border-r border-[#35424A]">PROTO</th>
                      <th className="p-2 border-r border-[#35424A]">SOURCE / DEST</th>
                      <th className="p-2 border-r border-[#35424A]">PAYLOAD</th>
                      <th className="p-2">FLAG</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#35424A] bg-[#0E1216]">
                    {packets.map((pkt) => (
                      <tr key={pkt.seq} className="hover:bg-[#161C21] transition-colors">
                        <td className="p-2 font-bold text-[#58B3C2] border-r border-[#35424A]">
                          #{pkt.seq}
                        </td>
                        <td className="p-2 text-[#A2B0B5] border-r border-[#35424A] tabular-nums">
                          {pkt.ts}
                        </td>
                        <td className="p-2 text-[#E4ECEE] border-r border-[#35424A]">
                          {pkt.proto}
                        </td>
                        <td className="p-2 text-[#A2B0B5] border-r border-[#35424A]">
                          {pkt.src} → {pkt.dst}
                        </td>
                        <td className="p-2 text-[#E4ECEE] border-r border-[#35424A] tabular-nums">
                          {pkt.bytes}
                        </td>
                        <td className="p-2">
                          <span
                            className={`px-1 py-0.5 rounded-[1px] text-[10px] font-bold ${
                              pkt.status === 'OK'
                                ? 'text-[#74BEA0]'
                                : pkt.status === 'WARN'
                                ? 'text-[#E4AF63]'
                                : 'text-[#E47F7F]'
                            }`}
                          >
                            {pkt.flag}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
