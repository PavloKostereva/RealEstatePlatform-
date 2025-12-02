'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing: {
    id: string;
    title: string;
    type: string;
    category: string;
    price: number;
    currency: string;
    address: string;
    images: string[];
    area?: number;
  };
}

export function CheckoutModal({ isOpen, onClose, listing }: CheckoutModalProps) {
  const t = useTranslations('checkout');
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [billingCycle, setBillingCycle] = useState<'month' | '3months' | 'year'>('month');
  const [autoRenew, setAutoRenew] = useState(true);
  const [insurance, setInsurance] = useState(false);
  const [selectedSize, setSelectedSize] = useState<number | null>(listing.area || null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Дані користувача для кроку 2
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    countryCity: '',
    discountCode: '',
    bookingAs: 'private' as 'private' | 'company',
    acceptTerms: false,
  });

  if (!isOpen) return null;

  // Ціна за квадратний метр за місяць
  const pricePerSquareMeterPerMonth = listing.price;

  // Вибраний розмір (якщо не вибрано, використовуємо площа лістингу або 1)
  const currentSize = selectedSize || listing.area || 1;

  // Базова ціна за місяць з урахуванням вибраного розміру
  const basePricePerMonth = pricePerSquareMeterPerMonth * currentSize;

  // Обчислюємо ціну в залежності від billing cycle
  const getPriceForCycle = (cycle: string) => {
    switch (cycle) {
      case 'month':
        return basePricePerMonth; // 1 місяць
      case '3months':
        return basePricePerMonth * 3; // 3 місяці
      case 'year':
        return basePricePerMonth * 12; // 12 місяців (1 рік)
      default:
        return basePricePerMonth;
    }
  };

  const cyclePrice = getPriceForCycle(billingCycle);
  const insurancePrice = insurance ? cyclePrice * 0.1 : 0;
  const totalPrice = cyclePrice + insurancePrice;

  const getBillingCycleDays = (cycle: string) => {
    switch (cycle) {
      case 'month':
        return 30;
      case '3months':
        return 90;
      case 'year':
        return 365;
      default:
        return 30;
    }
  };

  const getBillingCycleMonths = (cycle: string) => {
    switch (cycle) {
      case 'month':
        return 1;
      case '3months':
        return 3;
      case 'year':
        return 12;
      default:
        return 1;
    }
  };

  const allSizes = [10, 9, 8, 7, 6, 5, 3, 2];

  // Обчислюємо знижку з discount code (10% якщо код "DISCOUNT20")
  const discountPercent = formData.discountCode.toUpperCase() === 'DISCOUNT20' ? 0.1 : 0;
  const discountAmount = cyclePrice * discountPercent;
  const finalCyclePrice = cyclePrice - discountAmount;
  const finalInsurancePrice = insurance ? finalCyclePrice * 0.1 : 0;
  const finalTotalPrice = finalCyclePrice + finalInsurancePrice;

  // Перевірка чи всі поля заповнені та terms прийняті
  const isFormValid = () => {
    return (
      formData.fullName.trim() !== '' &&
      formData.email.trim() !== '' &&
      formData.phone.trim() !== '' &&
      formData.countryCity.trim() !== '' &&
      formData.acceptTerms
    );
  };

  const handleContinue = async () => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      // Валідація форми
      if (
        !formData.fullName.trim() ||
        !formData.email.trim() ||
        !formData.phone.trim() ||
        !formData.countryCity.trim()
      ) {
        alert("Будь ласка, заповніть всі обов'язкові поля");
        return;
      }
      if (!formData.acceptTerms) {
        alert('Будь ласка, прийміть умови використання');
        return;
      }

      // Створюємо Stripe Checkout Session
      setIsProcessingPayment(true);
      try {
        const response = await fetch('/api/stripe/create-checkout-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            listingId: listing.id,
            listingTitle: listing.title,
            amount: finalTotalPrice,
            currency: listing.currency,
            billingCycle: billingCycle,
            customerEmail: formData.email,
            customerName: formData.fullName,
            successUrl: `${window.location.origin}/listings/${listing.id}?success=true`,
            cancelUrl: `${window.location.origin}?canceled=true`,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          console.error('API Error:', data);
          throw new Error(data.error || 'Failed to create checkout session');
        }

        // Перенаправляємо на Stripe Checkout
        if (data.url) {
          window.location.href = data.url;
        } else if (data.sessionId) {
          // Якщо немає URL, але є sessionId, можна спробувати інший спосіб
          throw new Error('No checkout URL received');
        } else {
          throw new Error('Invalid response from server');
        }
      } catch (error) {
        console.error('Error creating checkout session:', error);
        setIsProcessingPayment(false);
        const errorMessage = error instanceof Error ? error.message : 'Спробуйте ще раз.';
        alert(`Помилка при створенні сесії оплати: ${errorMessage}`);
      }
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
    } else if (step === 3) {
      setStep(2);
    }
  };

  // Скидаємо step при закритті модального вікна
  const handleClose = () => {
    setStep(1);
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      countryCity: '',
      discountCode: '',
      bookingAs: 'private',
      acceptTerms: false,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-surface rounded-2xl border border-subtle shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto overflow-x-hidden">
        {/* Header */}
        <div className="sticky top-0 bg-surface border-b border-subtle p-6 flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-bold text-foreground">{t('title')}</h2>
            <p className="text-sm text-muted-foreground mt-1">{t('subtitle')}</p>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface-secondary transition text-muted-foreground hover:text-foreground">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Product Details - показується на всіх кроках */}
          {step === 1 && (
            <div className="flex gap-4 items-start">
              <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-surface-secondary flex-shrink-0">
                {listing.images?.[0] ? (
                  <Image
                    src={listing.images[0]}
                    alt={listing.title}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                    {t('noImage')}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-foreground">{listing.title}</h3>
                <p className="text-sm text-muted-foreground">{t('category')}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-foreground">
                  {pricePerSquareMeterPerMonth.toLocaleString()} {listing.currency}/m²
                </p>
                {currentSize > 1 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {currentSize} m² × {pricePerSquareMeterPerMonth.toLocaleString()} ={' '}
                    {basePricePerMonth.toLocaleString()} {listing.currency}/міс
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Other Offers - показується тільки на кроці 1 */}
          {step === 1 && (
            <div>
              <h4 className="text-sm font-medium text-foreground mb-3">{t('otherOffers')}</h4>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {allSizes.map((size) => {
                  const isSelected = selectedSize === size;
                  return (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-3 py-2 rounded-lg border text-sm transition ${
                        isSelected
                          ? 'bg-primary-600 text-white border-primary-600 font-medium'
                          : 'border-subtle bg-surface-secondary text-foreground hover:border-primary-400'
                      }`}>
                      {size} m²
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Progress Bar з індикаторами кроків */}
          <div className="space-y-3">
            {/* Прогрес бар */}
            <div className="h-2 bg-surface-secondary rounded-full overflow-hidden relative">
              <div
                className="h-full bg-primary-600 transition-all duration-300 rounded-full"
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </div>

            {/* Індикатори кроків */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
                    step >= 1
                      ? 'bg-primary-600 text-white'
                      : 'bg-surface-secondary text-muted-foreground border border-subtle'
                  }`}>
                  1
                </div>
                <span
                  className={`text-xs font-medium ${
                    step >= 1 ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                  Select options
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
                    step >= 2
                      ? 'bg-primary-600 text-white'
                      : 'bg-surface-secondary text-muted-foreground border border-subtle'
                  }`}>
                  2
                </div>
                <span
                  className={`text-xs font-medium ${
                    step >= 2 ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                  Your details
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
                    step >= 3
                      ? 'bg-primary-600 text-white'
                      : 'bg-surface-secondary text-muted-foreground border border-subtle'
                  }`}>
                  3
                </div>
                <span
                  className={`text-xs font-medium ${
                    step >= 3 ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                  Payment
                </span>
              </div>
            </div>
          </div>

          {/* Крок 2: Форма з даними користувача */}
          {step === 2 && (
            <div className="space-y-6">
              {/* Product Details для кроку 2 */}
              <div className="flex gap-4 items-start pb-4 border-b border-subtle">
                <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-surface-secondary flex-shrink-0">
                  {listing.images?.[0] ? (
                    <Image
                      src={listing.images[0]}
                      alt={listing.title}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                      {t('noImage')}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-foreground">{listing.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {listing.title} – {currentSize} m²
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-base font-bold text-foreground">
                    {pricePerSquareMeterPerMonth.toLocaleString()} {listing.currency}/m²
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="min-w-0">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Full name *
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-subtle bg-surface-secondary text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Alex Doe"
                  />
                </div>
                <div className="min-w-0">
                  <label className="block text-sm font-medium text-foreground mb-2">Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-subtle bg-surface-secondary text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="you@example.com"
                  />
                </div>
                <div className="min-w-0">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Phone number *
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-subtle bg-surface-secondary text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="+1 555 000 1111"
                  />
                </div>
                <div className="min-w-0">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Country & City *
                  </label>
                  <input
                    type="text"
                    value={formData.countryCity}
                    onChange={(e) => setFormData({ ...formData, countryCity: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-subtle bg-surface-secondary text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Germany, Hannover"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Discount code (optional)
                </label>
                <input
                  type="text"
                  value={formData.discountCode}
                  onChange={(e) => setFormData({ ...formData, discountCode: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-subtle bg-surface-secondary text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="DISCOUNT20"
                />
              </div>
              <div>
                <h4 className="text-sm font-medium text-foreground mb-3">Booking as</h4>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setFormData({ ...formData, bookingAs: 'private' })}
                    className={`px-4 py-2.5 rounded-lg border text-sm font-medium transition ${
                      formData.bookingAs === 'private'
                        ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                        : 'bg-surface-secondary text-foreground border-subtle hover:border-primary-400 hover:bg-surface-tertiary'
                    }`}>
                    Private
                  </button>
                  <button
                    onClick={() => setFormData({ ...formData, bookingAs: 'company' })}
                    className={`px-4 py-2.5 rounded-lg border text-sm font-medium transition ${
                      formData.bookingAs === 'company'
                        ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                        : 'bg-surface-secondary text-foreground border-subtle hover:border-primary-400 hover:bg-surface-tertiary'
                    }`}>
                    Company
                  </button>
                </div>
              </div>
              <div className="border-t border-subtle pt-6 mt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-foreground mb-2">Accept terms</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed break-words">
                      By completing your payment, you accept our{' '}
                      <a
                        href="#"
                        className="text-primary-600 hover:underline break-all"
                        onClick={(e) => e.preventDefault()}>
                        Terms of Service.
                      </a>
                    </p>
                  </div>
                  <button
                    onClick={() => setFormData({ ...formData, acceptTerms: !formData.acceptTerms })}
                    className={`relative w-12 h-6 rounded-full transition flex-shrink-0 ${
                      formData.acceptTerms ? 'bg-primary-600' : 'bg-surface-secondary'
                    }`}
                    aria-label="Accept terms">
                    <div
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                        formData.acceptTerms ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Крок 3: Оплата */}
          {step === 3 && (
            <div className="space-y-4">
              {/* Progress Bar для кроку 3 */}
              <div className="h-1 bg-surface-secondary rounded-full overflow-hidden mb-6">
                <div className="h-full bg-primary-600" style={{ width: '100%' }} />
              </div>

              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-600/20 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-primary-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  Redirecting to payment...
                </h3>
                <p className="text-sm text-muted-foreground">
                  You will be redirected to the payment gateway to complete your subscription.
                </p>
              </div>
            </div>
          )}

          {/* Крок 1: Вибір параметрів (показується тільки на кроці 1) */}
          {step === 1 && (
            <>
              {/* Billing Cycle */}
              <div>
                <h4 className="text-sm font-medium text-foreground mb-3">
                  {t('billingCycle.label')}
                </h4>
                <div className="flex gap-3">
                  {(['month', '3months', 'year'] as const).map((cycle) => (
                    <button
                      key={cycle}
                      onClick={() => setBillingCycle(cycle)}
                      className={`flex-1 px-4 py-3 rounded-lg border transition ${
                        billingCycle === cycle
                          ? 'bg-primary-600 text-white border-primary-600'
                          : 'bg-surface-secondary text-foreground border-subtle hover:border-primary-400'
                      }`}>
                      <div className="font-medium">{t(`billingCycle.${cycle}`)}</div>
                      <div className="text-xs opacity-80">
                        {getBillingCycleDays(cycle)} {t('days')}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Two Column Layout */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Left Column - Auto Renew */}
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-foreground">{t('autoRenew')}</h4>
                      <button
                        onClick={() => setAutoRenew(!autoRenew)}
                        className={`relative w-12 h-6 rounded-full transition ${
                          autoRenew ? 'bg-primary-600' : 'bg-surface-secondary'
                        }`}>
                        <div
                          className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition ${
                            autoRenew ? 'translate-x-6' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">{t('autoRenewDescription')}</p>
                  </div>
                  <button className="w-full px-4 py-3 rounded-lg border border-subtle bg-surface-secondary text-foreground hover:border-primary-400 transition">
                    {t('viewListingDetails')}
                  </button>
                </div>

                {/* Right Column - First Charge */}
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-2">{t('firstCharge')}</h4>
                    <p className="text-2xl font-bold text-foreground">
                      {totalPrice.toLocaleString()} {listing.currency}
                    </p>
                    <div className="text-xs text-muted-foreground mt-1">
                      <div>
                        {t('base')}: {cyclePrice.toLocaleString()} {listing.currency}
                      </div>
                      <div>
                        {t('perMonth')}: {basePricePerMonth.toLocaleString()} {listing.currency}
                      </div>
                      {getBillingCycleMonths(billingCycle) > 1 && (
                        <div className="text-primary-600 mt-1">
                          За {getBillingCycleMonths(billingCycle)}{' '}
                          {getBillingCycleMonths(billingCycle) === 1
                            ? 'місяць'
                            : getBillingCycleMonths(billingCycle) < 5
                            ? 'місяці'
                            : 'місяців'}
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-foreground">{t('addInsurance')}</span>
                      <button
                        onClick={() => setInsurance(!insurance)}
                        className={`relative w-12 h-6 rounded-full transition ${
                          insurance ? 'bg-primary-600' : 'bg-surface-secondary'
                        }`}>
                        <div
                          className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition ${
                            insurance ? 'translate-x-6' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                    {insurance && (
                      <p className="text-xs text-muted-foreground">
                        +{insurancePrice.toLocaleString()} {listing.currency}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-surface border-t border-subtle p-3 sm:p-4">
          {step === 1 && (
            <div className="space-y-2">
              {/* Price info */}
              <div className="text-center sm:text-right">
                <span className="text-lg sm:text-xl font-bold text-foreground block">
                  {totalPrice.toLocaleString()} {listing.currency}
                </span>
                {getBillingCycleMonths(billingCycle) > 1 && (
                  <span className="text-xs text-muted-foreground">
                    за {getBillingCycleMonths(billingCycle)}{' '}
                    {getBillingCycleMonths(billingCycle) === 1
                      ? 'місяць'
                      : getBillingCycleMonths(billingCycle) < 5
                      ? 'місяці'
                      : 'місяців'}
                  </span>
                )}
                {getBillingCycleMonths(billingCycle) === 1 && (
                  <span className="text-xs text-muted-foreground">{t('perMonth')}</span>
                )}
              </div>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-2.5">
                <div className="flex-1 text-xs text-muted-foreground flex items-center justify-center sm:justify-start">
                  <div>
                    <div>{t('secureCheckout')}</div>
                    <div>{t('subscriptionBills')}</div>
                  </div>
                </div>
                <button
                  onClick={handleContinue}
                  className="flex-1 sm:flex-none px-3 py-2 rounded-lg bg-primary-600 text-white text-xs sm:text-sm font-medium hover:bg-primary-700 transition whitespace-nowrap">
                  Continue
                </button>
              </div>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-2">
              {/* Total due */}
              <div className="text-center sm:text-right text-xs text-muted-foreground mb-1">
                Total due {finalTotalPrice.toLocaleString()} {listing.currency}
              </div>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-2.5">
                <button
                  onClick={handleBack}
                  className="flex-1 px-3 py-2 rounded-lg border border-subtle bg-surface-secondary text-foreground text-xs sm:text-sm font-medium hover:border-primary-400 transition">
                  Back
                </button>
                <button
                  onClick={handleContinue}
                  disabled={!isFormValid() || isProcessingPayment}
                  className={`flex-1 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition ${
                    isFormValid() && !isProcessingPayment
                      ? 'bg-primary-600 text-white hover:bg-primary-700 cursor-pointer'
                      : 'bg-surface-secondary text-muted-foreground border border-subtle cursor-not-allowed opacity-60'
                  }`}>
                  {isProcessingPayment
                    ? 'Processing...'
                    : `Start subscription (${finalTotalPrice.toLocaleString()} ${
                        listing.currency
                      }/${getBillingCycleMonths(billingCycle) === 1 ? 'month' : 'period'})`}
                </button>
              </div>
            </div>
          )}
          {step === 3 && (
            <div className="text-center">
              <button
                onClick={handleClose}
                className="px-3 py-2 rounded-lg border border-subtle bg-surface-secondary text-foreground text-xs sm:text-sm font-medium hover:border-primary-400 transition">
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
