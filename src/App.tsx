import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import { Calculator, Users, MousePointerClick, TrendingUp, BarChart3, Percent, Target, CircleDollarSign, Banknote, Languages, FileText } from 'lucide-react';
import BlurText from './components/BlurText';
import ShinyText from './components/ShinyText';
import SpotlightCard from './components/SpotlightCard';
import BackgroundGrid from './components/BackgroundGrid';
import { motion } from 'motion/react';

const PDF_PAGE_WIDTH = 1240;
const PDF_PAGE_HEIGHT = 1754;

const drawRoundedRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fillStyle: string | CanvasGradient | CanvasPattern,
  strokeStyle?: string,
  lineWidth = 1,
) => {
  const cornerRadius = Math.min(radius, width / 2, height / 2);

  ctx.beginPath();
  ctx.moveTo(x + cornerRadius, y);
  ctx.lineTo(x + width - cornerRadius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + cornerRadius);
  ctx.lineTo(x + width, y + height - cornerRadius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - cornerRadius, y + height);
  ctx.lineTo(x + cornerRadius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - cornerRadius);
  ctx.lineTo(x, y + cornerRadius);
  ctx.quadraticCurveTo(x, y, x + cornerRadius, y);
  ctx.closePath();

  ctx.fillStyle = fillStyle;
  ctx.fill();

  if (strokeStyle) {
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
};

const drawArrow = (
  ctx: CanvasRenderingContext2D,
  startX: number,
  y: number,
  endX: number,
  color: string,
) => {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';

  ctx.beginPath();
  ctx.moveTo(startX, y);
  ctx.lineTo(endX, y);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(endX, y);
  ctx.lineTo(endX - 18, y - 12);
  ctx.lineTo(endX - 18, y + 12);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
};

const PDF_FONT_FAMILY = '"Segoe UI", "Microsoft YaHei", "PingFang SC", "Noto Sans SC", Arial, sans-serif';

const setPdfFont = (
  ctx: CanvasRenderingContext2D,
  size: number,
  weight: number | string = 600,
) => {
  ctx.font = `${weight} ${size}px ${PDF_FONT_FAMILY}`;
};

const drawFitText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  size: number,
  weight: number | string,
  color: string,
  minSize = 16,
) => {
  let fontSize = size;
  setPdfFont(ctx, fontSize, weight);

  while (ctx.measureText(text).width > maxWidth && fontSize > minSize) {
    fontSize -= 1;
    setPdfFont(ctx, fontSize, weight);
  }

  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
};

const drawTruncatedText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  size: number,
  weight: number | string,
  color: string,
) => {
  setPdfFont(ctx, size, weight);
  ctx.fillStyle = color;

  if (ctx.measureText(text).width <= maxWidth) {
    ctx.fillText(text, x, y);
    return;
  }

  let clippedText = text;
  while (clippedText.length > 1 && ctx.measureText(`${clippedText}...`).width > maxWidth) {
    clippedText = clippedText.slice(0, -1);
  }

  ctx.fillText(`${clippedText}...`, x, y);
};

