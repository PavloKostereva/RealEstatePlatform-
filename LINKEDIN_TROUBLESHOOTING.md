# Виправлення помилки LinkedIn OAuth

## Помилка: OAuthCallback

Якщо після авторизації через LinkedIn вас перекидає на `/how-it-works?error=OAuthCallback`, це означає що щось пішло не так під час callback.

## Можливі причини та рішення:

### 1. Перевірте Redirect URL в LinkedIn

**Важливо:** Redirect URL має точно відповідати!

1. Перейдіть на https://www.linkedin.com/developers/apps
2. Виберіть ваш додаток "Real Estate Platform"
3. Перейдіть на вкладку **"Auth"**
4. У розділі **"Redirect URLs"** переконайтесь що є:
   ```
   http://localhost:3000/api/auth/callback/linkedin
   ```
5. **Важливо:** URL має бути точно таким (з `http://`, портом `3000`, без зайвих слешів)
6. Натисніть **"Update"**

### 2. Перевірте чи увімкнено продукт

1. Перейдіть на вкладку **"Products"**
2. Переконайтесь що увімкнено **"Sign In with LinkedIn using OpenID Connect"**
3. Якщо не увімкнено - натисніть **"Request access"** або **"Enable"**

### 3. Перевірте змінні середовища

Переконайтесь що в `.env` файлі є:

```env
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
```

### 4. Перевірте логи сервера

Після спроби авторизації перевірте консоль сервера (де запущений `npm run dev`). Там мають бути детальні помилки.

### 5. LinkedIn може не надавати email

LinkedIn може не надавати email адресу за замовчуванням. Переконайтесь що:

- У LinkedIn Application увімкнено продукт "Sign In with LinkedIn using OpenID Connect"
- Додано scopes: `openid profile email` (вже додано в коді)

### 6. Перезапустіть сервер

Після змін в `.env` або коді:

```bash
npm run dev
```

### 7. Очистіть кеш браузера

- Chrome/Edge: Ctrl+Shift+Delete (Windows) або Cmd+Shift+Delete (Mac)
- Або відкрийте DevTools (F12) → Application → Clear storage

## Додаткова діагностика

Якщо проблема залишається, перевірте:

1. **Консоль браузера** (F12 → Console) - чи є помилки JavaScript
2. **Network tab** (F12 → Network) - перевірте запити до `/api/auth/callback/linkedin`
3. **Логи сервера** - детальні помилки з NextAuth

## Типові помилки:

### "Invalid redirect_uri"

- Перевірте чи точно відповідає Redirect URL в LinkedIn
- Переконайтесь що немає зайвих пробілів або символів

### "Invalid client"

- Перевірте Client ID та Client Secret
- Переконайтесь що вони правильно скопійовані без пробілів

### "Access denied"

- Перевірте чи увімкнено продукт "Sign In with LinkedIn using OpenID Connect"
- Можливо потрібне схвалення від LinkedIn (для нових додатків)

### "Email not provided"

- LinkedIn може не надавати email якщо не увімкнено правильні scopes
- Переконайтесь що додано `email` scope (вже додано в коді)
