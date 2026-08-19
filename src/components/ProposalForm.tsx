import { useState } from 'react';
import { CATEGORIES, LOCATIONS } from '../types';
import type { Category, LocationType } from '../types';

interface ProposalFormProps {
  isConnected: boolean;
  analysisResult: string;
  onSubmit: (post: {
    author: string;
    title: string;
    content: string;
    status: string;
    location: string;
    category: string;
    image_url: string;
  }) => void;
}

export default function ProposalForm({ isConnected, analysisResult, onSubmit }: ProposalFormProps) {
  const [author, setAuthor] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [location, setLocation] = useState<LocationType | ''>('');
  const [locationCustom, setLocationCustom] = useState('');
  const [category, setCategory] = useState<Category | ''>('');
  const [imageUrl, setImageUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!author.trim() || !title.trim() || !content.trim() || !category) {
      alert('작성자, 제목, 내용, 카테고리를 모두 입력하세요.');
      return;
    }
    const finalLocation = location === '기타' ? locationCustom.trim() : location;
    onSubmit({
      author: author.trim(),
      title: title.trim(),
      content: content.trim(),
      status: analysisResult || '직접 제안',
      location: finalLocation || '',
      category,
      image_url: imageUrl,
    });
    setAuthor('');
    setTitle('');
    setContent('');
    setLocation('');
    setLocationCustom('');
    setCategory('');
    setImageUrl('');
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setImageUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div className="border border-gray-200 rounded bg-white">
      <div className="px-4 py-3 border-b border-gray-100">
        <h2 className="text-sm font-bold text-gray-900">새 제안 작성</h2>
      </div>
      <form onSubmit={handleSubmit} className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">작성자</label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="이름 입력"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:outline-none focus:border-orange-400"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">카테고리 *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:outline-none focus:border-orange-400 bg-white"
            >
              <option value="">선택</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">위치</label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value as LocationType | '기타')}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:outline-none focus:border-orange-400 bg-white"
            >
              <option value="">선택</option>
              {LOCATIONS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
              <option value="기타">기타...</option>
            </select>
          </div>
          {location === '기타' && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">직접 입력</label>
              <input
                type="text"
                value={locationCustom}
                onChange={(e) => setLocationCustom(e.target.value)}
                placeholder="위치 입력"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:outline-none focus:border-orange-400"
              />
            </div>
          )}
          <div>
            <label className="block text-xs text-gray-500 mb-1">AI 분석 결과</label>
            <input
              type="text"
              disabled
              value={analysisResult || '이미지 분석 후 자동 기입'}
              className="w-full px-3 py-2 text-sm border border-gray-100 rounded bg-gray-50 text-gray-400"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">제목</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제안 제목"
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:outline-none focus:border-orange-400"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">상세 내용</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="열섬 완화를 위한 구체적 제안을 작성하세요."
            rows={4}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:outline-none focus:border-orange-400 resize-none"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">이미지 첨부</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border file:border-gray-200 file:text-sm file:bg-white file:text-gray-700 hover:file:bg-gray-50"
          />
          {imageUrl && (
            <div className="mt-2 relative inline-block">
              <img src={imageUrl} alt="첨부 이미지" className="h-20 rounded border border-gray-200" />
              <button
                type="button"
                onClick={() => setImageUrl('')}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-600 text-white rounded-full text-xs flex items-center justify-center hover:bg-gray-700"
              >
                x
              </button>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
          >
            {isConnected ? '등록' : '임시 저장'}
          </button>
        </div>
      </form>
    </div>
  );
}
