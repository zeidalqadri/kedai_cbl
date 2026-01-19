import { useShop } from '../../hooks/useShop'
import { layout, cx } from '../../lib/ui-primitives'
import {
  CatalogScreen,
  ProductScreen,
  CartScreen,
  CustomerScreen,
  PaymentScreen,
  ConfirmScreen,
  ProcessingScreen,
  LookupScreen,
} from './screens'

interface ShopModeProps {
  onAdminClick: () => void
}

export function ShopMode({ onAdminClick }: ShopModeProps) {
  const shop = useShop()

  const renderScreen = () => {
    switch (shop.screen) {
      case 'catalog':
        return <CatalogScreen shop={shop} onAdminClick={onAdminClick} />
      case 'product':
        return <ProductScreen shop={shop} />
      case 'cart':
        return <CartScreen shop={shop} />
      case 'customer':
        return <CustomerScreen shop={shop} />
      case 'payment':
        return <PaymentScreen shop={shop} />
      case 'confirm':
        return <ConfirmScreen shop={shop} />
      case 'processing':
        return <ProcessingScreen shop={shop} />
      case 'lookup':
        return <LookupScreen shop={shop} />
      default:
        return <CatalogScreen shop={shop} onAdminClick={onAdminClick} />
    }
  }

  return (
    <div className={cx(layout.page, layout.backdrop)}>
      <div className={layout.shopShell}>
        {renderScreen()}
      </div>
    </div>
  )
}
