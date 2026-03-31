import { Home, LogIn, Store as StoreIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useTheme } from './theme';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const InfoPageMobileFooter = () => {
  const { isDarkMode } = useTheme();

  return (
    <div className={cn("fixed bottom-0 inset-x-0 z-50 border-t px-2 py-2 md:hidden flex", isDarkMode ? "bg-gray-800/95 border-gray-700 backdrop-blur-sm" : "bg-white/95 border-black/5 backdrop-blur-sm")}>
      <div className="w-full flex items-stretch gap-2 overflow-x-auto pb-1">
        <Link to="/" className={cn("min-w-[72px] flex-1 rounded-2xl px-2 py-2 text-center transition-colors", isDarkMode ? "text-gray-300 hover:bg-gray-700" : "text-gray-600 hover:bg-gray-100")}>
          <div className="flex flex-col items-center gap-1">
            <Home size={18} className="flex-shrink-0" />
            <span className="text-[10px] leading-tight">الرئيسية</span>
          </div>
        </Link>
        <Link to="/stores" className={cn("min-w-[72px] flex-1 rounded-2xl px-2 py-2 text-center transition-colors", isDarkMode ? "text-gray-300 hover:bg-gray-700" : "text-gray-600 hover:bg-gray-100")}>
          <div className="flex flex-col items-center gap-1">
            <StoreIcon size={18} className="flex-shrink-0" />
            <span className="text-[10px] leading-tight">المتاجر</span>
          </div>
        </Link>
        <Link to="/login" className={cn("min-w-[72px] flex-1 rounded-2xl px-2 py-2 text-center transition-colors", isDarkMode ? "text-gray-300 hover:bg-gray-700" : "text-gray-600 hover:bg-gray-100")}>
          <div className="flex flex-col items-center gap-1">
            <LogIn size={18} className="flex-shrink-0" />
            <span className="text-[10px] leading-tight">الدخول</span>
          </div>
        </Link>
      </div>
    </div>
  );
};

const InfoPageLayout = ({ title, children }: { title: string; children: React.ReactNode }) => {
  const { isDarkMode } = useTheme();

  return (
    <div className={cn("min-h-screen bg-gradient-to-b from-indigo-50 to-white pb-28 md:pb-0 flex flex-col", isDarkMode ? 'bg-gray-900' : '')}>
      <div className="flex-1 max-w-4xl mx-auto px-6 py-16">
        <h1 className={cn("text-4xl font-normal mb-8", isDarkMode ? 'text-white' : 'text-gray-900')}>{title}</h1>
        <div className={cn("rounded-2xl shadow-lg p-8 space-y-6", isDarkMode ? 'bg-gray-800 text-gray-100' : 'bg-white')}>
          {children}
        </div>
      </div>
      <InfoPageMobileFooter />
    </div>
  );
};

export const AboutPage = () => {
  const { isDarkMode } = useTheme();

  return (
    <InfoPageLayout title="من نحن">
      <div>
        <h2 className={cn("text-2xl font-normal mb-4", isDarkMode ? 'text-indigo-400' : 'text-indigo-600')}>🌍 منصتنا</h2>
        <p className={cn("leading-relaxed", isDarkMode ? 'text-gray-300' : 'text-gray-700')}>
          نحن منصة تجارة إلكترونية حديثة توفر حلولاً شاملة للتجار والمتاجر الإلكترونية. تأسست المنصة بهدف تمكين الشركات الصغيرة والمتوسطة من الانطلاق رقمياً بسهولة وفعالية.
        </p>
      </div>
      <div>
        <h2 className={cn("text-2xl font-normal mb-4", isDarkMode ? 'text-indigo-400' : 'text-indigo-600')}>🎯 رسالتنا</h2>
        <p className={cn("leading-relaxed", isDarkMode ? 'text-gray-300' : 'text-gray-700')}>
          توفير أدوات وخدمات متقدمة تمكّن التجار من إدارة متاجرهم الإلكترونية بكفاءة وتوسيع أعمالهم في السوق الرقمي.
        </p>
      </div>
      <div>
        <h2 className={cn("text-2xl font-normal mb-4", isDarkMode ? 'text-indigo-400' : 'text-indigo-600')}>✨ قيمنا</h2>
        <ul className={cn("space-y-2", isDarkMode ? 'text-gray-300' : 'text-gray-700')}>
          <li>✓ الشفافية والأمانة في جميع معاملاتنا</li>
          <li>✓ الابتكار المستمر لتحسين الخدمات</li>
          <li>✓ دعم العملاء على مدار الساعة</li>
          <li>✓ أمن البيانات والخصوصية</li>
        </ul>
      </div>
    </InfoPageLayout>
  );
};

