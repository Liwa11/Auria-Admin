# Auria Admin Dashboard

Een professioneel admin dashboard voor het Auria AI call center platform van Impact IQ.

## 🚀 Features

### 📊 Dashboard
- Real-time statistieken en overzichten
- Actieve campagnes monitoring
- Verkoper prestaties tracking
- Gesprek resultaten analyse

### 👥 Gebruikersbeheer
- Admin gebruikers authenticatie
- Veilige login met Supabase Auth
- Gebruikersrollen en rechten

### 🗺️ Regio's Beheer
- Volledige CRUD functionaliteit voor regio's
- Postcode en beschrijving management
- Real-time updates

### 🎯 Campagnes
- Campagne creatie en beheer
- Start- en einddatum tracking
- Regio-specifieke campagnes

### 👨‍💼 Verkopers
- Verkoper profielen beheer
- Admin rechten toewijzing
- Regio koppeling

### 🏢 Klanten
- Klantendatabase management
- Bedrijfsinformatie tracking
- Contact gegevens beheer

### 📞 Gesprekken
- Call logging en tracking
- Resultaatcode management
- Verkoper-klant koppeling

### 📈 Rapporten & Logs
- Uitgebreide rapportage
- Activiteit logs
- Performance analytics

## 🛠️ Technologieën

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Deployment**: Vercel-ready

## 📋 Vereisten

- Node.js 18+ 
- npm of pnpm
- Supabase account en project

## 🚀 Installatie

1. **Clone de repository**
```bash
git clone https://github.com/Liwa11/Auria-Admin.git
cd Auria-Admin
```

2. **Installeer dependencies**
```bash
npm install
# of
pnpm install
```

3. **Configureer Supabase**
- Maak een `.env.local` bestand aan
- Voeg je Supabase URL en anon key toe:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. **Start de development server**
```bash
npm run dev
# of
pnpm dev
```

5. **Open de applicatie**
- Ga naar [http://localhost:3000](http://localhost:3000)
- Log in met je admin credentials

## 🗄️ Database Schema

### Admin Users
```sql
admin_users (
  id: uuid PRIMARY KEY,
  name: text,
  email: text UNIQUE,
  avatar_url: text,
  last_login: timestamp,
  created_at: timestamp,
  updated_at: timestamp
)
```

### Regio's
```sql
regio (
  id: serial PRIMARY KEY,
  naam: text,
  beschrijving: text,
  created_at: timestamp,
  updated_at: timestamp
)
```

### Verkopers
```sql
verkopers (
  id: uuid PRIMARY KEY,
  naam: text,
  email: text,
  is_admin: boolean,
  regio_id: uuid REFERENCES regio(id),
  aangemaakt_op: timestamp
)
```

### Klanten
```sql
klanten (
  id: uuid PRIMARY KEY,
  bedrijfsnaam: text,
  email: text,
  telefoon: text,
  adres: text,
  btw_nummer: text,
  aangemaakt_op: timestamp
)
```

### Campagnes
```sql
campagnes (
  id: uuid PRIMARY KEY,
  naam: text,
  startdatum: date,
  einddatum: date,
  regio_id: uuid REFERENCES regio(id)
)
```

### Gesprekken
```sql
gesprekken (
  id: uuid PRIMARY KEY,
  datum: date,
  tijdslot: text,
  opmerkingen: text,
  klant_id: uuid REFERENCES klanten(id),
  verkoper_id: uuid REFERENCES verkopers(id),
  campagne_id: uuid REFERENCES campagnes(id),
  regio_id: uuid REFERENCES regio(id),
  resultaatcode: text,
  aangemaakt_op: timestamp
)
```

## 🔐 Authenticatie

Het dashboard gebruikt Supabase Auth voor beveiligde toegang:

1. **Admin gebruikers** moeten bestaan in de `admin_users` tabel
2. **Supabase Auth accounts** moeten gekoppeld zijn aan admin gebruikers
3. **Dubbele verificatie** voor maximale beveiliging

## 🎨 UI/UX

- **Donkere thema** voor professionele uitstraling
- **Responsive design** voor alle apparaten
- **Real-time updates** via Supabase subscriptions
- **Intuïtieve navigatie** met sidebar menu
- **Loading states** en error handling

## 📱 Responsive Design

Het dashboard is volledig responsive en werkt op:
- Desktop computers
- Tablets
- Mobiele telefoons

## 🔄 Real-time Features

- Live updates van alle data
- Real-time notificaties
- Automatische data synchronisatie
- Instant feedback bij acties

## 🚀 Deployment

### Vercel (Aanbevolen)
1. Push naar GitHub
2. Verbind met Vercel
3. Configureer environment variables
4. Deploy automatisch

### Andere platforms
Het project kan ook gedeployed worden op:
- Netlify
- Railway
- Heroku
- Eigen server

## 🤝 Bijdragen

1. Fork de repository
2. Maak een feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit je wijzigingen (`git commit -m 'Add some AmazingFeature'`)
4. Push naar de branch (`git push origin feature/AmazingFeature`)
5. Open een Pull Request

## 📄 Licentie

Dit project is eigendom van Impact IQ.

## 📞 Support

Voor vragen of ondersteuning:
- Email: support@impactiq.nl
- Website: https://impactiq.nl

## 🔄 Changelog

### v1.0.0
- Initiële release
- Volledig admin dashboard
- Authenticatie systeem
- CRUD functionaliteit voor alle modules
- Real-time updates
- Responsive design

---

**Ontwikkeld door Impact IQ** 🚀 