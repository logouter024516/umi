export interface MockImage {
  id: string;
  src: string;
  title: string;
  location: string;
  desc: string;
  temp: string;
  tempValue: number;
  isHeat: boolean;
  probs: { className: string; probability: number }[];
  suggestion: string;
  sourceLabel: string;
  sourceUrl: string;
}

export interface MockMessage {
  id: number;
  author: string;
  role: '시민' | '연구원' | '나';
  text: string;
  time: string;
}

export const MOCK_IMAGES: MockImage[] = [
  {
    id: 'rooftop',
    src: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
    sourceLabel: 'Unsplash',
    sourceUrl: 'https://unsplash.com/'
    title: '옥상 아스팔트',
    location: '1-3 · 본관 옥상',
    desc: '방수 아스팔트 마감, 정오 직사광 노출',
    temp: '38.2℃',
    tempValue: 38.2,
    isHeat: true,
    probs: [
      { className: 'Urban Heat Island', probability: 0.89 },
      { className: 'Normal', probability: 0.11 },
    ],
    suggestion: '쿨루프 도장 + 옥상 녹화 제안',
  },
  {
    id: 'asphalt',
    src: 'https://images.unsplash.com/photo-1732987499973-e4fd25f4968c?auto=format&fit=crop&w=1200&q=80',
    sourceLabel: 'Unsplash',
    sourceUrl: 'https://unsplash.com/photos/an-empty-street-with-a-few-cars-driving-down-it-5xY2Q7-smW8'
    title: '아스팔트 도로',
    location: '2-5 · 통학로',
    desc: '차도 + 보도, 가로수 단절 구간',
    temp: '37.5℃',
    tempValue: 37.5,
    isHeat: true,
    probs: [
      { className: 'Urban Heat Island', probability: 0.82 },
      { className: 'Normal', probability: 0.18 },
    ],
    suggestion: '차열성 포장 + 가로수 바람길 제안',
  },
  {
    id: 'park',
    src: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=80',
    sourceLabel: 'Unsplash',
    sourceUrl: 'https://unsplash.com/'
    title: '도시 공원',
    location: '운동장 옆 녹지',
    desc: '수목 + 잔디, 증발산 활발 구간',
    temp: '29.1℃',
    tempValue: 29.1,
    isHeat: false,
    probs: [
      { className: 'Normal', probability: 0.93 },
      { className: 'Urban Heat Island', probability: 0.07 },
    ],
    suggestion: '현재 상태 양호 · 녹지 유지 관리',
  },
  {
    id: 'coolroof',
    src: 'https://images.unsplash.com/photo-1513257068508-0cd03c3209aa?auto=format&fit=crop&w=1200&q=80',
    sourceLabel: 'Unsplash · Chuttersnap',
    sourceUrl: 'https://unsplash.com/photos/aerial-photo-of-trees-and-high-rise-buildings-mEOfn2dK0Vo'
    title: '쿨루프 건물',
    location: '3-2 · 강당동',
    desc: '고반사 차열 도장 시공 완료',
    temp: '30.4℃',
    tempValue: 30.4,
    isHeat: false,
    probs: [
      { className: 'Normal', probability: 0.87 },
      { className: 'Urban Heat Island', probability: 0.13 },
    ],
    suggestion: '쿨루프 우수 사례 · 확산 제안',
  },
];

export const MOCK_CHAT: Record<string, MockMessage[]> = {
  rooftop: [
    { id: 1, author: '김시민', role: '시민', text: '여기 여름마다 숨이 막혀요. 옥상에서 열기가 올라오는 게 느껴집니다.', time: '10:02' },
    { id: 2, author: '이기후', role: '연구원', text: '38.2℃면 위험 구간입니다. 쿨루프 도장 시 표면온도 -8℃ 기대할 수 있어요.', time: '10:05' },
    { id: 3, author: '박녹지', role: '시민', text: '옥상 텃밭 같이 하면 주민 참여도 올릴 수 있지 않을까요?', time: '10:09' },
  ],
  asphalt: [
    { id: 1, author: '최통학', role: '시민', text: '등하교길 아스팔트에서 열기가 올라와요. 아이들이 힘들어합니다.', time: '09:41' },
    { id: 2, author: '이기후', role: '연구원', text: '차열 포장 + 가로수 2열 식재가 가장 비용 대비 효과 좋습니다.', time: '09:47' },
  ],
  park: [
    { id: 1, author: '박녹지', role: '시민', text: '공원 들어서자마자 3℃는 내려가는 느낌이에요.', time: '11:12' },
    { id: 2, author: '이기후', role: '연구원', text: '수목 증발산 효과가 잘 유지되고 있습니다. 관수 관리가 핵심입니다.', time: '11:15' },
  ],
  coolroof: [
    { id: 1, author: '김시민', role: '시민', text: '쿨루프 시공 후 실내가 확실히 시원해졌어요!', time: '13:20' },
    { id: 2, author: '박녹지', role: '시민', text: '우리 동에도 확산하면 좋겠어요. 비용 공유할 수 있을까요?', time: '13:26' },
  ],
};

export const QUICK_REPLIES = ['공감합니다 👍', '우리 동네도 필요해요', '비용이 궁금해요', '전문가 의견 부탁드려요'];

export interface MockProposalComment {
  id: number;
  author: string;
  text: string;
}

export interface MockProposal {
  id: number;
  author: string;
  title: string;
  content: string;
  category: string;
  status: string;
  location: string;
  likes: number;
  comments: MockProposalComment[];
  created_at: string;
}

export const MOCK_PROPOSALS: MockProposal[] = [
  {
    id: 101,
    author: '김시민',
    title: '본관 옥상 쿨루프 + 텃밭 시범사업 제안',
    content: '옥상 아스팔트 38.2℃ 구간에 고반사 도장을 하고, 남는 공간에 상자텃밭을 두면 온도도 낮추고 주민 참여도 올릴 수 있습니다.',
    category: '쿨루프',
    status: 'Urban Heat Island (89%)',
    location: '1-3 · 본관 옥상',
    likes: 12,
    comments: [
      { id: 1001, author: '이기후', text: '표면온도 -8℃, 실내 -2℃ 실측 사례 있습니다. 찬성합니다.' },
      { id: 1002, author: '박녹지', text: '방수층 보호 조건으로 텃밭 하중 검토만 되면 좋겠어요.' },
    ],
    created_at: '2026-07-02',
  },
  {
    id: 102,
    author: '최통학',
    title: '통학로 차열 포장 + 가로수 2열 식재',
    content: '2-5 통학로 37.5℃ 구간에 차열성 포장을 적용하고 단절된 가로수를 메워 바람길을 만들자는 제안입니다.',
    category: '바람길',
    status: 'Urban Heat Island (82%)',
    location: '2-5 · 통학로',
    likes: 8,
    comments: [{ id: 1003, author: '이기후', text: '비용 대비 효과가 가장 좋은 조합입니다.' }],
    created_at: '2026-07-05',
  },
];
