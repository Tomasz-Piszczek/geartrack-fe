import React, { useState } from 'react';
import { HiX, HiInformationCircle, HiArrowLeft } from 'react-icons/hi';

interface MaterialAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBack: () => void;
  onSubmit: (dateFrom: string, dateTo: string, offsetPercent?: number, offsetNumber?: number) => void;
  isLoading?: boolean;
}

const MaterialAuditModal: React.FC<MaterialAuditModalProps> = ({
  isOpen,
  onClose,
  onBack,
  onSubmit,
  isLoading = false,
}) => {
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [offsetPercent, setOffsetPercent] = useState<string>('');
  const [offsetNumber, setOffsetNumber] = useState<string>('');
  const [showTooltip, setShowTooltip] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dateFrom || !dateTo) return;

    onSubmit(
      dateFrom,
      dateTo,
      offsetPercent ? parseFloat(offsetPercent) : undefined,
      offsetNumber ? parseFloat(offsetNumber) : undefined
    );
  };

  const isValid = dateFrom && dateTo && dateFrom <= dateTo;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-background-sidebar rounded-xl p-6 w-full max-w-lg mx-4 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <HiArrowLeft className="w-5 h-5" />
            <span>Wróć</span>
          </button>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <HiX className="w-6 h-6" />
          </button>
        </div>

        <h2 className="text-xl font-semibold text-white mb-6 text-center">
          Sprawdź Poprawność RW w Zleceniach
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Data od
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-3 py-2 bg-background-card border border-gray-600 rounded-lg text-white focus:border-main focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Data do
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-2 bg-background-card border border-gray-600 rounded-lg text-white focus:border-main focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Offset Section */}
          <div className="bg-background-card rounded-lg p-4 space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-gray-300">
                Tolerancja błędu (opcjonalnie)
              </h3>
              <div className="relative">
                <button
                  type="button"
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                  onClick={() => setShowTooltip(!showTooltip)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <HiInformationCircle className="w-5 h-5" />
                </button>

                {showTooltip && (
                  <div className="absolute left-6 top-0 z-10 w-80 p-3 bg-gray-800 border border-gray-600 rounded-lg shadow-xl text-sm text-gray-200">
                    <p className="font-medium mb-2">Jak działa tolerancja?</p>
                    <p className="mb-2">
                      Materiał jest oznaczony jako <span className="text-red-400">błędnie wpisany</span> tylko wtedy,
                      gdy <span className="font-semibold">OBA</span> warunki nie są spełnione:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-gray-300">
                      <li>Różnica przekracza odchył procentowy</li>
                      <li>Różnica przekracza odchył liczbowy</li>
                    </ul>
                    <p className="mt-2 text-gray-400">
                      <span className="font-medium">Przykład:</span> Odchylenie 5% i 2 szt.
                      Oczekiwano 100 szt., wpisano 97 szt. Różnica = 3 szt.
                      odchył % = 5 szt., odchył liczbowy = 2 szt.
                      Różnica (3) mieści się w 5%, więc <span className="text-green-400">OK</span>.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Odchył procentowy (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={offsetPercent}
                  onChange={(e) => setOffsetPercent(e.target.value)}
                  placeholder="np. 5"
                  className="w-full px-3 py-2 bg-background-sidebar border border-gray-600 rounded-lg text-white focus:border-main focus:outline-none placeholder-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Odchył liczbowy
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={offsetNumber}
                  onChange={(e) => setOffsetNumber(e.target.value)}
                  placeholder="np. 2"
                  className="w-full px-3 py-2 bg-background-sidebar border border-gray-600 rounded-lg text-white focus:border-main focus:outline-none placeholder-gray-500"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!isValid || isLoading}
            className="w-full py-3 bg-main text-black font-medium rounded-lg hover:bg-main/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isLoading ? (
              <span className="flex items-center black justify-center gap-2">
                <svg className="animate-spin h-5 w-5 black" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Analizuję...
              </span>
            ) : (
              'Sprawdź'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default MaterialAuditModal;
