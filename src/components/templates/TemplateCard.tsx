import { useState, useEffect } from 'react';
import { Heart, ArrowRight } from 'lucide-react';
import { Template } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { favorites } from '../../utils/supabase';
import { useUserStore } from '../../store';

interface TemplateCardProps {
  template: Template;
  onSelect: (template: Template) => void;
}

const TemplateCard = ({ template, onSelect }: TemplateCardProps) => {
  const [isFavorited, setIsFavorited] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const { favorites: userFavorites, addFavorite, removeFavorite } = useUserStore();

  useEffect(() => {
    if (userFavorites.some(f => f.id === template.id)) {
      setIsFavorited(true);
    }
  }, [userFavorites, template.id]);

  const handleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) return;

    if (isFavorited) {
      const { error } = await favorites.remove(user!.id, template.id);
      if (!error) {
        setIsFavorited(false);
        removeFavorite(template.id);
      }
    } else {
      const { error } = await favorites.add(user!.id, template.id);
      if (!error) {
        setIsFavorited(true);
        addFavorite(template);
      }
    }
  };

  return (
    <div
      className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onSelect(template)}
    >
      <div className="relative aspect-[9/16] overflow-hidden">
        <img
          src={template.thumbnail_url}
          alt={template.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`} />
        
        <button
          onClick={handleFavorite}
          disabled={!isAuthenticated}
          className={`absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
            isAuthenticated
              ? isFavorited
                ? 'bg-red-500 text-white'
                : 'bg-white/80 text-gray-600 hover:bg-white'
              : 'bg-white/50 text-gray-400 cursor-not-allowed'
          }`}
        >
          <Heart className={`w-5 h-5 ${isFavorited ? 'fill-current' : ''}`} />
        </button>

        <div className={`absolute bottom-0 left-0 right-0 p-4 transition-all duration-300 ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <button className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
            开始编辑
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-2">{template.name}</h3>
        <div className="flex flex-wrap gap-2">
          <span className="px-2 py-1 bg-purple-50 text-purple-600 text-xs rounded-full">
            {template.category}
          </span>
          <span className="px-2 py-1 bg-pink-50 text-pink-600 text-xs rounded-full">
            {template.occasion}
          </span>
          <span className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-full">
            {template.style}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TemplateCard;