export const HelpCenterPage = () => {
  const { isDarkMode } = useTheme();

  return (
    <InfoPageLayout title="مركز المساعدة">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={cn("border-l-4 border-indigo-600 pl-4", isDarkMode ? 'bg-gray-700' : '')}>
          <h3 className={cn("text-xl font-normal mb-2", isDarkMode ? 'text-indigo-400' : 'text-indigo-600')}>❓ الأسئلة الشائعة</h3>
          <p className={cn("text-sm", isDarkMode ? 'text-gray-300' : 'text-gray-700')}>ستجد الإجابات على الأسئلة الأكثر شيوعاً حول استخدام المنصة وإدارة متجرك.</p>
        </div>
        <div className={cn("border-l-4 border-indigo-600 pl-4", isDarkMode ? 'bg-gray-700' : '')}>
          <h3 className={cn("text-xl font-normal mb-2", isDarkMode ? 'text-indigo-400' : 'text-indigo-600')}>📚 الدلائل والأدلة</h3>
          <p className={cn("text-sm", isDarkMode ? 'text-gray-300' : 'text-gray-700')}>خطوات مفصلة وأدلة شاملة تساعدك في البدء والقيام بمختلف العمليات.</p>
        </div>
        <div className={cn("border-l-4 border-indigo-600 pl-4", isDarkMode ? 'bg-gray-700' : '')}>
          <h3 className={cn("text-xl font-normal mb-2", isDarkMode ? 'text-indigo-400' : 'text-indigo-600')}>💬 دعم العملاء</h3>
          <p className={cn("text-sm", isDarkMode ? 'text-gray-300' : 'text-gray-700')}>فريق الدعم الخاص بنا متاح لمساعدتك على مدار الساعة يومياً.</p>
        </div>
        <div className={cn("border-l-4 border-indigo-600 pl-4", isDarkMode ? 'bg-gray-700' : '')}>
          <h3 className={cn("text-xl font-normal mb-2", isDarkMode ? 'text-indigo-400' : 'text-indigo-600')}>🛠️ الصيانة والتحديثات</h3>
          <p className={cn("text-sm", isDarkMode ? 'text-gray-300' : 'text-gray-700')}>تابع آخر التحديثات والصيانة الدورية للمنصة.</p>
        </div>
      </div>
      <div className={cn("p-6 rounded-xl mt-8", isDarkMode ? 'bg-gray-700' : 'bg-indigo-50')}>
        <p className={isDarkMode ? 'text-gray-200' : 'text-gray-700'}>
          <strong>📧 تواصل معنا:</strong> إذا لم تجد الإجابة، يمكنك التواصل مع فريقنا عبر البريد الإلكتروني أو خلال ساعات العمل.
        </p>
      </div>
    </InfoPageLayout>
  );
};

