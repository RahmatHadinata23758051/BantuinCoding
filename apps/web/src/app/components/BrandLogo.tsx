import Image from 'next/image'

export function BrandLogo({
  imageSize = 32,
  className = '',
  imageClassName = '',
  textClassName = 'font-semibold tracking-[-0.06em]',
  showWordmark = true,
}: {
  imageSize?: number
  className?: string
  imageClassName?: string
  textClassName?: string
  showWordmark?: boolean
}) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <Image
        src="/logo.png"
        alt={showWordmark ? '' : 'Bantuin'}
        width={imageSize}
        height={imageSize}
        className={`shrink-0 rounded-[22%] object-contain ${imageClassName}`}
      />
      {showWordmark && (
        <span className={textClassName}>
          bantuin<span className="font-serif font-normal text-[#a66142]">.</span>
        </span>
      )}
    </span>
  )
}
