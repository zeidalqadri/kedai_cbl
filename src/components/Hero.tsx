export function Hero() {
  return (
    <section className="relative pt-24 sm:pt-28 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-cbl-orange/10 via-transparent to-transparent pointer-events-none" />

      {/* Decorative Elements */}
      <div className="absolute top-20 left-1/4 size-96 bg-cbl-orange/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-40 right-1/4 size-64 bg-orange-600/10 rounded-full blur-[80px] pointer-events-none" />

      <div className="relative max-w-4xl mx-auto text-center">
        <span className="inline-block px-4 py-2 bg-cbl-orange/20 text-cbl-orange text-sm font-semibold rounded-full mb-6">
          Official CBL Merchandise
        </span>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white text-balance leading-tight">
          Gear Up for
          <span className="text-cbl-orange"> Greatness</span>
        </h1>
        <p className="mt-4 sm:mt-6 text-lg sm:text-xl text-white/70 max-w-2xl mx-auto text-pretty">
          Premium basketball equipment and apparel from Community Basketball League.
          Built for performance, designed for champions.
        </p>
      </div>
    </section>
  )
}
