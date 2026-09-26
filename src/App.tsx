import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  ArrowLeft, ArrowRight, Bookmark, CalendarDays, ChevronRight, Coffee, Compass,
  Crosshair, Home, Layers, MapPin, Menu, Moon, Navigation, Plus,
  Search, Settings, Share2, SlidersHorizontal, Sparkles, Sun, Ticket, UserRound,
  Utensils, Trees
} from 'lucide-react'
import { discoveries as seed, type Discovery } from './data/discoveries'

type Screen = 'home' | 'explore' | 'saved' | 'profile' | 'food' | 'events' | 'detail' | 'map' | 'planner' | 'notifications'
type Theme = 'light' | 'dark'

const foodSeed: Discovery[] = [
  { id: 'paragon', category: 'Food', title: 'Paragon Restaurant', detail: 'Biryani · Indian · Family Friendly', distance: '2.1 km', image: 'photo-1517248135467-4c7edcad34c4', note: '4.7 (12.4K)', budgetMinInr: 300, budgetMaxInr: 700 },
  { id: 'rahmaniya', category: 'Food', title: 'Rahmaniya Hotel', detail: 'Biryani · Beef · Kerala', distance: '3.4 km', image: 'photo-1552566626-52f8b828add9', note: '4.6 (8.1K)', budgetMinInr: 250, budgetMaxInr: 600 },
  { id: 'kashi', category: 'Cafe', title: 'Kashi Art Cafe', detail: 'Cafe · Coffee · Desserts', distance: '4.1 km', image: 'photo-1501339847302-ac426a4a7cbb', note: '4.8 (2.4K)', budgetMinInr: 250, budgetMaxInr: 700 },
  { id: 'grand', category: 'Food', title: 'Grand Pavilion', detail: 'Fine Dining · North Indian', distance: '4.3 km', image: 'photo-1414235077428-338989a2e8c0', note: '4.5 (6.8K)', budgetMinInr: 800, budgetMaxInr: 1600 },
  { id: 'zam', category: 'Food', title: 'Zam Zam Restaurant', detail: 'Biryani · Mandi · Arabic', distance: '4.9 km', image: 'photo-1517248135467-4c7edcad34c4', note: '4.4 (3.8K)', budgetMinInr: 300, budgetMaxInr: 700 },
]
const eventSeed: Discovery[] = [
  { id: 'indie', category: 'Event', title: 'Indie Night at Shooters', detail: 'Shooters Cafe · Live Music', distance: '2.8 km', image: 'photo-1470229722913-7c0e2dbbafd3', note: 'FRI 26 SEP', budgetMinInr: 299, budgetMaxInr: 299 },
  { id: 'comedy', category: 'Event', title: 'Stand-up Comedy Night', detail: 'The Habitat Room · Comedy', distance: '3.4 km', image: 'photo-1585699324551-f6c309eedeca', note: 'SAT 27 SEP', budgetMinInr: 499, budgetMaxInr: 499 },
  { id: 'festival', category: 'Event', title: 'Kochi Food Festival', detail: 'Marine Drive · Food Festival', distance: '4.1 km', image: 'photo-1515003197210-e0cd71810b5f', note: 'SUN 28 SEP', budgetMinInr: 0, budgetMaxInr: 0 },
]
const placeSeed: Discovery[] = [
  { id: 'fort', category: 'Place', title: 'Fort Kochi', detail: 'Heritage · Photography · Walks', distance: '1.4 km', image: 'photo-1582510003544-4d00b7f74220', note: 'POPULAR', budgetMinInr: 0, budgetMaxInr: 0 },
  { id: 'cherai', category: 'Place', title: 'Cherai Beach', detail: 'Beach · Sunset · Nature', distance: '24 km', image: 'photo-1507525428034-b723cf961d3e', note: 'NATURE', budgetMinInr: 0, budgetMaxInr: 0 },
  { id: 'mattancherry', category: 'Place', title: 'Mattancherry', detail: 'Culture · Markets · Heritage', distance: '3.1 km', image: 'photo-1524492412937-b28074a5d7da', note: 'CULTURE', budgetMinInr: 0, budgetMaxInr: 0 },
]

function imageSource(value: string) {
  return value.startsWith('http') ? value : `https://images.unsplash.com/${value}?auto=format&fit=crop&w=1000&q=85`
}

