import Image from "next/image"

export default function VaultButton({ className = "" }: { className?: string }) {
  return (
    <div className={`w-full flex justify-end px-4 md:bottom-4 md:right-4 bg-gray-100 border-none ${className}`}>
      <button
        className="flex items-center space-x-1 rounded-md px-2 pt-1 cursor-pointer"
        onClick={() => window.open('https://discord.gg/account-vaultx', '_blank')}
      >
        <Image
          src="/vault.png"
          alt="Account Vault"
          width={30}
          height={30}
        />
        <span className="text-gray-600 text-l font-bold">Powered by Account Vault</span>
      </button>
    </div>
  )
}
