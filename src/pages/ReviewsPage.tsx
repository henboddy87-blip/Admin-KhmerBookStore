import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { reviewsApi } from '../api/client';
import { CheckCircle, XCircle, Trash2, MessageSquare, Star } from 'lucide-react';

export function ReviewsPage() {
  const { token } = useAuth();
  const toast = useToast();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = () => {
    if (!token) return;
    setLoading(true);
    reviewsApi.list(token)
      .then(setReviews)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchReviews();
  }, [token]);

  const toggleApproval = async (reviewId: number, currentStatus: boolean) => {
    if (!token) return;
    try {
      await reviewsApi.approve(token, reviewId, !currentStatus);
      fetchReviews();
      toast.success(
        !currentStatus
          ? 'Review approved and published to book detail!'
          : 'Review unapproved and hidden from public.'
      );
    } catch (err: any) {
      toast.error(err.message || 'Failed to update review status');
    }
  };

  const deleteReview = async (reviewId: number) => {
    if (!token) return;
    if (!confirm('Are you sure you want to delete this review?')) return;
    try {
      await reviewsApi.delete(token, reviewId);
      fetchReviews();
      toast.success('Review deleted successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete review');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Star className="w-8 h-8 text-amber-500 fill-amber-500 shrink-0" />
            <h1 className="text-2xl sm:text-3xl font-bold text-black dark:text-black">Reviews</h1>
          </div>
          <p className="text-gray-500 mt-1">Manage customer feedback</p>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-emerald-900/30 border-t-emerald-900 rounded-full animate-spin" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <MessageSquare className="w-12 h-12 mb-4 text-emerald-800 opacity-30" />
            <p className="text-lg font-semibold text-gray-800">No reviews found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Book ID</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rating</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Comment</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reviews.map((review) => (
                  <tr key={review.id} className="hover:bg-emerald-50/30 transition-colors">
                    <td className="px-6 py-4 text-sm text-emerald-900 font-mono font-semibold">
                      #{review.book_id}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {review.user?.avatar ? (
                          <img
                            src={review.user.avatar}
                            alt={review.user.name || 'User'}
                            className="w-9 h-9 rounded-full object-cover shadow-sm border border-gray-100 flex-shrink-0"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-800 font-bold text-xs flex-shrink-0">
                            {review.user?.name?.charAt(0) || 'U'}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{review.user?.name || 'Unknown'}</p>
                          <p className="text-xs text-gray-500">{review.user?.email || ''}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-amber-500">
                        <Star className="w-4 h-4 fill-current" />
                        <span className="text-sm font-semibold text-gray-800">{review.rating}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600 max-w-xs truncate">{review.comment}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${
                        review.is_approved ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}>
                        {review.is_approved ? 'Approved' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => toggleApproval(review.id, review.is_approved)}
                          className={`px-3.5 py-1.5 text-xs font-semibold rounded-full border transition-all ${
                            review.is_approved 
                              ? 'text-amber-800 bg-amber-50 border-amber-200 hover:bg-amber-100' 
                              : 'text-emerald-800 bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                          }`}
                        >
                          {review.is_approved ? 'Unapprove' : 'Approve'}
                        </button>
                        <button
                          onClick={() => deleteReview(review.id)}
                          className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all"
                          title="Delete Review"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
