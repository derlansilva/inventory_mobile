import React, { useState, useRef, useEffect } from 'react';
import { QrCode, AlertTriangle, ArrowLeft, RefreshCw, PackageCheck, Barcode, Search, CheckCircle2, Hash } from 'lucide-react';
import { apiServices } from '../services/apiServices';

interface ScannedItem {
  id?: number;
  materialCode: string;
  ean: string;
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

  // Estados para o modo de quantidade
  const [isQuantityMode, setIsQuantityMode] = useState(false);
  const [selectedItemForQty, setSelectedItemForQty] = useState<ScannedItem | null>(null);
  const [manualQty, setManualQty] = useState<string>('');

  const invoiceInputRef = useRef<HTMLInputElement>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const qtyInputRef = useRef<HTMLInputElement>(null);

  // Foco automático
  useEffect(() => {
    if (!activeInvoice) {
      invoiceInputRef.current?.focus();
    } else if (!loading && barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, [activeInvoice, loading, items]);

  // Escutador da tecla F1 para ativar o modo quantidade
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1' && activeInvoice) {
        e.preventDefault();
        setIsQuantityMode(true);
        setMessage({ text: 'Modo Quantidade Ativado! Bipe o item.', type: 'info' });
        setTimeout(() => setMessage(null), 2000);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeInvoice]);

