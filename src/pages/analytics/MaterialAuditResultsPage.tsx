import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  HiArrowLeft,
  HiCheckCircle,
  HiXCircle,
  HiChevronDown,
  HiUserGroup,
  HiExclamationCircle,
  HiFilter,
  HiSortAscending,
  HiSortDescending,
  HiSearch,
  HiClock,
} from 'react-icons/hi';
import type { MaterialAuditResponseDto, AuditOrderDto } from '../../api/bi-service';

interface LocationState {
  auditData: MaterialAuditResponseDto;
  dateFrom: string;
  dateTo: string;
  offsetPercent?: number;
  offsetNumber?: number;
}

type SortOption = 'name' | 'accuracy' | 'errors' | 'total';
type SortDirection = 'asc' | 'desc';

const MaterialAuditResultsPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState | null;

  const [expandedWorkers, setExpandedWorkers] = useState<Set<string>>(new Set());
  const [showIncorrectOnly, setShowIncorrectOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('errors');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedProductTypes, setSelectedProductTypes] = useState<Set<string>>(new Set());
  const [productTypeDropdownOpen, setProductTypeDropdownOpen] = useState(false);
  const [productTypeSearch, setProductTypeSearch] = useState('');
  const [selectedTwrKods, setSelectedTwrKods] = useState<Set<string>>(new Set());
  const [twrKodDropdownOpen, setTwrKodDropdownOpen] = useState(false);
  const [twrKodSearch, setTwrKodSearch] = useState('');
  const [showCorrectOnly, setShowCorrectOnly] = useState(false);
  const [ignoredMaterials, setIgnoredMaterials] = useState<Set<string>>(() => {
    const stored = localStorage.getItem('ignoredMaterials');
    return stored ? new Set(JSON.parse(stored)) : new Set();
  });
  const [ignoredDropdownOpen, setIgnoredDropdownOpen] = useState(false);
  const [ignoredSearch, setIgnoredSearch] = useState('');
  const productTypeDropdownRef = useRef<HTMLDivElement>(null);
  const twrKodDropdownRef = useRef<HTMLDivElement>(null);
  const ignoredDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (productTypeDropdownRef.current && !productTypeDropdownRef.current.contains(event.target as Node)) {
        setProductTypeDropdownOpen(false);
      }
      if (twrKodDropdownRef.current && !twrKodDropdownRef.current.contains(event.target as Node)) {
        setTwrKodDropdownOpen(false);
      }
      if (ignoredDropdownRef.current && !ignoredDropdownRef.current.contains(event.target as Node)) {
        setIgnoredDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Save ignored materials to localStorage
  useEffect(() => {
    localStorage.setItem('ignoredMaterials', JSON.stringify(Array.from(ignoredMaterials)));
  }, [ignoredMaterials]);

  if (!state?.auditData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="card text-center max-w-md">
          <HiExclamationCircle className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Brak danych</h2>
          <p className="text-gray-400 mb-6">Nie znaleziono danych audytu do wyświetlenia.</p>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-main hover:bg-main/80 text-white rounded-xl transition-all"
          >
            <HiArrowLeft className="w-5 h-5" />
            Powrót
          </button>
        </div>
      </div>
    );
  }

  const { auditData, dateFrom, dateTo, offsetPercent, offsetNumber } = state;

  const toggleWorker = (workerId: string) => {
    setExpandedWorkers((prev) => {
      const next = new Set(prev);
      if (next.has(workerId)) {
        next.delete(workerId);
      } else {
        next.add(workerId);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedWorkers(new Set(auditData.workers.map((w) => w.workerId)));
  };

  const collapseAll = () => {
    setExpandedWorkers(new Set());
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const handleSort = (option: SortOption) => {
    if (sortBy === option) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(option);
      setSortDirection(option === 'name' ? 'asc' : 'desc');
    }
  };

  // Get all unique product types from all orders
  const allProductTypes = useMemo(() => {
    const types = new Set<string>();
    auditData.workers.forEach((worker) => {
      worker.correctOrders.forEach((order) => {
        if (order.productTypeId) types.add(order.productTypeId);
      });
      worker.incorrectOrders.forEach((order) => {
        if (order.productTypeId) types.add(order.productTypeId);
      });
    });
    return Array.from(types).sort();
  }, [auditData.workers]);

  // Filter product types based on search
  const filteredProductTypes = useMemo(() => {
    if (!productTypeSearch.trim()) return allProductTypes;
    const search = productTypeSearch.toLowerCase();
    return allProductTypes.filter((type) => type.toLowerCase().includes(search));
  }, [allProductTypes, productTypeSearch]);

  // Get all unique twrKod values from all orders
  const allTwrKods = useMemo(() => {
    const codes = new Set<string>();
    auditData.workers.forEach((worker) => {
      worker.correctOrders.forEach((order) => {
        order.materials.forEach((mat) => {
          if (mat.twrKod) codes.add(mat.twrKod);
        });
      });
      worker.incorrectOrders.forEach((order) => {
        order.materials.forEach((mat) => {
          if (mat.twrKod) codes.add(mat.twrKod);
        });
      });
    });
    return Array.from(codes).sort();
  }, [auditData.workers]);

  // Filter twrKod based on search
  const filteredTwrKods = useMemo(() => {
    if (!twrKodSearch.trim()) return allTwrKods;
    const search = twrKodSearch.toLowerCase();
    return allTwrKods.filter((code) => code.toLowerCase().includes(search));
  }, [allTwrKods, twrKodSearch]);

  // Filter ignored materials based on search (from audit response twrKods)
  const filteredIgnoredOptions = useMemo(() => {
    if (!ignoredSearch.trim()) return allTwrKods;
    const search = ignoredSearch.toLowerCase();
    return allTwrKods.filter((code) => code.toLowerCase().includes(search));
  }, [allTwrKods, ignoredSearch]);

  const toggleProductType = (productType: string) => {
    setSelectedProductTypes((prev) => {
      const next = new Set(prev);
      if (next.has(productType)) {
        next.delete(productType);
      } else {
        next.add(productType);
      }
      return next;
    });
  };

  const clearProductTypeFilter = () => {
    setSelectedProductTypes(new Set());
    setProductTypeSearch('');
  };

  const selectAllFilteredProductTypes = () => {
    setSelectedProductTypes((prev) => {
      const next = new Set(prev);
      filteredProductTypes.forEach((type) => next.add(type));
      return next;
    });
  };

  const deselectAllFilteredProductTypes = () => {
    setSelectedProductTypes((prev) => {
      const next = new Set(prev);
      filteredProductTypes.forEach((type) => next.delete(type));
      return next;
    });
  };

  const toggleTwrKod = (twrKod: string) => {
    setSelectedTwrKods((prev) => {
      const next = new Set(prev);
      if (next.has(twrKod)) {
        next.delete(twrKod);
      } else {
        next.add(twrKod);
      }
      return next;
    });
  };

  const clearTwrKodFilter = () => {
    setSelectedTwrKods(new Set());
    setTwrKodSearch('');
  };

  const selectAllFilteredTwrKods = () => {
    setSelectedTwrKods((prev) => {
      const next = new Set(prev);
      filteredTwrKods.forEach((code) => next.add(code));
      return next;
    });
  };

  const deselectAllFilteredTwrKods = () => {
    setSelectedTwrKods((prev) => {
      const next = new Set(prev);
      filteredTwrKods.forEach((code) => next.delete(code));
      return next;
    });
  };

  const toggleIgnoredMaterial = (twrKod: string) => {
    setIgnoredMaterials((prev) => {
      const next = new Set(prev);
      if (next.has(twrKod)) {
        next.delete(twrKod);
      } else {
        next.add(twrKod);
      }
      return next;
    });
  };

  const clearIgnoredMaterials = () => {
    setIgnoredMaterials(new Set());
    setIgnoredSearch('');
  };

  const selectAllFilteredIgnored = () => {
    setIgnoredMaterials((prev) => {
      const next = new Set(prev);
      filteredIgnoredOptions.forEach((code) => next.add(code));
      return next;
    });
  };

  const deselectAllFilteredIgnored = () => {
    setIgnoredMaterials((prev) => {
      const next = new Set(prev);
      filteredIgnoredOptions.forEach((code) => next.delete(code));
      return next;
    });
  };

  // Helper to check if order contains selected twrKod
  const orderHasSelectedTwrKod = (order: AuditOrderDto) => {
    if (selectedTwrKods.size === 0) return true;
    return order.materials.some((mat) => mat.twrKod && selectedTwrKods.has(mat.twrKod));
  };

  // Helper to check if material is ok (considering ignored materials)
  const isMaterialOk = (mat: { twrKod?: string; ok?: boolean }) => {
    if (mat.twrKod && ignoredMaterials.has(mat.twrKod)) {
      return true; // Ignored materials are always considered OK
    }
    return mat.ok;
  };

  // Helper to check if order is correct (all materials ok, considering ignored)
  const isOrderCorrect = (order: AuditOrderDto) => {
    return order.materials.every((mat) => isMaterialOk(mat));
  };

  // Transform order to apply ignored materials logic
  const transformOrder = (order: AuditOrderDto): AuditOrderDto => {
    return {
      ...order,
      materials: order.materials.map((mat) => ({
        ...mat,
        ok: isMaterialOk(mat),
      })),
    };
  };

  // Filter workers and their orders based on selected filters
  const filteredAndSortedWorkers = useMemo(() => {
    let workers = auditData.workers.map((worker) => {
      // Combine all orders and re-classify based on ignored materials
      const allOrders = [...worker.correctOrders, ...worker.incorrectOrders];

      // Transform orders to apply ignored materials and re-classify
      let newCorrectOrders: AuditOrderDto[] = [];
      let newIncorrectOrders: AuditOrderDto[] = [];

      allOrders.forEach((order) => {
        const transformedOrder = transformOrder(order);
        if (isOrderCorrect(order)) {
          newCorrectOrders.push(transformedOrder);
        } else {
          newIncorrectOrders.push(transformedOrder);
        }
      });

      // Filter by product type
      if (selectedProductTypes.size > 0) {
        newCorrectOrders = newCorrectOrders.filter(
          (order) => order.productTypeId && selectedProductTypes.has(order.productTypeId)
        );
        newIncorrectOrders = newIncorrectOrders.filter(
          (order) => order.productTypeId && selectedProductTypes.has(order.productTypeId)
        );
      }

      // Filter by twrKod
      if (selectedTwrKods.size > 0) {
        newCorrectOrders = newCorrectOrders.filter(orderHasSelectedTwrKod);
        newIncorrectOrders = newIncorrectOrders.filter(orderHasSelectedTwrKod);
      }

      // Apply "show correct only" - hide incorrect orders
      if (showCorrectOnly) {
        newIncorrectOrders = [];
      }

      // Apply "show incorrect only" - hide correct orders
      if (showIncorrectOnly) {
        newCorrectOrders = [];
      }

      return {
        ...worker,
        correctOrders: newCorrectOrders,
        incorrectOrders: newIncorrectOrders,
        correctCount: newCorrectOrders.length,
        incorrectCount: newIncorrectOrders.length,
        totalOrders: newCorrectOrders.length + newIncorrectOrders.length,
      };
    });

    // Remove workers with no orders after filtering
    workers = workers.filter((w) => w.totalOrders > 0);

    return [...workers].sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.workerId.localeCompare(b.workerId);
          break;
        case 'accuracy':
          const accA = a.totalOrders > 0 ? a.correctCount / a.totalOrders : 0;
          const accB = b.totalOrders > 0 ? b.correctCount / b.totalOrders : 0;
          comparison = accA - accB;
          break;
        case 'errors':
          comparison = a.incorrectCount - b.incorrectCount;
          break;
        case 'total':
          comparison = a.totalOrders - b.totalOrders;
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [auditData.workers, showIncorrectOnly, showCorrectOnly, sortBy, sortDirection, selectedProductTypes, selectedTwrKods, ignoredMaterials]);

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-2">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors self-start"
            >
              <HiArrowLeft className="w-5 h-5" />
              <span className="text-sm">Powrót</span>
            </button>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
                Audyt Materiałów RW
              </h1>
              <div className="flex flex-wrap items-center gap-2 text-sm text-gray-400">
                <span className="bg-[#343434] px-3 py-1 rounded-lg">
                  {formatDate(dateFrom)} — {formatDate(dateTo)}
                </span>
                {(offsetPercent !== undefined || offsetNumber !== undefined) && (
                  <span className="bg-[#343434] px-3 py-1 rounded-lg">
                    Tolerancja: {offsetPercent !== undefined && `${offsetPercent}%`}
                    {offsetPercent !== undefined && offsetNumber !== undefined && ' / '}
                    {offsetNumber !== undefined && `${offsetNumber} szt.`}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="card fade-in space-y-4">
          {/* Row 1: Basic filters and sorting */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-gray-400">
                <HiFilter className="w-4 h-4" />
                <span className="text-sm font-medium">Filtry:</span>
              </div>

              <label className="inline-flex items-center gap-2 cursor-pointer bg-[#343434] hover:bg-[#3d3d3d] px-4 py-2 rounded-lg transition-colors">
                <input
                  type="checkbox"
                  checked={showIncorrectOnly}
                  onChange={(e) => {
                    setShowIncorrectOnly(e.target.checked);
                    if (e.target.checked) setShowCorrectOnly(false);
                  }}
                  className="w-4 h-4 rounded border-gray-600 bg-[#1F1F1F] text-main focus:ring-main focus:ring-offset-0"
                />
                <span className="text-sm text-gray-300">Tylko z błędami</span>
              </label>

              <label className="inline-flex items-center gap-2 cursor-pointer bg-[#343434] hover:bg-[#3d3d3d] px-4 py-2 rounded-lg transition-colors">
                <input
                  type="checkbox"
                  checked={showCorrectOnly}
                  onChange={(e) => {
                    setShowCorrectOnly(e.target.checked);
                    if (e.target.checked) setShowIncorrectOnly(false);
                  }}
                  className="w-4 h-4 rounded border-gray-600 bg-[#1F1F1F] text-main focus:ring-main focus:ring-offset-0"
                />
                <span className="text-sm text-gray-300">Tylko poprawne</span>
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-gray-400 mr-1">Sortuj:</span>
              <SortButton
                label="Nazwa"
                isActive={sortBy === 'name'}
                direction={sortBy === 'name' ? sortDirection : null}
                onClick={() => handleSort('name')}
              />
              <SortButton
                label="Skuteczność"
                isActive={sortBy === 'accuracy'}
                direction={sortBy === 'accuracy' ? sortDirection : null}
                onClick={() => handleSort('accuracy')}
              />
              <SortButton
                label="Błędy"
                isActive={sortBy === 'errors'}
                direction={sortBy === 'errors' ? sortDirection : null}
                onClick={() => handleSort('errors')}
              />
              <SortButton
                label="Zlecenia"
                isActive={sortBy === 'total'}
                direction={sortBy === 'total' ? sortDirection : null}
                onClick={() => handleSort('total')}
              />
            </div>
          </div>

          {/* Row 2: Product Type Filter Dropdown */}
          {allProductTypes.length > 0 && (
            <div className="border-t border-[#343434] pt-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm text-gray-400">Typ produktu:</span>

                <div className="relative" ref={productTypeDropdownRef}>
                  {/* Dropdown Button */}
                  <button
                    onClick={() => setProductTypeDropdownOpen(!productTypeDropdownOpen)}
                    className="inline-flex items-center justify-between gap-2 px-4 py-2 bg-[#343434] hover:bg-[#3d3d3d] rounded-lg text-sm transition-colors min-w-[200px]"
                  >
                    <span className="text-gray-300">
                      {selectedProductTypes.size === 0
                        ? 'Wszystkie typy'
                        : `Wybrano: ${selectedProductTypes.size}`}
                    </span>
                    <HiChevronDown
                      className={`w-4 h-4 text-gray-400 transition-transform ${
                        productTypeDropdownOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {/* Dropdown Panel */}
                  {productTypeDropdownOpen && (
                    <div className="absolute z-50 mt-2 w-72 bg-[#2a2a2a] border border-[#404040] rounded-xl shadow-xl overflow-hidden">
                      {/* Search Input */}
                      <div className="p-3 border-b border-[#404040]">
                        <div className="relative">
                          <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                          <input
                            type="text"
                            value={productTypeSearch}
                            onChange={(e) => setProductTypeSearch(e.target.value)}
                            placeholder="Szukaj typu produktu..."
                            className="w-full pl-9 pr-3 py-2 bg-[#1F1F1F] border border-[#404040] rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-main"
                          />
                        </div>
                      </div>

                      {/* Select All / Deselect All */}
                      <div className="flex items-center justify-between px-3 py-2 border-b border-[#404040] bg-[#252525]">
                        <button
                          onClick={selectAllFilteredProductTypes}
                          className="text-xs text-main hover:text-main/80 transition-colors"
                        >
                          Zaznacz wszystkie
                        </button>
                        <button
                          onClick={deselectAllFilteredProductTypes}
                          className="text-xs text-gray-400 hover:text-white transition-colors"
                        >
                          Odznacz wszystkie
                        </button>
                      </div>

                      {/* Options List */}
                      <div className="max-h-60 overflow-y-auto">
                        {filteredProductTypes.length === 0 ? (
                          <div className="px-3 py-4 text-center text-sm text-gray-500">
                            Nie znaleziono typów
                          </div>
                        ) : (
                          filteredProductTypes.map((productType) => {
                            const isSelected = selectedProductTypes.has(productType);
                            return (
                              <label
                                key={productType}
                                className="flex items-center gap-3 px-3 py-2.5 hover:bg-[#343434] cursor-pointer transition-colors"
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleProductType(productType)}
                                  className="w-4 h-4 rounded border-gray-600 bg-[#1F1F1F] text-main focus:ring-main focus:ring-offset-0"
                                />
                                <span className={`text-sm ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                                  {productType}
                                </span>
                              </label>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Clear Filter Button */}
                {selectedProductTypes.size > 0 && (
                  <button
                    onClick={clearProductTypeFilter}
                    className="text-xs text-main hover:text-main/80 transition-colors"
                  >
                    Wyczyść
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Row 3: TwrKod Filter Dropdown */}
          {allTwrKods.length > 0 && (
            <div className="border-t border-[#343434] pt-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm text-gray-400">Kod materiału:</span>

                <div className="relative" ref={twrKodDropdownRef}>
                  {/* Dropdown Button */}
                  <button
                    onClick={() => setTwrKodDropdownOpen(!twrKodDropdownOpen)}
                    className="inline-flex items-center justify-between gap-2 px-4 py-2 bg-[#343434] hover:bg-[#3d3d3d] rounded-lg text-sm transition-colors min-w-[200px]"
                  >
                    <span className="text-gray-300">
                      {selectedTwrKods.size === 0
                        ? 'Wszystkie materiały'
                        : `Wybrano: ${selectedTwrKods.size}`}
                    </span>
                    <HiChevronDown
                      className={`w-4 h-4 text-gray-400 transition-transform ${
                        twrKodDropdownOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {/* Dropdown Panel */}
                  {twrKodDropdownOpen && (
                    <div className="absolute z-50 mt-2 w-72 bg-[#2a2a2a] border border-[#404040] rounded-xl shadow-xl overflow-hidden">
                      {/* Search Input */}
                      <div className="p-3 border-b border-[#404040]">
                        <div className="relative">
                          <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                          <input
                            type="text"
                            value={twrKodSearch}
                            onChange={(e) => setTwrKodSearch(e.target.value)}
                            placeholder="Szukaj kodu materiału..."
                            className="w-full pl-9 pr-3 py-2 bg-[#1F1F1F] border border-[#404040] rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-main"
                          />
                        </div>
                      </div>

                      {/* Select All / Deselect All */}
                      <div className="flex items-center justify-between px-3 py-2 border-b border-[#404040] bg-[#252525]">
                        <button
                          onClick={selectAllFilteredTwrKods}
                          className="text-xs text-main hover:text-main/80 transition-colors"
                        >
                          Zaznacz wszystkie
                        </button>
                        <button
                          onClick={deselectAllFilteredTwrKods}
                          className="text-xs text-gray-400 hover:text-white transition-colors"
                        >
                          Odznacz wszystkie
                        </button>
                      </div>

                      {/* Options List */}
                      <div className="max-h-60 overflow-y-auto">
                        {filteredTwrKods.length === 0 ? (
                          <div className="px-3 py-4 text-center text-sm text-gray-500">
                            Nie znaleziono materiałów
                          </div>
                        ) : (
                          filteredTwrKods.map((twrKod) => {
                            const isSelected = selectedTwrKods.has(twrKod);
                            return (
                              <label
                                key={twrKod}
                                className="flex items-center gap-3 px-3 py-2.5 hover:bg-[#343434] cursor-pointer transition-colors"
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleTwrKod(twrKod)}
                                  className="w-4 h-4 rounded border-gray-600 bg-[#1F1F1F] text-main focus:ring-main focus:ring-offset-0"
                                />
                                <span className={`text-sm font-mono ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                                  {twrKod}
                                </span>
                              </label>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Clear Filter Button */}
                {selectedTwrKods.size > 0 && (
                  <button
                    onClick={clearTwrKodFilter}
                    className="text-xs text-main hover:text-main/80 transition-colors"
                  >
                    Wyczyść
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Row 4: Ignored Materials Dropdown */}
          {allTwrKods.length > 0 && (
            <div className="border-t border-[#343434] pt-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm text-gray-400">Ignoruj materiały:</span>

                <div className="relative" ref={ignoredDropdownRef}>
                  {/* Dropdown Button */}
                  <button
                    onClick={() => setIgnoredDropdownOpen(!ignoredDropdownOpen)}
                    className="inline-flex items-center justify-between gap-2 px-4 py-2 bg-[#343434] hover:bg-[#3d3d3d] rounded-lg text-sm transition-colors min-w-[200px]"
                  >
                    <span className={ignoredMaterials.size > 0 ? 'text-orange-400' : 'text-gray-300'}>
                      {ignoredMaterials.size === 0
                        ? 'Wybierz materiały'
                        : `Ignorowane: ${ignoredMaterials.size}`}
                    </span>
                    <HiChevronDown
                      className={`w-4 h-4 text-gray-400 transition-transform ${
                        ignoredDropdownOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {/* Dropdown Panel */}
                  {ignoredDropdownOpen && (
                    <div className="absolute z-50 mt-2 w-72 bg-[#2a2a2a] border border-[#404040] rounded-xl shadow-xl overflow-hidden">
                      {/* Search Input */}
                      <div className="p-3 border-b border-[#404040]">
                        <div className="relative">
                          <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                          <input
                            type="text"
                            value={ignoredSearch}
                            onChange={(e) => setIgnoredSearch(e.target.value)}
                            placeholder="Szukaj kodu..."
                            className="w-full pl-9 pr-3 py-2 bg-[#1F1F1F] border border-[#404040] rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-main"
                          />
                        </div>
                      </div>

                      {/* Select All / Deselect All */}
                      <div className="flex items-center justify-between px-3 py-2 border-b border-[#404040] bg-[#252525]">
                        <button
                          onClick={selectAllFilteredIgnored}
                          className="text-xs text-main hover:text-main/80 transition-colors"
                        >
                          Zaznacz wszystkie
                        </button>
                        <button
                          onClick={deselectAllFilteredIgnored}
                          className="text-xs text-gray-400 hover:text-white transition-colors"
                        >
                          Odznacz wszystkie
                        </button>
                      </div>

                      {/* Options List */}
                      <div className="max-h-60 overflow-y-auto">
                        {filteredIgnoredOptions.length === 0 ? (
                          <div className="px-3 py-4 text-center text-sm text-gray-500">
                            Nie znaleziono materiałów
                          </div>
                        ) : (
                          filteredIgnoredOptions.map((code) => {
                            const isIgnored = ignoredMaterials.has(code);
                            return (
                              <label
                                key={code}
                                className="flex items-center gap-3 px-3 py-2.5 hover:bg-[#343434] cursor-pointer transition-colors"
                              >
                                <input
                                  type="checkbox"
                                  checked={isIgnored}
                                  onChange={() => toggleIgnoredMaterial(code)}
                                  className="w-4 h-4 rounded border-gray-600 bg-[#1F1F1F] text-orange-500 focus:ring-orange-500 focus:ring-offset-0"
                                />
                                <span className={`text-sm font-mono ${isIgnored ? 'text-orange-400' : 'text-gray-300'}`}>
                                  {code}
                                </span>
                              </label>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Clear Ignored Button */}
                {ignoredMaterials.size > 0 && (
                  <button
                    onClick={clearIgnoredMaterials}
                    className="text-xs text-orange-400 hover:text-orange-300 transition-colors"
                  >
                    Wyczyść
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Workers Section Header */}
        <div className="flex items-center justify-between fade-in">
          <div className="flex items-center gap-3">
            <HiUserGroup className="w-5 h-5 text-gray-400" />
            <h2 className="text-lg font-semibold text-white">
              Pracownicy ({filteredAndSortedWorkers.length})
            </h2>
            {(selectedProductTypes.size > 0 || selectedTwrKods.size > 0 || ignoredMaterials.size > 0) && (
              <div className="flex items-center gap-2">
                {selectedProductTypes.size > 0 && (
                  <span className="text-xs text-main bg-main/20 px-2 py-1 rounded-lg">
                    {selectedProductTypes.size} {selectedProductTypes.size === 1 ? 'typ' : 'typów'}
                  </span>
                )}
                {selectedTwrKods.size > 0 && (
                  <span className="text-xs text-blue-400 bg-blue-500/20 px-2 py-1 rounded-lg">
                    {selectedTwrKods.size} {selectedTwrKods.size === 1 ? 'materiał' : 'materiałów'}
                  </span>
                )}
                {ignoredMaterials.size > 0 && (
                  <span className="text-xs text-orange-400 bg-orange-500/20 px-2 py-1 rounded-lg">
                    {ignoredMaterials.size} ignorowanych
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={expandAll}
              className="text-xs text-gray-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-[#343434] transition-colors"
            >
              Rozwiń wszystko
            </button>
            <button
              onClick={collapseAll}
              className="text-xs text-gray-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-[#343434] transition-colors"
            >
              Zwiń wszystko
            </button>
          </div>
        </div>

        {/* Workers List */}
        <div className="space-y-3">
          {filteredAndSortedWorkers.map((worker, index) => {
            const isExpanded = expandedWorkers.has(worker.workerId);
            const accuracy =
              worker.totalOrders > 0
                ? (worker.correctCount / worker.totalOrders) * 100
                : 0;

            return (
              <WorkerCard
                key={worker.workerId}
                worker={worker}
                isExpanded={isExpanded}
                accuracy={accuracy}
                onToggle={() => toggleWorker(worker.workerId)}
                animationDelay={index * 50}
              />
            );
          })}
        </div>

        {/* Empty State */}
        {filteredAndSortedWorkers.length === 0 && (
          <div className="card text-center py-12 fade-in">
            <HiCheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">
              {showIncorrectOnly
                ? 'Wszyscy pracownicy bezbłędni!'
                : 'Brak danych'}
            </h3>
            <p className="text-gray-400">
              {showIncorrectOnly
                ? 'Żaden pracownik nie ma błędnych wpisów w tym okresie.'
                : 'Nie znaleziono żadnych danych do wyświetlenia.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Sort Button Component
interface SortButtonProps {
  label: string;
  isActive: boolean;
  direction: SortDirection | null;
  onClick: () => void;
}

const SortButton: React.FC<SortButtonProps> = ({ label, isActive, direction, onClick }) => (
  <button
    onClick={onClick}
    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${
      isActive
        ? 'bg-main/20 text-main border border-main/30'
        : 'bg-[#343434] text-gray-400 hover:text-white hover:bg-[#3d3d3d]'
    }`}
  >
    {label}
    {isActive && direction && (
      direction === 'asc' ? (
        <HiSortAscending className="w-4 h-4" />
      ) : (
        <HiSortDescending className="w-4 h-4" />
      )
    )}
  </button>
);

// Worker Card Component
interface WorkerCardProps {
  worker: MaterialAuditResponseDto['workers'][0];
  isExpanded: boolean;
  accuracy: number;
  onToggle: () => void;
  animationDelay: number;
}

const WorkerCard: React.FC<WorkerCardProps> = ({
  worker,
  isExpanded,
  accuracy,
  onToggle,
  animationDelay,
}) => {
  const isAllCorrect = worker.incorrectCount === 0;
  const accuracyFormatted = accuracy.toFixed(1);

  const getAccuracyBarColor = () => {
    if (accuracy >= 95) return 'from-green-500 to-green-400';
    if (accuracy >= 80) return 'from-yellow-500 to-yellow-400';
    return 'from-red-500 to-red-400';
  };

  return (
    <div
      className="card !p-0 overflow-hidden fade-in"
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      {/* Worker Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 md:p-5 hover:bg-[#2a2a2a] transition-colors text-left"
      >
        <div className="flex items-center gap-4 min-w-0 flex-1">
          {/* Status Icon */}
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
              isAllCorrect
                ? 'bg-green-500/20 text-green-400'
                : 'bg-red-500/20 text-red-400'
            }`}
          >
            {isAllCorrect ? (
              <HiCheckCircle className="w-7 h-7" />
            ) : (
              <HiXCircle className="w-7 h-7" />
            )}
          </div>

          {/* Worker Info */}
          <div className="min-w-0 flex-1">
            <p className="text-white font-semibold text-base md:text-lg truncate">
              {worker.workerId}
            </p>
            <div className="flex items-center gap-4 mt-1">
              <span className="text-sm text-gray-400">
                {worker.totalOrders} zleceń
              </span>
              {/* Mini Progress Bar */}
              <div className="hidden sm:flex items-center gap-2 flex-1 max-w-[200px]">
                <div className="h-1.5 bg-[#1F1F1F] rounded-full flex-1 overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${getAccuracyBarColor()} rounded-full transition-all duration-300`}
                    style={{ width: `${accuracy}%` }}
                  />
                </div>
                <span className="text-xs text-gray-400 w-12 text-right">
                  {accuracyFormatted}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 md:gap-6 shrink-0">
          <div className="hidden md:flex items-center gap-4">
            <div className="text-right">
              <p className="text-green-400 font-semibold">{worker.correctCount}</p>
              <p className="text-xs text-gray-500">poprawnych</p>
            </div>
            <div className="text-right">
              <p className="text-red-400 font-semibold">{worker.incorrectCount}</p>
              <p className="text-xs text-gray-500">błędnych</p>
            </div>
          </div>

          {/* Mobile Stats */}
          <div className="flex md:hidden items-center gap-2 text-sm">
            <span className="text-green-400 font-medium">{worker.correctCount}</span>
            <span className="text-gray-600">/</span>
            <span className="text-red-400 font-medium">{worker.incorrectCount}</span>
          </div>

          {/* Chevron */}
          <div className={`text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
            <HiChevronDown className="w-5 h-5" />
          </div>
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-[#343434] bg-[#1a1a1a]">
          <div className="p-4 md:p-5 space-y-6">
            {/* Incorrect Orders */}
            {worker.incorrectOrders.length > 0 && (
              <OrdersSection
                title="Zlecenia z błędami"
                orders={worker.incorrectOrders}
                type="error"
              />
            )}

            {/* Correct Orders */}
            {worker.correctOrders.length > 0 && (
              <OrdersSection
                title="Poprawne zlecenia"
                orders={worker.correctOrders}
                type="success"
                maxVisible={5}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Orders Section Component
interface OrdersSectionProps {
  title: string;
  orders: AuditOrderDto[];
  type: 'success' | 'error';
  maxVisible?: number;
  showAll?: boolean;
}

const OrdersSection: React.FC<OrdersSectionProps> = ({
  title,
  orders,
  type,
  maxVisible = 5,
  showAll = false,
}) => {
  const [showAllOrders, setShowAllOrders] = useState(showAll);
  const visibleOrders = showAllOrders ? orders : orders.slice(0, maxVisible);
  const hasMore = orders.length > maxVisible && !showAllOrders;

  const headerColor = type === 'error' ? 'text-red-400' : 'text-green-400';
  const badgeBg = type === 'error' ? 'bg-red-500/20' : 'bg-green-500/20';

  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <h4 className={`font-medium ${headerColor}`}>{title}</h4>
        <span className={`${badgeBg} ${headerColor} text-xs px-2 py-0.5 rounded-full`}>
          {orders.length}
        </span>
      </div>

      <div className="space-y-2">
        {visibleOrders.map((order) => (
          <OrderCard key={order.numerZlecenia} order={order} type={type} />
        ))}
      </div>

      {hasMore && (
        <button
          onClick={() => setShowAllOrders(true)}
          className="mt-3 text-sm text-main hover:text-main/80 transition-colors"
        >
          Pokaż pozostałe {orders.length - maxVisible} zleceń...
        </button>
      )}
    </div>
  );
};

// Order Card Component
interface OrderCardProps {
  order: AuditOrderDto;
  type: 'success' | 'error';
}

const OrderCard: React.FC<OrderCardProps> = ({ order, type }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const borderColor = type === 'error' ? 'border-red-500/30' : 'border-green-500/30';
  const bgColor = type === 'error' ? 'bg-red-500/5' : 'bg-green-500/5';
  const hoverBg = type === 'error' ? 'hover:bg-red-500/10' : 'hover:bg-green-500/10';

  // Count correct and incorrect materials
  const correctMaterials = order.materials.filter((m) => m.ok).length;
  const incorrectMaterials = order.materials.filter((m) => !m.ok).length;

  // Format minutes to hours and minutes
  const formatMinutes = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
    }
    return `${mins}min`;
  };

  return (
    <div className={`rounded-xl border ${borderColor} ${bgColor} overflow-hidden`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full flex items-center justify-between p-3 md:p-4 ${hoverBg} transition-colors text-left`}
      >
        <div className="flex flex-wrap items-center gap-2 md:gap-4">
          <span className="text-white font-mono text-sm font-medium">
            {order.numerZlecenia}
          </span>
          <span className="text-gray-400 text-sm">{order.productTypeId}</span>
          {order.dataZlecenia && (
            <span className="text-gray-500 text-xs">
              {new Date(order.dataZlecenia).toLocaleDateString('pl-PL')}
            </span>
          )}
          {/* Material counts */}
          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1 text-green-400">
              <HiCheckCircle className="w-3.5 h-3.5" />
              {correctMaterials}
            </span>
            <span className="flex items-center gap-1 text-red-400">
              <HiXCircle className="w-3.5 h-3.5" />
              {incorrectMaterials}
            </span>
          </div>
        </div>
        <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
          <HiChevronDown className="w-4 h-4 text-gray-400" />
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-[#343434]/50">
          {/* Worker Time Section */}
          {order.workerTimeEntries && order.workerTimeEntries.length > 0 && (
            <div className="p-4 border-b border-[#343434]/50 bg-[#232323]/30">
              <div className="flex items-center gap-2 mb-3">
                <HiClock className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-300">Pracownicy:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {order.workerTimeEntries.map((workerTime) => (
                  <div
                    key={workerTime.workerId}
                    className="flex items-center gap-2 px-3 py-1.5 bg-[#2a2a2a] rounded-lg border border-[#343434]"
                  >
                    <span className="text-sm text-white font-medium">{workerTime.workerId}</span>
                    <span className="text-xs text-gray-400">—</span>
                    <span className="text-sm text-main font-mono">
                      {formatMinutes(workerTime.minutesWorked)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Materials Table */}
          {order.materials.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[500px]">
            <thead>
              <tr className="bg-[#232323]/50">
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Materiał
                </th>
                <th className="text-right py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Oczekiwano
                </th>
                <th className="text-right py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Wpisano
                </th>
                <th className="text-right py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Różnica
                </th>
                <th className="text-center py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#343434]/30">
              {order.materials.map((mat) => {
                const diff =
                  mat.actualIlosc !== null && mat.expectedIlosc !== null
                    ? mat.actualIlosc - mat.expectedIlosc
                    : null;

                const getDiffColor = () => {
                  if (diff === null) return 'text-gray-500';
                  if (diff === 0) return 'text-gray-300';
                  if (diff > 0) return 'text-orange-400';
                  return 'text-red-400';
                };

                return (
                  <tr key={mat.twrKod} className="hover:bg-[#232323]/30 transition-colors">
                    <td className="py-3 px-4">
                      <span className="text-white font-mono">{mat.twrKod}</span>
                    </td>
                    <td className="py-3 px-4 text-right text-gray-300">
                      {mat.expectedIlosc?.toFixed(2) ?? '—'}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-300">
                      {mat.actualIlosc?.toFixed(2) ?? '—'}
                    </td>
                    <td className={`py-3 px-4 text-right font-medium ${getDiffColor()}`}>
                      {diff !== null ? (
                        <span>
                          {diff >= 0 ? '+' : ''}
                          {diff.toFixed(2)}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {mat.ok ? (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-green-500/20">
                          <HiCheckCircle className="w-5 h-5 text-green-400" />
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-red-500/20">
                          <HiXCircle className="w-5 h-5 text-red-400" />
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MaterialAuditResultsPage;