function Rating({ value = '4.7', reviews = '12.4K' }: { value?: string; reviews?: string }) {
  return <span className="rating"><span>★</span> {value} <small>({reviews})</small></span>
}

function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [selected, setSelected] = useState<Discovery>(foodSeed[0])
  const [activeTab, setActiveTab] = useState('ALL')
  const [saved, setSaved] = useState<string[]>(() => JSON.parse(localStorage.getItem('roam:saved') ?? '[]'))
  const [theme, setTheme] = useState<Theme>(() => {
    const value = localStorage.getItem('roam:theme')
    return value === 'dark' || value === 'light' ? value : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  })

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('roam:theme', theme)
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#101214' : '#f6f6f3')
  }, [theme])

  useEffect(() => localStorage.setItem('roam:saved', JSON.stringify(saved)), [saved])

  const allItems = useMemo(() => [...foodSeed, ...eventSeed, ...placeSeed, ...seed], [])
  const toggleSaved = (item: Discovery) => setSaved((current) => current.includes(String(item.id)) ? current.filter((id) => id !== String(item.id)) : [...current, String(item.id)])

  const openDetail = (item: Discovery) => {
    setSelected(item)
    setScreen('detail')
  }

  const setBottomScreen = (value: 'home' | 'explore' | 'saved' | 'profile') => {
    setScreen(value)
    setActiveTab('ALL')
  }

  const goBack = () => setScreen(screen === 'detail' || screen === 'map' || screen === 'planner' || screen === 'notifications' ? 'home' : 'home')

  return (
    <main className="app-shell">
      {screen === 'home' && <HomeScreen onNavigate={setScreen} onOpen={openDetail} saved={saved} toggleSaved={toggleSaved} />}
      {screen === 'food' && <ListingScreen title="Food" subtitle="Kochi" items={foodSeed} activeTab={activeTab} setActiveTab={setActiveTab} onBack={goBack} onOpen={openDetail} saved={saved} toggleSaved={toggleSaved} tabs={['ALL', 'BIRIYANI', 'SOUTH INDIAN', 'CAFES', 'SEAFOOD']} />}
      {screen === 'events' && <ListingScreen title="Events" subtitle="Kochi" items={eventSeed} activeTab={activeTab} setActiveTab={setActiveTab} onBack={goBack} onOpen={openDetail} saved={saved} toggleSaved={toggleSaved} tabs={['TODAY', 'THIS WEEK', 'MUSIC', 'COMEDY', 'FOOD']} />}
      {screen === 'explore' && <ExploreScreen onOpen={openDetail} onMap={() => setScreen('map')} />}
      {screen === 'saved' && <SavedScreen items={allItems.filter((item) => saved.includes(String(item.id)))} onOpen={openDetail} />}
      {screen === 'profile' && <ProfileScreen theme={theme} onTheme={() => setTheme(theme === 'light' ? 'dark' : 'light')} />}
      {screen === 'detail' && <DetailScreen item={selected} saved={saved.includes(String(selected.id))} onBack={goBack} onSave={() => toggleSaved(selected)} />}
      {screen === 'map' && <MapScreen item={foodSeed[0]} onBack={goBack} onOpen={openDetail} />}
      {screen === 'planner' && <PlannerScreen onBack={goBack} onOpen={openDetail} />}
      {screen === 'notifications' && <NotificationsScreen onBack={goBack} />}

      {['home','explore','saved','profile'].includes(screen) && <BottomNav screen={screen as 'home'|'explore'|'saved'|'profile'} onNavigate={setBottomScreen} savedCount={saved.length} />}
    </main>
  )
}

function Header({ title, subtitle, onBack, right = 'none' }: { title: string; subtitle?: string; onBack?: () => void; right?: 'search'|'filter'|'settings'|'plus'|'none' }) {
  return <header className="topbar">
    {onBack ? <button className="plain-icon" onClick={onBack} aria-label="Back"><ArrowLeft /></button> : <div className="topbar-brand">ROAM</div>}
    <div className={onBack ? 'topbar-title' : 'topbar-location'}><strong>{title}</strong>{subtitle && <span>{subtitle}</span>}</div>
    {right === 'search' && <button className="plain-icon"><Search /></button>}
    {right === 'filter' && <button className="plain-icon"><SlidersHorizontal /></button>}
    {right === 'settings' && <button className="plain-icon"><Settings /></button>}
    {right === 'plus' && <button className="plain-icon"><Plus /></button>}
    {right === 'none' && <div className="topbar-spacer" />}
  </header>
}