const drawWrappedText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number,
  size: number,
  weight: number | string,
  color: string,
) => {
  setPdfFont(ctx, size, weight);
  ctx.fillStyle = color;

  const tokens = text.includes(' ') ? text.split(/\s+/) : Array.from(text);
  const lines: string[] = [];
  let currentLine = '';

  tokens.forEach((token) => {
    const separator = text.includes(' ') && currentLine ? ' ' : '';
    const candidate = `${currentLine}${separator}${token}`;

    if (ctx.measureText(candidate).width <= maxWidth) {
      currentLine = candidate;
      return;
    }

    if (currentLine) {
      lines.push(currentLine);
    }
    currentLine = token;
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  lines.slice(0, maxLines).forEach((line, index) => {
    let renderedLine = index === maxLines - 1 && lines.length > maxLines ? `${line.replace(/\.{3}$/, '')}...` : line;

    while (renderedLine.length > 1 && ctx.measureText(renderedLine).width > maxWidth) {
      renderedLine = `${renderedLine.replace(/\.{3}$/, '').slice(0, -1)}...`;
    }

    ctx.fillText(renderedLine, x, y + index * lineHeight);
  });
};

const drawReportShadow = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fillStyle: string | CanvasGradient | CanvasPattern,
  strokeStyle?: string,
  shadowColor = 'rgba(15, 23, 42, 0.08)',
) => {
  ctx.save();
  ctx.shadowColor = shadowColor;
  ctx.shadowBlur = 26;
  ctx.shadowOffsetY = 12;
  drawRoundedRect(ctx, x, y, width, height, radius, fillStyle, strokeStyle, 2);
  ctx.restore();
};

const drawSectionLabel = (
  ctx: CanvasRenderingContext2D,
  label: string,
  x: number,
  y: number,
) => {
  drawRoundedRect(ctx, x, y - 24, 7, 27, 4, '#0b74ff');
  drawFitText(ctx, label.toUpperCase(), x + 24, y, 520, 24, 900, '#0f172a');
};

const drawMiniIcon = (
  ctx: CanvasRenderingContext2D,
  type: 'users' | 'target' | 'customer' | 'cart' | 'money' | 'rocket' | 'calendar',
  cx: number,
  cy: number,
  color: string,
  bg = 'rgba(11, 116, 255, 0.10)',
) => {
  ctx.save();
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.arc(cx, cy, 24, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (type === 'money') {
    ctx.beginPath();
    ctx.arc(cx, cy, 15, 0, Math.PI * 2);
    ctx.stroke();
    setPdfFont(ctx, 20, 900);
    ctx.textAlign = 'center';
    ctx.fillText('$', cx, cy + 7);
  } else if (type === 'target') {
    ctx.beginPath();
    ctx.arc(cx, cy, 15, 0, Math.PI * 2);
    ctx.moveTo(cx - 21, cy);
    ctx.lineTo(cx - 10, cy);
    ctx.moveTo(cx + 10, cy);
    ctx.lineTo(cx + 21, cy);
    ctx.moveTo(cx, cy - 21);
    ctx.lineTo(cx, cy - 10);
    ctx.moveTo(cx, cy + 10);
    ctx.lineTo(cx, cy + 21);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'rocket') {
    ctx.beginPath();
    ctx.moveTo(cx - 12, cy + 12);
    ctx.quadraticCurveTo(cx + 2, cy - 20, cx + 17, cy - 16);
    ctx.quadraticCurveTo(cx + 14, cy + 1, cx - 12, cy + 12);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - 16, cy + 15);
    ctx.lineTo(cx - 22, cy + 22);
    ctx.moveTo(cx - 7, cy + 16);
    ctx.lineTo(cx - 10, cy + 24);
    ctx.stroke();
  } else if (type === 'calendar') {
    ctx.strokeRect(cx - 15, cy - 13, 30, 27);
    ctx.beginPath();
    ctx.moveTo(cx - 15, cy - 4);
    ctx.lineTo(cx + 15, cy - 4);
    ctx.moveTo(cx - 7, cy - 18);
    ctx.lineTo(cx - 7, cy - 9);
    ctx.moveTo(cx + 7, cy - 18);
    ctx.lineTo(cx + 7, cy - 9);
    ctx.stroke();
  } else if (type === 'cart') {
    ctx.beginPath();
    ctx.moveTo(cx - 16, cy - 10);
    ctx.lineTo(cx - 10, cy + 7);
    ctx.lineTo(cx + 12, cy + 7);
    ctx.lineTo(cx + 17, cy - 5);
    ctx.lineTo(cx - 8, cy - 5);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx - 7, cy + 15, 3, 0, Math.PI * 2);
    ctx.arc(cx + 10, cy + 15, 3, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.arc(cx, cy - 7, 7, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy + 16, 14, Math.PI, Math.PI * 2);
    ctx.stroke();

    if (type === 'users') {
      ctx.beginPath();
      ctx.arc(cx - 15, cy - 4, 5, 0, Math.PI * 2);
      ctx.arc(cx + 15, cy - 4, 5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx - 15, cy + 16, 9, Math.PI, Math.PI * 2);
      ctx.arc(cx + 15, cy + 16, 9, Math.PI, Math.PI * 2);
      ctx.stroke();
    }
  }

  ctx.textAlign = 'left';
  ctx.restore();
};

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });

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
    pdfButton: "Generate PDF Report",
    pdfButtonLoading: "Generating PDF...",
    pdfTitle: "Revenue Estimate Report",
    pdfGeneratedAt: "Generated",
    pdfFlow: "Conversion Flow",
    pdfSummary: "Detailed Summary",
    pdfError: "Unable to generate the PDF report right now.",
    pdfFooter: "\u00a9 2026 ConvEngine. All rights reserved.",
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
    pdfButton: "生成 PDF 报告",
    pdfButtonLoading: "PDF 生成中...",
    pdfTitle: "营收预估报告",
    pdfGeneratedAt: "生成时间",
    pdfFlow: "转化流程",
    pdfSummary: "详细摘要",
    pdfError: "当前无法生成 PDF 报告。",
    pdfFooter: "\u00a9 2026 ConvEngine. All rights reserved.",
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
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

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

  const generatePdfReport = async () => {
    if (isGeneratingPdf) {
      return;
    }

    setIsGeneratingPdf(true);

    try {
      const snapshot = {
        traffic: safeNumber(traffic),
        leads: safeNumber(leads),
        conversionRate: safeNumber(conversionRate),
        customers: safeNumber(customers),
        closingRate: safeNumber(closingRate),
        aov: safeNumber(aov),
      };
      const estimatedRevenue = snapshot.customers * snapshot.aov;
      const reportLocale = lang === 'zh' ? 'zh-CN' : 'en-US';
      const generatedAt = new Intl.DateTimeFormat(reportLocale, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date());

      const summaryRows = [
        { label: t.traffic, value: formatNumber(snapshot.traffic) },
        { label: t.leads, value: formatNumber(snapshot.leads) },
        { label: t.convRate, value: `${formatNumber(snapshot.conversionRate)}%` },
        { label: t.customers, value: formatNumber(snapshot.customers) },
        { label: t.closeRate, value: `${formatNumber(snapshot.closingRate)}%` },
        { label: t.aov, value: formatCurrency(snapshot.aov) },
        { label: t.estRevenue, value: formatCurrency(estimatedRevenue) },
      ];

      if ('fonts' in document) {
        await document.fonts.ready;
      }

      const canvas = document.createElement('canvas');
      canvas.width = PDF_PAGE_WIDTH;
      canvas.height = PDF_PAGE_HEIGHT;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Canvas rendering context is unavailable.');
      }

      ctx.fillStyle = '#f8fbff';
      ctx.fillRect(0, 0, PDF_PAGE_WIDTH, PDF_PAGE_HEIGHT);

      const pageGradient = ctx.createRadialGradient(1020, 80, 80, 1020, 80, 520);
      pageGradient.addColorStop(0, 'rgba(11, 116, 255, 0.18)');
      pageGradient.addColorStop(0.52, 'rgba(226, 241, 255, 0.62)');
      pageGradient.addColorStop(1, 'rgba(248, 251, 255, 0)');
      ctx.fillStyle = pageGradient;
      ctx.fillRect(0, 0, PDF_PAGE_WIDTH, 520);

      ctx.strokeStyle = 'rgba(11, 116, 255, 0.10)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(1118, 110, 150, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(1118, 110, 118, 0.35, Math.PI * 1.65);
      ctx.stroke();

      ctx.fillStyle = 'rgba(11, 116, 255, 0.15)';
      ctx.beginPath();
      ctx.arc(1130, 110, 96, 0, Math.PI * 2);
      ctx.fill();

      const markGradient = ctx.createLinearGradient(1010, 75, 1148, 192);
      markGradient.addColorStop(0, '#0f74ff');
      markGradient.addColorStop(1, '#0354d8');
      ctx.fillStyle = markGradient;
      ctx.beginPath();
      ctx.moveTo(1015, 80);
      ctx.lineTo(1170, 80);
      ctx.lineTo(1145, 114);
      ctx.lineTo(1057, 114);
      ctx.lineTo(1048, 132);
      ctx.lineTo(1130, 132);
      ctx.lineTo(1110, 162);
      ctx.lineTo(1034, 162);
      ctx.lineTo(1028, 178);
      ctx.lineTo(1094, 178);
      ctx.lineTo(1062, 206);
      ctx.lineTo(990, 206);
      ctx.closePath();
      ctx.fill();

      const accentGradient = ctx.createLinearGradient(1070, 132, 1178, 156);
      accentGradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
      accentGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.85)');
      accentGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = accentGradient;
      ctx.fillRect(1070, 137, 116, 12);
      ctx.fillRect(1036, 172, 116, 10);

      try {
        const logo = await loadImage('/favicon-96x96.png');
        ctx.drawImage(logo, 56, 52, 70, 70);
      } catch {
        drawRoundedRect(ctx, 56, 52, 70, 70, 9, '#06152f');
        drawMiniIcon(ctx, 'money', 91, 87, '#ffcc00', 'rgba(255, 204, 0, 0.12)');
      }

      drawFitText(ctx, 'Conv', 144, 96, 100, 34, 900, '#0f172a');
      drawFitText(ctx, 'Engine', 236, 96, 140, 34, 900, '#0b74ff');

      drawFitText(ctx, lang === 'zh' ? t.pdfGeneratedAt : 'Generated On', 56, 170, 260, 22, 600, '#0f172a');
      drawFitText(ctx, generatedAt, 56, 206, 420, 22, 500, '#475569');

      if (lang === 'en') {
        drawFitText(ctx, 'REVENUE ESTIMATE', 56, 272, 520, 42, 900, '#0f172a');
        drawFitText(ctx, 'REPORT', 548, 272, 210, 42, 900, '#0b74ff');
      } else {
        drawFitText(ctx, t.pdfTitle, 56, 272, 700, 42, 900, '#0f172a');
      }

      const revenueX = 58;
      const revenueY = 324;
      const revenueW = 1124;
      const revenueH = 252;
      const revenueGradient = ctx.createLinearGradient(revenueX, revenueY, revenueX + revenueW, revenueY + revenueH);
      revenueGradient.addColorStop(0, '#0869f2');
      revenueGradient.addColorStop(0.52, '#0053df');
      revenueGradient.addColorStop(1, '#0678ff');
      drawReportShadow(ctx, revenueX, revenueY, revenueW, revenueH, 25, revenueGradient, 'rgba(255, 255, 255, 0.35)', 'rgba(7, 89, 210, 0.22)');

      ctx.save();
      ctx.clip();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      for (let x = revenueX + 650; x < revenueX + revenueW; x += 26) {
        ctx.beginPath();
        ctx.moveTo(x, revenueY + 30);
        ctx.lineTo(x, revenueY + revenueH - 35);
        ctx.stroke();
      }
      for (let y = revenueY + 42; y < revenueY + revenueH - 35; y += 26) {
        ctx.beginPath();
        ctx.moveTo(revenueX + 650, y);
        ctx.lineTo(revenueX + revenueW - 34, y);
        ctx.stroke();
      }

      const bars = [52, 72, 104, 148, 172];
      bars.forEach((barHeight, index) => {
        const barX = revenueX + 780 + index * 62;
        const barY = revenueY + revenueH - 50 - barHeight;
        const barGradient = ctx.createLinearGradient(barX, barY, barX + 36, barY + barHeight);
        barGradient.addColorStop(0, '#c9f7ff');
        barGradient.addColorStop(0.55, '#ffffff');
        barGradient.addColorStop(1, '#43a6ff');
        drawRoundedRect(ctx, barX, barY, 38, barHeight, 5, barGradient);
      });
      ctx.strokeStyle = '#6bdcff';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(revenueX + 796, revenueY + 184);
      ctx.lineTo(revenueX + 850, revenueY + 156);
      ctx.lineTo(revenueX + 882, revenueY + 164);
      ctx.lineTo(revenueX + 930, revenueY + 128);
      ctx.lineTo(revenueX + 984, revenueY + 90);
      ctx.lineTo(revenueX + 1050, revenueY + 48);
      ctx.stroke();
      ctx.fillStyle = '#6bdcff';
      ctx.beginPath();
      ctx.moveTo(revenueX + 1062, revenueY + 42);
      ctx.lineTo(revenueX + 1038, revenueY + 47);
      ctx.lineTo(revenueX + 1052, revenueY + 66);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      drawFitText(ctx, lang === 'zh' ? t.estRevenue : 'Estimated Total Revenue', 105, 396, 470, 27, 700, '#dbeafe');
      drawFitText(ctx, formatCurrency(estimatedRevenue), 105, 502, 600, 78, 900, '#ffffff', 46);

      drawSectionLabel(ctx, lang === 'zh' ? t.pdfFlow : 'Conversion Funnel', 60, 640);

      const funnelY = 672;
      const funnelH = 126;
      const funnelW = 232;
      const funnelXs = [58, 368, 678, 946];
      const funnelItems = [
        { label: lang === 'zh' ? '月度流量' : 'Monthly Traffic', value: formatNumber(snapshot.traffic), icon: 'users' as const, fill: '#ffffff', border: '#b7d4ff', color: '#0b74ff' },
        { label: lang === 'zh' ? '潜在客户' : 'Leads', value: formatNumber(snapshot.leads), icon: 'users' as const, fill: '#f8fbff', border: '#0b74ff', color: '#0b74ff' },
        { label: lang === 'zh' ? '成交客户' : 'Customers', value: formatNumber(snapshot.customers), icon: 'customer' as const, fill: '#fffdf7', border: '#f59e0b', color: '#f59e0b' },
        { label: lang === 'zh' ? '预估营收' : 'Revenue', value: formatCurrency(estimatedRevenue), icon: 'money' as const, fill: '#06152f', border: '#14335f', color: '#ffffff' },
      ];

      funnelItems.forEach((item, index) => {
        const x = funnelXs[index];
        drawReportShadow(ctx, x, funnelY, funnelW, funnelH, 18, item.fill, item.border, 'rgba(15, 23, 42, 0.06)');
        ctx.save();
        drawRoundedRect(ctx, x + 8, funnelY + 8, funnelW - 16, funnelH - 16, 13, 'rgba(255, 255, 255, 0)');
        ctx.clip();
        drawMiniIcon(ctx, item.icon, x + 43, funnelY + 63, index === 3 ? '#ffffff' : item.color, index === 3 ? 'rgba(11, 116, 255, 0.75)' : undefined);
        drawWrappedText(ctx, item.label, x + 82, funnelY + 48, funnelW - 104, 17, 2, 15, 700, index === 3 ? '#ffffff' : '#243044');
        drawFitText(ctx, item.value, x + 82, funnelY + 94, funnelW - 104, 25, 900, index === 3 ? '#ffffff' : '#0f172a', 16);
        ctx.restore();
      });

      drawFitText(ctx, `${formatNumber(snapshot.conversionRate)}%`, 316, funnelY + 39, 38, 17, 700, '#0f172a');
      drawArrow(ctx, 298, funnelY + 70, 354, '#0b74ff');
      drawFitText(ctx, `${formatNumber(snapshot.closingRate)}%`, 626, funnelY + 39, 38, 17, 700, '#0f172a');
      drawArrow(ctx, 608, funnelY + 70, 664, '#0b74ff');
      drawArrow(ctx, 918, funnelY + 70, 932, '#0b74ff');

      drawSectionLabel(ctx, lang === 'zh' ? t.pdfSummary : 'Summary Details', 60, 864);

      const tableX = 58;
      const tableY = 902;
      const tableW = 1124;
      const headerH = 68;
      const rowH = 94;
      const iconColW = 62;
      const labelColW = 635;
      const valueX = tableX + iconColW + labelColW + 28;
      const tableHeight = headerH + rowH * summaryRows.length;

      drawReportShadow(ctx, tableX, tableY, tableW, tableHeight, 12, '#ffffff', '#cfe0f7', 'rgba(15, 23, 42, 0.05)');
      const tableHeaderGradient = ctx.createLinearGradient(tableX, tableY, tableX + tableW, tableY);
      tableHeaderGradient.addColorStop(0, '#0b63ee');
      tableHeaderGradient.addColorStop(1, '#057cff');
      drawRoundedRect(ctx, tableX, tableY, tableW, headerH, 12, tableHeaderGradient);
      ctx.fillStyle = tableHeaderGradient;
      ctx.fillRect(tableX, tableY + 28, tableW, headerH - 28);

      drawFitText(ctx, lang === 'zh' ? '项目' : 'METRIC', tableX + 24, tableY + 43, 180, 18, 800, '#ffffff');
      drawFitText(ctx, lang === 'zh' ? '数值' : 'VALUE', valueX, tableY + 43, 160, 18, 800, '#ffffff');

      ctx.strokeStyle = 'rgba(11, 116, 255, 0.14)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(valueX - 28, tableY + 16);
      ctx.lineTo(valueX - 28, tableY + tableHeight);
      ctx.stroke();

      const tableIcons: Array<'users' | 'users' | 'target' | 'customer' | 'cart' | 'money' | 'money'> = ['users', 'users', 'target', 'customer', 'cart', 'money', 'money'];
      summaryRows.forEach((row, index) => {
        const rowY = tableY + headerH + index * rowH;
        ctx.fillStyle = index % 2 === 0 ? '#f8fbff' : '#ffffff';
        ctx.fillRect(tableX, rowY, tableW, rowH);
        ctx.strokeStyle = '#d7e6f8';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(tableX, rowY);
        ctx.lineTo(tableX + tableW, rowY);
        ctx.stroke();

        drawMiniIcon(ctx, tableIcons[index], tableX + 37, rowY + rowH / 2, '#0b74ff', 'rgba(11, 116, 255, 0.08)');
        drawTruncatedText(ctx, row.label, tableX + iconColW + 12, rowY + rowH / 2 + 7, labelColW - 38, 21, index === summaryRows.length - 1 ? 800 : 500, '#0f172a');
        drawFitText(ctx, row.value, valueX, rowY + rowH / 2 + 7, tableW - (valueX - tableX) - 32, 22, 800, index === summaryRows.length - 1 ? '#0b74ff' : '#0f172a', 16);
      });

      drawFitText(ctx, t.pdfFooter, 58, 1730, 760, 15, 600, '#64748b');

      const imageData = canvas.toDataURL('image/jpeg', 0.98);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      pdf.addImage(imageData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
      pdf.save('ConvEngine-Revenue-Report.pdf');
    } catch (error) {
      console.error('Failed to generate PDF report:', error);
      window.alert(t.pdfError);
    } finally {
      setIsGeneratingPdf(false);
    }
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
    <div className="md:min-h-screen bg-[#0974f1] flex flex-col items-center px-4 pt-6 pb-0 md:px-8 md:pt-8 lg:px-12 lg:pt-12 font-sans text-slate-900 relative overflow-x-hidden w-full">
      {/* Background Decorations Wrapper to prevent scroll stretching */}
      <BackgroundGrid />

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
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tighter text-white uppercase italic drop-shadow-[0_4px_4px_rgba(0,0,0,0.15)] transform -rotate-2 text-left md:text-center leading-[1.1] md:leading-normal flex flex-wrap md:justify-center items-center gap-x-2 sm:gap-x-3">
              <BlurText text={t.title1} className="text-white" />
              <BlurText text={t.title2} className="text-[#ffcc00]" />
            </h1>
          </div>
          <p className="text-blue-100 max-w-xl mx-auto font-medium md:text-lg drop-shadow-md text-center">
            <ShinyText text={t.subtitle} />
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch w-full">
          
          {/* Inputs Card */}
          <SpotlightCard className="shadow-2xl lg:col-span-7 relative z-20">
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
          </SpotlightCard>

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
            <div className="relative z-10 mt-10 p-8 bg-[#0974f1] rounded-[1.5rem] shadow-[0_10px_40px_rgba(9,116,241,0.4)] text-center overflow-hidden group">
              {/* Box decorations */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full mix-blend-overlay opacity-10 blur-xl"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-cyan-300 rounded-full mix-blend-overlay opacity-20 blur-xl"></div>
              
              {/* 5-Second Auto Glare */}
              <motion.div
                className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] z-20 pointer-events-none"
                style={{
                  background: "linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.6) 25%, transparent 30%)",
                }}
                animate={{ x: ["-100%", "100%"] }}
                transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 5, ease: "easeInOut" }}
              />
              
              {/* Hover Glare */}
              <div 
                className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] z-20 pointer-events-none translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-[1.5s] ease-in-out"
                style={{
                  background: "linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.6) 25%, transparent 30%)",
                }}
              />

              
              <p className="text-blue-100 text-sm font-bold uppercase tracking-widest mb-3 relative z-10">{t.estRevenue}</p>
              <div className="relative z-10">
                <p className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#ffcc00] tracking-tighter drop-shadow-md break-all sm:truncate">
                  {formatCurrency(revenue)}
                </p>
              </div>
            </div>
          </div>

        </div>

        <button
          type="button"
          onClick={generatePdfReport}
          disabled={isGeneratingPdf}
          className="w-full md:w-[280px] h-12 md:h-[52px] mx-auto inline-flex items-center justify-center gap-2.5 rounded-2xl bg-[#ffcc00] text-slate-900 font-black text-sm md:text-base tracking-wide shadow-[0_12px_30px_rgba(15,23,42,0.18)] transition-all hover:brightness-95 hover:-translate-y-0.5 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
        >
          <FileText className="w-5 h-5" />
          <span>{isGeneratingPdf ? t.pdfButtonLoading : t.pdfButton}</span>
        </button>
      </div>
      
      {/* Footer */}
      <footer className="w-full text-center z-10 mb-0 md:pb-8 mobile-pwa-footer-fix">
        <div className="max-w-5xl mx-auto border-t border-blue-400/30 pt-4 md:pt-6 mt-8">
          <p className="text-blue-200/80 text-[11px] sm:text-xs font-semibold tracking-wider">
            &copy; 2026 ConvEngine.Created by Wesley Pang. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
