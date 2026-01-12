import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { ProductCard } from './components/ProductCard'
import { Cart } from './components/Cart'
import { Footer } from './components/Footer'
import { useCart } from './hooks/useCart'
import { products } from './lib/products'

function App() {
  const {
    items,
    isOpen,
    setIsOpen,
    addItem,
    removeItem,
    updateQuantity,
    total,
    itemCount,
  } = useCart()

  return (
    <div className="min-h-dvh flex flex-col">
      <Header cartItemCount={itemCount} onCartClick={() => setIsOpen(true)} />

      <main className="flex-1">
        <Hero />

        {/* Products Section */}
        <section className="px-4 sm:px-6 lg:px-8 pb-16 sm:pb-24">
          <div className="max-w-7xl mx-auto">
            {/* Section Header */}
            <div className="text-center mb-10 sm:mb-14">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">
                Our Products
              </h2>
              <p className="mt-2 text-white/60">
                Only the essentials. Nothing more.
              </p>
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 max-w-5xl mx-auto">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={addItem}
                />
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />

      <Cart
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        items={items}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeItem}
        total={total}
      />
    </div>
  )
}

export default App
