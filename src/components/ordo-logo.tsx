import Image from "next/image"

export function OrdoLogo({ size = 40, className = "" }: { size?: number; className?: string }) {
  return (
    <Image
      src="/logo.png"
      alt="Ordo logo"
      width={size}
      height={size}
      className={className}
      style={{ filter: "grayscale(1) brightness(1.2)" }}
      priority
    />
  )
}
