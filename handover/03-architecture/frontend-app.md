# Frontend App

## Stack

- Expo SDK 54  
- React Navigation (native stack + drawer)  
- i18n (`src/i18n`)  
- Theme context  
- SecureStore for token / farm id (web falls back to localStorage)

## Entry

- `frontend/App.js` — fonts, splash, auth bootstrap, navigators  
- Screens under `frontend/src/screens/`  
- API client: `frontend/src/api/index.js`

## Critical config

```js
// frontend/src/api/index.js
const RENDER_URL = 'http://13.60.172.93';
const BASE_URL = `${RENDER_URL}/api`;
```

Any EC2 IP change requires updating this + new APK (unless domain is introduced).

## App identity (`app.json`)

| Key | Value |
|-----|-------|
| name | GoatBook |
| version | 1.2.0 |
| android.package | com.goatwala.farm |
| versionCode | 12 |
| cleartext HTTP | enabled (`usesCleartextTraffic: true`) |

## Main feature areas (screens)

- Auth: Login, Register, Forgot/Reset Password  
- Animals / Breeds / Employees / Locations  
- Mating / Breeding  
- Vaccines / Mass vaccination  
- Weights / Finances / Formulations  
- Reports / Notifications / Subscription / Farm settings  

## Image upload

`src/utils/cloudinary.js` uses unsigned preset `goatbook_preset` to Cloudinary cloud `dvtfv9vvr`.

## Payments UI

`SubscriptionScreen.js` loads Cashfree JS in **`sandbox`** mode — switch to production carefully with live keys.
