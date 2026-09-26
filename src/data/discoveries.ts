export type Discovery = {
  id: number
  category: 'Food' | 'Cafe' | 'Place' | 'Event'
  title: string
  detail: string
  distance: string
  image: string
  note?: string
}

export const discoveries: Discovery[] = [
  { id: 1, category: 'Food', title: 'The Sunday Table', detail: 'Modern Indian · $$', distance: '1.2 km', image: 'photo-1555396273-367ea4eb4db5', note: 'Worth the walk' },
  { id: 2, category: 'Cafe', title: 'Slow Hours', detail: 'Coffee & pastry · ₹₹', distance: '800 m', image: 'photo-1445116572660-236099ec97a0', note: 'A little quiet' },
  { id: 3, category: 'Place', title: 'Lodhi Art District', detail: 'Street art · Free', distance: '2.4 km', image: 'photo-1531058020387-3be344556be6', note: 'Open all day' },
  { id: 4, category: 'Event', title: 'Records After Dark', detail: 'Listening session · Tonight', distance: '1.8 km', image: 'photo-1470229722913-7c0e2dbbafd3', note: '7:30 pm · 12 spots' },
]
