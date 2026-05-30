import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import { Calculator, Users, MousePointerClick, TrendingUp, BarChart3, Percent, Target, CircleDollarSign, Banknote, Languages, FileText, ShoppingCart, GraduationCap, ClipboardList, MapPin, Gem, Sparkles, Activity, X } from 'lucide-react';
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

const drawVectorIcon = (
  ctx: CanvasRenderingContext2D,
  type: 'traffic' | 'lead' | 'conversion' | 'customer' | 'success' | 'aov' | 'revenue',
  cx: number,
  cy: number,
  radius: number,
  color: string,
) => {
  const scale = radius / 16;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2.1 * scale;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (type === 'traffic') {
    // Center person
    ctx.beginPath();
    ctx.arc(cx, cy - 3 * scale, 4 * scale, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy + 10 * scale, 8 * scale, Math.PI, Math.PI * 2);
    ctx.stroke();

    // Left person
    ctx.beginPath();
    ctx.arc(cx - 7 * scale, cy - 1 * scale, 3 * scale, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx - 7 * scale, cy + 10 * scale, 6 * scale, Math.PI, Math.PI * 2 - 0.2);
    ctx.stroke();

    // Right person
    ctx.beginPath();
    ctx.arc(cx + 7 * scale, cy - 1 * scale, 3 * scale, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx + 7 * scale, cy + 10 * scale, 6 * scale, Math.PI + 0.2, Math.PI * 2);
    ctx.stroke();

  } else if (type === 'lead') {
    // Person
    ctx.beginPath();
    ctx.arc(cx - 3 * scale, cy - 3 * scale, 4 * scale, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx - 3 * scale, cy + 10 * scale, 8 * scale, Math.PI, Math.PI * 2);
    ctx.stroke();

    // Plus sign
    ctx.beginPath();
    ctx.moveTo(cx + 7 * scale, cy - 1 * scale);
    ctx.lineTo(cx + 13 * scale, cy - 1 * scale);
    ctx.moveTo(cx + 10 * scale, cy - 4 * scale);
    ctx.lineTo(cx + 10 * scale, cy + 2 * scale);
    ctx.stroke();

  } else if (type === 'conversion') {
    // Target ring
    ctx.beginPath();
    ctx.arc(cx, cy, 9 * scale, 0, Math.PI * 2);
    ctx.stroke();
    // Center point
    ctx.beginPath();
    ctx.arc(cx, cy, 2 * scale, 0, Math.PI * 2);
    ctx.fill();
    // Ticks
    ctx.beginPath();
    ctx.moveTo(cx - 13 * scale, cy);
    ctx.lineTo(cx - 8 * scale, cy);
    ctx.moveTo(cx + 8 * scale, cy);
    ctx.lineTo(cx + 13 * scale, cy);
    ctx.moveTo(cx, cy - 13 * scale);
    ctx.lineTo(cx, cy - 8 * scale);
    ctx.moveTo(cx, cy + 8 * scale);
    ctx.lineTo(cx, cy + 13 * scale);
    ctx.stroke();

  } else if (type === 'customer') {
    // Person
    ctx.beginPath();
    ctx.arc(cx - 3 * scale, cy - 3 * scale, 4 * scale, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx - 3 * scale, cy + 10 * scale, 8 * scale, Math.PI, Math.PI * 2);
    ctx.stroke();

    // Checkmark
    ctx.beginPath();
    ctx.moveTo(cx + 6 * scale, cy);
    ctx.lineTo(cx + 9 * scale, cy + 3 * scale);
    ctx.lineTo(cx + 14 * scale, cy - 2 * scale);
    ctx.stroke();

  } else if (type === 'success') {
    // Circle Check
    ctx.beginPath();
    ctx.arc(cx, cy, 10 * scale, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - 5 * scale, cy);
    ctx.lineTo(cx - 1 * scale, cy + 4 * scale);
    ctx.lineTo(cx + 5 * scale, cy - 3 * scale);
    ctx.stroke();

  } else if (type === 'aov') {
    // Price tag
    ctx.beginPath();
    ctx.moveTo(cx - 10 * scale, cy - 6 * scale);
    ctx.lineTo(cx + 2 * scale, cy - 6 * scale);
    ctx.lineTo(cx + 11 * scale, cy + 3 * scale);
    ctx.lineTo(cx + 2 * scale, cy + 12 * scale);
    ctx.lineTo(cx - 10 * scale, cy);
    ctx.closePath();
    ctx.stroke();
    // Hole
    ctx.beginPath();
    ctx.arc(cx - 4 * scale, cy - 1 * scale, 1.5 * scale, 0, Math.PI * 2);
    ctx.fill();

  } else if (type === 'revenue') {
    // Stack of coins
    ctx.beginPath();
    ctx.ellipse(cx, cy - 5 * scale, 9 * scale, 4 * scale, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - 9 * scale, cy - 5 * scale);
    ctx.lineTo(cx - 9 * scale, cy + 1 * scale);
    ctx.ellipse(cx, cy + 1 * scale, 9 * scale, 4 * scale, 0, 0, Math.PI);
    ctx.lineTo(cx + 9 * scale, cy - 5 * scale);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - 9 * scale, cy + 1 * scale);
    ctx.lineTo(cx - 9 * scale, cy + 7 * scale);
    ctx.ellipse(cx, cy + 7 * scale, 9 * scale, 4 * scale, 0, 0, Math.PI);
    ctx.lineTo(cx + 9 * scale, cy + 1 * scale);
    ctx.stroke();
  }

  ctx.restore();
};

const drawMiniIcon = (
  ctx: CanvasRenderingContext2D,
  type: 'traffic' | 'lead' | 'conversion' | 'customer' | 'success' | 'aov' | 'revenue' | 'users' | 'target' | 'rocket' | 'calendar' | 'cart' | 'money',
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

  let resolvedType = type;
  if (type === 'users') resolvedType = 'traffic';
  if (type === 'money') resolvedType = 'revenue';

  if (
    resolvedType === 'traffic' ||
    resolvedType === 'lead' ||
    resolvedType === 'conversion' ||
    resolvedType === 'customer' ||
    resolvedType === 'success' ||
    resolvedType === 'aov' ||
    resolvedType === 'revenue'
  ) {
    drawVectorIcon(ctx, resolvedType, cx, cy, 24, color);
  } else {
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (type === 'target') {
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
    }
  }

  ctx.textAlign = 'left';
  ctx.restore();
};

type SummaryTableIconType =
  | 'audience'
  | 'lead'
  | 'conversion'
  | 'customerCheck'
  | 'successRate'
  | 'priceTag'
  | 'revenue';

