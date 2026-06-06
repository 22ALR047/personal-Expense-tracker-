/* eslint-disable react-refresh/only-export-components */
import { FoodIcon, RentIcon, SalaryIcon, TransportIcon, UtilitiesIcon, ShoppingIcon, HealthIcon, OtherIcon, GymIcon, CoffeeIcon } from './categoryIcons'

// Category Configuration Mapping (Gold & Pink style)
export const CATEGORY_META = {
  Shop: { icon: ShoppingIcon, bg: 'bg-pink-50 text-pink-500 dark:bg-pink-950/40 dark:text-pink-400', color: '#ff7ee2' },
  Electronic: { icon: UtilitiesIcon, bg: 'bg-blue-50 text-blue-500 dark:bg-blue-950/40 dark:text-blue-400', color: '#3b82f6' },
  Transportation: { icon: TransportIcon, bg: 'bg-amber-50 text-amber-500 dark:bg-amber-950/40 dark:text-amber-400', color: '#d97706' },
  Food: { icon: FoodIcon, bg: 'bg-rose-50 text-rose-500 dark:bg-rose-950/40 dark:text-rose-450', color: '#f43f5e' },
  Utilities: { icon: RentIcon, bg: 'bg-violet-50 text-violet-500 dark:bg-violet-950/40 dark:text-violet-400', color: '#7c3aed' },
  Health: { icon: HealthIcon, bg: 'bg-teal-50 text-teal-500 dark:bg-teal-950/40 dark:text-teal-400', color: '#0d9488' },
  Education: { icon: OtherIcon, bg: 'bg-indigo-50 text-indigo-500 dark:bg-indigo-950/40 dark:text-indigo-400', color: '#6366f1' },
  Fuel: { icon: TransportIcon, bg: 'bg-orange-50 text-orange-500 dark:bg-orange-950/40 dark:text-orange-400', color: '#f97316' },
  Rent: { icon: RentIcon, bg: 'bg-indigo-50 text-indigo-500 dark:bg-indigo-950/40 dark:text-indigo-400', color: '#6366f1' },
  Gym: { icon: GymIcon, bg: 'bg-emerald-50 text-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-400', color: '#10b981' },
  Coffee: { icon: CoffeeIcon, bg: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300', color: '#b45309' },
  Salary: { icon: SalaryIcon, bg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300', color: '#207561' },
  Freelance: { icon: SalaryIcon, bg: 'bg-teal-50 text-teal-600 dark:bg-teal-950/40 dark:text-teal-300', color: '#2fa882' },
  Other: { icon: OtherIcon, bg: 'bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400', color: '#64748b' }
}

export function getCategoryMeta(categoryName) {
  if (!categoryName) return CATEGORY_META.Other
  const name = categoryName.trim().toLowerCase()
  if (name.includes('shop') || name.includes('cloth') || name.includes('bag') || name.includes('apparel') || name.includes('wear') || name.includes('groc')) return CATEGORY_META.Shop
  if (name.includes('elect') || name.includes('phone') || name.includes('tech') || name.includes('appl') || name.includes('gadg')) return CATEGORY_META.Electronic
  if (name.includes('trans') || name.includes('trip') || name.includes('car') || name.includes('travel') || name.includes('bus') || name.includes('train') || name.includes('taxi')) return CATEGORY_META.Transportation
  if (name.includes('salary') || name.includes('paycheck') || name.includes('income')) return CATEGORY_META.Salary
  if (name.includes('freelance') || name.includes('project') || name.includes('consult')) return CATEGORY_META.Freelance
  if (name.includes('coffe') || name.includes('starbucks') || name.includes('caffeine') || name.includes('espresso') || name.includes('tea')) return CATEGORY_META.Coffee
  if (name.includes('food') || name.includes('eat') || name.includes('rest') || name.includes('cafe') || name.includes('dine')) return CATEGORY_META.Food
  if (name.includes('rent') || name.includes('lease') || name.includes('apartment') || name.includes('house')) return CATEGORY_META.Rent
  if (name.includes('util') || name.includes('bill') || name.includes('power') || name.includes('water')) return CATEGORY_META.Utilities
  if (name.includes('gym') || name.includes('workout') || name.includes('fitness') || name.includes('exercise')) return CATEGORY_META.Gym
  if (name.includes('heal') || name.includes('med') || name.includes('doctor') || name.includes('hosp') || name.includes('pill')) return CATEGORY_META.Health

  if (name.includes('educ') || name.includes('school') || name.includes('class') || name.includes('book') || name.includes('stud')) return CATEGORY_META.Education
  if (name.includes('fuel') || name.includes('gas') || name.includes('petrol')) return CATEGORY_META.Fuel
  
  const normalized = Object.keys(CATEGORY_META).find(
    (key) => key.toLowerCase() === name
  )
  return CATEGORY_META[normalized] || CATEGORY_META.Other
}

// Helper: Format cents to Rupees (matching reference exactly)
export function formatCurrency(cents) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(cents / 100)
}

// Helper: Parse currency input (USD) to integer cents
export function parseAmountToCents(val) {
  if (!val) return null
  const cleanVal = val.toString().replace(/[^\d.]/g, '')
  const parsed = parseFloat(cleanVal)
  if (Number.isNaN(parsed) || parsed <= 0) return null
  return Math.round(parsed * 100)
}

// Helper: Parse safe date timestamp
export function safeDate(value) {
  const timestamp = new Date(value).getTime()
  return Number.isNaN(timestamp) ? 0 : timestamp
}

// Helper: Format Date/Time
export function formatDate(value) {
  const timestamp = safeDate(value)
  if (timestamp === 0) {
    return 'Date unavailable'
  }
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    day: 'numeric',
  }).format(new Date(timestamp))
}

