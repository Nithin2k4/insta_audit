import { Heart, MessageCircle, Bookmark, Share2, ExternalLink } from 'lucide-react';
import { formatNumber, formatPercent, formatDate } from '../utils/formatters';

export default function PostCard({ post }) {
  const thumbnail = post.thumbnail_url || post.media_url;

  return (
    <div className="card p-0 overflow-hidden hover:shadow-md transition-shadow">
      {/* Thumbnail */}
      <div className="aspect-square bg-gray-100 relative overflow-hidden">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={post.caption || 'Post'}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <span className="text-4xl">📷</span>
          </div>
        )}
        <div className="absolute top-2 right-2">
          <span className="text-xs bg-black/60 text-white px-2 py-0.5 rounded-full capitalize">
            {post.post_type?.toLowerCase() || 'image'}
          </span>
        </div>
        {post.permalink && (
          <a
            href={post.permalink}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute top-2 left-2 p-1 bg-black/60 text-white rounded-lg hover:bg-black/80 transition-colors"
          >
            <ExternalLink size={12} />
          </a>
        )}
      </div>

      {/* Stats */}
      <div className="p-3">
        {post.caption && (
          <p className="text-sm text-gray-600 line-clamp-2 mb-3">{post.caption}</p>
        )}

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1 text-gray-500">
            <Heart size={12} className="text-red-400" />
            <span>{formatNumber(post.like_count)}</span>
          </div>
          <div className="flex items-center gap-1 text-gray-500">
            <MessageCircle size={12} className="text-blue-400" />
            <span>{formatNumber(post.comment_count)}</span>
          </div>
          <div className="flex items-center gap-1 text-gray-500">
            <Bookmark size={12} className="text-yellow-400" />
            <span>{formatNumber(post.save_count)}</span>
          </div>
          <div className="flex items-center gap-1 text-gray-500">
            <Share2 size={12} className="text-green-400" />
            <span>{formatNumber(post.share_count)}</span>
          </div>
        </div>

        <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
          <span>Eng: <span className="font-medium text-gray-700">{formatPercent(post.engagement_rate)}</span></span>
          <span>{formatDate(post.posted_at)}</span>
        </div>
      </div>
    </div>
  );
}
