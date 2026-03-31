import * as React from 'react';
import { CheckCircle } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { downloadOrganizedImages, resolveRenderableImageUrl } from './organized-image-download';
import { useTheme } from './theme';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const Card = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  const { isDarkMode } = useTheme();

  return (
    <div
      className={cn(
        'rounded-2xl border shadow-sm overflow-hidden transition-colors',
        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-black/5',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
};
export const TopupOrderDetails = () => {
  const { storeId, orderId } = useParams();
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const [codes, setCodes] = React.useState<string[]>([]);
  const [orderImages, setOrderImages] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [copied, setCopied] = React.useState(false);
  const [selectedImage, setSelectedImage] = React.useState<string | null>(null);
  const [isDownloadingImages, setIsDownloadingImages] = React.useState(false);

  const hydrateOrderImagesForDisplay = React.useCallback(async (images: any[]) => {
    const normalizedImages = Array.isArray(images) ? images : [];

    return Promise.all(
      normalizedImages.map(async (image) => {
        const imageUrl = image?.image_url || image?.url || image;
        if (!imageUrl) {
          return image;
        }

        return {
          ...image,
          image_url: image?.image_url || imageUrl,
          display_url: await resolveRenderableImageUrl(imageUrl),
        };
      })
    );
  }, []);

  const refreshCustomerDebt = async () => {
    try {
      const topupCustomer = localStorage.getItem('topupCustomer');
      if (!topupCustomer) {
        return;
      }

      const customer = JSON.parse(topupCustomer);
      if (!customer.customer_id) {
        return;
      }

      const response = await fetch(`/api/customers/${customer.customer_id}/statement`);
      if (!response.ok) {
        return;
      }

      const transactions = await response.json();
      let finalBalance = 0;
      if (Array.isArray(transactions)) {
        const lastTransaction = transactions[transactions.length - 1];
        if (lastTransaction) {
          finalBalance = Number(lastTransaction.balance) || 0;
        }
      }

      localStorage.setItem(
        'topupCustomer',
        JSON.stringify({
          ...customer,
          current_debt: finalBalance,
        }),
      );
    } catch (err) {
      console.error('[TopupOrderDetails] Error refreshing debt:', err);
    }
  };

  React.useEffect(() => {
    let isMounted = true;

    const loadOrderDetails = async () => {
      setLoading(true);
      try {
        await refreshCustomerDebt();

        const [codesRes, imagesRes] = await Promise.all([
          fetch(`/api/topup/order-codes/${orderId}`),
          fetch(`/api/topup/order-images/${orderId}`),
        ]);

        const codesData = await codesRes.json().catch(() => ({ codes: [] }));
        const imagesData = await imagesRes.json().catch(() => ({ images: [] }));

        if (!isMounted) {
          return;
        }

        setCodes(Array.isArray(codesData?.codes) ? codesData.codes : []);
        setOrderImages(await hydrateOrderImagesForDisplay(Array.isArray(imagesData?.images) ? imagesData.images : []));
      } catch (error) {
        console.error('Error loading mobile topup order details:', error);
        if (isMounted) {
          setCodes([]);
          setOrderImages([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadOrderDetails();

    return () => {
      isMounted = false;
    };
  }, [hydrateOrderImagesForDisplay, orderId]);

  const copyAllCodes = () => {
    navigator.clipboard.writeText(codes.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPurchasedImages = async () => {
    if (!orderImages.length) {
      alert('❌ لا توجد صور متاحة للتنزيل');
      return;
    }

    setIsDownloadingImages(true);
    try {
      const result = await downloadOrganizedImages(
        orderImages.map((image) => ({
          imageUrl: image?.image_url || image,
          companyName: image?.company_name || 'شركة_غير_محددة',
          productName: image?.product_name || String(image?.amount || 'منتج'),
        }))
      );

      if (result.mode === 'cancelled') {
        return;
      }

      if (result.count === 0) {
        alert('❌ لا توجد صور صالحة للتنزيل');
        return;
      }

      if (result.mode === 'folder') {
        alert(`✅ تم تنزيل ${result.count} صورة داخل المجلد ${result.containerName || 'المنظم'}.`);
      } else {
        alert(`✅ تم تنزيل ملف ZIP منظم يحتوي على ${result.count} صورة. على الموبايل سيُحفَظ مباشرة في Download، وعلى الأجهزة الأخرى يُستخدم هذا الأسلوب بدل اختيار المجلد عند الحاجة.`);
      }
    } catch (error) {
      console.error('خطأ في تنزيل صور الطلب من شاشة الموبايل:', error);
      alert(`❌ خطأ: ${(error as any).message || 'فشل تنزيل الصور'}`);
    } finally {
      setIsDownloadingImages(false);
    }
  };

  if (loading) {
    return <div className="p-4 sm:p-8 text-center">جاري تحميل أكوادك...</div>;
  }

  return (
    <div className={cn('min-h-screen p-4 sm:p-8', isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900')} dir="rtl">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-block p-4 rounded-full bg-green-100 mb-4">
            <CheckCircle size={48} className="text-green-600" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-normal mb-2">شكراً لك! 🎉</h1>
          <p className={cn(isDarkMode ? 'text-gray-400' : 'text-gray-600')}>تم استلام طلبك بنجاح</p>
        </div>

        <Card className={cn(isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50')}>
          <div className={cn('p-6 border-b border-green-500', isDarkMode ? 'border-green-900' : '')}>
            <h2 className="font-normal text-lg text-green-600">أكوادك الخاصة</h2>
            <p className={cn('text-xs mt-1', isDarkMode ? 'text-gray-400' : 'text-gray-600')}>احفظ هذه الأكواد في مكان آمن</p>
          </div>

          <div className="p-6 space-y-3">
            {codes.map((code, idx) => (
              <div key={idx} className={cn('p-4 rounded-lg border-2 font-mono text-lg font-normal', isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200')}>
                {code}
              </div>
            ))}
          </div>

          <div className={cn('p-4 border-t', isDarkMode ? 'border-gray-700' : 'border-gray-200')}>
            <button
              onClick={copyAllCodes}
              className="w-full py-3 rounded-lg font-normal transition-all"
              style={{ backgroundColor: copied ? '#22c55e' : '#3b82f6', color: 'white' }}
            >
              {copied ? '✓ تم النسخ!' : 'نسخ جميع الأكواد'}
            </button>
          </div>
        </Card>

        <Card className={cn('mt-6', isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50')}>
          <div className={cn('p-6 border-b', isDarkMode ? 'border-gray-700' : 'border-gray-200')}>
            <h2 className="font-normal text-lg text-blue-600">الصور المشتراة</h2>
            <p className={cn('text-xs mt-1', isDarkMode ? 'text-gray-400' : 'text-gray-600')}>تنزيل منظم حسب الشركة، واسم المنتج داخل اسم الصورة.</p>
          </div>

          <div className="p-6">
            {orderImages.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {orderImages.map((image, idx) => {
                  const imageUrl = image.display_url || image.image_url || image;
                  const imageTitle = image.product_name || image.amount || `صورة ${idx + 1}`;
                  return (
                    <button
                      key={`${imageUrl}-${idx}`}
                      type="button"
                      onClick={() => setSelectedImage(imageUrl)}
                      className={cn('rounded-lg border overflow-hidden text-right transition-all', isDarkMode ? 'bg-gray-700 border-gray-600 hover:border-blue-500' : 'bg-white border-gray-200 hover:border-blue-400')}
                    >
                      <img
                        src={imageUrl}
                        alt={imageTitle}
                        className="w-full h-28 object-cover"
                        onError={(e: any) => {
                          e.target.style.display = 'none';
                        }}
                      />
                      <div className="p-2 space-y-1">
                        <p className={cn('text-xs font-normal', isDarkMode ? 'text-gray-200' : 'text-gray-800')}>{image.company_name || 'شركة غير محددة'}</p>
                        <p className={cn('text-[11px]', isDarkMode ? 'text-gray-400' : 'text-gray-600')}>{imageTitle}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className={cn('text-sm text-center py-4', isDarkMode ? 'text-gray-400' : 'text-gray-600')}>
                لا توجد صور مرتبطة بهذا الطلب.
              </div>
            )}
          </div>

          <div className={cn('p-4 border-t', isDarkMode ? 'border-gray-700' : 'border-gray-200')}>
            <button
              onClick={handleDownloadPurchasedImages}
              disabled={isDownloadingImages || orderImages.length === 0}
              className="w-full py-3 rounded-lg font-normal transition-all"
              style={{ backgroundColor: isDownloadingImages || orderImages.length === 0 ? '#6b7280' : '#2563eb', color: 'white' }}
            >
              {isDownloadingImages ? 'جاري تجهيز التنزيل...' : '💾 تنزيل الصور في فولدرات الشركات'}
            </button>
          </div>
        </Card>

        <div className={cn('mt-8 p-4 rounded-lg', isDarkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-50 text-blue-700')}>
          <p className="text-sm font-normal">💡 نصيحة: سيتم إرسال الأكواد عبر تليجرام أيضاً على المعرّف أو الرقم المسجل</p>
        </div>

        <button
          onClick={() => navigate(`/topup/${storeId}`)}
          className={cn('w-full mt-8 py-3 rounded-lg font-normal transition-all', isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300')}
        >
          ← العودة للمتجر
        </button>

        {selectedImage && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setSelectedImage(null)}>
            <div className="max-w-3xl w-full" onClick={e => e.stopPropagation()}>
              <img src={selectedImage} alt="الصورة المحددة" className="w-full max-h-[85vh] object-contain rounded-xl" />
              <button onClick={() => setSelectedImage(null)} className="w-full mt-4 py-3 rounded-lg font-normal bg-white text-gray-900">
                إغلاق الصورة
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
