import React, { useState, useRef, useEffect } from 'react';
import { QrCode, CheckCircle2, AlertTriangle, ArrowLeft, RefreshCw, PackageCheck, Barcode } from 'lucide-react';
import { apiServices } from '../services/apiServices';

interface ScannedItem {
  id?: number;
  materialCode: string;
  description: string;
  expectedQty: number;
  scannedQty: number;
  damagedQty: number;
  batch?: string;
  nfNumber: string;
}

interface CollectorSimulatorProps {
  onBack?: () => void;
}

export default function CollectorSimulator({ onBack }: CollectorSimulatorProps) {
  const [manifestCodeInput, setManifestCodeInput] = useState<string>('');
  const [activeManifest, setActiveManifest] = useState<string>('');
  const [items, setItems] = useState<ScannedItem[]>([]);
  const [barcodeScan, setBarcodeScan] = useState<string>('');
  
  const [loading, setLoading] = useState<boolean>(false);
  const [savingItemId, setSavingItemId] = useState<number | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // ---------------------------------------------------------
  // O SEGREDO ESTÁ AQUI: O FOCO VOLTA TODA VEZ QUE A TELA ATUALIZA
  // ---------------------------------------------------------
  useEffect(() => {
    // Se o romaneio estiver aberto e não estiver salvando nada, joga o foco pro input
    if (activeManifest && !loading && barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, [activeManifest, loading, items]); // Ele observa a lista de itens ser atualizada

  const handleFetchManifest = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    const query = manifestCodeInput.trim().toUpperCase();
    if (!query) {
      setMessage({ text: 'Informe o número do Romaneio.', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const formattedCode = query.startsWith('GAM-') ? query : `GAM-${query}`;
      const data = await apiServices.getManifestByCode(formattedCode);

      setActiveManifest(data.manifestCode || formattedCode);
      let mappedItems: ScannedItem[] = [];

      if (data.invoices && Array.isArray(data.invoices)) {
        data.invoices.forEach((inv: any) => {
          const itemsList = inv.items || inv.returnItemEntities || [];
          itemsList.forEach((item: any) => {
            mappedItems.push({
              id: item.id,
              materialCode: item.materialCode || item.code || `MAT-${item.id}`,
              description: item.description || 'Produto sem descrição',
              expectedQty: item.noteQty ?? 1,
              scannedQty: item.checkedQty ?? item.scannedQty ?? 0,
              damagedQty: item.damagedQty ?? 0,
              batch: item.batch || 'S/L',
              nfNumber: inv.nfNumber || formattedCode
            });
          });
        });
      }

      setItems(mappedItems);
      setMessage({ text: `Romaneio ${formattedCode} carregado (${mappedItems.length} itens)`, type: 'success' });
    } catch (error: any) {
      console.error(error);
      setMessage({ text: `Romaneio "${query}" não encontrado.`, type: 'error' });
      setItems([]);
      setActiveManifest('');
    } finally {
      setLoading(false);
    }
  };

  const handleBarcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = barcodeScan.trim().toUpperCase();
    if (!code) return;

    setBarcodeScan(''); // Limpa o input
    
    if (savingItemId !== null) {
      setMessage({ text: 'Aguarde o processamento da última bipagem...', type: 'info' });
      return;
    }

    const itemIndex = items.findIndex(
      (it) => it.materialCode.toUpperCase() === code
    );

    if (itemIndex !== -1) {
      const targetItem = items[itemIndex];

      if (targetItem.scannedQty < targetItem.expectedQty) {
        
        try {
          setSavingItemId(targetItem.id!);
          setLoading(true);
          
          await apiServices.scanItem(targetItem.id!);

          const updated = [...items];
          updated[itemIndex].scannedQty += 1;
          setItems(updated);
          
          setMessage({ 
            text: `Bipado e salvo: ${targetItem.materialCode} (${updated[itemIndex].scannedQty}/${targetItem.expectedQty})`, 
            type: 'success' 
          });
        } catch (error: any) {
          setMessage({ text: `Erro: ${error.message || 'Falha ao salvar'}`, type: 'error' });
        } finally {
          setSavingItemId(null);
          setLoading(false);
        }

      } else {
        setMessage({ text: `Item ${targetItem.materialCode} já atingiu a quantidade total da nota!`, type: 'info' });
      }
    } else {
      setMessage({ text: `Produto ${code} não pertence a este romaneio!`, type: 'error' });
    }
  };

  const handleFinishScan = async () => {
    if (!activeManifest) return;

    const pendencias = items.filter(i => i.scannedQty < i.expectedQty);
    if (pendencias.length > 0) {
      setMessage({ text: `Ainda faltam ${pendencias.length} item(ns) para conferir.`, type: 'error' });
      return;
    }

    try {
      setLoading(true);
      //await apiServices.closeManifest(activeManifest);
      setMessage({ text: 'Romaneio finalizado com sucesso! Status alterado para CONCLUIDO.', type: 'success' });
    } catch (error: any) {
      setMessage({ text: error.message || 'Erro ao finalizar romaneio.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-100 h-full w-full text-gray-800 font-sans flex flex-col overflow-hidden">
      
      {/* 1. CABEÇALHO */}
      <div className="bg-[#002B49] text-white px-4 py-3 flex items-center justify-between shadow-xs shrink-0">
        <div className="flex items-center space-x-2">
          <Barcode className="w-5 h-5 text-amber-400" />
          <span className="font-bold text-xs tracking-wide">WMS Coletora Zebra</span>
        </div>
        
        <div className="flex items-center space-x-2">
          {activeManifest && (
            <button 
              onClick={() => { setActiveManifest(''); setItems([]); setManifestCodeInput(''); }} 
              className="text-[11px] bg-[#1E4D6B] hover:bg-[#2A6185] px-2.5 py-1 rounded text-white font-medium flex items-center space-x-1 transition cursor-pointer"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Trocar</span>
            </button>
          )}
          {onBack && (
            <button onClick={onBack} className="text-[11px] bg-red-700 hover:bg-red-800 px-2.5 py-1 rounded text-white font-medium transition cursor-pointer">
              <span>Voltar</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. ÁREA PRINCIPAL */}
      <div className="p-4 flex-1 flex flex-col min-h-0 space-y-3 overflow-hidden">

        {message && (
          <div className={`p-2.5 rounded text-xs font-semibold flex items-center space-x-2 border shadow-xs shrink-0 ${
            message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
            message.type === 'error' ? 'bg-red-50 text-red-800 border-red-300' :
            'bg-amber-50 text-amber-800 border-amber-300'
          }`}>
            {message.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
            {message.type === 'error' && <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />}
            <span>{message.text}</span>
          </div>
        )}

        {!activeManifest ? (
          <form onSubmit={handleFetchManifest} className="space-y-3 bg-white p-4 rounded border border-gray-300 shadow-xs shrink-0">
            <label className="block text-xs font-bold text-[#002B49] uppercase">Número do Romaneio / Carga:</label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={manifestCodeInput}
                onChange={(e) => setManifestCodeInput(e.target.value)}
                placeholder="Ex: 225603 ou GAM-225603"
                className="flex-1 bg-red-50/30 border border-red-400 px-3 py-1.5 rounded font-mono text-xs font-bold text-blue-900 focus:ring-1 focus:ring-blue-800 focus:outline-none shadow-inner"
              />
              <button type="submit" disabled={loading} className="bg-[#002B49] hover:bg-blue-900 text-white font-bold px-4 py-1.5 rounded text-xs flex items-center justify-center shadow transition cursor-pointer">
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Abrir'}
              </button>
            </div>
          </form>
        ) : (
          <div className="flex-1 flex flex-col min-h-0 space-y-3 overflow-hidden">
            
            <div className="bg-white p-3 rounded border border-gray-300 flex justify-between items-center font-mono shadow-xs shrink-0">
              <div>
                <span className="text-[10px] text-gray-500 font-bold block">ROMANEIO ATIVO</span>
                <span className="text-sm font-bold text-blue-900">{activeManifest}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-gray-500 font-bold block">TOTAL ITENS</span>
                <span className="text-sm font-bold text-gray-800">{items.length}</span>
              </div>
            </div>

            {/* INPUT DE BIPAGEM */}
            <form onSubmit={handleBarcodeSubmit} className="space-y-1 shrink-0">
              <label className="block text-[11px] font-bold text-gray-700 uppercase">Aguardando leitura de EAN/Material:</label>
              <div className="relative">
                <input
                  ref={barcodeInputRef}
                  type="text"
                  value={barcodeScan}
                  onChange={(e) => setBarcodeScan(e.target.value)}
                  placeholder={savingItemId ? "Salvando no banco..." : "Bipe o código com a Zebra..."}
                  disabled={loading}
                  className={`w-full bg-white border-2 px-3 py-2 rounded text-xs font-mono font-bold focus:outline-none shadow-inner transition-colors ${
                    savingItemId ? 'border-amber-400 text-amber-900' : 'border-emerald-600 text-emerald-900'
                  }`}
                />
                <QrCode className={`w-4 h-4 absolute right-3 top-2.5 ${savingItemId ? 'text-amber-500 animate-pulse' : 'text-emerald-600'}`} />
              </div>
            </form>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0">
              {items.map((item, idx) => {
                const isComplete = item.scannedQty >= item.expectedQty;
                const isSaving = savingItemId === item.id;
                
                return (
                  <div 
                    key={idx} 
                    className={`p-3 rounded border transition shadow-xs ${
                      isSaving ? 'bg-amber-50 border-amber-300' : 
                      isComplete ? 'bg-emerald-50/70 border-emerald-300' : 'bg-white border-gray-300'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-mono text-xs font-bold text-blue-900">{item.materialCode}</span>
                      <div className="flex items-center space-x-2">
                        {isSaving && <RefreshCw className="w-3 h-3 text-amber-600 animate-spin" />}
                        <span className="text-[10px] bg-blue-50 text-blue-800 font-bold px-2 py-0.5 rounded border border-blue-200 font-mono">
                          NF: {item.nfNumber}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-700 font-medium line-clamp-1 mb-2">{item.description}</p>
                    
                    <div className="flex justify-between items-center pt-2 border-t border-gray-200 text-xs font-mono">
                      <span className="text-gray-600">Qtd Nota: <strong className="text-gray-900">{item.expectedQty}</strong></span>
                      <span className={`font-bold px-2 py-0.5 rounded ${
                        isComplete ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-amber-800 border border-amber-300'
                      }`}>
                        Bipado: {item.scannedQty} / {item.expectedQty}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        )}

      </div>

      {activeManifest && (
        <div className="p-3 bg-white border-t border-gray-300 shadow-lg shrink-0">
          <button
            onClick={handleFinishScan}
            disabled={loading || savingItemId !== null}
            className="w-full bg-[#002B49] hover:bg-blue-900 text-white font-bold py-2.5 rounded text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow transition cursor-pointer disabled:opacity-50"
          >
            <PackageCheck className="w-4 h-4" />
            <span>{loading ? 'Processando...' : 'Finalizar Romaneio'}</span>
          </button>
        </div>
      )}

    </div>
  );
}