function HomeScreen({ onNavigate, onOpen, saved, toggleSaved }: { onNavigate: (s: Screen) => void; onOpen: (i: Discovery) => void; saved: string[]; toggleSaved: (i: Discovery) => void }) {
  return <div className="screen">
    <header className="home-top"><div className="topbar-brand">ROAM</div><button className="city-button">Kochi⌄</button><button className="plain-icon"><Menu /></button></header>
    <section className="home-hero">
      <h1>What’s<br />worth doing<br />near you?</h1>
      <p>Food, events, hidden spots — curated,<br />not crowded.</p>
      <button className="search-prompt"><Search /><span>Try “best biryani near me”</span><ArrowRight /></button>
    </section>
    <div className="quick-grid">
      <QuickTile tone="orange" icon={<Utensils />} title="FOOD" subtitle="Best dishes" onClick={() => onNavigate('food')} />
      <QuickTile tone="black" icon={<CalendarDays />} title="EVENTS" subtitle="Happening now" onClick={() => onNavigate('events')} />
      <QuickTile tone="stone" icon={<Trees />} title="EXPLORE" subtitle="Nature & spots" onClick={() => onNavigate('explore')} />
      <QuickTile tone="stone" icon={<Coffee />} title="CAFES" subtitle="Chill places" onClick={() => onNavigate('food')} />
    </div>
    <button className="surprise-tile" onClick={() => onOpen(foodSeed[0])}><Sparkles /><span><strong>SURPRISE ME</strong><small>Find something amazing nearby</small></span><ArrowRight /></button>
    <section className="home-nearby">
      <div className="section-title"><div><small>NEARBY</small><h2>Good places around Kochi</h2></div><button onClick={() => onNavigate('explore')}>SEE ALL</button></div>
      <div className="horizontal-cards">{foodSeed.slice(0,3).map((item) => <SmallPlaceCard key={item.id} item={item} saved={saved.includes(String(item.id))} onOpen={onOpen} onSave={toggleSaved} />)}</div>
    </section>
  </div>
}

function QuickTile({ tone, icon, title, subtitle, onClick }: { tone: string; icon: ReactNode; title: string; subtitle: string; onClick: () => void }) {
  return <button className={`quick-tile ${tone}`} onClick={onClick}>{icon}<span><strong>{title}</strong><small>{subtitle}</small></span></button>
}

function ListingScreen({ title, subtitle, items, tabs, activeTab, setActiveTab, onBack, onOpen, saved, toggleSaved }: { title: string; subtitle: string; items: Discovery[]; tabs: string[]; activeTab: string; setActiveTab: (s: string) => void; onBack: () => void; onOpen: (i: Discovery) => void; saved: string[]; toggleSaved: (i: Discovery) => void }) {
  return <div className="screen listing-screen">
    <Header title={title} subtitle={subtitle} onBack={onBack} right="filter" />
    <div className="chip-row">{tabs.map((tab) => <button className={activeTab === tab ? 'chip active' : 'chip'} key={tab} onClick={() => setActiveTab(tab)}>{tab}</button>)}</div>
    <div className="list-stack">{items.map((item) => <ListCard key={item.id} item={item} onOpen={onOpen} saved={saved.includes(String(item.id))} onSave={toggleSaved} />)}</div>
  </div>
}

function ListCard({ item, onOpen, saved, onSave }: { item: Discovery; index: number; onOpen: (i: Discovery) => void; saved: boolean; onSave: (i: Discovery) => void }) {
  return <article className="list-card" onClick={() => onOpen(item)}>
    <img src={imageSource(item.image)} alt="" />
    <div className="list-card-copy"><h3>{item.title}</h3><Rating /><p>{item.detail} · {item.distance}</p><small>{item.category} · {item.category === 'Food' ? 'Indian' : item.category === 'Cafe' ? 'Coffee · Desserts' : 'Kochi'}</small></div>
    <button className={saved ? 'bookmark active' : 'bookmark'} onClick={(e) => { e.stopPropagation(); onSave(item) }}><Bookmark fill={saved ? 'currentColor' : 'none'} /></button>
  </article>
}

