import type { FormEvent } from 'react'
import { Modal, Input, Select, Button } from '@/app/components/ui'

export interface ProjectSettingsModalProps {
  open: boolean
  isSavingSettings: boolean
  projectName: string
  onProjectNameChange: (value: string) => void
  projectLang: string
  onProjectLangChange: (value: string) => void
  onClose: () => void
  onSubmit: (event: FormEvent) => void
  t: (key: string) => string
  tCommon: (key: string) => string
}

export function ProjectSettingsModal({
  open,
  isSavingSettings,
  projectName,
  onProjectNameChange,
  projectLang,
  onProjectLangChange,
  onClose,
  onSubmit,
  t,
  tCommon,
}: ProjectSettingsModalProps) {
  return (
    <Modal
      open={open}
      onClose={() => !isSavingSettings && onClose()}
      title={t('settings')}
      closeLabel={t('closeDialog')}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="projectName" className="text-sm font-semibold text-[var(--workspace-ink)]">
            {t('projectName')}
          </label>
          <Input
            id="projectName"
            value={projectName}
            onChange={(e) => onProjectNameChange(e.target.value)}
            required
            minLength={2}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="projectLang" className="text-sm font-semibold text-[var(--workspace-ink)]">
            {t('language')}
          </label>
          <Select id="projectLang" value={projectLang} onChange={(e) => onProjectLangChange(e.target.value)}>
            <option value="id">{t('settingsLanguageId')}</option>
            <option value="en">{t('settingsLanguageEn')}</option>
          </Select>
        </div>
        <div className="flex justify-end pt-4">
          <Button type="submit" variant="primary" disabled={isSavingSettings}>
            {isSavingSettings ? tCommon('loading') : t('saveChanges')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