  // ==========================================
  // SONS
  // ==========================================
  const playSuccessSound = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'square';
      osc.frequency.setValueAtTime(2000, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.04);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.04);
    } catch (e) {
      console.error("Áudio não suportado", e);
    }
  };

  const playErrorSound = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {
      console.error("Áudio não suportado", e);
    }
  };

  // ==========================================
  // 1. BUSCAR NOTA FISCAL
  // ==========================================
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
        ean: item.ean,
        description: item.description,
        expectedQty: item.noteQuantity,
        scannedQty: item.scannedQuantity || 0,
        batch: item.batch
      }));

      setItems(mappedItems);
      playSuccessSound();
      setMessage({ text: `NF ${data.invoiceNumber} carregada (${mappedItems.length} itens)`, type: 'success' });
    } catch (error: any) {
      playErrorSound();
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

  // ==========================================
  // 2. BIPAR ITEM (Lógica com F1)
  // ==========================================
  const handleBarcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = barcodeScan.trim().toUpperCase();
    if (!code) return;

    setBarcodeScan(''); 
    if (savingItemId !== null) return;

    const itemIndex = items.findIndex(it => 
      it.materialCode.toUpperCase() === code || 
      (it.ean && it.ean.toUpperCase() === code)
    );

    if (itemIndex !== -1) {
      const targetItem = items[itemIndex];

      if (isQuantityMode) {
        // MODO QUANTIDADE: Abre o modal para digitar a quantidade
        setIsQuantityMode(false); // Desativa o modo one-shot
        setSelectedItemForQty(targetItem);
        setManualQty('');
        setTimeout(() => qtyInputRef.current?.focus(), 100);
        playSuccessSound();
      } else {
        // MODO NORMAL: Soma 1
        if (targetItem.scannedQty < targetItem.expectedQty) {
          try {
            setSavingItemId(targetItem.id!);
            setLoading(true);
            const response = await apiServices.scanItem(activeInvoice, code);
            const updated = [...items];
            updated[itemIndex].scannedQty = response.scanned;
            setItems(updated);
            playSuccessSound();
          } catch (error: any) {
            playErrorSound();
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
          playErrorSound();
          setMessage({ text: `Item ${targetItem.materialCode} já atingiu a quantidade total!`, type: 'info' });
          setTimeout(() => setMessage(null), 2000);
        }
      }
    } else {
      playErrorSound();
      setMessage({ text: `Produto ${code} não pertence a esta NF!`, type: 'error' });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  // ==========================================
  // 3. SALVAR QUANTIDADE MANUAL
  // ==========================================
  const handleManualQtySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForQty || !manualQty) return;

    const qty = parseInt(manualQty);
    if (isNaN(qty) || qty <= 0) {
      setMessage({ text: 'Digite uma quantidade válida.', type: 'error' });
      return;
    }

    const maxAllowed = selectedItemForQty.expectedQty - selectedItemForQty.scannedQty;
    if (qty > maxAllowed) {
      setMessage({ text: `Você só pode adicionar mais ${maxAllowed} unidades.`, type: 'error' });
      return;
    }

    try {
      setLoading(true);
      
      let currentQty = selectedItemForQty.scannedQty;
      // Faz o loop chamando a API para cada unidade
      for (let i = 0; i < qty; i++) {
        const response = await apiServices.scanItem(activeInvoice, selectedItemForQty.ean || selectedItemForQty.materialCode);
        currentQty = response.scanned;
      }

      setItems(prev => prev.map(it => 
        it.id === selectedItemForQty.id ? { ...it, scannedQty: currentQty } : it
      ));

      playSuccessSound();
      setMessage({ text: `+${qty} unidades adicionadas!`, type: 'success' });
      setSelectedItemForQty(null); 
      setManualQty('');
      
      setTimeout(() => barcodeInputRef.current?.focus(), 100);

    } catch (error) {
      playErrorSound();
      setMessage({ text: 'Erro ao adicionar quantidade.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // 4. FINALIZAR CONFERÊNCIA
  // ==========================================
  const handleFinishScan = async () => {
    if (!activeInvoice) return;

    const pendencias = items.filter(i => i.scannedQty < i.expectedQty);
    
    if (pendencias.length > 0) {
      playErrorSound();
      const confirm = window.confirm(`Existem ${pendencias.length} item(ns) com falta. Deseja finalizar mesmo assim?`);
      if (!confirm) return;
    }

    try {
      setLoading(true);
      playSuccessSound();
      setMessage({ text: 'Conferência finalizada com sucesso!', type: 'success' });
      setTimeout(() => onBack && onBack(), 2000);
    } catch (error: any) {
      playErrorSound();
      setMessage({ text: 'Erro ao finalizar conferência.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const totalExpected = items.reduce((acc, item) => acc + item.expectedQty, 0);
  const totalScanned = items.reduce((acc, item) => acc + item.scannedQty, 0);
  const hasPendencias = totalScanned < totalExpected;

  return (
    <div className="bg-gray-100 h-full w-full text-gray-800 font-sans flex flex-col overflow-hidden relative">

      {/* MODAL DE QUANTIDADE MANUAL */}
      {selectedItemForQty && (
        <div className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-4 rounded-lg shadow-xl w-full max-w-sm animate-in zoom-in-95 border border-slate-300">
            <h3 className="font-bold text-[#002B49] mb-1 text-center text-sm">Inserir Quantidade</h3>
            <p className="text-[10px] text-center text-slate-500 mb-3 truncate px-2">
              {selectedItemForQty.materialCode} - {selectedItemForQty.description}
            </p>
            
            <form onSubmit={handleManualQtySubmit}>
              <input
                ref={qtyInputRef}
                type="text"
                inputMode="numeric"
                value={manualQty}
                onChange={(e) => setManualQty(e.target.value.replace(/\D/g, ''))}
                placeholder="Ex: 4"
                className="w-full bg-slate-50 border-2 border-emerald-500 rounded-lg px-3 py-2 text-center text-xl font-bold text-emerald-900 focus:outline-none focus:ring-2 mb-3 shadow-inner"
                autoFocus
              />
              <div className="flex gap-2">
                <button 
                  type="button" 
                  onClick={() => { setSelectedItemForQty(null); setManualQty(''); barcodeInputRef.current?.focus(); }}
                  className="flex-1 bg-slate-200 text-slate-700 py-2 rounded font-bold text-xs hover:bg-slate-300 transition"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-emerald-600 text-white py-2 rounded font-bold text-xs hover:bg-emerald-700 transition"
                >
                  Confirmar (Enter)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

        {/* MENSAGENS DE ALERTA */}
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
          /* TELA DE BUSCA DE NF */
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
                className="w-full bg-white border border-slate-300 pl-10 pr-3 py-2.5 rounded text-sm font-mono font-bold text-blue-900 focus:border-blue-500 focus:outline-none shadow-sm"
                autoComplete="off"
              />
            </div>
          </form>
        ) : (
          /* TELA DE BIPAGEM */
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

            {/* INPUT DE BIPAGEM */}
            <form onSubmit={handleBarcodeSubmit} className="space-y-1 shrink-0 relative">
              {isQuantityMode && (
                <div className="absolute -top-6 left-0 right-0 bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-1 rounded text-center border border-amber-300 animate-pulse z-10">
                  MODO QUANTIDADE ATIVO (Bipe o item)
                </div>
              )}

              <label className={`block text-[11px] font-bold uppercase tracking-wider text-center ${isQuantityMode ? 'text-amber-600' : 'text-emerald-700'}`}>
                Aguardando EAN
              </label>
              <div className="relative">
                <input
                  ref={barcodeInputRef}
                  type="text"
                  value={barcodeScan}
                  onChange={(e) => setBarcodeScan(e.target.value)}
                  placeholder={savingItemId ? "Salvando..." : "Bipe o código de barras..."}
                  disabled={loading}
                  className={`w-full bg-white border-2 px-3 py-3 rounded-lg text-sm font-mono font-bold focus:outline-none shadow-inner transition-colors ${
                    savingItemId ? 'border-amber-400 text-amber-900' : isQuantityMode ? 'border-amber-500 text-amber-900' : 'border-emerald-600 text-emerald-900'
                  }`}
                  autoComplete="off"
                />
                {isQuantityMode ? (
                  <Hash className={`w-6 h-6 absolute right-3 top-3 text-amber-500 animate-pulse`} />
                ) : (
                  <QrCode className={`w-6 h-6 absolute right-3 top-3 ${savingItemId ? 'text-amber-500 animate-pulse' : 'text-emerald-600'}`} />
                )}
              </div>
            </form>

            {/* LISTA DE ITENS */}
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
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-base font-bold text-[#002B49]">
                            {item.materialCode}
                          </span>

                          {item.ean && item.ean !== "SEM EAN" && (
                            <span className="text-[9px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded border border-blue-200 font-mono">
                              EAN: {item.ean}
                            </span>
                          )}
                        </div>

                        <span className="text-[10px] text-gray-500 font-semibold uppercase line-clamp-1 mt-0.5">
                          {item.description}
                        </span>
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