function DetailScreen({ item, saved, onBack, onSave }: { item: Discovery; saved: boolean; onBack: () => void; onSave: () => void }) {
  return <div className="screen detail-screen">
    <div className="detail-hero"><img src={imageSource(item.image)} alt="" /><button className="hero-back" onClick={onBack}><ArrowLeft /></button><div className="hero-actions"><button onClick={onSave}><Bookmark fill={saved ? 'currentColor' : 'none'} /></button><button><Share2 /></button></div></div>
    <section className="detail-body">
      <h1>{item.title}</h1><Rating /><p className="detail-distance">📍 {item.distance} · Kochi</p>
      <div className="detail-tags"><span>BIRYANI</span><span>SEAFOOD</span><span>INDIAN</span><span>FAMILY FRIENDLY</span></div>
      <div className="open-line"><i /> Open · Closes 11:30 PM</div>
      <div className="action-row"><button className="primary-action"><Navigation /> GET DIRECTIONS</button><button className="secondary-action">☎ CALL</button></div>
      <div className="detail-tabs"><span className="active">OVERVIEW</span><span>POPULAR DISHES</span><span>REVIEWS</span><span>PHOTOS</span></div>
      <h2>Popular Dishes</h2>
      <div className="dish-grid">{['Chicken Biryani','Beef Fry','Porotta + Beef'].map((name, i) => <div key={name}><img src={imageSource([foodSeed[0].image, foodSeed[1].image, 'photo-1551218808-94e220e084d2'][i])} alt="" /><strong>{name}</strong><small>★ {['4.8 (4.2K)','4.7 (3.1K)','4.6 (2.8K)'][i]}</small></div>)}</div>
    </section>
  </div>
}

function MapScreen({ item, onBack, onOpen }: { item: Discovery; onBack: () => void; onOpen: (i: Discovery) => void }) {
  return <div className="screen map-screen">
    <div className="map-canvas"><div className="map-grid" /><Header title="Kochi" onBack={onBack} right="none" /><div className="map-tabs"><span className="active">RESTAURANTS</span><span>EVENTS</span><span>CAFES</span><span>EXPLORE</span></div><div className="map-label">Marine Drive</div><div className="map-city">Kochi</div><div className="map-pin">●</div><button className="map-control top"><Crosshair /></button><button className="map-control bottom"><Layers /></button></div>
    <button className="map-result" onClick={() => onOpen(item)}><img src={imageSource(item.image)} alt="" /><span><strong>{item.title}</strong><Rating /><small>BIRYANI · INDIAN</small></span><ArrowRight /></button>
  </div>
}

function PlannerScreen({ onBack, onOpen }: { onBack: () => void; onOpen: (i: Discovery) => void }) {
  return <div className="screen planner-screen"><Header title="AI Planner" onBack={onBack} /><div className="planner-copy"><h1>Got 3 hours<br />free tonight?</h1><p>Here’s a plan for you.</p></div><div className="timeline">{[['6:00 PM', foodSeed[2], 'Specialty coffee'],['7:00 PM', eventSeed[1], 'Stand-up comedy'],['9:00 PM', foodSeed[0], 'Biryani']].map(([time,item,label]) => <div className="timeline-row" key={time as string}><time>{time}</time><div className="timeline-dot" /><button onClick={() => onOpen(item as Discovery)}><img src={imageSource((item as Discovery).image)} alt="" /><span><strong>{(item as Discovery).title}</strong><small>{label as string} · {(item as Discovery).distance}</small></span></button></div>)}</div><button className="save-plan"><Sparkles /> SAVE PLAN <ArrowRight /></button></div>
}

function ExploreScreen({ onOpen, onMap }: { onOpen: (i: Discovery) => void; onMap: () => void }) {
  return <div className="screen explore-screen"><Header title="Explore" subtitle="Kochi" right="search" /><div className="chip-row">{['ALL','NATURE','CAFES','CULTURE','PHOTO SPOTS'].map((x,i) => <button className={i===0?'chip active':'chip'} key={x}>{x}</button>)}</div><button className="explore-feature" onClick={() => onOpen(placeSeed[0])}><img src={imageSource(placeSeed[0].image)} alt="" /><span>FORT KOCHI<small>1.4 km</small></span><ArrowRight /></button><div className="explore-grid">{placeSeed.slice(1).map((item) => <button key={item.id} onClick={() => onOpen(item)}><img src={imageSource(item.image)} alt="" /><span>{item.title.toUpperCase()}<small>{item.distance}</small></span><ArrowRight /></button>)}</div><button className="map-launch" onClick={onMap}><MapPin /> VIEW ON MAP</button></div>
}

