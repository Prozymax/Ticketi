# Pi Network Integration Guide

This guide explains how to integrate Pi Network functionality into your React/Next.js application.

## Overview

The Pi Network integration provides:
- User authentication with Pi Network
- Payment processing using Pi cryptocurrency
- Content sharing through Pi Network's social features

## Files Structure

```
client/
├── app/
│   ├── lib/
│   │   └── PiNetwork.tsx          # Core Pi Network service
│   ├── hooks/
│   │   └── usePiNetwork.ts        # React hook for Pi Network
│   ├── components/
│   │   └── PiNetworkDemo.tsx      # Demo component
│   └── .env.local                 # Environment configuration
```

## Setup

### 1. Environment Configuration

Add these variables to your `.env.local` file:

```env
# Pi Network Configuration
NEXT_PUBLIC_PI_SANDBOX=true
NEXT_PUBLIC_PI_API_KEY=your_pi_api_key_here
NEXT_PUBLIC_PI_WALLET_PRIVATE_SEED=your_wallet_private_seed_here
```

### 2. Include Pi SDK Script

Add the Pi SDK script to your HTML head (in `app/layout.tsx` or `pages/_document.tsx`):

```html
<script src="https://sdk.minepi.com/pi-sdk.js"></script>
```

For sandbox/development:
```html
<script src="https://sandbox.sdk.minepi.com/pi-sdk.js"></script>
```

## Usage

### Basic Usage with Hook