// General SVG Icons
export function PlusIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  )
}

export function SearchIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  )
}

export function EditIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
    </svg>
  )
}

export function TrashIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
  )
}

export function WalletIllustration({ className }) {
  return (
    <svg className={className} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="60" cy="60" r="45" stroke="currentColor" strokeWidth="2.5" strokeDasharray="5 5" />
      <path d="M40 75H80C82.7614 75 85 72.7614 85 70V50C85 47.2386 82.7614 45 80 45H40C37.2386 45 35 47.2386 35 50V70C35 72.7614 37.2386 75 40 75Z" stroke="currentColor" strokeWidth="3" />
      <path d="M35 55H85" stroke="currentColor" strokeWidth="2" />
      <circle cx="60" cy="62" r="3.5" fill="currentColor" />
    </svg>
  )
}

export function AnalyticsIllustration({ className }) {
  return (
    <svg className={className} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="35" y="65" width="12" height="25" rx="2" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="2.5" />
      <rect x="54" y="45" width="12" height="45" rx="2" fill="currentColor" fillOpacity="0.4" stroke="currentColor" strokeWidth="2.5" />
      <rect x="73" y="30" width="12" height="60" rx="2" fill="currentColor" fillOpacity="0.6" stroke="currentColor" strokeWidth="2.5" />
      <path d="M25 95H95" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

export function LoaderIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3-3m-3 3l3 3" />
    </svg>
  )
}

/* ==================== MONETY BRAND SVG ASSETS ==================== */

// Monety Overlay Capsules Logo (Gold & Pink themed)
export function MonetyLogo({ className }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Gold pill */}
      <rect x="6" y="9" width="7.5" height="18" rx="3.75" transform="rotate(-25 6 9)" fill="#ffdf9e" />
      {/* Pink pill overlapping */}
      <rect x="19" y="5" width="7.5" height="18" rx="3.75" transform="rotate(25 19 5)" fill="#ff7ee2" fillOpacity="0.88" />
    </svg>
  )
}
