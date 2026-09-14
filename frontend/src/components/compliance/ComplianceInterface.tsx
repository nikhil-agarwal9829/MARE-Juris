'use client';

import React, { useState, useEffect } from 'react';
import {
  Building2,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  FileText,
  Download,
  ExternalLink,
  ArrowRight,
  RotateCcw,
  CheckSquare,
  Square,
  Bookmark,
  MapPin,
  Scale,
  ListOrdered,
  FileCheck,
  Save,
  Clock,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { ComplianceScene3D } from '@/components/visual/ComplianceScene3D';

export const ComplianceInterface: React.FC = () => {
  const [step, setStep] = useState<'input' | 'questions' | 'result'>('input');
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [intent, setIntent] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const [complianceMatrix, setComplianceMatrix] = useState<any>(null);
  const [checkedDocs, setCheckedDocs] = useState<Record<string, boolean>>({});
  const [activeFilter, setActiveFilter] = useState<'all' | 'mandatory' | 'conditional' | 'verify'>('all');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [history, setHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Load History on Mount
  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/compliance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'history' }),
      });
      const data = await res.json();
      if (data.status === 'success' && data.history) {
        setHistory(data.history);
      }
    } catch (err) {
      console.error('Error fetching history:', err);
    }
  };

  // Save Assessment
  const handleSaveAssessment = async () => {
    if (!intent || !complianceMatrix) return;
    setIsSaving(true);
    setSaveStatus('saving');
    
    try {
      const res = await fetch('/api/compliance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'save',
          intent,
          matrix: complianceMatrix
        }),
      });
      
      const data = await res.json();
      if (data.status === 'success') {
        setSaveStatus('saved');
        fetchHistory(); // Refresh history
      } else {
        setSaveStatus('error');
      }
    } catch (err) {
      setSaveStatus('error');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const loadPastAssessment = (pastAssessment: any) => {
    setIntent(pastAssessment.intent);
    setComplianceMatrix(pastAssessment.compliance_matrix);
    setStep('result');
    setShowHistory(false);
  };

  // Step 1: Handle Initial Prompt Submission
  const handleStartAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsLoading(true);
    try {
      // 1. Extract intent
      const resIntent = await fetch('/api/compliance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'intent', prompt }),
      });
      const dataIntent = await resIntent.json();
      const extractedIntent = dataIntent.intent || { business_type: 'restaurant', city: 'Chennai', state: 'Tamil Nadu' };
      setIntent(extractedIntent);

      // 2. Fetch adaptive questions
      const resQ = await fetch('/api/compliance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'questions', intent: extractedIntent }),
      });
      const dataQ = await resQ.json();
      const fetchedQuestions = dataQ.questions || [];
      setQuestions(fetchedQuestions);

      if (fetchedQuestions.length > 0) {
        setStep('questions');
      } else {
        await handleRunAnalysis(extractedIntent, {});
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Handle Question Answer Selection
  const handleOptionSelect = (qId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [qId]: value }));
  };

  // Step 3: Run Full Compliance Matrix Analysis
  const handleRunAnalysis = async (curIntent = intent, curAnswers = answers) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/compliance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'analyze', intent: curIntent, answers: curAnswers }),
      });
      const data = await res.json();
      setComplianceMatrix(data.complianceMatrix);
      setStep('result');
      setSaveStatus('idle');
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle Document Checklist Checkbox
  const toggleDocCheck = (docId: string) => {
    setCheckedDocs((prev) => ({ ...prev, [docId]: !prev[docId] }));
  };

  // Download PDF Report
  const handleDownloadReport = async () => {
    if (!complianceMatrix) return;
    try {
      const res = await fetch('/api/compliance/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matrix: complianceMatrix }),
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `MARE-Juris-Compliance-${complianceMatrix.businessProfile?.city || 'India'}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error(err);
    }
  };

  // Reset Workflow
  const handleReset = () => {
    setStep('input');
    setPrompt('');
    setIntent(null);
    setQuestions([]);
    setAnswers({});
    setComplianceMatrix(null);
    setCheckedDocs({});
    setSaveStatus('idle');
  };

  return (
    <div className="space-y-10">
      {/* Step 1: Input Natural Business Prompt */}
      {step === 'input' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Adaptive Business Compliance Agent</span>
            </div>

            <h1 className="text-3xl md:text-5xl font-bold font-serif text-slate-900 leading-tight">
              Describe Your Business Idea. <br />
              <span className="text-primary">Build Your Compliance Roadmap.</span>
            </h1>

            <p className="text-xs md:text-sm text-slate-600 font-serif leading-relaxed">
              Describe your commercial venture naturally (e.g. city, state, scale, operations). MARE-Juris extracts statutory requirements across Central, State, and Municipal authorities under Indian Law.
            </p>

            <form onSubmit={handleStartAssessment} className="space-y-4 pt-2">
              <div className="relative">
                <textarea
                  rows={3}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g. 'I want to open a non-veg restaurant in Chennai with outdoor dining.'"
                  className="w-full p-4 pr-12 bg-white border border-slate-300 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-xs md:text-sm resize-none shadow-sm"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2 text-slate-500 text-xs">
                  <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">Examples:</span>
                  {[
                    'I want to open a restaurant in Chennai',
                    'Starting a software SaaS startup in Bengaluru',
                    'Opening a retail clothing store in Mumbai',
                  ].map((ex, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setPrompt(ex)}
                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-primary hover:border-blue-200 text-[11px] transition-colors cursor-pointer shadow-sm"
                    >
                      {ex}
                    </button>
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !prompt.trim()}
                  className="px-6 py-3 rounded-2xl bg-primary text-white font-bold text-xs md:text-sm shadow-sm hover:bg-primary-hover transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Sparkles className="w-4 h-4 animate-spin" />
                      <span>Analyzing Intent...</span>
                    </>
                  ) : (
                    <>
                      <span>Start Assessment</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Assessment History Section */}
            {history.length > 0 && (
              <div className="pt-6">
                <button 
                  onClick={() => setShowHistory(!showHistory)}
                  className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-primary transition-colors cursor-pointer"
                >
                  <Clock className="w-4 h-4" />
                  <span>Your Past Assessments ({history.length})</span>
                  {showHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showHistory && (
                  <div className="mt-4 space-y-3 max-h-64 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-300 animate-fadeIn">
                    {history.map((item) => (
                      <div key={item.id} className="p-4 rounded-xl bg-white border border-slate-200 hover:border-blue-300 transition-colors flex items-center justify-between group shadow-sm">
                        <div className="space-y-1">
                          <h4 className="font-semibold text-sm text-slate-800 capitalize">{item.intent?.business_type?.replace('_', ' ')} in {item.intent?.city}</h4>
                          <p className="text-xs text-slate-500 truncate max-w-sm">{item.business_desc}</p>
                        </div>
                        <button 
                          onClick={() => loadPastAssessment(item)}
                          className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-primary hover:bg-blue-50 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer"
                        >
                          View
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="lg:col-span-5 bg-white rounded-3xl p-4 border border-slate-200 shadow-sm sticky top-24">
            <ComplianceScene3D />
          </div>
        </div>
      )}

      {/* Step 2: Adaptive Questioning Flow */}
      {step === 'questions' && (
        <div className="max-w-3xl mx-auto legal-card rounded-3xl p-6 md:p-10 border border-slate-200 space-y-6 shadow-sm bg-white animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">
                Step 2: Adaptive Questionnaire
              </span>
              <h2 className="text-xl md:text-2xl font-bold font-serif text-slate-900 mt-1">
                Refine Your Business Parameters
              </h2>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-mono">
              {intent?.city || 'India'} Jurisdiction
            </span>
          </div>

          <div className="space-y-6">
            {questions.map((q, idx) => (
              <div key={q.id} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-50 border border-blue-200 text-blue-700 font-serif font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <h4 className="font-serif font-semibold text-slate-900 text-sm md:text-base">
                    {q.questionText}
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 pl-9">
                  {q.options.map((opt: any) => {
                    const isChecked = answers[q.id] === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleOptionSelect(q.id, opt.value)}
                        className={`p-3.5 rounded-xl text-left text-xs transition-all border cursor-pointer ${
                          isChecked
                            ? 'bg-blue-50 border-blue-300 text-blue-700 font-semibold shadow-sm transform scale-[1.02]'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              onClick={handleReset}
              className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs font-semibold hover:border-slate-300 hover:bg-slate-50 transition-all flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>

            <button
              onClick={() => handleRunAnalysis(intent, answers)}
              disabled={isLoading || Object.keys(answers).length < questions.length}
              className="px-6 py-3 rounded-xl bg-primary text-white font-bold text-xs md:text-sm shadow-sm hover:bg-primary-hover hover:-translate-y-0.5 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:hover:translate-y-0"
            >
              {isLoading ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>Generating Compliance Matrix...</span>
                </>
              ) : (
                <>
                  <span>Generate Full Roadmap</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Detailed Interactive Compliance Roadmap & Matrix */}
      {step === 'result' && complianceMatrix && (
        <div className="space-y-10 animate-fadeIn">
          {/* Top Overview Profile & Quick Stats */}
          <div className="legal-card bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-blue-100 transition-colors duration-1000"></div>
            
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-slate-100 pb-6 relative z-10">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold uppercase tracking-wider">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Statutory Compliance Matrix</span>
                </div>
                <h2 className="text-2xl md:text-4xl font-bold font-serif text-slate-900 mt-3 leading-tight">
                  Compliance Roadmap: <span className="text-primary">{complianceMatrix.businessProfile?.nameOrDesc}</span>
                </h2>
                <div className="flex items-center gap-2 text-sm text-slate-500 mt-2 font-medium">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span>{complianceMatrix.businessProfile?.jurisdictionSummary}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={handleSaveAssessment}
                  disabled={isSaving || saveStatus === 'saved'}
                  className={`px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all flex items-center gap-2 shadow-sm cursor-pointer ${
                    saveStatus === 'saved' 
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {isSaving ? (
                    <Sparkles className="w-4 h-4 animate-spin" />
                  ) : saveStatus === 'saved' ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>{saveStatus === 'saved' ? 'Saved to History' : 'Save Roadmap'}</span>
                </button>

                <button
                  onClick={handleDownloadReport}
                  className="px-4 py-2.5 rounded-xl bg-primary text-white font-bold text-xs flex items-center gap-2 shadow-sm hover:bg-primary-hover transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download PDF Report</span>
                </button>

                <button
                  onClick={handleReset}
                  className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs font-semibold hover:border-slate-300 hover:bg-slate-50 transition-all flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">New Venture</span>
                </button>
              </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 relative z-10">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1 shadow-sm">
                <span className="text-[11px] font-semibold text-slate-500 uppercase">Mandatory</span>
                <p className="text-3xl font-bold font-serif text-red-600">
                  {complianceMatrix.summaryStats?.totalMandatory}
                </p>
                <span className="text-[10px] text-slate-500">Required By Law</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1 shadow-sm">
                <span className="text-[11px] font-semibold text-slate-500 uppercase">Conditional</span>
                <p className="text-3xl font-bold font-serif text-amber-600">
                  {complianceMatrix.summaryStats?.totalConditional}
                </p>
                <span className="text-[10px] text-slate-500">Activity Dependent</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1 shadow-sm">
                <span className="text-[11px] font-semibold text-slate-500 uppercase">Verification</span>
                <p className="text-3xl font-bold font-serif text-blue-600">
                  {complianceMatrix.summaryStats?.totalNeedsVerification}
                </p>
                <span className="text-[10px] text-slate-500">State Bye-Laws</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1 shadow-sm">
                <span className="text-[11px] font-semibold text-slate-500 uppercase">Documents</span>
                <p className="text-3xl font-bold font-serif text-emerald-600">
                  {complianceMatrix.summaryStats?.totalChecklistItems}
                </p>
                <span className="text-[10px] text-slate-500">Mandatory Proofs</span>
              </div>
            </div>
          </div>

          {/* Sequential Step-by-Step Operating Roadmap */}
          <div className="legal-card bg-white rounded-3xl p-6 md:p-8 border border-slate-200 space-y-6 overflow-hidden relative shadow-sm">
            <div className="flex items-center gap-2 relative z-10">
              <ListOrdered className="w-5 h-5 text-primary" />
              <h3 className="text-xl md:text-2xl font-bold font-serif text-slate-900">
                Execution Action Plan
              </h3>
            </div>

            <div className="relative z-10">
              <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-slate-200 hidden md:block"></div>
              <div className="space-y-4">
                {complianceMatrix.roadmapSteps?.map((step: any, index: number) => (
                  <div key={step.step} className="relative flex flex-col md:flex-row items-start gap-4 md:gap-6 group">
                    <div className="w-12 h-12 rounded-full bg-white border-2 border-slate-200 text-slate-500 flex items-center justify-center text-sm font-bold font-serif flex-shrink-0 z-10 group-hover:border-primary group-hover:text-primary group-hover:bg-blue-50 transition-all shadow-sm">
                      {step.step}
                    </div>
                    <div className="flex-1 p-5 rounded-2xl bg-slate-50 border border-slate-200 group-hover:border-blue-200 transition-all">
                      <h4 className="font-bold text-slate-900 text-base font-serif group-hover:text-primary transition-colors">{step.title}</h4>
                      <p className="text-sm text-slate-600 mt-1">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Detailed Categorized Requirement Cards */}
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                  Detailed Obligations
                </span>
                <h3 className="text-2xl md:text-3xl font-bold font-serif text-slate-900 mt-2">
                  Statutory Licenses & Permissions
                </h3>
              </div>

              {/* Filter Pills */}
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'all', label: 'All Requirements' },
                  { id: 'mandatory', label: 'Mandatory', count: complianceMatrix.summaryStats?.totalMandatory },
                  { id: 'conditional', label: 'Conditional', count: complianceMatrix.summaryStats?.totalConditional },
                  { id: 'verify', label: 'Verification', count: complianceMatrix.summaryStats?.totalNeedsVerification },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setActiveFilter(f.id as any)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeFilter === f.id
                        ? 'bg-primary text-white shadow-sm'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>{f.label}</span>
                    {f.count !== undefined && (
                      <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${activeFilter === f.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                        {f.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {/* Render Mandatory */}
              {(activeFilter === 'all' || activeFilter === 'mandatory') &&
                complianceMatrix.mandatoryRequirements?.map((req: any) => (
                  <div key={req.id} className="legal-card bg-white rounded-2xl p-6 md:p-8 border border-slate-200 space-y-4 relative group hover:border-red-200 transition-all shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-full bg-red-50 border border-red-200 text-red-700 text-[11px] font-bold uppercase">
                          {req.status}
                        </span>
                        <span className="px-2.5 py-0.5 rounded bg-slate-100 text-slate-600 text-xs border border-slate-200">
                          {req.category}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 font-mono bg-slate-50 px-2 py-1 rounded-md border border-slate-200">Renewal: {req.renewalPeriod}</span>
                    </div>

                    <div>
                      <h4 className="text-xl md:text-2xl font-bold font-serif text-slate-900 group-hover:text-red-700 transition-colors">
                        {req.title}
                      </h4>
                      <p className="text-sm text-slate-600 mt-2 leading-relaxed max-w-4xl">{req.purpose}</p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase block">Enforcing Statutory Authority:</span>
                      <p className="font-serif font-bold text-primary text-sm">{req.authority}</p>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100">
                      <div className="flex items-start gap-2 text-xs text-slate-600 max-w-2xl">
                        <FileCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <span><strong>Required Docs:</strong> {req.documents?.join(', ')}</span>
                      </div>

                      {req.applicationUrl && (
                        <a
                          href={req.applicationUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs text-primary hover:bg-slate-50 font-semibold transition-all flex-shrink-0 shadow-sm"
                        >
                          <span>Official Portal ({req.officialSource})</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}

              {/* Render Conditional */}
              {(activeFilter === 'all' || activeFilter === 'conditional') &&
                complianceMatrix.conditionalRequirements?.map((req: any) => (
                  <div key={req.id} className="legal-card bg-white rounded-2xl p-6 md:p-8 border border-slate-200 space-y-4 relative group hover:border-amber-300 transition-all shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-bold uppercase">
                          {req.status}
                        </span>
                        <span className="px-2.5 py-0.5 rounded bg-slate-100 text-slate-600 text-xs border border-slate-200">
                          {req.category}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 font-mono bg-slate-50 px-2 py-1 rounded-md border border-slate-200">Renewal: {req.renewalPeriod}</span>
                    </div>

                    <div>
                      <h4 className="text-xl md:text-2xl font-bold font-serif text-slate-900 group-hover:text-amber-700 transition-colors">{req.title}</h4>
                      <p className="text-sm text-amber-800 mt-2 italic font-serif font-medium bg-amber-50 p-2 rounded-lg border border-amber-200 inline-block">Applies because: {req.condition}</p>
                      <p className="text-sm text-slate-600 mt-2 leading-relaxed max-w-4xl">{req.purpose}</p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase block">Enforcing Statutory Authority:</span>
                      <p className="font-serif font-bold text-primary text-sm">{req.authority}</p>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100">
                      <div className="flex items-start gap-2 text-xs text-slate-600 max-w-2xl">
                        <FileCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <span><strong>Required Docs:</strong> {req.documents?.join(', ')}</span>
                      </div>

                      {req.applicationUrl && (
                        <a
                          href={req.applicationUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs text-primary hover:bg-slate-50 font-semibold transition-all flex-shrink-0 shadow-sm"
                        >
                          <span>Official Portal ({req.officialSource})</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}

              {/* Render Needs Verification */}
              {(activeFilter === 'all' || activeFilter === 'verify') &&
                complianceMatrix.needsVerificationRequirements?.map((req: any) => (
                  <div key={req.id} className="legal-card bg-white rounded-2xl p-6 md:p-8 border border-slate-200 space-y-4 relative group hover:border-blue-300 transition-all shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-bold uppercase">
                          {req.status}
                        </span>
                        <span className="px-2.5 py-0.5 rounded bg-slate-100 text-slate-600 text-xs border border-slate-200">
                          {req.category}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 font-mono bg-slate-50 px-2 py-1 rounded-md border border-slate-200">Renewal: {req.renewalPeriod}</span>
                    </div>

                    <div>
                      <h4 className="text-xl md:text-2xl font-bold font-serif text-slate-900 group-hover:text-blue-700 transition-colors">{req.title}</h4>
                      <p className="text-sm text-blue-800 mt-2 italic font-serif font-medium bg-blue-50 p-2 rounded-lg border border-blue-200 inline-block">Verification Trigger: {req.condition}</p>
                      <p className="text-sm text-slate-600 mt-2 leading-relaxed max-w-4xl">{req.purpose}</p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase block">Enforcing Statutory Authority:</span>
                      <p className="font-serif font-bold text-primary text-sm">{req.authority}</p>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100">
                      <div className="flex items-start gap-2 text-xs text-slate-600 max-w-2xl">
                        <FileCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <span><strong>Required Docs:</strong> {req.documents?.join(', ')}</span>
                      </div>

                      {req.applicationUrl && (
                        <a
                          href={req.applicationUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs text-primary hover:bg-slate-50 font-semibold transition-all flex-shrink-0 shadow-sm"
                        >
                          <span>Official Portal ({req.officialSource})</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Interactive Document Checklist Section */}
          <div className="legal-card bg-white rounded-3xl p-6 md:p-8 border border-slate-200 space-y-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl md:text-2xl font-bold font-serif text-slate-900">
                    Document Preparation Checklist
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">Track the documents you need to gather for your applications.</p>
                </div>
              </div>
              <div className="px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-700 shadow-sm">
                <span className="text-primary">{Object.values(checkedDocs).filter(Boolean).length}</span> / {complianceMatrix.documentChecklist?.length} Prepared
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {complianceMatrix.documentChecklist?.map((doc: any) => {
                const isChecked = checkedDocs[doc.id];
                return (
                  <button
                    key={doc.id}
                    onClick={() => toggleDocCheck(doc.id)}
                    className={`p-4 md:p-5 rounded-2xl text-left border flex items-start gap-4 transition-all cursor-pointer shadow-sm hover:shadow-md ${
                      isChecked
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    {isChecked ? (
                      <CheckSquare className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5 drop-shadow-sm" />
                    ) : (
                      <Square className="w-6 h-6 text-slate-400 flex-shrink-0 mt-0.5" />
                    )}
                    
                    <div className="space-y-1">
                      <span className={`text-sm font-bold block leading-tight ${isChecked ? 'line-through opacity-70' : ''}`}>{doc.name}</span>
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 block">{doc.category}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
