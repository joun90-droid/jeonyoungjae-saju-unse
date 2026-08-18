import { meta as pricingMeta, render as renderPricing, bind as bindPricing } from './pricing.js'

export const meta = {
  ...pricingMeta,
  path: '/premium',
}

export function render() {
  return renderPricing()
}

export function bind(root) {
  return bindPricing(root)
}
