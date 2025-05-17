import Image from "next/image"

export function GannonLogo({ className }: { className?: string }) {
  return (
    <div className={className}>
      <Image
        src="/gannon-logo.png" // Imagen local dentro de public/
        alt="Gannon University Logo"
        width={120}
        height={40}
        priority
        className="h-10 w-auto"
      />
    </div>
  )
}
