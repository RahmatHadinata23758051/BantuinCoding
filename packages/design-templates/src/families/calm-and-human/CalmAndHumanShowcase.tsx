'use client'

import React, { useState } from 'react'
import {
  Heart,
  Calendar,
  Clock,
  CheckCircle,
  HelpCircle,
  ShieldCheck,
  ChevronRight,
  ArrowRight,
  Monitor,
  Tablet,
  Smartphone,
  Sparkles,
} from 'lucide-react'

export type CalmArchetypeId = 'care-milestones' | 'learning-pathways' | 'patient-intake'

export function CalmAndHumanShowcase() {
  const [activeArchetype, setActiveArchetype] = useState<CalmArchetypeId>('care-milestones')
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [intakeStep, setIntakeStep] = useState(2)
  const [dietFocus, setDietFocus] = useState('Sleep Recovery & Circadian Rhythm')

  const archetypes: { id: CalmArchetypeId; label: string; desc: string }[] = [
    {
      id: 'care-milestones',
      label: 'Humane Consultation Milestone Desk',
      desc: 'Gentle step landmarks, dedicated practitioner context, and quiet focus',
    },
    {
      id: 'learning-pathways',
      label: 'Guided Care Pathway',
      desc: 'Clear progressive disclosure cards with soothing eucalyptus accents',
    },
    {
      id: 'patient-intake',
      label: 'Forgiving Context Intake',
      desc: 'Transparent guidance with inline reassurance and zero aggressive alerts',
    },
  ]

  const pathways = [
    {
      id: 'path-01',
      title: 'Circadian Stabilization & Light Hygiene',
      duration: '4-Week Rhythm',
      progress: 75,
      mentor: 'Dr. Sarah Lin',
      summary: 'Gentle morning lux exposure and evening amber transition protocols designed for restorative REM cycles.',
    },
    {
      id: 'path-02',
      title: 'Gut Microbiome Diversity Index',
      duration: '6-Week Guidance',
      progress: 40,
      mentor: 'Julian Vane, ND',
      summary: 'Incorporating fermented botanical substrates and polyphenol-dense roots without restrictive caloric counting.',
    },
    {
      id: 'path-03',
      title: 'Somatic Breath & Autonomic Tone',
      duration: '2-Week Practice',
      progress: 100,
      mentor: 'Elena Thorne',
      summary: 'Structured 5.5-second resonance breathing to support vagal tone during high-demand work intervals.',
    },
  ]

  return (
    <div className="bg-[#F5F7F3] text-[#21312C] border border-[#CDDCD1] rounded-[12px] overflow-hidden shadow-xs font-sans">
      {/* Calm & Human Toolbar */}
      <div className="bg-white border-b border-[#CDDCD1] px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="p-1.5 bg-[#E8F0EA] text-[#326F5C] rounded-full">
            <Heart className="size-4" />
          </span>
          <div>
            <h4 className="font-semibold text-sm text-[#21312C]">Calm & Human</h4>
            <p className="text-[11px] text-[#51645C]">Humane Service & Care Design</p>
          </div>
        </div>

        {/* Archetype switcher */}
        <div className="flex items-center gap-1 bg-[#F5F7F3] p-1 rounded-[8px] border border-[#CDDCD1]">
          {archetypes.map((arch) => (
            <button
              key={arch.id}
              type="button"
              onClick={() => setActiveArchetype(arch.id)}
              className={`px-3 py-1.5 text-xs rounded-[6px] font-medium transition-all ${
                activeArchetype === arch.id
                  ? 'bg-white text-[#326F5C] shadow-xs font-semibold'
                  : 'text-[#51645C] hover:text-[#21312C]'
              }`}
            >
              {arch.label}
            </button>
          ))}
        </div>

        {/* Viewport switch */}
        <div className="flex items-center gap-1 bg-[#F5F7F3] p-1 rounded-[8px] border border-[#CDDCD1]">
          <button
            type="button"
            onClick={() => setViewport('desktop')}
            className={`p-1.5 rounded-[6px] ${
              viewport === 'desktop' ? 'bg-white text-[#326F5C] shadow-xs' : 'text-[#51645C]'
            }`}
            title="Desktop 100%"
          >
            <Monitor className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setViewport('tablet')}
            className={`p-1.5 rounded-[6px] ${
              viewport === 'tablet' ? 'bg-white text-[#326F5C] shadow-xs' : 'text-[#51645C]'
            }`}
            title="Tablet 768px"
          >
            <Tablet className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setViewport('mobile')}
            className={`p-1.5 rounded-[6px] ${
              viewport === 'mobile' ? 'bg-white text-[#326F5C] shadow-xs' : 'text-[#51645C]'
            }`}
            title="Mobile 375px"
          >
            <Smartphone className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Main Viewport Frame */}
      <div className="p-4 sm:p-6 lg:p-8 bg-[#EBF0E9] flex justify-center overflow-x-auto min-h-[550px]">
        <div
          className={`bg-white transition-all duration-300 border border-[#CDDCD1] shadow-sm ${
            viewport === 'desktop'
              ? 'w-full max-w-5xl'
              : viewport === 'tablet'
              ? 'w-[768px]'
              : 'w-[375px]'
          } rounded-[12px] overflow-hidden flex flex-col`}
        >
          {/* Calm Masthead */}
          <div className="px-6 py-4 border-b border-[#CDDCD1] bg-[#FAFCF9] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#326F5C] bg-[#E8F0EA] px-2.5 py-1 rounded-full">
                Haven Health Cooperative
              </span>
              <span className="text-xs text-[#51645C]">• Consultation Space</span>
            </div>
            <span className="text-xs text-[#51645C]">Session Secure & Confidential</span>
          </div>

          {/* Archetype Screen 1: Care Milestones */}
          {activeArchetype === 'care-milestones' && (
            <div className="p-6 sm:p-10 space-y-8 max-w-3xl mx-auto">
              {/* Landmark Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-[#51645C]">
                  <span>Step 2 of 4: Personalized Lifestyle Context</span>
                  <span className="font-semibold text-[#326F5C]">50% Completed</span>
                </div>
                <div className="w-full bg-[#E8F0EA] h-2 rounded-full overflow-hidden">
                  <div className="bg-[#326F5C] h-full w-1/2 rounded-full" />
                </div>
              </div>

              {/* Practitioner Card */}
              <div className="p-5 bg-[#FAFCF9] border border-[#CDDCD1] rounded-[10px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="size-12 rounded-full bg-[#E8F0EA] text-[#326F5C] font-semibold flex items-center justify-center text-sm border border-[#CDDCD1]">
                    SL
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[#21312C]">Dr. Sarah Lin, MSc</h3>
                    <p className="text-xs text-[#51645C]">
                      Integrative Clinical Nutritionist • Haven Health Lead
                    </p>
                  </div>
                </div>
                <span className="text-xs text-[#326F5C] bg-[#E8F0EA] px-3 py-1 rounded-full font-medium">
                  Assigned Practitioner
                </span>
              </div>

              {/* Question card */}
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-[#21312C]">
                  What area of daily rhythm feels most in need of gentle restoration?
                </h2>
                <p className="text-xs text-[#51645C] leading-relaxed">
                  There are no wrong answers. Your reflections help Dr. Lin prepare a paced protocol tailored to your actual energy levels, rather than a generic diet plan.
                </p>

                <div className="space-y-2.5 pt-2">
                  {[
                    'Sleep Recovery & Circadian Rhythm',
                    'Digestive Ease & Post-Meal Energy',
                    'Sustained Cognitive Energy Without Crashes',
                    'Gentle Movement Consistency',
                  ].map((option) => (
                    <label
                      key={option}
                      className={`flex items-center gap-3 p-3.5 rounded-[8px] border cursor-pointer transition-colors ${
                        dietFocus === option
                          ? 'border-[#326F5C] bg-[#E8F0EA]/50 font-medium text-[#21312C]'
                          : 'border-[#CDDCD1] bg-white hover:bg-[#FAFCF9] text-[#51645C]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="focus"
                        checked={dietFocus === option}
                        onChange={() => setDietFocus(option)}
                        className="accent-[#326F5C]"
                      />
                      <span className="text-xs">{option}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-[#CDDCD1] flex items-center justify-between">
                <button
                  type="button"
                  className="px-4 py-2 text-xs text-[#51645C] hover:text-[#21312C]"
                >
                  Save & Return Later
                </button>
                <button
                  type="button"
                  onClick={() => setActiveArchetype('learning-pathways')}
                  className="px-6 py-2.5 bg-[#326F5C] hover:bg-[#285849] text-white text-xs font-semibold rounded-[8px] transition-colors shadow-xs"
                >
                  Continue to Pathway
                </button>
              </div>
            </div>
          )}

          {/* Archetype Screen 2: Learning Pathways */}
          {activeArchetype === 'learning-pathways' && (
            <div className="p-6 sm:p-8 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#CDDCD1] pb-4">
                <div>
                  <h3 className="font-bold text-base text-[#21312C]">Active Care Pathways</h3>
                  <p className="text-xs text-[#51645C]">Evidence-grounded protocols paced to your calendar</p>
                </div>
                <span className="text-xs font-medium text-[#326F5C] bg-[#E8F0EA] px-3 py-1 rounded-full">
                  All Milestones In Order
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {pathways.map((item) => (
                  <div
                    key={item.id}
                    className="p-5 border border-[#CDDCD1] rounded-[10px] bg-[#FAFCF9] flex flex-col justify-between space-y-4 shadow-xs"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-[#51645C]">
                        <span>{item.duration}</span>
                        <span className="font-semibold text-[#326F5C]">{item.progress}%</span>
                      </div>
                      <h4 className="font-bold text-sm text-[#21312C] leading-snug">{item.title}</h4>
                      <p className="text-xs text-[#51645C] leading-relaxed">{item.summary}</p>
                    </div>

                    <div className="pt-3 border-t border-[#CDDCD1] flex items-center justify-between text-xs">
                      <span className="text-[#51645C]">{item.mentor}</span>
                      <button
                        type="button"
                        onClick={() => setActiveArchetype('care-milestones')}
                        className="text-[#326F5C] font-semibold hover:underline inline-flex items-center gap-1"
                      >
                        Open <ChevronRight className="size-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Archetype Screen 3: Patient Intake */}
          {activeArchetype === 'patient-intake' && (
            <div className="p-6 sm:p-10 max-w-xl mx-auto space-y-6">
              <div className="border border-[#CDDCD1] bg-[#FAFCF9] p-6 rounded-[12px] space-y-4">
                <div className="border-b border-[#CDDCD1] pb-3">
                  <span className="text-[11px] font-semibold uppercase text-[#326F5C] tracking-wider">
                    Initial Context Form
                  </span>
                  <h3 className="font-bold text-base text-[#21312C] mt-0.5">
                    Welcome to Your Care Space
                  </h3>
                  <p className="text-xs text-[#51645C]">
                    Take your time. Any notes you enter are saved automatically and reviewed solely by your care team.
                  </p>
                </div>

                <div className="space-y-3.5 text-xs">
                  <div>
                    <label className="font-semibold text-[#21312C] block mb-1">
                      Preferred Name & Pronouns
                    </label>
                    <input
                      type="text"
                      defaultValue="Rahmat Hadinata"
                      className="w-full p-2.5 bg-white border border-[#CDDCD1] rounded-[6px] text-xs text-[#21312C] focus:outline-none focus:border-[#326F5C]"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-[#21312C] block mb-1">
                      What would make this consultation feel truly supportive for you?
                    </label>
                    <textarea
                      rows={3}
                      defaultValue="Looking for clear, sustainable routines without strict calorie counting or overwhelming supplement regimens."
                      className="w-full p-2.5 bg-white border border-[#CDDCD1] rounded-[6px] text-xs text-[#21312C] focus:outline-none focus:border-[#326F5C]"
                    />
                  </div>

                  <div className="p-3 bg-[#E8F0EA] rounded-[6px] flex items-center gap-2 text-xs text-[#21312C]">
                    <ShieldCheck className="size-4 text-[#326F5C] shrink-0" />
                    <span>Your context is encrypted and accessible only during your active consultation.</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveArchetype('care-milestones')}
                    className="w-full py-2.5 bg-[#326F5C] hover:bg-[#285849] text-white font-semibold rounded-[8px] transition-colors shadow-xs"
                  >
                    Submit Context to Dr. Lin
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
