export interface ScenarioPhoto {
  imageUrl: string;
  alt: string;
  photographer: string;
  sourceUrl: string;
}

/**
 * Real photographs used as visual references in the demo.
 * They show general examples, not the user's selected physical locations.
 * The linked Unsplash pages identify each photographer and the Unsplash License.
 */
export const SCENARIO_PHOTOS: Record<string, ScenarioPhoto> = {
  rooftop: {
    imageUrl: 'https://images.unsplash.com/photo-1657981740460-3a83db1bd131?auto=format&fit=crop&w=1200&q=80',
    alt: '파리 도심의 건물 옥상 참고 사진',
    photographer: 'Florian Peeters',
    sourceUrl: 'https://unsplash.com/photos/a-rooftop-of-a-building-DQP-N3Vdkok',
  },
  asphalt: {
    imageUrl: 'https://images.unsplash.com/photo-1543083053-858466b7e503?auto=format&fit=crop&w=1200&q=80',
    alt: '나무 사이로 이어지는 아스팔트 도로 참고 사진',
    photographer: 'Jose Antonio Jiménez Macías',
    sourceUrl: 'https://unsplash.com/photos/asphalt-road-between-trees-during-daytime-EXqxVndATbU',
  },
  park: {
    imageUrl: 'https://images.unsplash.com/photo-1655097596746-97606b3cad65?auto=format&fit=crop&w=1200&q=80',
    alt: '잔디와 나무가 있는 도시 공원 참고 사진',
    photographer: 'Sophie N',
    sourceUrl: 'https://unsplash.com/photos/a-large-green-field-fcCDrddVYzk',
  },
  coolroof: {
    imageUrl: 'https://images.unsplash.com/photo-1651103655575-d96577732e98?auto=format&fit=crop&w=1200&q=80',
    alt: '서울 강남의 흰 지붕이 있는 도시 건물 참고 사진',
    photographer: 'Ryoo Geon Uk',
    sourceUrl: 'https://unsplash.com/photos/a-white-tower-with-a-white-roof-nQpkU96JuUk',
  },
};
