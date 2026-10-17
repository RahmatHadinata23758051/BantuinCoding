import React from 'react'
import { TemplateFamilySelector } from '@/app/components/TemplateFamilySelector'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function DesignLabPage() {
  return (
    <div className="min-h-screen bg-[#F4F6F8] p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Navigation & Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#D5DFE7]">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#546575] hover:text-[#17222D]"
        >
          <ArrowLeft className="size-3.5" />
          Back to Dashboard
        </Link>
        <span className="text-xs font-mono text-[#8898AA]">
          BantuinCoding Template Foundry Lab
        </span>
      </div>

      <TemplateFamilySelector />
    </div>
  )
}
