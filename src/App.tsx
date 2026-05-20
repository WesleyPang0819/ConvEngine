import { useState, useEffect } from 'react';
import { Calculator, DollarSign, Users, MousePointerClick, TrendingUp, BarChart3, Percent, Target, CircleDollarSign, Banknote, Languages } from 'lucide-react';

const TRANSLATIONS = {
  en: {
    title1: "Revenue",
    title2: "Calculator",
    subtitle: "Estimate your potential. Edit numbers or percentages and the rest recalculates magically.",
    metrics: "Your Metrics",
    traffic: "Monthly Traffic",
    leads: "Leads (Count)",
    convRate: "Conv. Rate (%)",
    customers: "Customers",
    closeRate: "Closing Rate (%)",
    aov: "Average Order Value",
    projections: "Projections",
    totalLeads: "Total Leads",
    totalCustomers: "Customers",
    estRevenue: "Estimated Revenue",
  },
  zh: {
    title1: "营收",
    title2: "计算器",
    subtitle: "预估收益潜力。修改任意数值或百分比，结果将自动重新计算。",
    metrics: "您的数据指标",
    traffic: "月度流量 (Traffic)",
    leads: "潜在客户 (Leads)",
    convRate: "转化率 (Conv. Rate %)",
    customers: "成交客户 (Customers)",
    closeRate: "成交率 (Closing Rate %)",
    aov: "平均客单价 (AOV)",
    projections: "预测结果",
    totalLeads: "总线索数",
    totalCustomers: "成交客户",
    estRevenue: "预估总营收",
  }
};

const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', zhName: '美金' },
  { code: 'GBP', name: 'British Pound', zhName: '英镑' },
  { code: 'MYR', name: 'Malaysian Ringgit', zhName: '马币' },
  { code: 'EUR', name: 'Euro', zhName: '欧元' },
  { code: 'JPY', name: 'Japanese Yen', zhName: '日元' },
  { code: 'AUD', name: 'Australian Dollar', zhName: '澳元' },
  { code: 'CAD', name: 'Canadian Dollar', zhName: '加元' },
  { code: 'CHF', name: 'Swiss Franc', zhName: '瑞士法郎' },
  { code: 'CNY', name: 'Chinese Yuan', zhName: '人民币' },
  { code: 'HKD', name: 'Hong Kong Dollar', zhName: '港币' },
  { code: 'NZD', name: 'New Zealand Dollar', zhName: '新西兰元' },
  { code: 'SGD', name: 'Singapore Dollar', zhName: '新币' },
  { code: 'KRW', name: 'South Korean Won', zhName: '韩元' },
  { code: 'INR', name: 'Indian Rupee', zhName: '印度卢比' },
  { code: 'BRL', name: 'Brazilian Real', zhName: '巴西雷亚尔' },
  { code: 'ZAR', name: 'South African Rand', zhName: '南非兰特' },
  { code: 'MXN', name: 'Mexican Peso', zhName: '墨西哥比索' },
  { code: 'RUB', name: 'Russian Ruble', zhName: '俄罗斯卢布' },
  { code: 'SEK', name: 'Swedish Krona', zhName: '瑞典克朗' },
  { code: 'NOK', name: 'Norwegian Krone', zhName: '挪威克朗' },
  { code: 'DKK', name: 'Danish Krone', zhName: '丹麦克朗' },
  { code: 'TRY', name: 'Turkish Lira', zhName: '土耳其里拉' },
  { code: 'THB', name: 'Thai Baht', zhName: '泰铢' },
  { code: 'IDR', name: 'Indonesian Rupiah', zhName: '印尼盾' },
  { code: 'PHP', name: 'Philippine Peso', zhName: '菲律宾比索' },
  { code: 'VND', name: 'Vietnamese Dong', zhName: '越南盾' },
  { code: 'TWD', name: 'New Taiwan Dollar', zhName: '新台币' },
  { code: 'PLN', name: 'Polish Zloty', zhName: '波兰兹罗提' },
  { code: 'ARS', name: 'Argentine Peso', zhName: '阿根廷比索' },
  { code: 'CLP', name: 'Chilean Peso', zhName: '智利比索' },
  { code: 'COP', name: 'Colombian Peso', zhName: '哥伦比亚比索' },
  { code: 'PEN', name: 'Peruvian Sol', zhName: '秘鲁索尔' },
  { code: 'ILS', name: 'Israeli New Shekel', zhName: '以色列新谢克尔' },
  { code: 'AED', name: 'UAE Dirham', zhName: '阿联酋迪拉姆' },
  { code: 'SAR', name: 'Saudi Riyal', zhName: '沙特里亚尔' },
  { code: 'EGP', name: 'Egyptian Pound', zhName: '埃及镑' },
  { code: 'NGN', name: 'Nigerian Naira', zhName: '尼日利亚奈拉' },
  { code: 'KES', name: 'Kenyan Shilling', zhName: '肯尼亚先令' },
];