const drawSummaryTableIcon = (
  ctx: CanvasRenderingContext2D,
  type: SummaryTableIconType,
  cx: number,
  cy: number,
  isEmphasis = false,
) => {
  const color = isEmphasis ? '#055fe8' : '#0b74ff';
  const bg = isEmphasis ? '#dbeafe' : '#eff6ff';

  ctx.save();
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.arc(cx, cy, 16, 0, Math.PI * 2);
  ctx.fill();

  let resolvedType: 'traffic' | 'lead' | 'conversion' | 'customer' | 'success' | 'aov' | 'revenue' = 'traffic';
  if (type === 'audience') resolvedType = 'traffic';
  if (type === 'lead') resolvedType = 'lead';
  if (type === 'conversion') resolvedType = 'conversion';
  if (type === 'customerCheck') resolvedType = 'customer';
  if (type === 'successRate') resolvedType = 'success';
  if (type === 'priceTag') resolvedType = 'aov';
  if (type === 'revenue') resolvedType = 'revenue';

  drawVectorIcon(ctx, resolvedType, cx, cy, 16, color);

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

type Lang = 'en' | 'zh';
type PresetKey = 'ecommerce' | 'saas' | 'course' | 'leadGen' | 'localService' | 'highTicket';
type ScenarioKey = 'worst' | 'base' | 'best';
type ReportType = 'internal' | 'client';

const TRANSLATIONS = {
  en: {
    title1: "Revenue",
    title2: "Decision Tool",
    subtitle: "Estimate revenue, spot growth opportunities, and export a clean PDF report from your traffic and conversion numbers.",
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
    pdfModalTitle: "Choose report type",
    pdfModalSubtitle: "Pick the version that best fits your next audience.",
    pdfInternalTitle: "Internal Optimization Report",
    pdfInternalDesc: "Includes growth insights, scenario comparison, key takeaway, and optimization suggestions for internal analysis.",
    pdfClientTitle: "Client Summary Report",
    pdfClientDesc: "A clean revenue estimate report with revenue, conversion flow, and summary details for clients or stakeholders.",
    pdfCancel: "Cancel",
    pdfTitle: "Revenue Estimate Report",
    pdfGeneratedAt: "Generated",
    pdfFlow: "Conversion Flow",
    pdfSummary: "Detailed Summary",
    pdfError: "Unable to generate the PDF report right now.",
    pdfKeyTakeaway: "Key Takeaway",
    pdfGrowthInsight: "Growth Insight",
    pdfScenarioComparison: "Scenario Comparison",
    pdfFooterGenerated: "Generated by ConvEngine. Created by Wesley Pang.",
    pdfFooterRights: "\u00a9 2026 ConvEngine. All rights reserved.",
    pdfFooterDisclaimer: "Estimates are for informational purposes only.",
    presets: "Business Model Presets",
    presetHint: "Pick a model to load realistic starting numbers.",
    presetExplainer: "Choose a common business model to instantly load standardized example numbers. You can still edit every input manually.",
    quickFill: "Quick fill",
    loaded: "Loaded",
    templateMetrics: "Traffic / Conv. Rate / Close Rate / AOV",
    ecommerce: "E-commerce",
    ecommerceDesc: "Direct online purchase funnel",
    saas: "SaaS",
    saasDesc: "Trial or demo to paid customer",
    course: "Online Course",
    courseDesc: "Webinar, course, or coaching funnel",
    leadGen: "Lead Generation",
    leadGenDesc: "Form inquiry or quote request funnel",
    localService: "Local Service",
    localServiceDesc: "Local service booking or quote funnel",
    highTicket: "High-Ticket Service",
    highTicketDesc: "Agency, consulting, or premium service funnel",
    decisionInsights: "Decision Insights",
    insightHint: "See the next growth lever and the range of likely outcomes.",
    funnel: "Funnel",
    funnelHint: "How traffic becomes leads, customers, and revenue.",
    revenue: "Revenue",
    upliftTitle: "If Conv. Rate improves by 1 percentage point",
    ppDefinition: "A 1 percentage point lift means conversion improves from 3% to 4%.",
    upliftLabel: "Extra monthly revenue",
    upliftFormula: "Formula: Traffic × 1% × Closing Rate × AOV",
    upliftAdvice: "Next move: improve the landing page offer, form clarity, or lead magnet before buying more traffic.",
    scenarios: "Scenarios",
    scenarioHint: "Use this range to decide whether the plan still works when assumptions move.",
    best: "Best",
    base: "Base",
    worst: "Worst",
    bestNote: "+15% traffic, +1 percentage point rates, +10% AOV",
    baseNote: "Current inputs",
    worstNote: "-15% traffic, -1 percentage point rates, -10% AOV",
  },
  zh: {
    title1: "营收",
    title2: "决策工具",
    subtitle: "输入流量、转化率、成交率和客单价，立即看见营收预估、优化空间和可导出的 PDF 报告。",
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
    pdfModalTitle: "选择报告类型",
    pdfModalSubtitle: "根据这份报告要给谁看，选择合适版本。",
    pdfInternalTitle: "自己看的优化报告",
    pdfInternalDesc: "包含增长洞察、情景对比、关键结论和优化建议，适合自己分析。",
    pdfClientTitle: "客户看的简洁报告",
    pdfClientDesc: "只包含营收预估、转化流程和详细摘要，适合分享给客户或老板。",
    pdfCancel: "取消",
    pdfTitle: "营收预估报告",
    pdfGeneratedAt: "生成时间",
    pdfFlow: "转化流程",
    pdfSummary: "详细摘要",
    pdfError: "当前无法生成 PDF 报告。",
    pdfKeyTakeaway: "关键结论",
    pdfGrowthInsight: "增长洞察",
    pdfScenarioComparison: "情境对比",
    pdfFooterGenerated: "Generated by ConvEngine. Created by Wesley Pang.",
    pdfFooterRights: "\u00a9 2026 ConvEngine. All rights reserved.",
    pdfFooterDisclaimer: "Estimates are for informational purposes only.",
    presets: "一键填入业务模型",
    presetHint: "选择一种模式，快速载入合理起始数据。",
    presetExplainer: "选择一个常见业务场景，系统会自动填入一组标准示例数据。所有数字都可以继续手动修改。",
    quickFill: "一键填入",
    loaded: "已载入",
    templateMetrics: "流量 / 转化率 / 成交率 / AOV",
    ecommerce: "电商",
    ecommerceDesc: "线上直接购买漏斗",
    saas: "SaaS",
    saasDesc: "试用或演示转付费客户",
    course: "线上课程",
    courseDesc: "直播课、课程或教练服务漏斗",
    leadGen: "线索收集",
    leadGenDesc: "表单咨询或报价请求漏斗",
    localService: "本地服务",
    localServiceDesc: "本地预约或报价漏斗",
    highTicket: "高客单服务",
    highTicketDesc: "代理、咨询或高端服务漏斗",
    decisionInsights: "决策洞察",
    insightHint: "快速判断下一步优化空间和可能结果范围。",
    funnel: "漏斗",
    funnelHint: "看流量如何变成线索、客户和营收。",
    revenue: "营收",
    upliftTitle: "如果转化率提升 1 个百分点",
    ppDefinition: "意思是转化率从 3% 提升到 4%。",
    upliftLabel: "每月可增加营收",
    upliftFormula: "公式：流量 × 1% × 成交率 × AOV",
    upliftAdvice: "下一步建议：先优化落地页卖点、表单清晰度或 Lead Magnet，再继续加大流量。",
    scenarios: "情境对比",
    scenarioHint: "用这个范围判断：假设变化后，这个计划是否仍然值得做。",
    best: "Best",
    base: "Base",
    worst: "Worst",
    bestNote: "流量 +15%，两段转化 +1 个百分点，AOV +10%",
    baseNote: "当前输入",
    worstNote: "流量 -15%，两段转化 -1 个百分点，AOV -10%",
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

const EXCHANGE_RATES: Record<string, number> = {
  USD: 1,
  GBP: 0.78,
  MYR: 4.7,
  EUR: 0.92,
  JPY: 157,
  AUD: 1.5,
  CAD: 1.37,
  CHF: 0.9,
  CNY: 7.25,
  HKD: 7.82,
  NZD: 1.63,
  SGD: 1.35,
  KRW: 1375,
  INR: 83.5,
  BRL: 5.2,
  ZAR: 18.4,
  MXN: 18.1,
  RUB: 89,
  SEK: 10.5,
  NOK: 10.6,
  DKK: 6.86,
  TRY: 32.2,
  THB: 36.6,
  IDR: 16200,
  PHP: 58.5,
  VND: 25400,
  TWD: 32.4,
  PLN: 3.95,
  ARS: 920,
  CLP: 930,
  COP: 3900,
  PEN: 3.75,
  ILS: 3.7,
  AED: 3.67,
  SAR: 3.75,
  EGP: 47.8,
  NGN: 1480,
  KES: 129,
};

const PRESETS: Array<{
  key: PresetKey;
  values: {
    traffic: number;
    conversionRate: number;
    closingRate: number;
    aov: number;
  };
}> = [
  { key: 'ecommerce', values: { traffic: 20000, conversionRate: 3, closingRate: 100, aov: 75 } },
  { key: 'saas', values: { traffic: 12000, conversionRate: 5, closingRate: 15, aov: 99 } },
  { key: 'course', values: { traffic: 8000, conversionRate: 8, closingRate: 10, aov: 499 } },
  { key: 'leadGen', values: { traffic: 10000, conversionRate: 6, closingRate: 20, aov: 350 } },
  { key: 'localService', values: { traffic: 5000, conversionRate: 7, closingRate: 25, aov: 800 } },
  { key: 'highTicket', values: { traffic: 3000, conversionRate: 4, closingRate: 15, aov: 3000 } },
];

const SCENARIO_RULES: Array<{
  key: ScenarioKey;
  trafficMultiplier: number;
  conversionDelta: number;
  closingDelta: number;
  aovMultiplier: number;
}> = [
  { key: 'worst', trafficMultiplier: 0.85, conversionDelta: -1, closingDelta: -1, aovMultiplier: 0.9 },
  { key: 'base', trafficMultiplier: 1, conversionDelta: 0, closingDelta: 0, aovMultiplier: 1 },
  { key: 'best', trafficMultiplier: 1.15, conversionDelta: 1, closingDelta: 1, aovMultiplier: 1.1 },
];

const PRESET_ICONS = {
  ecommerce: ShoppingCart,
  saas: BarChart3,
  course: GraduationCap,
  leadGen: ClipboardList,
  localService: MapPin,
  highTicket: Gem,
};

const calculateProjection = (
  traffic: number,
  conversionRate: number,
  closingRate: number,
  aov: number,
) => {
  const leads = traffic * (conversionRate / 100);
  const customers = leads * (closingRate / 100);

  return {
    traffic,
    leads,
    conversionRate,
    customers,
    closingRate,
    aov,
    revenue: customers * aov,
  };
};

export default function App() {
  const [traffic, setTraffic] = useState<string>('10000');
  const [leads, setLeads] = useState<string>('300');
  const [conversionRate, setConversionRate] = useState<string>('3');
  const [customers, setCustomers] = useState<string>('9');
  const [closingRate, setClosingRate] = useState<string>('3');
  const [aov, setAov] = useState<string>('300');
  const [currency, setCurrency] = useState<string>('USD');
  const [lang, setLang] = useState<Lang>('zh');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [activePreset, setActivePreset] = useState<PresetKey | null>(null);

  const t = TRANSLATIONS[lang];

  useEffect(() => {
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
  }, [lang]);

  const safeNumber = (val: string) => {
    const num = parseFloat(val);
    return isNaN(num) || !isFinite(num) ? 0 : Math.max(0, num);
  };

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrency(e.target.value);
  };

  const trafficValue = safeNumber(traffic);
  const conversionRateValue = safeNumber(conversionRate);
  const customersValue = safeNumber(customers);
  const closingRateValue = safeNumber(closingRate);
  const aovValue = safeNumber(aov);
  const revenue = customersValue * aovValue;
  const selectedCurrency = CURRENCIES.find(c => c.code === currency);
  const selectedCurrencyRate = Number.isFinite(EXCHANGE_RATES[currency]) ? EXCHANGE_RATES[currency] : 1;

  const formatCurrencyAmount = (val: number) => {
    const safeValue = Number.isFinite(val) ? Math.max(0, val) : 0;

    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency,
      currencyDisplay: 'narrowSymbol',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(safeValue);
  };

  const formatInputCurrency = (val: number) => {
    return formatCurrencyAmount(val);
  };

  const formatRevenueCurrency = (baseUsdValue: number) => {
    return formatCurrencyAmount(baseUsdValue * selectedCurrencyRate);
  };

  const formatNumber = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 1,
    }).format(val);
  };

  const conversionUpliftRevenue = trafficValue * 0.01 * (closingRateValue / 100) * aovValue;
  const scenarioProjections = SCENARIO_RULES.map((scenario) => {
    const projection = calculateProjection(
      trafficValue * scenario.trafficMultiplier,
      Math.max(0, conversionRateValue + scenario.conversionDelta),
      Math.max(0, closingRateValue + scenario.closingDelta),
      aovValue * scenario.aovMultiplier,
    );

    return {
      ...scenario,
      ...projection,
      note: t[`${scenario.key}Note` as const],
      label: t[scenario.key],
    };
  });

  const getPdfSnapshot = () => {
    const snapshot = {
      traffic: safeNumber(traffic),
      leads: safeNumber(leads),
      conversionRate: safeNumber(conversionRate),
      customers: safeNumber(customers),
      closingRate: safeNumber(closingRate),
      aov: safeNumber(aov),
    };
    const estimatedRevenue = snapshot.customers * snapshot.aov;
    const conversionUplift = snapshot.traffic * 0.01 * (snapshot.closingRate / 100) * snapshot.aov;
    const scenarioRows = SCENARIO_RULES.map((scenario) => {
      const projection = calculateProjection(
        snapshot.traffic * scenario.trafficMultiplier,
        Math.max(0, snapshot.conversionRate + scenario.conversionDelta),
        Math.max(0, snapshot.closingRate + scenario.closingDelta),
        snapshot.aov * scenario.aovMultiplier,
      );

      return {
        key: scenario.key,
        label: t[scenario.key],
        note: t[`${scenario.key}Note` as const],
        revenue: projection.revenue,
      };
    });

    return {
      snapshot,
      estimatedRevenue,
      conversionUplift,
      scenarioRows,
    };
  };

  const generateInternalOptimizationReport = async () => {
    if (isGeneratingPdf) {
      return;
    }

    setIsGeneratingPdf(true);

    try {
      const { snapshot, estimatedRevenue, conversionUplift, scenarioRows } = getPdfSnapshot();
      const reportLocale = lang === 'zh' ? 'zh-CN' : 'en-US';
      const generatedAt = new Intl.DateTimeFormat(reportLocale, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date());
      const estimatedRevenueDisplay = formatRevenueCurrency(estimatedRevenue);
      const keyTakeawayText = lang === 'zh'
        ? `在 ${formatNumber(snapshot.traffic)} 月流量、${formatNumber(snapshot.conversionRate)}% 转化率、${formatNumber(snapshot.closingRate)}% 成交率和 ${currency} ${formatNumber(snapshot.aov)} 客单价下，预计总营收为 ${currency} ${formatNumber(estimatedRevenue * selectedCurrencyRate)}。`
        : `With ${formatNumber(snapshot.traffic)} monthly traffic, a ${formatNumber(snapshot.conversionRate)}% conversion rate, a ${formatNumber(snapshot.closingRate)}% closing rate, and ${currency} ${formatNumber(snapshot.aov)} AOV, the estimated revenue is ${currency} ${formatNumber(estimatedRevenue * selectedCurrencyRate)}.`;

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


      try {
        const logo = await loadImage('/favicon-96x96.png');
        ctx.drawImage(logo, 54, 42, 64, 64);
      } catch {
        drawRoundedRect(ctx, 54, 42, 64, 64, 10, '#06152f');
      }

      setPdfFont(ctx, 32, 900);
      const convWidth = ctx.measureText('Conv').width;
      drawFitText(ctx, 'Conv', 132, 84, 90, 32, 900, '#0f172a');
      drawFitText(ctx, 'Engine', 132 + convWidth + 1.5, 84, 140, 32, 900, '#0b74ff');
      drawFitText(ctx, lang === 'zh' ? '生成时间' : 'GENERATED ON', 54, 142, 220, 17, 800, '#64748b');
      drawFitText(ctx, generatedAt, 54, 176, 360, 20, 600, '#475569');

      if (lang === 'zh') {
        drawFitText(ctx, '营收预估报告', 54, 250, 420, 48, 900, '#0f172a');
      } else {
        drawFitText(ctx, 'REVENUE ESTIMATE REPORT', 54, 250, 760, 42, 900, '#0f172a');
      }

      const revenueX = 54;
      const revenueY = 294;
      const revenueW = 1132;
      const revenueH = 210;
      const revenueGradient = ctx.createLinearGradient(revenueX, revenueY, revenueX + revenueW, revenueY + revenueH);
      revenueGradient.addColorStop(0, '#096ff2');
      revenueGradient.addColorStop(0.55, '#0055df');
      revenueGradient.addColorStop(1, '#087cff');
      drawReportShadow(ctx, revenueX, revenueY, revenueW, revenueH, 18, revenueGradient, 'rgba(255, 255, 255, 0.38)', 'rgba(7, 89, 210, 0.18)');

      drawFitText(ctx, lang === 'zh' ? '预计总营收' : 'ESTIMATED TOTAL REVENUE', revenueX + 38, revenueY + 58, 430, 22, 900, '#dbeafe');
      drawFitText(ctx, estimatedRevenueDisplay, revenueX + 38, revenueY + 130, 520, 66, 900, '#ffffff', 40);
      drawWrappedText(ctx, lang === 'zh' ? '基于当前输入数据计算得出' : 'Calculated based on your current inputs', revenueX + 40, revenueY + 168, 360, 17, 2, 16, 600, '#dbeafe');

      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,0.24)';
      ctx.lineWidth = 3;
      const chartX = revenueX + 775;
      const chartBase = revenueY + 164;
      const barHeights = [42, 62, 82, 112, 136];
      barHeights.forEach((height, index) => {
        const x = chartX + index * 64;
        const y = chartBase - height;
        const barGradient = ctx.createLinearGradient(x, y, x, chartBase);
        barGradient.addColorStop(0, '#ffffff');
        barGradient.addColorStop(1, 'rgba(255,255,255,0.28)');
        drawRoundedRect(ctx, x, y, 38, height, 6, barGradient);
      });
      ctx.strokeStyle = '#e0f2fe';
      ctx.beginPath();
      ctx.moveTo(chartX + 18, chartBase - 50);
      ctx.lineTo(chartX + 82, chartBase - 74);
      ctx.lineTo(chartX + 146, chartBase - 98);
      ctx.lineTo(chartX + 210, chartBase - 126);
      ctx.lineTo(chartX + 286, chartBase - 158);
      ctx.stroke();
      ctx.restore();

      drawSectionLabel(ctx, lang === 'zh' ? '转化流程' : 'CONVERSION FLOW', 54, 566);
      const flowY = 596;
      const flowW = 220;
      const flowH = 92;
      const flowXs = [54, 342, 630, 918];
      const flowItems = [
        { label: lang === 'zh' ? '月度流量' : 'Monthly Traffic', value: formatNumber(snapshot.traffic), icon: 'traffic' as const, fill: '#ffffff', border: '#b8d5ff', color: '#0b74ff' },
        { label: lang === 'zh' ? '潜在客户' : 'Leads', value: formatNumber(snapshot.leads), icon: 'lead' as const, fill: '#ffffff', border: '#b8d5ff', color: '#0b74ff' },
        { label: lang === 'zh' ? '成交客户' : 'Customers', value: formatNumber(snapshot.customers), icon: 'customer' as const, fill: '#fffdf7', border: '#f59e0b', color: '#f59e0b' },
        { label: lang === 'zh' ? '预估营收' : 'Revenue', value: estimatedRevenueDisplay, icon: 'revenue' as const, fill: '#06152f', border: '#14335f', color: '#ffffff' },
      ];

      flowItems.forEach((item, index) => {
        const x = flowXs[index];
        drawReportShadow(ctx, x, flowY, flowW, flowH, 14, item.fill, item.border, 'rgba(15,23,42,0.05)');
        drawMiniIcon(ctx, item.icon, x + 42, flowY + 46, index === 3 ? '#ffffff' : item.color, index === 3 ? 'rgba(11, 116, 255, 0.75)' : undefined);
        drawWrappedText(ctx, item.label, x + 80, flowY + 38, 112, 15, 2, 14, 800, index === 3 ? '#ffffff' : '#172033');
        drawFitText(ctx, item.value, x + 80, flowY + 72, 126, 21, 900, index === 3 ? '#ffffff' : '#0f172a', 13);
      });
      drawFitText(ctx, `${formatNumber(snapshot.conversionRate)}%`, 286, flowY + 34, 40, 16, 900, '#0f172a');
      drawArrow(ctx, 274, flowY + 52, 326, '#0b74ff');
      drawFitText(ctx, `${formatNumber(snapshot.closingRate)}%`, 574, flowY + 34, 40, 16, 900, '#0f172a');
      drawArrow(ctx, 562, flowY + 52, 614, '#0b74ff');
      drawArrow(ctx, 850, flowY + 52, 902, '#0b74ff');

      const midY = 758;
      drawSectionLabel(ctx, lang === 'zh' ? '增长洞察' : 'GROWTH INSIGHT', 54, midY);
      drawSectionLabel(ctx, lang === 'zh' ? '情景对比' : 'SCENARIO COMPARISON', 534, midY);

      drawReportShadow(ctx, 54, midY + 28, 430, 162, 14, '#f1fff5', '#bbf7d0', 'rgba(21, 128, 61, 0.06)');
      drawMiniIcon(ctx, 'rocket', 108, midY + 108, '#16a34a', 'rgba(22, 163, 74, 0.12)');
      drawWrappedText(ctx, lang === 'zh' ? '如果转化率提升 1 个百分点' : 'If conversion rate improves by +1 percentage point', 176, midY + 78, 250, 18, 2, 16, 800, '#0f172a');
      drawFitText(ctx, `+${formatRevenueCurrency(conversionUplift)}`, 176, midY + 124, 250, 32, 900, '#16a34a', 20);
      drawWrappedText(ctx, lang === 'zh' ? '预计额外营收' : 'Estimated additional revenue', 176, midY + 154, 220, 15, 2, 14, 600, '#475569');

      const scenarioStartX = 534;
      const scenarioW = 200;
      scenarioRows.forEach((scenario, index) => {
        const x = scenarioStartX + index * 216;
        const isWorst = scenario.key === 'worst';
        const isBase = scenario.key === 'base';
        const accent = isWorst ? '#ef4444' : isBase ? '#0b74ff' : '#16a34a';
        const fill = isWorst ? '#fff7f7' : isBase ? '#eef6ff' : '#f1fff5';
        const label = isWorst ? 'Worst Case' : isBase ? lang === 'zh' ? 'Base Case (当前)' : 'Base Case' : 'Best Case';
        drawReportShadow(ctx, x, midY + 28, scenarioW, 162, 14, fill, accent, 'rgba(15,23,42,0.05)');
        drawFitText(ctx, label, x + 22, midY + 68, 155, 17, 900, accent);
        drawFitText(ctx, formatRevenueCurrency(scenario.revenue), x + 22, midY + 104, 155, 24, 900, accent, 15);
        drawWrappedText(ctx, scenario.note, x + 22, midY + 132, 150, 15, 3, 12, 600, '#334155');
      });

      drawSectionLabel(ctx, lang === 'zh' ? '详细摘要' : 'DETAILED SUMMARY', 54, 1006);
      const tableX = 54;
      const tableY = 1038;
      const tableW = 1132;
      const headerH = 44;
      const rowH = 46;
      const labelColW = 680;
      const valueX = tableX + labelColW;
      const tableRows = [
        { label: lang === 'zh' ? '月度流量' : 'Monthly Traffic', value: formatNumber(snapshot.traffic), icon: 'audience' as const },
        { label: lang === 'zh' ? '潜在客户' : 'Leads', value: formatNumber(snapshot.leads), icon: 'lead' as const },
        { label: lang === 'zh' ? '转化率' : 'Conversion Rate', value: `${formatNumber(snapshot.conversionRate)}%`, icon: 'conversion' as const },
        { label: lang === 'zh' ? '成交客户' : 'Customers', value: formatNumber(snapshot.customers), icon: 'customerCheck' as const },
        { label: lang === 'zh' ? '成交率' : 'Closing Rate', value: `${formatNumber(snapshot.closingRate)}%`, icon: 'successRate' as const },
        { label: lang === 'zh' ? '平均客单价' : 'Average Order Value', value: formatInputCurrency(snapshot.aov), icon: 'priceTag' as const },
        { label: lang === 'zh' ? '预估总营收' : 'Estimated Revenue', value: estimatedRevenueDisplay, icon: 'revenue' as const },
      ];

      drawReportShadow(ctx, tableX, tableY, tableW, headerH + rowH * tableRows.length, 12, '#ffffff', '#cfe0f7', 'rgba(15,23,42,0.05)');
      drawRoundedRect(ctx, tableX, tableY, tableW, headerH, 12, '#0b74ff');
      ctx.fillStyle = '#0b74ff';
      ctx.fillRect(tableX, tableY + 18, tableW, headerH - 18);
      drawFitText(ctx, lang === 'zh' ? '项目' : 'Item', tableX + 24, tableY + 30, 220, 16, 900, '#ffffff');
      drawFitText(ctx, lang === 'zh' ? '数值' : 'Value', valueX + 24, tableY + 30, 220, 16, 900, '#ffffff');

      tableRows.forEach((row, index) => {
        const y = tableY + headerH + index * rowH;
        const isLast = index === tableRows.length - 1;
        ctx.fillStyle = isLast ? '#e4efff' : index % 2 === 0 ? '#f8fbff' : '#ffffff';
        ctx.fillRect(tableX, y, tableW, rowH);
        ctx.strokeStyle = '#d7e6f8';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(tableX, y);
        ctx.lineTo(tableX + tableW, y);
        ctx.stroke();
        if (isLast) {
          ctx.strokeStyle = 'rgba(11, 116, 255, 0.34)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(tableX, y);
          ctx.lineTo(tableX + tableW, y);
          ctx.stroke();
        }
        drawSummaryTableIcon(ctx, row.icon, tableX + 36, y + rowH / 2, isLast);
        drawFitText(ctx, row.label, tableX + 76, y + 30, 420, 16, isLast ? 900 : 700, '#0f172a');
        drawFitText(ctx, row.value, valueX + 24, y + 30, 360, isLast ? 19 : 17, 900, isLast ? '#0b74ff' : '#0f172a');
      });

      const takeawayY = 1438;
      drawReportShadow(ctx, 54, takeawayY, 1132, 160, 14, '#f8fbff', '#cfe0f7', 'rgba(15,23,42,0.05)');
      drawMiniIcon(ctx, 'target', 112, takeawayY + 80, '#0b74ff', 'rgba(11,116,255,0.12)');
      drawFitText(ctx, lang === 'zh' ? '关键结论' : 'KEY TAKEAWAY', 180, takeawayY + 52, 260, 20, 900, '#0f172a');
      drawWrappedText(ctx, keyTakeawayText, 180, takeawayY + 88, 700, 24, 3, 18, 600, '#334155');
      drawFitText(ctx, estimatedRevenueDisplay, 940, takeawayY + 95, 210, 30, 900, '#0b74ff', 22);

      ctx.save();
      setPdfFont(ctx, 14, 600);
      ctx.fillStyle = '#475569';
      ctx.textAlign = 'right';
      ctx.fillText(t.pdfFooterRights, 1186, 1722);
      ctx.restore();

      const imageData = canvas.toDataURL('image/jpeg', 0.98);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      pdf.addImage(imageData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
      pdf.setDisplayMode(1, 'single');
      pdf.viewerPreferences({ PrintScaling: 'None' });
      pdf.save('ConvEngine-Optimization-Report.pdf');
    } catch (error) {
      console.error('Failed to generate internal optimization PDF report:', error);
      window.alert(t.pdfError);
    } finally {
      setIsGeneratingPdf(false);
    }
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
      const estimatedRevenueDisplay = formatRevenueCurrency(estimatedRevenue);
      const reportLocale = lang === 'zh' ? 'zh-CN' : 'en-US';
      const generatedAt = new Intl.DateTimeFormat(reportLocale, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date());

      const summaryRows = [
        { label: lang === 'zh' ? '月度流量' : 'Monthly Traffic', value: formatNumber(snapshot.traffic) },
        { label: lang === 'zh' ? '潜在客户' : 'Leads', value: formatNumber(snapshot.leads) },
        { label: lang === 'zh' ? '转化率' : 'Conversion Rate', value: `${formatNumber(snapshot.conversionRate)}%` },
        { label: lang === 'zh' ? '成交客户' : 'Customers', value: formatNumber(snapshot.customers) },
        { label: lang === 'zh' ? '成交率' : 'Closing Rate', value: `${formatNumber(snapshot.closingRate)}%` },
        { label: lang === 'zh' ? '平均客单价' : 'Average Order Value', value: formatInputCurrency(snapshot.aov) },
        { label: lang === 'zh' ? '预计总营收' : 'Estimated Revenue', value: estimatedRevenueDisplay },
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


      try {
        const logo = await loadImage('/favicon-96x96.png');
        ctx.drawImage(logo, 56, 52, 70, 70);
      } catch {
        drawRoundedRect(ctx, 56, 52, 70, 70, 9, '#06152f');
        drawMiniIcon(ctx, 'money', 91, 87, '#ffcc00', 'rgba(255, 204, 0, 0.12)');
      }

      setPdfFont(ctx, 34, 900);
      const convWidth2 = ctx.measureText('Conv').width;
      drawFitText(ctx, 'Conv', 144, 96, 100, 34, 900, '#0f172a');
      drawFitText(ctx, 'Engine', 144 + convWidth2 + 1.5, 96, 140, 34, 900, '#0b74ff');

      drawFitText(ctx, lang === 'zh' ? t.pdfGeneratedAt : 'Generated On', 56, 170, 260, 22, 600, '#0f172a');
      drawFitText(ctx, generatedAt, 56, 206, 420, 22, 500, '#475569');

      if (lang === 'en') {
        drawFitText(ctx, 'Revenue Estimate', 56, 272, 520, 42, 900, '#0f172a');
        drawFitText(ctx, 'Report', 512, 272, 210, 42, 900, '#0b74ff');
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
      drawFitText(ctx, estimatedRevenueDisplay, 105, 502, 600, 78, 900, '#ffffff', 46);

      drawSectionLabel(ctx, lang === 'zh' ? '转化流程' : 'Conversion Flow', 60, 640);

      const funnelY = 672;
      const funnelH = 126;
      const funnelW = 232;
      const funnelXs = [58, 368, 678, 946];
      const funnelItems = [
        { label: lang === 'zh' ? '月度流量' : 'Monthly Traffic', value: formatNumber(snapshot.traffic), icon: 'traffic' as const, fill: '#ffffff', border: '#b7d4ff', color: '#0b74ff' },
        { label: lang === 'zh' ? '潜在客户' : 'Leads', value: formatNumber(snapshot.leads), icon: 'lead' as const, fill: '#f8fbff', border: '#0b74ff', color: '#0b74ff' },
        { label: lang === 'zh' ? '成交客户' : 'Customers', value: formatNumber(snapshot.customers), icon: 'customer' as const, fill: '#fffdf7', border: '#f59e0b', color: '#f59e0b' },
        { label: lang === 'zh' ? '预计总营收' : 'Estimated Revenue', value: estimatedRevenueDisplay, icon: 'revenue' as const, fill: '#06152f', border: '#14335f', color: '#ffffff' },
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

      drawSectionLabel(ctx, lang === 'zh' ? '详细摘要' : 'Detailed Summary', 60, 864);

      const tableX = 58;
      const tableY = 902;
      const tableW = 1124;
      const headerH = 54;
      const rowH = 58;
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

      drawFitText(ctx, lang === 'zh' ? '项目' : 'Item', tableX + 24, tableY + 35, 180, 18, 800, '#ffffff');
      drawFitText(ctx, lang === 'zh' ? '数值' : 'Value', valueX, tableY + 35, 160, 18, 800, '#ffffff');

      ctx.strokeStyle = 'rgba(11, 116, 255, 0.14)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(valueX - 28, tableY + 16);
      ctx.lineTo(valueX - 28, tableY + tableHeight);
      ctx.stroke();

      const tableIcons: Array<'traffic' | 'lead' | 'conversion' | 'customer' | 'success' | 'aov' | 'revenue'> = ['traffic', 'lead', 'conversion', 'customer', 'success', 'aov', 'revenue'];
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
        drawTruncatedText(ctx, row.label, tableX + iconColW + 12, rowY + rowH / 2 + 7, labelColW - 38, 18, index === summaryRows.length - 1 ? 800 : 500, '#0f172a');
        drawFitText(ctx, row.value, valueX, rowY + rowH / 2 + 7, tableW - (valueX - tableX) - 32, 19, 800, index === summaryRows.length - 1 ? '#0b74ff' : '#0f172a', 15);
      });

      ctx.save();
      setPdfFont(ctx, 14, 600);
      ctx.fillStyle = '#64748b';
      ctx.textAlign = 'right';
      ctx.fillText(t.pdfFooterRights, 1186, 1722);
      ctx.restore();

      const imageData = canvas.toDataURL('image/jpeg', 0.98);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      pdf.addImage(imageData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
      pdf.setDisplayMode(1, 'single');
      pdf.viewerPreferences({ PrintScaling: 'None' });
      pdf.save('ConvEngine-Client-Summary-Report.pdf');
    } catch (error) {
      console.error('Failed to generate PDF report:', error);
      window.alert(t.pdfError);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleTrafficChange = (val: string) => {
    setActivePreset(null);
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
    setActivePreset(null);
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
    setActivePreset(null);
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
    setActivePreset(null);
    setCustomers(val);
    const c = safeNumber(val);
    const l = safeNumber(leads);
    const clr = l > 0 ? (c / l) * 100 : 0;
    setClosingRate(Number(clr.toFixed(2)).toString());
  };

  const handleClosingRateChange = (val: string) => {
    setActivePreset(null);
    setClosingRate(val);
    const clr = safeNumber(val);
    const l = safeNumber(leads);
    const c = l * (clr / 100);
    setCustomers(Number(c.toFixed(2)).toString());
  };

  const handlePresetApply = (presetKey: PresetKey) => {
    const preset = PRESETS.find((item) => item.key === presetKey);
    if (!preset) {
      return;
    }

    const projected = calculateProjection(
      preset.values.traffic,
      preset.values.conversionRate,
      preset.values.closingRate,
      preset.values.aov,
    );

    setTraffic(preset.values.traffic.toString());
    setConversionRate(preset.values.conversionRate.toString());
    setClosingRate(preset.values.closingRate.toString());
    setAov(preset.values.aov.toString());
    setLeads(Number(projected.leads.toFixed(2)).toString());
    setCustomers(Number(projected.customers.toFixed(2)).toString());
    setActivePreset(presetKey);
  };

  const handleReportTypeSelect = async (reportType: ReportType) => {
    setIsPdfModalOpen(false);
    if (reportType === 'internal') {
      await generateInternalOptimizationReport();
      return;
    }

    await generatePdfReport();
  };

  return (
    <div className="md:min-h-screen bg-[#0974f1] flex flex-col items-center px-4 pt-6 pb-0 md:px-8 md:pt-8 lg:px-12 lg:pt-12 font-sans text-slate-900 relative overflow-x-hidden w-full">
      {/* Background Decorations Wrapper to prevent scroll stretching */}
      <BackgroundGrid />

      {/* Top Left Brand: Logo & Text */}
      <div className="absolute top-3 left-3 md:top-[28px] md:left-[28px] flex items-center gap-2 md:gap-3 z-50">
        <img src="/favicon-96x96.png" alt="ConvEngine Logo" className="w-[40px] h-[40px] md:w-[60px] md:h-[60px] object-contain rounded-xl" />
        <span className="hidden sm:inline text-white font-semibold text-base md:text-xl tracking-tight md:tracking-wide">
          <span className="text-[#ffcc00]">Conv</span>Engine
        </span>
      </div>

      {/* Top Right Controls: Language & Currency */}
      <div className="absolute top-3 right-3 md:top-6 md:right-6 flex items-center gap-1.5 md:gap-2 z-50">
        <div
          role="group"
          aria-label="Language"
          className="flex items-center gap-1 bg-white px-1 py-1 rounded-full shadow-md border border-slate-100"
        >
          <Languages className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#0974f1]" />
          {(['zh', 'en'] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setLang(option)}
              className={`h-6 px-2 rounded-full text-[10px] md:text-xs font-black transition-colors cursor-pointer ${
                lang === option
                  ? 'bg-[#0974f1] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
              aria-pressed={lang === option}
            >
              {option === 'zh' ? '中文' : 'EN'}
            </button>
          ))}
        </div>

        <div className="relative flex items-center gap-1 md:gap-1.5 bg-white px-2 md:px-2.5 py-1 md:py-1.5 rounded-full shadow-md border border-slate-100 transition-transform hover:scale-105 min-w-[96px] sm:min-w-[128px] md:min-w-[180px] max-w-[180px] md:max-w-[260px]">
          <CircleDollarSign className="w-4 h-4 text-[#0974f1] shrink-0" />
          <div className="flex items-center gap-1 pointer-events-none w-full min-w-0">
            <span className="min-w-0 text-[10px] sm:text-xs font-bold text-slate-800 whitespace-nowrap leading-tight">
              {currency} <span>({selectedCurrency?.zhName})</span>
              <span className="hidden md:inline"> - {selectedCurrency?.name}</span>
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

      <div className="flex flex-col items-center justify-center flex-1 w-full max-w-5xl gap-6 sm:gap-8 mt-[56px] mb-[20px] z-10">
        
        {/* Header */}
        <div className="flex flex-col items-center gap-4 mt-4">
          <div className="flex flex-col items-center justify-center gap-3 sm:gap-4">
            <div className="inline-flex items-center justify-center p-3 sm:p-4 md:p-5 bg-[#ffcc00] rounded-full shadow-xl transform -rotate-6 shrink-0 z-10">
              <Calculator className="w-9 h-9 sm:w-11 sm:h-11 md:w-12 md:h-12 text-slate-900" />
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tight text-white uppercase drop-shadow-[0_4px_4px_rgba(0,0,0,0.15)] text-left md:text-center leading-[1.05] md:leading-[1.02] flex flex-wrap md:justify-center items-center gap-x-2 sm:gap-x-3">
              <BlurText text={t.title1} className="text-white" />
              <BlurText text={t.title2} className="text-[#ffcc00]" />
            </h1>
          </div>
          <p className="text-blue-100 max-w-2xl mx-auto px-2 font-medium md:text-lg drop-shadow-md text-center leading-relaxed">
            <ShinyText text={t.subtitle} />
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start lg:items-stretch w-full">
          
          {/* Inputs Card */}
          <SpotlightCard className="shadow-2xl lg:col-span-7 relative z-20">
            <h2 className="text-2xl font-black uppercase text-slate-800 tracking-tight mb-6 flex items-center gap-3">
              <BarChart3 className="w-7 h-7 text-[#0974f1]" />
              {t.metrics}
            </h2>

            <div className="mb-6 p-4 bg-blue-50/80 border-2 border-blue-100 rounded-xl">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-[#0974f1]">{t.quickFill}</p>
                  <p className="mt-1 text-lg font-black text-slate-800">{t.presets}</p>
                  <p className="mt-2 text-sm leading-relaxed font-semibold text-slate-600">{t.presetExplainer}</p>
                </div>
                <Sparkles className="w-5 h-5 text-[#0974f1] shrink-0" />
              </div>
              <p className="mb-2 text-[11px] font-black uppercase tracking-wide text-slate-400">{t.templateMetrics}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PRESETS.map((preset) => {
                  const Icon = PRESET_ICONS[preset.key];
                  const isActive = activePreset === preset.key;

                  return (
                    <button
                      key={preset.key}
                      type="button"
                      onClick={() => handlePresetApply(preset.key)}
                      className={`min-h-[96px] rounded-xl border-2 px-4 py-3 text-left transition-all hover:-translate-y-0.5 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 ${
                        isActive
                          ? 'bg-white border-[#0974f1] shadow-[0_8px_24px_rgba(9,116,241,0.14)]'
                          : 'bg-white/90 border-blue-100 hover:border-[#0974f1]'
                      }`}
                    >
                      <span className="flex items-center justify-between gap-3">
                        <span className="flex items-center gap-2 text-sm font-black text-slate-800">
                          <Icon className="w-4 h-4 text-[#0974f1]" />
                          {t[preset.key]}
                        </span>
                        {isActive && (
                          <span className="rounded-full bg-[#0974f1] px-2 py-1 text-[10px] font-black text-white">
                            {t.loaded}
                          </span>
                        )}
                      </span>
                      <span className="block mt-1 text-[11px] leading-snug font-semibold text-slate-500">
                        {t[`${preset.key}Desc` as const]}
                      </span>
                      <span className="block mt-2 text-[11px] leading-snug font-black text-slate-700">
                        {formatNumber(preset.values.traffic)} / {formatNumber(preset.values.conversionRate)}% / {formatNumber(preset.values.closingRate)}% / {formatInputCurrency(preset.values.aov)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            
            <div className="space-y-5">
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
                    className="block w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:ring-0 focus:border-[#0974f1] focus:bg-blue-50/50 outline-none transition-all font-bold text-lg text-slate-800"
                    placeholder="e.g., 10000"
                    min="0"
                  />
                </div>
              </div>

              {/* Leads & Conversion Rate Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl">
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
                    onChange={(e) => {
                      setActivePreset(null);
                      setAov(e.target.value);
                    }}
                    className="block w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:ring-0 focus:border-[#0974f1] focus:bg-blue-50/50 outline-none transition-all font-bold text-lg text-slate-800"
                    placeholder="e.g., 300"
                    min="0"
                  />
                </div>
              </div>
            </div>

          </SpotlightCard>

          {/* Results Card */}
          <div className="bg-white rounded-[2rem] shadow-2xl p-6 md:p-8 lg:col-span-5 flex flex-col h-full relative overflow-hidden z-20">
            {/* Soft decorative blob */}
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-cyan-100 rounded-full blur-[60px] opacity-60"></div>
            
            <div className="relative z-10 space-y-6">
              <h2 className="text-2xl font-black uppercase text-slate-800 tracking-tight flex items-center gap-3">
                <TrendingUp className="w-7 h-7 text-[#ffcc00]" />
                {t.projections}
              </h2>

              {/* Huge Revenue Box */}
              <div className="relative p-7 bg-[#0974f1] rounded-[1.5rem] shadow-[0_10px_40px_rgba(9,116,241,0.36)] text-center overflow-hidden group">
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
                  <p className="text-4xl sm:text-5xl lg:text-[3.25rem] font-black text-[#ffcc00] tracking-tighter drop-shadow-md break-words leading-none">
                    {formatRevenueCurrency(revenue)}
                  </p>
                </div>
              </div>

              <div className="rounded-xl bg-slate-900 p-4 sm:p-6 text-white">
                <div className="flex flex-col gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase tracking-wide text-blue-100">{t.upliftLabel}</p>
                    <p className="mt-1 text-base font-black leading-snug text-white break-words">{t.upliftTitle}</p>
                  </div>
                  <p className="text-4xl font-black text-[#ffcc00] leading-none">{formatRevenueCurrency(conversionUpliftRevenue)}</p>
                </div>
                <p className="mt-3 text-xs leading-relaxed font-semibold text-slate-300 break-words">{t.ppDefinition}</p>
                <p className="mt-4 rounded-lg bg-white/10 px-3 py-2 text-xs leading-relaxed font-semibold text-blue-100">{t.upliftFormula}</p>
                <p className="mt-3 text-sm leading-relaxed font-semibold text-slate-300">{t.upliftAdvice}</p>
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-wide text-[#0974f1]">{t.scenarios}</p>
                <p className="mt-1 mb-3 text-xs leading-relaxed font-semibold text-slate-500">{t.scenarioHint}</p>
                <div className="grid grid-cols-1 gap-3">
                  {scenarioProjections.map((scenario) => (
                    <div
                      key={scenario.key}
                      className={`rounded-xl border-2 p-4 ${
                        scenario.key === 'base'
                          ? 'border-[#0974f1] bg-blue-50 shadow-[0_8px_24px_rgba(9,116,241,0.10)]'
                          : 'border-slate-100 bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-sm font-black text-slate-800">{scenario.label}</p>
                          <p className="mt-2 text-xs leading-snug font-semibold text-slate-500">{scenario.note}</p>
                        </div>
                        <p className="shrink-0 text-xl font-black text-[#0974f1] text-right leading-tight">{formatRevenueCurrency(scenario.revenue)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 lg:mt-auto lg:pt-6">
              <button
                type="button"
                onClick={() => setIsPdfModalOpen(true)}
                disabled={isGeneratingPdf}
                className="w-full h-12 md:h-[52px] inline-flex items-center justify-center gap-2.5 rounded-xl bg-[#ffcc00] text-slate-900 font-black text-sm md:text-base tracking-wide shadow-[0_12px_30px_rgba(15,23,42,0.16)] transition-all hover:brightness-95 hover:-translate-y-0.5 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-yellow-200"
              >
                <FileText className="w-5 h-5" />
                <span>{isGeneratingPdf ? t.pdfButtonLoading : t.pdfButton}</span>
              </button>
            </div>
          </div>

        </div>

      </div>
      
      {/* Footer */}
      <footer className="w-full text-center z-10 mb-0 md:pb-8 mobile-pwa-footer-fix">
        <div className="max-w-5xl mx-auto border-t border-blue-400/30 pt-4 md:pt-6 mt-8">
          <p className="text-blue-200/80 text-[11px] sm:text-xs font-semibold tracking-wider">
            &copy; 2026 ConvEngine.Created by Wesley Pang. All rights reserved.
          </p>
        </div>
      </footer>

      {isPdfModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pdf-report-type-title"
        >
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="pdf-report-type-title" className="text-xl font-black text-slate-900">
                  {t.pdfModalTitle}
                </h2>
                <p className="mt-1 text-sm font-semibold leading-relaxed text-slate-500">
                  {t.pdfModalSubtitle}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPdfModalOpen(false)}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
                aria-label={t.pdfCancel}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 grid gap-3">
              <button
                type="button"
                onClick={() => handleReportTypeSelect('internal')}
                disabled={isGeneratingPdf}
                className="rounded-xl border-2 border-blue-100 bg-blue-50/70 p-4 text-left transition-all hover:border-[#0974f1] hover:bg-blue-50 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
              >
                <span className="flex items-center gap-3 text-base font-black text-slate-900">
                  <Activity className="h-5 w-5 text-[#0974f1]" />
                  {t.pdfInternalTitle}
                </span>
                <span className="mt-2 block text-sm font-semibold leading-relaxed text-slate-600">
                  {t.pdfInternalDesc}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleReportTypeSelect('client')}
                disabled={isGeneratingPdf}
                className="rounded-xl border-2 border-slate-100 bg-white p-4 text-left transition-all hover:border-[#0974f1] hover:bg-slate-50 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
              >
                <span className="flex items-center gap-3 text-base font-black text-slate-900">
                  <FileText className="h-5 w-5 text-[#0974f1]" />
                  {t.pdfClientTitle}
                </span>
                <span className="mt-2 block text-sm font-semibold leading-relaxed text-slate-600">
                  {t.pdfClientDesc}
                </span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsPdfModalOpen(false)}
              className="mt-4 h-11 w-full rounded-xl border border-slate-200 bg-white text-sm font-black text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
            >
              {t.pdfCancel}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