export const SecurityPolicyPage = () => {
  const { isDarkMode } = useTheme();

  return (
    <InfoPageLayout title="سياسة الأمان">
      <div>
        <h2 className={cn("text-2xl font-normal mb-4", isDarkMode ? 'text-indigo-400' : 'text-indigo-600')}>🔒 أمان البيانات</h2>
        <p className={cn("leading-relaxed", isDarkMode ? 'text-gray-300' : 'text-gray-700')}>
          نستخدم تقنيات التشفير الحديثة لحماية معلومات عملائنا والحفاظ على سرية بيانات المتاجر والعملاء.
        </p>
      </div>
      <div>
        <h2 className={cn("text-2xl font-normal mb-4", isDarkMode ? 'text-indigo-400' : 'text-indigo-600')}>🛡️ حماية المعاملات</h2>
        <p className={cn("leading-relaxed", isDarkMode ? 'text-gray-300' : 'text-gray-700')}>
          جميع المعاملات المالية محمية بمعايير أمان دولية. لا نقبل بطاقات ائتمان مباشرة - يتم التعامل من خلال بوابات دفع آمنة معتمدة.
        </p>
      </div>
      <div>
        <h2 className={cn("text-2xl font-normal mb-4", isDarkMode ? 'text-indigo-400' : 'text-indigo-600')}>🔐 كلمات المرور</h2>
        <p className={cn("leading-relaxed", isDarkMode ? 'text-gray-300' : 'text-gray-700')}>
          استخدم كلمات مرور قوية ولا تشارك حسابك مع أحد. يمكنك تحديث كلمة المرور في أي وقت من إعدادات الحساب.
        </p>
      </div>
      <div>
        <h2 className={cn("text-2xl font-normal mb-4", isDarkMode ? 'text-indigo-400' : 'text-indigo-600')}>الإبلاغ عن المشاكل الأمنية</h2>
        <p className={cn("leading-relaxed", isDarkMode ? 'text-gray-300' : 'text-gray-700')}>
          إذا اكتشفت أي مشكلة أمنية، يرجى الإبلاغ عنها فوراً إلى فريق الأمان بخصوصية تامة.
        </p>
      </div>
    </InfoPageLayout>
  );
};

export const PrivacyPolicyPage = () => {
  const { isDarkMode } = useTheme();

  return (
    <InfoPageLayout title="سياسة الخصوصية">
      <div>
        <h2 className={cn("text-2xl font-normal mb-4", isDarkMode ? 'text-indigo-400' : 'text-indigo-600')}>📋 جمع البيانات</h2>
        <p className={cn("leading-relaxed", isDarkMode ? 'text-gray-300' : 'text-gray-700')}>
          نجمع المعلومات الضرورية لتقديم الخدمة فقط، مثل البيانات الشخصية والمعاملات التجارية.
        </p>
      </div>
      <div>
        <h2 className={cn("text-2xl font-normal mb-4", isDarkMode ? 'text-indigo-400' : 'text-indigo-600')}>🔒 استخدام البيانات</h2>
        <p className={cn("leading-relaxed", isDarkMode ? 'text-gray-300' : 'text-gray-700')}>
          نستخدم بيانات العملاء فقط لتحسين الخدمة والتواصل حول الحسابات والعروض الخاصة. لا بيع البيانات لأطراف ثالثة.
        </p>
      </div>
      <div>
        <h2 className={cn("text-2xl font-normal mb-4", isDarkMode ? 'text-indigo-400' : 'text-indigo-600')}>🚀 ملفات تعريف الارتباط</h2>
        <p className={cn("leading-relaxed", isDarkMode ? 'text-gray-300' : 'text-gray-700')}>
          نستخدم الملفات التعريفية لتحسين تجربة الاستخدام. يمكنك إدارة الملفات التعريفية من إعدادات المتصفح.
        </p>
      </div>
      <div>
        <h2 className={cn("text-2xl font-normal mb-4", isDarkMode ? 'text-indigo-400' : 'text-indigo-600')}>🗑️ حقوقك</h2>
        <p className={cn("leading-relaxed", isDarkMode ? 'text-gray-300' : 'text-gray-700')}>
          لديك الحق في طلب معلوماتك الشخصية، تصحيحها، أو حذفها في أي وقت.
        </p>
      </div>
    </InfoPageLayout>
  );
};