function NotificationsScreen({ onBack }: { onBack: () => void }) {
  return <div className="screen"><Header title="Notifications" onBack={onBack}/><div className="notification-group"><strong>TODAY</strong>{[['🔥','New restaurant opened near you','The Local Patio · 1.5 km'],['♫','Stand-up Comedy Night tonight','The Habitat Room · 3.4 km'],['◇','Food Festival this weekend','Marine Drive · 4.1 km']].map(([icon,title,meta])=><div className="notification-row" key={title}><b>{icon}</b><span><strong>{title}</strong><small>{meta}</small></span><ChevronRight /></div>)}</div><div className="notification-group"><strong>EARLIER</strong><div className="notification-row"><b>♧</b><span><strong>Your saved place has an event</strong><small>Kashi Art Cafe · Live Music · Tomorrow · 8:00 PM</small></span><ChevronRight /></div></div></div>
}

function SavedScreen({ items, onOpen }: { items: Discovery[]; onOpen: (i: Discovery) => void }) {
  return <div className="screen"><Header title="Saved" right="plus" /><div className="saved-tabs"><span className="active">PLACES</span><span>EVENTS</span><span>PLANS</span></div><div className="saved-list">{(items.length ? items : foodSeed.slice(0,4)).map((item) => <button key={item.id} onClick={() => onOpen(item)}><img src={imageSource(item.image)} alt="" /><span><strong>{item.title}</strong><Rating /><small>{item.category.toUpperCase()} · {item.distance}</small></span><ChevronRight /></button>)}</div></div>
}

function ProfileScreen({ theme, onTheme }: { theme: Theme; onTheme: () => void }) {
  return <div className="screen profile-screen"><Header title="Profile" right="settings" /><div className="profile-head"><div className="avatar">A</div><div><h1>Anand</h1><p>Exploring good food and<br />great places around Kochi.</p></div></div><div className="stats"><span><b>24</b>Saved</span><span><b>12</b>Places visited</span><span><b>5</b>Events attended</span></div><div className="preferences"><div className="section-title"><h2>Preferences</h2><button>EDIT</button></div><div><span>BIRIYANI</span><span>☕ CAFES</span><span>♫ LIVE MUSIC</span><span>◉ COMEDY</span><span>♧ NATURE</span><span>₹ BUDGET FRIENDLY</span></div></div><button className="profile-row"><Ticket /> Notification Settings <ChevronRight /></button><button className="profile-row"><MapPin /> Location <span>Kochi, Kerala</span><ChevronRight /></button><button className="profile-row" onClick={onTheme}>{theme === 'light' ? <Moon /> : <Sun />} {theme === 'light' ? 'Dark theme' : 'Light theme'}<span>{theme}</span><ChevronRight /></button></div>
}

function SmallPlaceCard({ item, saved, onOpen, onSave }: { item: Discovery; saved: boolean; onOpen: (i: Discovery) => void; onSave: (i: Discovery) => void }) {
  return <article className="small-place" onClick={() => onOpen(item)}><div><img src={imageSource(item.image)} alt="" /><button onClick={(e) => {e.stopPropagation(); onSave(item)}}><Bookmark fill={saved ? 'currentColor' : 'none'} /></button></div><strong>{item.title}</strong><Rating /><small>{item.category} · {item.distance}</small></article>
}

function BottomNav({ screen, onNavigate, savedCount }: { screen: 'home'|'explore'|'saved'|'profile'; onNavigate: (s: 'home'|'explore'|'saved'|'profile') => void; savedCount: number }) {
  return <nav className="bottom-nav"><button className={screen==='home'?'active':''} onClick={() => onNavigate('home')}><Home />HOME</button><button className={screen==='explore'?'active':''} onClick={() => onNavigate('explore')}><Compass />EXPLORE</button><button className={screen==='saved'?'active':''} onClick={() => onNavigate('saved')}><Bookmark />SAVED{savedCount>0&&<i/>}</button><button className={screen==='profile'?'active':''} onClick={() => onNavigate('profile')}><UserRound />PROFILE</button></nav>
}

export default App
