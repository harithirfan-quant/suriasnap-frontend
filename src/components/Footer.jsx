export default function Footer() {
  return (
    <footer className="border-t border-gray-100 mt-auto">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-2">
        <span className="text-sm text-gray-400">
          © {new Date().getFullYear()} SuriaSnap · Solar assessment for Malaysian homes
        </span>
        <span className="text-xs text-gray-300">
          Data: Global Solar Atlas · SEDA Malaysia · TNB
        </span>
      </div>
    </footer>
  )
}
