export function Footer() {
  return (
    <footer className="mt-auto border-t border-white/10 bg-cbl-gray/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Logo & Copyright */}
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-cbl-orange flex items-center justify-center">
              <span className="text-sm font-bold text-white">CBL</span>
            </div>
            <div>
              <p className="font-semibold text-white">Kedai CBL</p>
              <p className="text-xs text-white/50">
                &copy; {new Date().getFullYear()} Community Basketball League
              </p>
            </div>
          </div>

          {/* Links */}
          <nav className="flex items-center gap-6 text-sm" aria-label="Footer navigation">
            <a
              href="#"
              className="text-white/60 hover:text-white transition-colors focus:outline-none focus:underline"
            >
              Terms
            </a>
            <a
              href="#"
              className="text-white/60 hover:text-white transition-colors focus:outline-none focus:underline"
            >
              Privacy
            </a>
            <a
              href="#"
              className="text-white/60 hover:text-white transition-colors focus:outline-none focus:underline"
            >
              Contact
            </a>
          </nav>
        </div>
      </div>
    </footer>
  )
}
