export type Discovery = {
  id: number | string
  category: 'Food' | 'Cafe' | 'Place' | 'Event'
  title: string
  detail: string
  distance: string
  image: string
  note?: string
  budgetMinInr: number
  budgetMaxInr: number
}

export const discoveries: Discovery[] = [
  { id: 1, category: 'Food', title: 'Kochi Kitchen', detail: 'Kerala cuisine', distance: '4.6 km', image: 'photo-1555396273-367ea4eb4db5', note: 'Demo listing', budgetMinInr: 800, budgetMaxInr: 1500 },
  { id: 2, category: 'Cafe', title: 'Waterfront Coffee', detail: 'Coffee & pastry', distance: '3.0 km', image: 'photo-1445116572660-236099ec97a0', note: 'Demo listing', budgetMinInr: 250, budgetMaxInr: 500 },
  { id: 3, category: 'Place', title: 'Fort Kochi Walk', detail: 'Heritage streets · Self-guided', distance: '4.6 km', image: 'photo-1583558257444-cfba032b49ea', note: 'Demo listing · photo of Kochi', budgetMinInr: 0, budgetMaxInr: 0 },
  { id: 4, category: 'Event', title: 'Kochi After Dark', detail: 'Live music · Demo event', distance: '5.7 km', image: 'photo-1470229722913-7c0e2dbbafd3', note: 'Demo listing', budgetMinInr: 499, budgetMaxInr: 999 },
]
