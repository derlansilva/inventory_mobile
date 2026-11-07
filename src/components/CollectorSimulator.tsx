import React, { useState, useRef, useEffect } from 'react';
import { QrCode, AlertTriangle, ArrowLeft, RefreshCw, PackageCheck, Barcode, Search, CheckCircle2 } from 'lucide-react';
import { apiServices } from '../services/apiServices';

interface ScannedItem {
  id?: number;
  materialCode: string;
  description: string;
  expectedQty: number;
  scannedQty: number;
  batch?: string;
}

interface CollectorSimulatorProps {
  onBack?: () => void;
}

export default function CollectorSimulator({ onBack }: CollectorSimulatorProps) {
  const [invoiceNumberInput, setInvoiceNumberInput] = useState<string>('');
  const [activeInvoice, setActiveInvoice] = useState<string>('');
  const [items, setItems] = useState<ScannedItem[]>([]);
  const [barcodeScan, setBarcodeScan] = useState<string>('');
  
  const [loading, setLoading] = useState<boolean>(false);
  const [savingItemId, setSavingItemId] = useState<number | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const invoiceInputRef = useRef<HTMLInputElement>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Foco automático: na busca da NF ou na bipagem dos itens
  useEffect(() => {
    if (!activeInvoice) {
      invoiceInputRef.current?.focus();
    } else if (!loading && barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, [activeInvoice, loading, items]);

  const handleFetchInvoice = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = invoiceNumberInput.trim();
    if (!query) {
      setMessage({ text: 'Informe o número da Nota Fiscal.', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const data = await apiServices.getInvoiceForScanning(query);
      setActiveInvoice(data.invoiceNumber);
      
      const mappedItems: ScannedItem[] = data.items.map((item: any) => ({
        id: item.id,
        materialCode: item.materialCode,
        description: item.description,
        expectedQty: item.noteQuantity,
        scannedQty: item.scannedQuantity || 0,
        batch: item.batch
      }));

      setItems(mappedItems);
    } catch (error: any) {
      let errorMsg = "Erro ao buscar NF.";
      if (error.response?.data) {
        errorMsg = typeof error.response.data === 'string' ? error.response.data : error.response.data.message;
      }
      setMessage({ text: errorMsg, type: 'error' });
      setItems([]);
      setActiveInvoice('');
    } finally {
      setLoading(false);
    }
  };

  const handleBarcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = barcodeScan.trim().toUpperCase();
    if (!code) return;

    setBarcodeScan(''); 
    if (savingItemId !== null) return;

    const itemIndex = items.findIndex(it => it.materialCode.toUpperCase() === code);

    if (itemIndex !== -1) {
      const targetItem = items[itemIndex];

      if (targetItem.scannedQty < targetItem.expectedQty) {
        try {
          setSavingItemId(targetItem.id!);
          setLoading(true);
          
          const response = await apiServices.scanItem(activeInvoice, code);

          const updated = [...items];
          updated[itemIndex].scannedQty = response.scanned;
          setItems(updated);
          
        } catch (error: any) {
          let errorMsg = "Erro ao bipar item.";
          if (error.response?.data) {
            errorMsg = typeof error.response.data === 'string' ? error.response.data : error.response.data.message;
          }
          setMessage({ text: errorMsg, type: 'error' });
        } finally {
          setSavingItemId(null);
          setLoading(false);
          setTimeout(() => barcodeInputRef.current?.focus(), 50);
        }
      } else {
        setMessage({ text: `Item ${targetItem.materialCode} já atingiu a quantidade total!`, type: 'info' });
        setTimeout(() => setMessage(null), 2000);
      }
    } else {
      setMessage({ text: `Produto ${code} não pertence a esta NF!`, type: 'error' });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleFinishScan = async () => {
    if (!activeInvoice) return;

    const pendencias = items.filter(i => i.scannedQty < i.expectedQty);
    
    if (pendencias.length > 0) {
      const confirm = window.confirm(`Existem ${pendencias.length} item(ns) com falta. Deseja finalizar mesmo assim?`);
      if (!confirm) return;
    }

    try {
      setLoading(true);
      setMessage({ text: 'Conferência finalizada com sucesso!', type: 'success' });
      setTimeout(() => onBack && onBack(), 2000);
    } catch (error: any) {
      setMessage({ text: 'Erro ao finalizar conferência.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const totalExpected = items.reduce((acc, item) => acc + item.expectedQty, 0);
  const totalScanned = items.reduce((acc, item) => acc + item.scannedQty, 0);
  const hasPendencias = totalScanned < totalExpected;

  return (
    <div className="bg-gray-100 h-full w-full text-gray-800 font-sans flex flex-col overflow-hidden">
      
      {/* HEADER */}
      <div className="bg-[#002B49] text-white px-4 py-3 flex items-center justify-between shadow-xs shrink-0">
        <div className="flex items-center space-x-2">
          <Barcode className="w-5 h-5 text-amber-400" />
          <span className="font-bold text-xs tracking-wide">Recebimento Devolução</span>
        </div>
        
        <div className="flex items-center space-x-2">
          {activeInvoice && (
            <button onClick={() => { setActiveInvoice(''); setItems([]); setInvoiceNumberInput(''); setMessage(null); }} className="text-[11px] bg-[#1E4D6B] hover:bg-[#2A6185] px-2.5 py-1 rounded text-white font-medium transition cursor-pointer">
              <ArrowLeft className="w-3 h-3 inline mr-1" /> Trocar
            </button>
          )}
          {onBack && (
            <button onClick={onBack} className="text-[11px] bg-red-700 hover:bg-red-800 px-2.5 py-1 rounded text-white font-medium transition cursor-pointer">
              Voltar
            </button>
          )}
        </div>
      </div>

      {/* ÁREA PRINCIPAL */}
      <div className="p-3 flex-1 flex flex-col min-h-0 space-y-2 overflow-hidden">

        {message && message.type !== 'success' && (
          <div className={`p-2 rounded text-xs font-semibold flex items-center space-x-2 border shadow-xs shrink-0 ${
            message.type === 'error' ? 'bg-red-50 text-red-800 border-red-300' : 'bg-amber-50 text-amber-800 border-amber-300'
          }`}>
            {message.type === 'error' && <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />}
            {message.type === 'info' && <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />}
            <span>{message.text}</span>
          </div>
        )}

        {!activeInvoice ? (
          <form onSubmit={handleFetchInvoice} className="space-y-2 bg-white p-4 rounded-lg border border-gray-300 shadow-sm shrink-0">
            <label className="block text-xs font-bold text-[#002B49] uppercase text-center mb-2">Número da Nota Fiscal</label>
            <div className="relative w-full">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
              <input
                ref={invoiceInputRef}
                type="text"
                value={invoiceNumberInput}
                onChange={(e) => setInvoiceNumberInput(e.target.value)}
                placeholder="Digite ou bipe a NF e Enter..."
                className="w-full bg-blue-50/30 border-2 border-blue-400 pl-10 pr-3 py-3 rounded text-sm font-mono font-bold text-blue-900 focus:ring-2 focus:ring-blue-800 focus:outline-none"
                autoComplete="off"
              />
            </div>
          </form>
        ) : (
          <div className="flex-1 flex flex-col min-h-0 space-y-2 overflow-hidden">
            
            {/* RESUMO */}
            <div className="bg-white p-3 rounded-lg border border-gray-300 flex justify-between items-center font-mono shadow-sm shrink-0">
              <div>
                <span className="text-[10px] text-gray-500 font-bold block">NOTA FISCAL</span>
                <span className="text-base font-bold text-blue-900">{activeInvoice}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-gray-500 font-bold block">PROGRESSO</span>
                <span className="text-base font-bold text-emerald-600">{totalScanned} / {totalExpected}</span>
              </div>
            </div>

            {/* INPUT DE BIPAGEM (SEM BOTÃO) */}
            <form onSubmit={handleBarcodeSubmit} className="space-y-1 shrink-0">
              <label className="block text-[11px] font-bold text-emerald-700 uppercase tracking-wider text-center">Aguardando EAN</label>
              <div className="relative">
                <input
                  ref={barcodeInputRef}
                  type="text"
                  value={barcodeScan}
                  onChange={(e) => setBarcodeScan(e.target.value)}
                  placeholder={savingItemId ? "Salvando..." : "Bipe o código de barras..."}
                  disabled={loading}
                  className={`w-full bg-white border-2 px-3 py-3 rounded-lg text-sm font-mono font-bold focus:outline-none shadow-inner transition-colors ${
                    savingItemId ? 'border-amber-400 text-amber-900' : 'border-emerald-600 text-emerald-900'
                  }`}
                  autoComplete="off"
                />
                <QrCode className={`w-6 h-6 absolute right-3 top-3 ${savingItemId ? 'text-amber-500 animate-pulse' : 'text-emerald-600'}`} />
              </div>
            </form>

            {/* LISTA */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0">
              {items.map((item, idx) => {
                const isComplete = item.scannedQty >= item.expectedQty;
                const isSaving = savingItemId === item.id;
                
                return (
                  <div key={idx} className={`p-3 rounded-lg border-2 transition-all shadow-sm ${
                    isSaving ? 'bg-amber-50 border-amber-400' : 
                    isComplete ? 'bg-emerald-50/60 border-emerald-300' : 'bg-white border-gray-200'
                  }`}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex flex-col flex-1 pr-2 text-left">
                        <span className="font-mono text-base font-bold text-[#002B49]">{item.materialCode}</span>
                        <span className="text-[10px] text-gray-500 font-semibold uppercase line-clamp-1">{item.description}</span>
                      </div>
                      <div className="flex flex-col items-end">
                        {isSaving ? <RefreshCw className="w-4 h-4 text-amber-600 animate-spin" /> : <span className="text-[9px] bg-slate-100 border border-slate-200 text-slate-500 px-1.5 py-0.5 rounded">Lote: {item.batch || 'S/L'}</span>}
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-gray-100 font-mono">
                      <span className="text-[11px] text-gray-500">Qtd Nota: <strong className="text-gray-800">{item.expectedQty}</strong></span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${isComplete ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-amber-800 border border-amber-300'}`}>
                        {item.scannedQty} / {item.expectedQty}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        )}

      </div>

      {/* FINALIZAR */}
      {activeInvoice && (
        <div className="p-3 bg-white border-t border-gray-300 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] shrink-0">
          <button
            onClick={handleFinishScan}
            disabled={loading || savingItemId !== null}
            className={`w-full font-bold py-3 rounded-lg text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow transition cursor-pointer disabled:opacity-50 ${
              hasPendencias ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            {hasPendencias ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
            <span>
              {loading ? 'Processando...' : hasPendencias ? `Finalizar (Faltam ${totalExpected - totalScanned})` : 'Finalizar Completo'}
            </span>
          </button>
        </div>
      )}

    </div>
  );
}