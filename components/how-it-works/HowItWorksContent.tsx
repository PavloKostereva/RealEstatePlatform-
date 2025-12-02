'use client';

import { FormEvent, useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import { signIn } from 'next-auth/react';

export function HowItWorksContent() {
  const router = useRouter();
  const locale = useLocale();
  const searchParams = useSearchParams();
  const [isSignIn, setIsSignIn] = useState(false); // Перемикач між входом та реєстрацією
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const confirmPasswordInputRef = useRef<HTMLInputElement>(null);

  // Обробка OAuth помилок з URL
  useEffect(() => {
    const oauthError = searchParams.get('error');
    if (oauthError) {
      let errorMessage = 'Помилка авторизації. ';
      switch (oauthError) {
        case 'OAuthCallback':
          errorMessage +=
            'Не вдалося завершити авторизацію через LinkedIn. Перевірте чи увімкнено продукт "Sign In with LinkedIn using OpenID Connect" в LinkedIn Developers Portal.';
          break;
        case 'OAuthSignin':
          errorMessage += 'Помилка при спробі входу. Перевірте налаштування LinkedIn Application.';
          break;
        case 'OAuthAccountNotLinked':
          errorMessage += "Цей акаунт вже пов'язаний з іншим методом входу.";
          break;
        default:
          errorMessage += `Помилка: ${oauthError}`;
      }
      setError(errorMessage);
      // Очистити URL від параметра помилки
      router.replace(`/${locale}/how-it-works`);
    }
  }, [searchParams, router, locale]);

  // Generate secure password
  const generatePassword = () => {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    setGeneratedPassword(password);

    // Set password fields
    if (passwordInputRef.current) {
      passwordInputRef.current.value = password;
    }
    if (confirmPasswordInputRef.current) {
      confirmPasswordInputRef.current.value = password;
    }
  };

  const handleSignIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const formData = new FormData(event.currentTarget);
      const email = formData.get('email') as string;
      const password = formData.get('password') as string;

      if (!email || !password) {
        setError("Email та пароль обов'язкові");
        setLoading(false);
        return;
      }

      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Невірний email або пароль');
      } else {
        router.push(`/${locale}`);
        router.refresh();
      }
    } catch (error) {
      console.error('Error signing in:', error);
      setError('Помилка входу. Спробуйте ще раз.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const formData = new FormData(event.currentTarget);
      const firstName = formData.get('firstName') as string;
      const lastName = formData.get('lastName') as string;
      const phone = formData.get('phone') as string;
      const email = formData.get('email') as string;
      const password = formData.get('password') as string;
      const confirmPassword = formData.get('confirmPassword') as string;
      const role = formData.get('role') as string;

      // Validation
      if (!email || !password) {
        setError("Email та пароль обов'язкові");
        setLoading(false);
        return;
      }

      if (password !== confirmPassword) {
        setError('Паролі не співпадають');
        setLoading(false);
        return;
      }

      if (password.length < 6) {
        setError('Пароль повинен містити мінімум 6 символів');
        setLoading(false);
        return;
      }

      // Combine first and last name
      const name = [firstName, lastName].filter(Boolean).join(' ') || null;

      // Map role to database role
      let dbRole = 'USER';
      if (role === 'Home Owner') {
        dbRole = 'OWNER';
      }

      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          name,
          phone: phone || null,
          role: dbRole,
        }),
      });

      if (res.ok) {
        // Невелика затримка, щоб переконатися, що користувач збережений в БД
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Автоматично авторизуємо користувача після реєстрації
        const signInResult = await signIn('credentials', {
          email,
          password,
          redirect: false,
        });

        if (signInResult?.error) {
          // Якщо авторизація не вдалася, залишаємо на сторінці з помилкою
          console.error('Sign in error after signup:', signInResult.error);
          setError('Помилка авторизації. Спробуйте увійти вручну.');
        } else {
          // Успішна авторизація - перенаправляємо на головну сторінку
          router.push(`/${locale}`);
          router.refresh();
        }
      } else {
        const data = await res.json();
        // Show detailed error in development
        const errorMessage = data.details?.message
          ? `${data.error}: ${data.details.message}`
          : data.error || 'Помилка реєстрації';
        setError(errorMessage);
        console.error('Signup error:', data);
      }
    } catch (error) {
      console.error('Error creating account:', error);
      setError('Помилка реєстрації. Спробуйте ще раз.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative overflow-hidden bg-surface py-16">
      <div
        className="absolute inset-0 bg-gradient-to-b from-surface via-surface-secondary/40 to-surface"
        aria-hidden="true"
      />
      <div className="relative z-10 w-full px-6 sm:px-12 lg:px-20">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-12">
          <section className="flex-1 space-y-8">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-primary-400">
                Welcome to RealEstate
              </p>
              <h1 className="mt-4 text-4xl md:text-5xl font-bold text-foreground">
                The smartest way to find and manage property space
              </h1>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
                Join thousands of users who trust RealEstate for renting, buying, and managing
                property.
              </p>
            </div>

            <div className="space-y-6 bg-surface-secondary/60 backdrop-blur rounded-3xl border border-subtle shadow-inner px-8 py-6">
              <h2 className="text-2xl font-semibold text-foreground">How RealEstate Works</h2>
              <p className="text-muted-foreground">Get started in just 3 simple steps</p>

              <ol className="space-y-6">
                {[
                  {
                    step: '1',
                    title: 'Find a Space',
                    description:
                      'Type your address, compare sizes & prices from trusted property owners near you. Live availability, clear fees.',
                  },
                  {
                    step: '2',
                    title: 'Book in Seconds',
                    description:
                      'Pick your move-in date, checkout online, add transport/insurance if you want. Instant confirmation.',
                  },
                  {
                    step: '3',
                    title: 'Move in & Manage',
                    description:
                      'Get access details, move in, and manage billing or extensions from your dashboard. 24/7 support.',
                  },
                ].map(({ step, title, description }) => (
                  <li key={step} className="flex items-start gap-4">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-500 text-white font-semibold text-lg">
                      {step}
                    </span>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        {description}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>

              <div className="rounded-2xl bg-surface border border-primary-500/40 px-6 py-5 text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">For property owners:</span> Connect
                your listings, set pricing & rules, and receive payouts monthly with full
                transparency.
              </div>
            </div>
          </section>

          <section className="w-full lg:w-[420px] xl:w-[480px] bg-surface border border-subtle rounded-3xl shadow-xl overflow-hidden">
            <div className="px-8 py-6 border-b border-subtle">
              <div className="flex gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setIsSignIn(false)}
                  className={`flex-1 h-10 rounded-xl text-sm font-medium transition ${
                    !isSignIn
                      ? 'bg-primary-600 text-white'
                      : 'bg-surface-secondary text-muted-foreground hover:text-foreground'
                  }`}>
                  Реєстрація
                </button>
                <button
                  type="button"
                  onClick={() => setIsSignIn(true)}
                  className={`flex-1 h-10 rounded-xl text-sm font-medium transition ${
                    isSignIn
                      ? 'bg-primary-600 text-white'
                      : 'bg-surface-secondary text-muted-foreground hover:text-foreground'
                  }`}>
                  Вхід
                </button>
              </div>
              <h2 className="text-xl font-semibold text-foreground">Sign in with:</h2>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {['Google', 'Facebook', 'LinkedIn', 'Email'].map((provider) => (
                  <button
                    key={provider}
                    type="button"
                    className="h-11 rounded-xl border border-subtle bg-surface-secondary text-sm font-medium text-foreground hover:border-primary-400">
                    {provider}
                  </button>
                ))}
              </div>
              <div className="mt-6 flex items-center gap-3 text-sm text-muted-foreground justify-center">
                <span className="h-px flex-1 bg-subtle" aria-hidden="true" />
                or
                <span className="h-px flex-1 bg-subtle" aria-hidden="true" />
              </div>
            </div>

            {isSignIn ? (
              <form onSubmit={handleSignIn} className="px-8 py-8 space-y-5">
                <div className="text-center space-y-2">
                  <h3 className="text-2xl font-semibold text-foreground">Вхід в систему</h3>
                  <p className="text-sm text-muted-foreground">Увійдіть у свій акаунт</p>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-xl text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email Address</label>
                  <input
                    name="email"
                    type="email"
                    required
                    className="mt-1 w-full h-11 px-3 rounded-xl border border-subtle bg-surface-secondary focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Password</label>
                  <div className="relative">
                    <input
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      className="mt-1 w-full h-11 px-3 pr-10 rounded-xl border border-subtle bg-surface-secondary focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPassword ? (
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 rounded-xl bg-primary-600 text-white font-semibold shadow hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed">
                  {loading ? 'Вхід...' : 'Увійти'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleSignUp} className="px-8 py-8 space-y-5">
                <div className="text-center space-y-2">
                  <h3 className="text-2xl font-semibold text-foreground">Create Your Account</h3>
                  <p className="text-sm text-muted-foreground">
                    Join RealEstate today and start your property journey
                  </p>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-xl text-sm">
                    {error}
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">First Name</label>
                    <input
                      name="firstName"
                      className="mt-1 w-full h-11 px-3 rounded-xl border border-subtle bg-surface-secondary focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Jane"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Last Name</label>
                    <input
                      name="lastName"
                      className="mt-1 w-full h-11 px-3 rounded-xl border border-subtle bg-surface-secondary focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Doe"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Phone Number
                    </label>
                    <input
                      name="phone"
                      className="mt-1 w-full h-11 px-3 rounded-xl border border-subtle bg-surface-secondary focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="(+49) 123 4567"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Email Address
                    </label>
                    <input
                      name="email"
                      type="email"
                      required
                      className="mt-1 w-full h-11 px-3 rounded-xl border border-subtle bg-surface-secondary focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-sm font-medium text-muted-foreground">Password</label>
                      <button
                        type="button"
                        onClick={generatePassword}
                        className="text-xs text-primary-500 hover:text-primary-600 font-medium">
                        Generate password
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        ref={passwordInputRef}
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        defaultValue={generatedPassword}
                        onChange={(e) => setGeneratedPassword(e.target.value)}
                        className="mt-1 w-full h-11 px-3 pr-10 rounded-xl border border-subtle bg-surface-secondary focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showPassword ? (
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                            />
                          </svg>
                        ) : (
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        ref={confirmPasswordInputRef}
                        name="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        defaultValue={generatedPassword}
                        className="mt-1 w-full h-11 px-3 pr-10 rounded-xl border border-subtle bg-surface-secondary focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showConfirmPassword ? (
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                            />
                          </svg>
                        ) : (
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    I am a... (optional)
                  </label>
                  <div className="mt-2 grid sm:grid-cols-2 gap-2">
                    {['Renter', 'Home Owner', 'Property Manager', 'Transport / Logistics'].map(
                      (role) => (
                        <label
                          key={role}
                          className="flex items-center gap-2 rounded-xl border border-subtle bg-surface-secondary px-3 py-2 text-sm text-foreground hover:border-primary-400">
                          <input
                            type="radio"
                            name="role"
                            value={role}
                            className="accent-primary-600"
                          />
                          {role}
                        </label>
                      ),
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Additional Notes (optional)
                  </label>
                  <textarea
                    name="notes"
                    rows={3}
                    placeholder="Anything we should know about your property needs?"
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-subtle bg-surface-secondary focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <label className="flex items-start gap-2 text-sm text-muted-foreground">
                  <input type="checkbox" className="mt-1 accent-primary-600" required />
                  <span>
                    I agree to the{' '}
                    <a className="underline" href="#">
                      Terms of Service
                    </a>{' '}
                    and{' '}
                    <a className="underline" href="#">
                      Privacy Policy
                    </a>
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 rounded-xl bg-primary-600 text-white font-semibold shadow hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed">
                  {loading ? 'Creating Account...' : 'Create Account'}
                </button>
              </form>
            )}
          </section>
        </div>

        <div className="h-12" />
      </div>
    </div>
  );
}