export default function App() {
  const [traffic, setTraffic] = useState<string>('10000');
  const [leads, setLeads] = useState<string>('300');
  const [conversionRate, setConversionRate] = useState<string>('3');
  const [customers, setCustomers] = useState<string>('9');
  const [closingRate, setClosingRate] = useState<string>('3');
  const [aov, setAov] = useState<string>('300');
  const [currency, setCurrency] = useState<string>('USD');
  const [rates, setRates] = useState<Record<string, number>>({});
  const [lang, setLang] = useState<'en' | 'zh'>('zh');

  const t = TRANSLATIONS[lang];

  useEffect(() => {
    fetch('https://open.er-api.com/v6/latest/USD')
      .then(res => res.json())
      .then(data => {
        if (data && data.rates) {
          setRates(data.rates);
        }
      })
      .catch(err => console.error('Failed to fetch exchange rates:', err));
  }, []);

  const safeNumber = (val: string) => {
    const num = parseFloat(val);
    return isNaN(num) || !isFinite(num) ? 0 : Math.max(0, num);
  };

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCurrency = e.target.value;
    if (rates[currency] && rates[newCurrency]) {
      const currentAovNum = safeNumber(aov);
      if (currentAovNum > 0) {
        const aovInUsd = currentAovNum / rates[currency];
        const aovInNew = aovInUsd * rates[newCurrency];
        setAov(Number(aovInNew.toFixed(2)).toString());
      }
    }
    setCurrency(newCurrency);
  };

  const revenue = safeNumber(customers) * safeNumber(aov);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val);
  };


  const formatNumber = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 1,
    }).format(val);
  };

  const handleTrafficChange = (val: string) => {
    setTraffic(val);
    const t = safeNumber(val);
    const cr = safeNumber(conversionRate);
    const l = t * (cr / 100);
    setLeads(Number(l.toFixed(2)).toString());
    
    const clr = safeNumber(closingRate);
    const c = l * (clr / 100);
    setCustomers(Number(c.toFixed(2)).toString());
  };

  const handleLeadsChange = (val: string) => {
    setLeads(val);
    const l = safeNumber(val);
    const t = safeNumber(traffic);
    const cr = t > 0 ? (l / t) * 100 : 0;
    setConversionRate(Number(cr.toFixed(2)).toString());
    
    const clr = safeNumber(closingRate);
    const c = l * (clr / 100);
    setCustomers(Number(c.toFixed(2)).toString());
  };

  const handleConversionRateChange = (val: string) => {
    setConversionRate(val);
    const cr = safeNumber(val);
    const t = safeNumber(traffic);
    const l = t * (cr / 100);
    setLeads(Number(l.toFixed(2)).toString());
    
    const clr = safeNumber(closingRate);
    const c = l * (clr / 100);
    setCustomers(Number(c.toFixed(2)).toString());
  };

  const handleCustomersChange = (val: string) => {
    setCustomers(val);
    const c = safeNumber(val);
    const l = safeNumber(leads);
    const clr = l > 0 ? (c / l) * 100 : 0;
    setClosingRate(Number(clr.toFixed(2)).toString());
  };

  const handleClosingRateChange = (val: string) => {
    setClosingRate(val);
    const clr = safeNumber(val);
    const l = safeNumber(leads);
    const c = l * (clr / 100);
    setCustomers(Number(c.toFixed(2)).toString());
  };

  return (
    <div className="min-h-screen bg-[#0974f1] flex flex-col items-center px-4 pt-6 pb-0 md:px-8 md:pt-8 lg:px-12 lg:pt-12 font-sans text-slate-900 relative overflow-x-hidden w-full">
      {/* Background Decorations Wrapper to prevent scroll stretching */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Light grid overlay */}
        <div 
          className="absolute inset-0" 
          style={{ 
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.07) 1px, transparent 1px)', 
            backgroundSize: '30px 30px' 
          }}
        ></div>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-400 rounded-full blur-[120px] opacity-20"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-900 rounded-full blur-[150px] opacity-40"></div>
      </div>

      {/* Top Left Brand: Logo & Text */}
      <div className="absolute top-3 left-3 md:top-[28px] md:left-[28px] flex items-center gap-2 md:gap-3 z-50">
        <img src="/favicon-96x96.png" alt="ConvEngine Logo" className="w-[40px] h-[40px] md:w-[60px] md:h-[60px] object-contain rounded-xl" />
        <span className="text-white font-semibold text-base md:text-xl tracking-tight md:tracking-wide">
          <span className="text-[#ffcc00]">Conv</span>Engine
        </span>
      </div>

      {/* Top Right Controls: Language & Currency */}
      <div className="absolute top-3 right-3 md:top-6 md:right-6 flex items-center gap-1.5 md:gap-2 z-50">
        <button
          onClick={() => setLang(lang === 'en' ? 'zh' : 'en')}
          className="flex items-center gap-1 md:gap-1.5 bg-white px-2 md:px-3 py-1 md:py-1.5 rounded-full shadow-md border border-slate-100 transition-transform hover:scale-105 active:scale-95 cursor-pointer"
        >
          <Languages className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#0974f1]" />
          <span className="text-[10px] md:text-xs font-bold text-slate-700 w-4 md:w-5 text-center">{lang === 'en' ? '中' : 'EN'}</span>
        </button>

        <div className="relative flex items-center gap-1 md:gap-1.5 bg-white px-2 md:px-2.5 py-1 md:py-1.5 rounded-full shadow-md border border-slate-100 transition-transform hover:scale-105 flex-1 min-w-0 max-w-[120px] sm:max-w-[160px] md:max-w-none">
          <CircleDollarSign className="w-4 h-4 text-[#0974f1] shrink-0" />
          <div className="flex items-center gap-1 pointer-events-none overflow-hidden w-full">
            <span className="text-[10px] sm:text-xs font-bold text-slate-800 whitespace-nowrap truncate leading-tight">
              {currency} <span className="hidden sm:inline">- {CURRENCIES.find(c => c.code === currency)?.name} </span>({CURRENCIES.find(c => c.code === currency)?.zhName})
            </span>
            <svg className="w-3.5 h-3.5 text-slate-800 shrink-0 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"></path></svg>
          </div>
          <select
            value={currency}
            onChange={handleCurrencyChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} - {c.name} ({c.zhName})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center flex-1 w-full max-w-5xl gap-8 sm:gap-10 mt-[60px] mb-[20px] z-10">
        
        {/* Header */}
        <div className="flex flex-col items-center space-y-4 mt-[20px]">
          <div className="flex flex-row md:flex-col items-center justify-center gap-3 sm:gap-5 md:gap-0">
            <div className="inline-flex items-center justify-center p-3.5 sm:p-5 md:p-6 bg-[#ffcc00] rounded-full shadow-xl transform -rotate-12 md:-mb-1 shrink-0 z-10">
              <Calculator className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 text-slate-900" />
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tighter text-white uppercase italic drop-shadow-[0_4px_4px_rgba(0,0,0,0.15)] transform -rotate-2 text-left md:text-center leading-[1.1] md:leading-normal">
              <span className="block sm:inline">{t.title1}</span> <span className="text-[#ffcc00] block sm:inline mt-1 sm:mt-0 sm:ml-2">{t.title2}</span>
            </h1>
          </div>
          <p className="text-blue-100 max-w-xl mx-auto font-medium md:text-lg drop-shadow-md text-center">
            {t.subtitle}
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch w-full">
          
          {/* Inputs Card */}
          <div className="bg-white rounded-[2rem] shadow-2xl p-6 md:p-10 lg:col-span-7 relative z-20">
            <h2 className="text-2xl font-black uppercase text-slate-800 tracking-tight mb-8 flex items-center gap-3">
              <BarChart3 className="w-7 h-7 text-[#0974f1]" />
              {t.metrics}
            </h2>
            
            <div className="space-y-8">
              {/* Traffic Input */}
              <div className="space-y-2">
                <label htmlFor="traffic" className="block text-sm font-bold text-slate-600 uppercase tracking-wide">
                  {t.traffic}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <MousePointerClick className="h-6 w-6 text-slate-300" />
                  </div>
                  <input
                    type="number"
                    id="traffic"
                    value={traffic}
                    onChange={(e) => handleTrafficChange(e.target.value)}
                    className="block w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-0 focus:border-[#0974f1] focus:bg-blue-50/50 outline-none transition-all font-bold text-lg text-slate-800"
                    placeholder="e.g., 10000"
                    min="0"
                  />
                </div>
              </div>

              {/* Leads & Conversion Rate Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-6 bg-slate-50 border-2 border-slate-100 rounded-3xl">
                <div className="space-y-2">
                  <label htmlFor="leads" className="block text-sm font-bold text-slate-600 uppercase tracking-wide">
                    {t.leads}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Target className="h-5 w-5 text-slate-300" />
                    </div>
                    <input
                      type="number"
                      id="leads"
                      value={leads}
                      onChange={(e) => handleLeadsChange(e.target.value)}
                      className="block w-full pl-11 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:ring-0 focus:border-[#0974f1] outline-none transition-all font-bold text-slate-800"
                      placeholder="e.g., 300"
                      min="0"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="conversionRate" className="block text-sm font-bold text-slate-600 uppercase tracking-wide">
                    {t.convRate}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Percent className="h-5 w-5 text-slate-300" />
                    </div>
                    <input
                      type="number"
                      id="conversionRate"
                      value={conversionRate}
                      onChange={(e) => handleConversionRateChange(e.target.value)}
                      className="block w-full pl-11 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:ring-0 focus:border-[#0974f1] outline-none transition-all font-bold text-slate-800"
                      placeholder="e.g., 3"
                      min="0"
                    />
                  </div>
                </div>
              </div>

              {/* Customers & Closing Rate Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-6 bg-slate-50 border-2 border-slate-100 rounded-3xl">
                <div className="space-y-2">
                  <label htmlFor="customers" className="block text-sm font-bold text-slate-600 uppercase tracking-wide">
                    {t.customers}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Users className="h-5 w-5 text-slate-300" />
                    </div>
                    <input
                      type="number"
                      id="customers"
                      value={customers}
                      onChange={(e) => handleCustomersChange(e.target.value)}
                      className="block w-full pl-11 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:ring-0 focus:border-[#0974f1] outline-none transition-all font-bold text-slate-800"
                      placeholder="e.g., 9"
                      min="0"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="closingRate" className="block text-sm font-bold text-slate-600 uppercase tracking-wide">
                    {t.closeRate}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Percent className="h-5 w-5 text-slate-300" />
                    </div>
                    <input
                      type="number"
                      id="closingRate"
                      value={closingRate}
                      onChange={(e) => handleClosingRateChange(e.target.value)}
                      className="block w-full pl-11 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:ring-0 focus:border-[#0974f1] outline-none transition-all font-bold text-slate-800"
                      placeholder="e.g., 3"
                      min="0"
                    />
                  </div>
                </div>
              </div>

              {/* Average Order Value Input */}
              <div className="space-y-2">
                <label htmlFor="aov" className="block text-sm font-bold text-slate-600 uppercase tracking-wide flex justify-between items-center">
                  <span>{t.aov}</span>
                  <span className="text-[#0974f1] bg-blue-50 px-2 py-0.5 rounded-md text-xs">{currency}</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Banknote className="h-6 w-6 text-slate-300" />
                  </div>
                  <input
                    type="number"
                    id="aov"
                    value={aov}
                    onChange={(e) => setAov(e.target.value)}
                    className="block w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-0 focus:border-[#0974f1] focus:bg-blue-50/50 outline-none transition-all font-bold text-lg text-slate-800"
                    placeholder="e.g., 300"
                    min="0"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Results Card */}
          <div className="bg-white rounded-[2rem] shadow-2xl p-6 md:p-10 lg:col-span-5 flex flex-col justify-between relative overflow-hidden z-20">
            {/* Soft decorative blob */}
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-cyan-100 rounded-full blur-[60px] opacity-60"></div>
            
            <div className="relative z-10 space-y-10 flex-1">
              <h2 className="text-2xl font-black uppercase text-slate-800 tracking-tight flex items-center gap-3">
                <TrendingUp className="w-7 h-7 text-[#ffcc00]" />
                {t.projections}
              </h2>

              <div className="space-y-8">
                <div className="grid grid-cols-2 gap-6 pb-8 border-b-2 border-slate-100">
                  <div>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">{t.totalLeads}</p>
                    <p className="text-4xl font-black text-slate-800 drop-shadow-sm">
                      {formatNumber(safeNumber(leads))}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">{t.convRate}</p>
                    <p className="text-4xl font-black text-[#0974f1] drop-shadow-sm">
                      {formatNumber(safeNumber(conversionRate))}%
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">{t.totalCustomers}</p>
                    <p className="text-4xl font-black text-slate-800 drop-shadow-sm">
                      {formatNumber(safeNumber(customers))}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">{t.closeRate}</p>
                    <p className="text-4xl font-black text-[#0974f1] drop-shadow-sm">
                      {formatNumber(safeNumber(closingRate))}%
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Huge Revenue Box */}
            <div className="relative z-10 mt-10 p-8 bg-[#0974f1] rounded-[1.5rem] shadow-[0_10px_40px_rgba(9,116,241,0.4)] text-center overflow-hidden">
              {/* Box decorations */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full mix-blend-overlay opacity-10 blur-xl"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-cyan-300 rounded-full mix-blend-overlay opacity-20 blur-xl"></div>
              
              <p className="text-blue-100 text-sm font-bold uppercase tracking-widest mb-3 relative z-10">{t.estRevenue}</p>
              <div className="relative z-10">
                <p className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#ffcc00] tracking-tighter drop-shadow-md break-all sm:truncate">
                  {formatCurrency(revenue)}
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
      
      {/* Footer */}
      <footer className="w-full text-center z-10 mb-0 pb-6 md:pb-8">
        <div className="max-w-5xl mx-auto border-t border-blue-400/30 pt-4 md:pt-6 mt-8">
          <p className="text-blue-200/80 text-[11px] sm:text-xs font-semibold tracking-wider">
            &copy; 2026 ConvEngine. Created by Wesley Pang. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