```tsx
import { usePiNetwork } from '../hooks/usePiNetwork';

export default function MyComponent() {
  const {
    isAuthenticated,
    user,
    isLoading,
    error,
    authenticate,
    createPayment,
    shareContent,
    isSDKReady,
  } = usePiNetwork();

  const handleLogin = async () => {
    try {
      await authenticate();
      console.log('User authenticated:', user);
    } catch (error) {
      console.error('Authentication failed:', error);
    }
  };

  const handlePayment = async () => {
    try {
      const paymentId = await createPayment(
        5.0, // amount in Pi
        'Event ticket purchase',
        { eventId: 'event_123', ticketType: 'VIP' }
      );
      console.log('Payment created:', pating. troubleshooe for consolthetion to al informaddition will log a

Thise
```BUG_PI=truBLIC_DEv
NEXT_PUing:
```enging by settebug log

Enable dModeug Deb
### 
ronmentenvied  your intendatchvariables mronment ure envi Make son**: Productibox vsSandlance
4. **baicient Pi as suffand hticated hen is autrify userrs**: Veayment erroup
3. **PK setr SDr with prope o Browser Ping innick if run*: Che fails*nticationAuthe
2. **your app before ded and loadedt is inclu scrip SDKEnsure the*: t loading***Pi SDK nosues

1.  Ison

### Commleshooting

## Troubckuser feedband ling ar handroper errolement p
- Impuctionn prodTPS i Use HTr backend
-n yous odate paymentliAlways vacode
- -side lientin c or seeds te keysrivaver expose ps

- Neteurity No# Secr

#i Browsen Phly ioroug
4. Test thllet seeds and waper API keysigure pro
3. Confduction URLwith proDK URL  Sdboxe san2. Replacduction
e` in proBOX=falsI_SANDIC_P_PUBL. Set `NEXToyment

1tion DeplProduc# 

#;
}
```v>
  )  </di />
  rkDemo <PiNetwo
     >est</h1gration Tork Inte <h1>Pi Netw>
     
    <div return () {
 n TestPage(io functfault
export deo';
NetworkDemPionents/'../comp} from kDemo t { PiNetworpor
imtsxtion:

``` integratheent to test pon como`workDemthe `PiNet
Use # Testing


# }
}
```rs
 r erroe othedl
    // Han { else
  }duireication requthent/ Handle a / {
   ted')t authenticano= 'User ge ==ror.messaf (er } else iaded
 loe SDK not / Handl    /') {
itializedle or not invailabnot aK i SD=== 'Pe r.messagroerif (
  or) {ch (err
} cathenticate();aut {
  await try
```tsx
dling:
 error hanomprehensivees crvice includ

The se Handlingrror
```

## Eing;
}strt: 
  created_a
  };ing; _link: str
   olean;verified: bo
    d: string; txi
   nsaction?: {;
  tra } boolean;
 led: user_cancel  ean;
  bool  cancelled:ean;
  d: bool_complete   developerolean;
 boied: n_verifio    transactolean;
oved: booper_appr devel {
   tus:staing;
  strtion: ;
  direcrings: stes;
  to_addrs: stringdres
  from_adn>; unknowcord<string,tadata: Retring;
  me: s memober;
  num;
  amount:nguid: stri
  user_;ingier: str
  identiftePayment {ncomplenterface Icript
iest
```typletePaymen
### Incomp
```own>;
}
ng, unknecord<strimetadata: Ring;
  strr;
  memo: t: numbea {
  amounDataymentnterface Ppescript
i```tytData

### Paymen
```

  };
} string; username:ing;
    uid: str {
   user:g;
  strinToken: ccess a {
 ltace AuthResunterfescript
i
```typthResults

### Au

## Typeusbility statSDK availa- Pi : boolean` sSDKReady `i
-ntconte to share tionvoid` - Func> ge) =e, messatltireContent: (
- `shamentte paycrean to >` - Functioe<stringmisroa?) => Padatmo, met, meamount (ment:atePay`creser
- nticate uion to autheid>` - Functromise<vo: () => Pcatetihen `aution fails
-atany operge if essal` - Error m| nul: string rrors
- `enc operatione for asying statLoad boolean` - ading:`isLoation
- er informd ushenticateut - A| null`er 
- `user: Ususion statticatr authenlean` - Useboo: nticated- `isAuthenstance
 service itwork Ne null` - PirkService |iNetwovice: P
- `piSerturns
 Re

####twork HookusePiNe
### ction
and produn sandbox h betweeitcd` - Swean): voibooldbox: santSandbox(s
- `seation scopeenticthcurrent au[]` - Get (): stringScopesady
- `geted and reoadi SDK is l- Check if Pboolean` vailable():  `isSDKA
-are dialogNetwork sh` - Open Pi age): void messog(title,ialenShareDopquest
- `nt reeate a payme - Cre<string>`ta): Promisetada memo, mnt(amount,me`createPaywork
-  with Pi Netnticate usert>` - AuthehResulPromise<AuteUser(): atthenticauods

- `# Methice

###orkServ PiNetw

###ence API Refer;
```

##ncert!') cois amazing at thin me, 'Joonight!'('Concert TnShareDialogice.opervnt
piSehare conte;

// Smetadata
)6' } // oncert_45ntId: 'c
  { eve memot', //cke ti
  'Concert// amount10.0, nt(
  Paymereatece.cServi pintId = awaitnst paymeayment
co// Create pesult);

ted:', authRnticag('Authele.lo);
consor(seteUe.authenticaServic await piuthResult =const ate user
ntica/ Authendbox

/rue for sa; // tue)rkService(tr new PiNetwoService =t pi
conservicetialize s
// Ini;
iNetwork'/lib/Pm '.. frorvice }kSe { PiNetwor
import```tsx
ce Usage
 Servi Direct``

###
}
`/div>
  );)}
    <v>
            </diutton>
  /b      <    re Event
         Sha  t!')}>
 evenis t thCheck out Title', 'enntent('Ev) => shareCoClick={(on on     <butttton>
      </bu     )
    cket (5π   Buy Ti        Loading}>
 sabled={isPayment} di{handleck=utton onCli   <b
       !</p>ername}user?.us>Welcome, {       <p  iv>
    <d     ) : (
     >
   </button
      h Pi'}witogin ...' : 'Lngati 'Authenticading ?       {isLo
   oading}>{isLled=disableLogin} hand={tton onClick  <bu  
    icated ? (ntisAuthev>
      {!
    <din (

  retur
  }K...</div>; Network SDoading Pirn <div>L {
    retusSDKReady)!i (

  if
  };r);
    }iled:', erroayment faerror('Pole.ons c
     h (error) { } catcId);
   yment