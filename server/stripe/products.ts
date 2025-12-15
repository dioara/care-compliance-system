/**
 * Stripe Products and Pricing Configuration
 * 
 * License-based pricing: £70/license/month base price
 * Tiered discounts:
 * - 1-5 users: Full price (£70/license)
 * - 6-10 users: 10% discount (£63/license)
 * - 11-20 users: 15% discount (£59.50/license)
 * - 21+ users: 20% discount (£56/license)
 * 
 * Annual billing: Additional 15% discount
 */

export const PRICING_CONFIG = {
  basePricePerLicense: 7000, // £70.00 in pence
  currency: 'gbp',
  
  // Tiered pricing discounts
  tiers: [
    { minLicenses: 1, maxLicenses: 5, discount: 0, label: '1-5 licenses' },
    { minLicenses: 6, maxLicenses: 10, discount: 0.10, label: '6-10 licenses (10% off)' },
    { minLicenses: 11, maxLicenses: 20, discount: 0.15, label: '11-20 licenses (15% off)' },
    { minLicenses: 21, maxLicenses: Infinity, discount: 0.20, label: '21+ licenses (20% off)' },
  ],
  
  // Annual billing discount (on top of tier discount)
  annualDiscount: 0.15, // 15% additional discount for annual billing
  
  // Billing intervals
  intervals: {
    monthly: { label: 'Monthly', months: 1 },
    annual: { label: 'Annual', months: 12 },
  },
};

/**
 * Calculate price per license based on quantity and billing interval
 */
export function calculatePricePerLicense(
  quantity: number,
  billingInterval: 'monthly' | 'annual'
): number {
  const { basePricePerLicense, tiers, annualDiscount } = PRICING_CONFIG;
  
  // Find applicable tier
  const tier = tiers.find(t => quantity >= t.minLicenses && quantity <= t.maxLicenses);
  const tierDiscount = tier?.discount || 0;
  
  // Calculate price with tier discount
  let pricePerLicense = basePricePerLicense * (1 - tierDiscount);
  
  // Apply annual discount if applicable
  if (billingInterval === 'annual') {
    pricePerLicense = pricePerLicense * (1 - annualDiscount);
  }
  
  return Math.round(pricePerLicense);
}

/**
 * Calculate total price for a subscription
 */
export function calculateTotalPrice(
  quantity: number,
  billingInterval: 'monthly' | 'annual'
): { pricePerLicense: number; totalMonthly: number; totalBilling: number; savings: number } {
  const pricePerLicense = calculatePricePerLicense(quantity, billingInterval);
  const totalMonthly = pricePerLicense * quantity;
  
  const months = billingInterval === 'annual' ? 12 : 1;
  const totalBilling = totalMonthly * months;
  
  // Calculate savings compared to full price monthly
  const fullPriceMonthly = PRICING_CONFIG.basePricePerLicense * quantity;
  const fullPriceBilling = fullPriceMonthly * months;
  const savings = fullPriceBilling - totalBilling;
  
  return {
    pricePerLicense,
    totalMonthly,
    totalBilling,
    savings,
  };
}

/**
 * Get pricing tier label for display
 */
export function getPricingTierLabel(quantity: number): string {
  const tier = PRICING_CONFIG.tiers.find(
    t => quantity >= t.minLicenses && quantity <= t.maxLicenses
  );
  return tier?.label || 'Custom pricing';
}

/**
 * Format price for display (pence to pounds)
 */
export function formatPrice(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`;
}
