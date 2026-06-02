import React, { useState } from 'react';
import { X, Tag, MapPin, Calendar, FileText, Bookmark, ClipboardCheck } from 'lucide-react';

interface PostDialogProps {
  type: 'lost' | 'found';
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description: string;
    category: string;
    location: string;
    date: string;
  }) => Promise<void>;
}

const CATEGORIES = [
  'Electronics & Gadgets',
  'Keys, Badges & ID Cards',
  'Bags, Backpacks & Purses',
  'Wallets, Cards & Cash',
  'Books, Stationery & Notebooks',
  'Clothing, Shoes & Accessories',
  'Water Bottles & Flasks',
  'Sports & Gym Equipment',
  'Other Campus Belongings',
];

const getLocalDateString = () => {
  const localDate = new Date();
  const year = localDate.getFullYear();
  const month = String(localDate.getMonth() + 1).padStart(2, '0');
  const day = String(localDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function PostDialog({
  type,
  isOpen,
  onClose,
  onSubmit,
}: PostDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [location, setLocation] = useState('');
  const [date, setDate] = useState(getLocalDateString());
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!title.trim() || !description.trim() || !location.trim() || !date) {
      setErrorMsg('All fields are required.');
      return;
    }

    if (title.length > 150) {
      setErrorMsg('Title cannot exceed 150 characters.');
      return;
    }

    if (description.length > 2000) {
      setErrorMsg('Description cannot exceed 2000 characters.');
      return;
    }

    if (location.length > 150) {
      setErrorMsg('Location cannot exceed 150 characters.');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        category,
        location: location.trim(),
        date,
      });
      // Clear forms
      setTitle('');
      setDescription('');
      setCategory(CATEGORIES[0]);
      setLocation('');
      setDate(new Date().toISOString().split('T')[0]);
      onClose();
    } catch (err) {
      console.error('Failed to submit post:', err);
      setErrorMsg('An error occurred. Check your database access or rules.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm overflow-y-auto animate-fade-in" id="post-dialog-container">
      {/* Modal Dialog */}
      <div 
        className="w-full max-w-xl overflow-y-auto rounded-2xl border border-gray-100 bg-white shadow-2xl transition-all duration-300 transform scale-100 max-h-[90vh] my-auto"
        id="post-dialog-modal"
      >
        {/* Banner */}
        <div className={`px-6 py-4 flex items-center justify-between text-white ${
          type === 'lost' ? 'bg-orange-600' : 'bg-emerald-600'
        }`}>
          <div>
            <h3 className="text-lg font-extrabold tracking-tight">
              Post {type === 'lost' ? 'Lost Item' : 'Found Item'}
            </h3>
            <p className="text-xs text-white/80 font-medium mt-0.5">Let the campus know about this item</p>
          </div>
          <button 
            id="close-post-modal"
            onClick={onClose} 
            className="rounded-lg p-1.5 hover:bg-white/10 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4" id="post-item-form">
          {errorMsg && (
            <div className="rounded-xl border border-red-15 px-4 py-3 bg-red-50 text-xs font-semibold text-red-700" id="form-error-banner">
              {errorMsg}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Bookmark className="h-3.5 w-3.5 text-gray-400" />
              <span>Item Short Title</span>
            </label>
            <input
              id="input-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Red Leather Wallet, iPhone 14 Pro Max..."
              maxLength={150}
              className="w-full rounded-xl border border-gray-200 hover:border-gray-300 focus:border-gray-900 focus:ring-0 focus:outline-none px-4.5 py-3 text-sm font-medium transition text-gray-900"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Category selection */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Tag className="h-3.5 w-3.5 text-gray-400" />
                <span>Belonging Category</span>
              </label>
              <select
                id="select-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-gray-200 hover:border-gray-300 focus:border-gray-900 focus:ring-0 focus:outline-none px-4 py-3 text-sm font-semibold transition bg-white text-gray-900"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Picker */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-gray-400" />
                <span>Date {type === 'lost' ? 'Lost' : 'Found'}</span>
              </label>
              <input
                id="input-date"
                type="date"
                required
                value={date}
                max={getLocalDateString()}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-gray-200 hover:border-gray-300 focus:border-gray-900 focus:ring-0 focus:outline-none px-4 py-3 text-sm font-medium transition bg-white text-gray-900"
              />
            </div>
          </div>

          {/* Location details */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-gray-400" />
              <span>Campus Location Spot</span>
            </label>
            <input
              id="input-location"
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Science Library, 2nd floor study pods, Campus Lounge..."
              maxLength={150}
              className="w-full rounded-xl border border-gray-200 hover:border-gray-300 focus:border-gray-900 focus:ring-0 focus:outline-none px-4.5 py-3 text-sm font-medium transition text-gray-900"
            />
          </div>

          {/* Item Description */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <FileText className="h-3.5 w-3.5 text-gray-400" />
              <span>Identifying Description</span>
            </label>
            <textarea
              id="input-description"
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide distinctive features (e.g. sticker on the phone cover, initials inside the wallet, etc.) to help identify your item..."
              maxLength={2000}
              className="w-full rounded-xl border border-gray-200 hover:border-gray-300 focus:border-gray-900 focus:ring-0 focus:outline-none px-4.5 py-3 text-sm font-medium transition resize-none leading-relaxed text-gray-900"
            />
            <div className="flex justify-end text-[10px] text-gray-400 font-semibold mt-1">
              {description.length} / 2000 chars
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-gray-50">
            <button
              id="btn-cancel-post"
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl border border-gray-150 bg-gray-50/50 hover:bg-gray-100 px-5 py-2.5 text-sm font-bold text-gray-600 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="btn-submit-post"
              type="submit"
              disabled={submitting}
              className={`rounded-xl px-6 py-2.5 text-sm font-bold text-white shadow-sm transition active:scale-98 cursor-pointer ${
                type === 'lost' 
                  ? 'bg-orange-600 hover:bg-orange-500' 
                  : 'bg-emerald-600 hover:bg-emerald-500'
              }`}
            >
              {submitting ? 'Posting item...' : 'Submit Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
