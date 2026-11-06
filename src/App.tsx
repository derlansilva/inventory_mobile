import React, { useState } from 'react';
import CollectorSimulator from './components/CollectorSimulator';
import "./App.css"
type ScreenState = 'MENU' | 'RECEBIMENTO_DEVOLUCAO' | 'DESCARGA' | 'CARREGAMENTO';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenState>('MENU');

  return (
    <div className="bg-gray-100 h-screen w-screen text-gray-800 font-sans flex flex-col justify-between overflow-hidden select-none">
      
      {currentScreen === 'MENU' ? (
        <>
          {/* CABEÇALHO DO MENU */}
          <header className="bg-[#002B49] text-white px-4 py-3 flex flex-col items-center justify-center shadow-md shrink-0">
            <h1 className="font-bold text-sm tracking-wider uppercase">WMS Coletora Zebra</h1>
            <span className="text-[10px] text-gray-300 font-mono mt-0.5">v1.0 • IP: 150.X.X.X</span>
          </header>

          {/* MENU PRINCIPAL */}
          <main className="p-4 flex-1 flex flex-col min-h-0 justify-center space-y-3 overflow-y-auto max-w-md mx-auto w-full">
            <div className="text-center mb-1">
              <span className="text-xs font-bold text-[#002B49] uppercase tracking-wider bg-blue-50 px-3 py-1 rounded-full border border-blue-200 inline-block">
                Selecione a Operação
              </span>
            </div>

            {/* OPÇÃO 1: RECEBIMENTO DEVOLUÇÃO (Sem borda azul forte, igual aos outros) */}
            <button
              onClick={() => setCurrentScreen('RECEBIMENTO_DEVOLUCAO')}
              className="w-full bg-white border border-gray-300 active:bg-blue-50 p-3.5 rounded-lg shadow-sm flex items-center justify-between transition cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <div className="bg-blue-900 text-white font-mono font-bold text-xs w-6 h-6 rounded flex items-center justify-center shrink-0">
                  1
                </div>
                <div className="text-left">
                  <span className="block font-bold text-xs text-blue-900 uppercase">
                    Recebimento Devolução
                  </span>
                  <span className="block text-[10px] text-gray-500">
                    Conferência de NFs e Romaneios
                  </span>
                </div>
              </div>
            </button>

            {/* OPÇÃO 2: DESCARGA */}
            <button
              onClick={() => alert('Módulo de Descarga em desenvolvimento')}
              className="w-full bg-white border border-gray-300 active:bg-gray-100 p-3.5 rounded-lg shadow-sm flex items-center justify-between transition cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <div className="bg-gray-200 text-gray-700 font-mono font-bold text-xs w-6 h-6 rounded flex items-center justify-center shrink-0">
                  2
                </div>
                <div className="text-left">
                  <span className="block font-bold text-xs text-gray-800 uppercase">
                    Descarga
                  </span>
                  <span className="block text-[10px] text-gray-500">
                    Entrada de paletes e docas
                  </span>
                </div>
              </div>
            </button>

            {/* OPÇÃO 3: CARREGAMENTO */}
            <button
              onClick={() => alert('Módulo de Carregamento em desenvolvimento')}
              className="w-full bg-white border border-gray-300 active:bg-gray-100 p-3.5 rounded-lg shadow-sm flex items-center justify-between transition cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <div className="bg-gray-200 text-gray-700 font-mono font-bold text-xs w-6 h-6 rounded flex items-center justify-center shrink-0">
                  3
                </div>
                <div className="text-left">
                  <span className="block font-bold text-xs text-gray-800 uppercase">
                    Carregamento
                  </span>
                  <span className="block text-[10px] text-gray-500">
                    Expedição e conferência de saída
                  </span>
                </div>
              </div>
            </button>
          </main>

          {/* RODAPÉ DO MENU */}
          <footer className="bg-gray-200 border-t border-gray-300 px-3 py-2 text-center text-[10px] text-gray-600 font-mono shrink-0">
            Operador: <strong className="text-gray-800">Sem Autenticação</strong>
          </footer>
        </>
      ) : (
        /* TELA DE CONFERÊNCIA (Ocupando 100% da coletora) */
        <div className="flex-1 flex flex-col min-h-0 w-full">
          <CollectorSimulator onBack={() => setCurrentScreen('MENU')} />
        </div>
      )}

    </div>
  );
}