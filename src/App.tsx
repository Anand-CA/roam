import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight, Bookmark, CalendarDays, Compass, Home, MapPin, Search, Shuffle, Sparkles, UserRound, Utensils, Coffee, Trees, Moon, Sun } from 'lucide-react'
import { discoveries as sampleDiscoveries, type Discovery } from './data/discoveries'
import { supabase } from './lib/supabase'

const filters = ['Everything', 'Food', 'Cafes', 'Places', 'Events'] as const
type Screen = 'Home' | 'Explore' | 'Saved' | 'You'
type NearbyRow = { id: string; category: Discovery['category']; title: string; detail: string; budget_min_inr: number; budget_max_inr: number; distance_meters: number; image_url: string | null; note: string | null }
type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> }
const DEFAULT_KOCHI = { latitude: 9.9312, longitude: 76.2673 }

function imageSource(value: string) {
  return value.startsWith('http') ? value : `https://images.unsplash.com/${value}?auto=format&fit=crop&w=900&q=80`
}

function formatBudget(minimum: number, maximum: number) {
  const format = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)
  if (minimum === 0 && maximum === 0) return 'Free'
  return minimum === maximum ? format(minimum) : `${format(minimum)}–${format(maximum)}`
}

function App() {
  const [screen, setScreen] = useState<Screen>('Home')
  const [activeFilter, setActiveFilter] = useState<string>('Everything')
  const [items, setItems] = useState<Discovery[]>(sampleDiscoveries)
  const [saved, setSaved] = useState<string[]>(() => JSON.parse(localStorage.getItem('roam:saved') ?? '[]') as string[])
  const [surprise, setSurprise] = useState<Discovery | null>(null)
  const [surpriseReason, setSurpriseReason] = useState('')
  const [surpriseLabel, setSurpriseLabel] = useState('A ROAM PICK')
  const [surpriseBusy, setSurpriseBusy] = useState(false)
  const [locationName, setLocationName] = useState('Kochi')
  const [coordinates, setCoordinates] = useState(DEFAULT_KOCHI)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const stored = localStorage.getItem('roam:theme')
    if (stored === 'light' || stored === 'dark') return stored
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })
  const requestController = useRef<AbortController | null>(null)

  const shown = useMemo(() => items.filter((item) =>
    (activeFilter === 'Everything' || item.category.toLowerCase() === activeFilter.replace(/s$/, '').toLowerCase()) &&
    (screen !== 'Saved' || saved.includes(String(item.id))),
  ), [items, activeFilter, screen, saved])

  async function loadNearby(latitude: number, longitude: number, name: string, filter = activeFilter) {
    requestController.current?.abort()
    const controller = new AbortController()
    requestController.current = controller
    setBusy(true)
    setMessage('')
    setLocationName(name)
    setCoordinates({ latitude, longitude })
    if (supabase) {
      const category = filter === 'Everything' ? null : filter.replace(/s$/, '')
      const { data, error } = await supabase.functions.invoke<{ items: NearbyRow[] }>('discover', {
        body: { latitude, longitude, radiusMeters: 12000, category },
        signal: controller.signal,
        timeout: 10000,
      })
      if (controller.signal.aborted) return
      if (error) {
        setMessage('Showing a few Roam picks while we reconnect.')
      } else if (data) {
        setItems(data.items.map((row) => ({
          id: row.id,
          category: row.category,
          title: row.title,
          detail: row.detail,
          distance: row.distance_meters < 1000 ? `${Math.round(row.distance_meters)} m` : `${(row.distance_meters / 1000).toFixed(1)} km`,
          image: row.image_url ?? 'photo-1517248135467-4c7edcad34c4',
          note: row.note ?? undefined,
          budgetMinInr: row.budget_min_inr,
          budgetMaxInr: row.budget_max_inr,
        })))
      }
    }
    if (!controller.signal.aborted) setBusy(false)
  }

  useEffect(() => {
    void loadNearby(DEFAULT_KOCHI.latitude, DEFAULT_KOCHI.longitude, 'Kochi')
  // First load uses the city's public centre; precise location is only used after the user taps the location control.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => () => requestController.current?.abort(), [])

  useEffect(() => {
    const handler = (event: Event) => {
      event.preventDefault()
      setInstallPrompt(event as InstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  useEffect(() => { localStorage.setItem('roam:saved', JSON.stringify(saved)) }, [saved])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('roam:theme', theme)
    const meta = document.querySelector('meta[name="theme-color"]')
    meta?.setAttribute('content', theme === 'dark' ? '#111311' : '#f4f2ed')
  }, [theme])

  function toggleTheme() {
    setTheme((current) => current === 'light' ? 'dark' : 'light')
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      setMessage('Location is not available on this device.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => void loadNearby(coords.latitude, coords.longitude, 'Near you'),
      () => setMessage('Location permission was not available. Showing Kochi picks.'),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    )
  }

  function toggleSaved(item: Discovery) {
    const id = String(item.id)
    setSaved((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id])
  }

  async function installApp() {
    if (!installPrompt) return
    await installPrompt.prompt()
    setInstallPrompt(null)
  }

  async function pickSurprise() {
    if (!items.length || surpriseBusy) return
    setSurpriseBusy(true)
    setSurpriseReason('')
    try {
      if (supabase) {
        const candidates = items.slice(0, 12).map(({ id, category, title, detail, note, budgetMinInr, budgetMaxInr }) => ({ id: String(id), category, title, detail, note, budgetMinInr, budgetMaxInr }))
        const { data, error } = await supabase.functions.invoke<{ itemId: string; reason: string }>('recommend', { body: { items: candidates }, timeout: 15000 })
        const selected = !error && data ? items.find((item) => String(item.id) === data.itemId) : undefined
        if (selected) {
          setSurprise(selected)
          setSurpriseReason(data?.reason ?? '')
          setSurpriseLabel('PICKED FOR YOU')
          return
        }
      }
      setSurprise(items[Math.floor(Math.random() * items.length)])
      setSurpriseLabel('A ROAM PICK')
    } finally {
      setSurpriseBusy(false)
    }
  }

  const heading = screen === 'Explore' ? 'Find a good thing.' : screen === 'Saved' ? 'Keep these close.' : screen === 'You' ? 'Your Roam.' : 'Find your somewhere.'

  return (
    <main className="app-shell">
      <header className="app-header">
        <a className="wordmark" href="#top" onClick={() => setScreen('Home')}>roam<span>.</span></a>
        <div className="header-actions">
          <button className="location-button" onClick={useMyLocation} aria-label="Use my current location"><MapPin size={14} /><span>{locationName}</span><span className="location-dot" /></button>
          <button className="theme-button" onClick={toggleTheme} aria-label={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'} title={theme === 'light' ? 'Dark theme' : 'Light theme'}>
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </button>
        </div>
      </header>

      {screen === 'You' ? <section className="account-screen">
        <div className="screen-kicker"><span className="eyebrow-line" /> YOUR LITTLE CORNER</div>
        <h1>{heading}</h1>
        <p className="account-copy">A place for your saved spots, favourite neighbourhoods, and plans for later.</p>
        <div className="account-card"><UserRound size={22} /><div><strong>Your account</strong><span>Sign in and personal touches are coming next.</span></div><ArrowRight size={16} /></div>
        {installPrompt && <button className="install-button" onClick={installApp}>Add Roam to your home screen <ArrowRight size={15} /></button>}
      </section> : <>
        {screen === 'Home' && <section className="home-intro" id="top">
          <div className="screen-kicker"><span className="eyebrow-line" /> THE CITY, WELL SPENT</div>
          <h1>Find your<br /><em>somewhere.</em></h1>
          <p className="hero-subtitle">Good things are closer than you think. Here are a few worth stepping out for.</p>
          <div className="category-grid" aria-label="Explore by category">
            {[
              { label: 'Food', filter: 'Food', Icon: Utensils, tone: 'food' },
              { label: 'Cafes', filter: 'Cafes', Icon: Coffee, tone: 'cafes' },
              { label: 'Places', filter: 'Places', Icon: Trees, tone: 'places' },
              { label: 'Events', filter: 'Events', Icon: CalendarDays, tone: 'events' },
            ].map(({ label, filter, Icon, tone }) => <button key={label} className={`category-tile ${tone}`} onClick={() => { setActiveFilter(filter); setScreen('Explore'); if (supabase) void loadNearby(coordinates.latitude, coordinates.longitude, locationName, filter) }}><Icon size={19} strokeWidth={1.8} /><span>{label}</span><ArrowRight size={14} /></button>)}
          </div>
          <button className="surprise-button" onClick={() => void pickSurprise()} disabled={surpriseBusy}><Shuffle size={15} /> {surpriseBusy ? 'Finding your pick…' : 'Surprise me'} <ArrowRight size={15} /></button>
          <p className="image-note"><Sparkles size={12} /> Real photos from Unsplash. Demo listings; photos are illustrative.</p>
        </section>}

        <section className={`discover-section ${screen === 'Home' ? '' : 'screen-discover'}`}>
          <div className="section-heading">
            <div><p className="screen-kicker"><span className="eyebrow-line" /> {screen === 'Saved' ? 'YOUR BOOKMARKS' : 'AROUND YOU, RIGHT NOW'}</p><h2>{screen === 'Home' ? 'Good things nearby' : heading}<span>.</span></h2></div>
            {screen === 'Explore' && <button className="icon-button" aria-label="Search nearby"><Search size={18} /></button>}
          </div>
          {screen !== 'Saved' && <div className="filter-row" aria-label="Filter discoveries">
            {filters.map((filter) => <button key={filter} aria-pressed={activeFilter === filter} className={activeFilter === filter ? 'filter active' : 'filter'} onClick={() => { setActiveFilter(filter); if (supabase) void loadNearby(coordinates.latitude, coordinates.longitude, locationName, filter) }}>{filter}</button>)}
          </div>}
          {message && <p className="inline-message">{message}</p>}
          {busy && <div className="loading-line"><span /> Finding nearby picks…</div>}
          {!busy && shown.length === 0 ? <div className="empty-state"><Bookmark size={22} /><strong>{screen === 'Saved' ? 'Nothing saved yet.' : 'Nothing nearby just yet.'}</strong><span>{screen === 'Saved' ? 'Tap the bookmark on a place to keep it here.' : 'Try another category or a wider radius.'}</span></div> : <div className="discovery-list">
            {shown.map((item) => <article className="discovery-card" key={item.id}>
              <div className="card-image-wrap"><img src={imageSource(item.image)} alt="" loading="lazy" decoding="async" /><span className="category-tag">{item.category}</span><button className={saved.includes(String(item.id)) ? 'save-button is-saved' : 'save-button'} onClick={() => toggleSaved(item)} aria-label={saved.includes(String(item.id)) ? `Remove ${item.title} from saved` : `Save ${item.title}`}><Bookmark size={17} fill={saved.includes(String(item.id)) ? 'currentColor' : 'none'} /></button></div>
              <div className="card-info"><div><p className="card-note">{item.note}</p><h3>{item.title}</h3><p className="card-detail">{item.detail}</p><p className="budget-line">{formatBudget(item.budgetMinInr, item.budgetMaxInr)} <span>{item.budgetMinInr === 0 && item.budgetMaxInr === 0 ? 'entry' : 'est. / person'}</span></p></div><span className="distance">{item.distance}</span></div>
            </article>)}
          </div>}
          {screen === 'Home' && <button className="more-button" onClick={() => setScreen('Explore')}>Explore around you <ArrowRight size={15} /></button>}
        </section>
      </>}

      <footer className="app-footer"><Compass size={17} /><span>Less scrolling. More stumbling into something good.</span></footer>

      <nav className="bottom-nav" aria-label="App navigation">
        {([{ name: 'Home', Icon: Home }, { name: 'Explore', Icon: Compass }, { name: 'Saved', Icon: Bookmark }, { name: 'You', Icon: UserRound }] as const).map(({ name, Icon }) => <button key={name} className={screen === name ? 'bottom-tab active' : 'bottom-tab'} onClick={() => { setScreen(name); setActiveFilter('Everything') }} aria-current={screen === name ? 'page' : undefined}><Icon size={19} strokeWidth={screen === name ? 2 : 1.7} /><span>{name}</span>{name === 'Saved' && saved.length > 0 && <i className="saved-dot" />}</button>)}
      </nav>

      {installPrompt && <button className="floating-install" onClick={installApp}>Install Roam <ArrowRight size={14} /></button>}

      {surprise && <div className="modal-backdrop" onClick={() => setSurprise(null)}><section className="surprise-modal" role="dialog" aria-modal="true" aria-labelledby="surprise-title" onClick={(event) => event.stopPropagation()}>
        <button className="modal-close" onClick={() => setSurprise(null)} aria-label="Close">×</button><p className="screen-kicker"><span className="eyebrow-line" /> {surpriseLabel}</p><div className="modal-image"><img src={imageSource(surprise.image)} alt="" decoding="async" /></div><p className="card-note">{surprise.category} · {surprise.distance}</p><h2 id="surprise-title">{surprise.title}</h2><p className="card-detail">{surpriseReason || surprise.detail}</p><p className="budget-line">{formatBudget(surprise.budgetMinInr, surprise.budgetMaxInr)} <span>{surprise.budgetMinInr === 0 && surprise.budgetMaxInr === 0 ? 'entry' : 'est. / person'}</span></p><button className="surprise-button" onClick={() => void pickSurprise()} disabled={surpriseBusy}><Shuffle size={15} /> {surpriseBusy ? 'Finding another…' : 'Pick another'} <ArrowRight size={15} /></button>
      </section></div>}
    </main>
  )
}

export default App
