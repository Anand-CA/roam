import { useState } from 'react'
import { ArrowDownRight, ArrowRight, ArrowUpRight, Compass, MapPin, Search, Shuffle, Sparkles } from 'lucide-react'
import { discoveries } from './data/discoveries'

const filters = ['Everything', 'Food', 'Cafes', 'Places', 'Events'] as const

function App() {
  const [activeFilter, setActiveFilter] = useState<string>('Everything')
  const [surprise, setSurprise] = useState<number | null>(null)
  const shown = discoveries.filter((item) => activeFilter === 'Everything' || item.category.toLowerCase() === activeFilter.slice(0, -1).toLowerCase() || item.category === activeFilter)
  const surprisePick = surprise === null ? null : discoveries[surprise]

  function pickSurprise() {
    const next = Math.floor(Math.random() * discoveries.length)
    setSurprise(next)
  }

  return (
    <main className="page-shell">
      <header className="topbar">
        <a className="wordmark" href="#top" aria-label="Roam home">roam<span>.</span></a>
        <nav className="top-links" aria-label="Main navigation">
          <a className="nav-current" href="#discover">Discover</a><a href="#about">Our point of view</a>
        </nav>
        <button className="location-button"><MapPin size={14} strokeWidth={1.8} /> <span>New Delhi</span><span className="location-dot" /></button>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow"><span className="eyebrow-line" /> THE CITY, WELL SPENT</p>
          <h1>Find your<br /><em>somewhere.</em></h1>
          <p className="hero-subtitle">Good things are closer than you think.<br />Here are a few worth stepping out for.</p>
          <button className="surprise-button" onClick={pickSurprise}><Sparkles size={15} /> Surprise me <ArrowUpRight size={15} /></button>
        </div>
        <div className="hero-image-wrap">
          <img className="hero-image" src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1500&q=85" alt="Warmly lit neighborhood restaurant at dusk" />
          <div className="image-caption"><span>01 / 04</span><span>THE GOOD TABLE · HAUZ KHAS</span><ArrowDownRight size={15} /></div>
          <div className="image-stamp">A good<br />place to<br /><i>begin.</i></div>
        </div>
        <div className="hero-index"><span>SCROLL TO WANDER</span><span className="index-rule" /><span>01 — 04</span></div>
      </section>

      <section className="discover-section" id="discover">
        <div className="section-heading">
          <div><p className="eyebrow"><span className="eyebrow-line" /> AROUND YOU, RIGHT NOW</p><h2>Good things nearby<span>.</span></h2></div>
          <button className="search-button" aria-label="Search nearby"><Search size={19} /><span>Search the neighbourhood</span><ArrowRight size={15} /></button>
        </div>
        <div className="filter-row" role="tablist" aria-label="Filter discoveries">
          {filters.map((filter) => <button key={filter} role="tab" aria-selected={activeFilter === filter} className={activeFilter === filter ? 'filter active' : 'filter'} onClick={() => setActiveFilter(filter)}>{filter}</button>)}
          <span className="results-count">{shown.length.toString().padStart(2, '0')} FINDS</span>
        </div>
        <div className="discovery-grid">
          {shown.map((item, index) => <article className={`discovery-card card-${index + 1}`} key={item.id}>
            <div className="card-image-wrap"><img src={`https://images.unsplash.com/${item.image}?auto=format&fit=crop&w=900&q=80`} alt="" /><span className="category-tag">{item.category}</span><button className="card-arrow" aria-label={`Explore ${item.title}`}><ArrowUpRight size={17} /></button></div>
            <div className="card-info"><div><p className="card-note">{item.note}</p><h3>{item.title}</h3><p className="card-detail">{item.detail}</p></div><span className="distance">{item.distance}</span></div>
          </article>)}
        </div>
        <button className="more-button">See all nearby <ArrowRight size={15} /></button>
      </section>

      <section className="closing-note" id="about"><Compass size={19} strokeWidth={1.4} /><p>Less scrolling, more <em>stumbling into something good.</em></p><span>THAT'S THE IDEA.</span></section>
      <footer><a className="wordmark" href="#top">roam<span>.</span></a><span>MADE FOR THE WAY OUT.</span><span>NEW DELHI · 28.6139° N</span></footer>

      {surprisePick && <div className="modal-backdrop" role="presentation" onClick={() => setSurprise(null)}><section className="surprise-modal" role="dialog" aria-modal="true" aria-labelledby="surprise-title" onClick={(event) => event.stopPropagation()}>
        <button className="modal-close" onClick={() => setSurprise(null)} aria-label="Close">×</button><p className="eyebrow"><span className="eyebrow-line" /> YOUR NEXT LITTLE ADVENTURE</p><div className="modal-image"><img src={`https://images.unsplash.com/${surprisePick.image}?auto=format&fit=crop&w=900&q=85`} alt="" /></div><p className="card-note">{surprisePick.category} · {surprisePick.distance}</p><h2 id="surprise-title">{surprisePick.title}</h2><p className="card-detail">{surprisePick.detail}</p><button className="surprise-button" onClick={pickSurprise}><Shuffle size={15} /> Pick another <ArrowRight size={15} /></button>
      </section></div>}
    </main>
  )
}

export default App
