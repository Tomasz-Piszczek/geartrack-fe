import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { biServiceApi, type ContractorDto, type ProductDto, type GrafikEntryDto } from '../api/bi-service';
import { QUERY_KEYS } from '../constants';

export const useContractors = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.CONTRACTORS],
    queryFn: biServiceApi.getContractors,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
  });
};

export const useProducts = (filterQuantity: boolean = true, groupId?: number) => {
  return useQuery({
    queryKey: [QUERY_KEYS.PRODUCTS, filterQuantity, groupId],
    queryFn: () => biServiceApi.getProducts(filterQuantity, groupId),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
  });
};

export const useProductGroups = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.PRODUCT_GROUPS],
    queryFn: biServiceApi.getProductGroups,
    staleTime: 10 * 60 * 1000,
    gcTime: 20 * 60 * 1000,
    retry: 2,
  });
};

/**
 * Grafik produkcji for a date window [from, to] (to defaults to from).
 * `autoRefreshMs` enables periodic refetch (e.g. 15 min = 900000) so the board
 * stays in sync with the ERP without a manual reload.
 */
export const useGrafik = (
  from: string,
  to?: string,
  mode: 'plan' | 'actual' = 'plan',
  autoRefreshMs?: number
) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GRAFIK, mode, from, to ?? from],
    queryFn: () => (mode === 'actual' ? biServiceApi.getGrafikActual(from, to) : biServiceApi.getGrafik(from, to)),
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 2,
    refetchInterval: autoRefreshMs && autoRefreshMs > 0 ? autoRefreshMs : false,
  });
};

/** Order detail (actual-view popover): who worked + materials. Enabled when orderId set. */
export const useGrafikOrderDetail = (orderId: number | null) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GRAFIK, 'order', orderId],
    queryFn: () => biServiceApi.getGrafikOrderDetail(orderId as number),
    enabled: orderId != null,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};

/** Live search over the grafik by contractor name or order number (min 2 chars). */
export const useGrafikSearch = (q: string) => {
  const term = q.trim();
  return useQuery({
    queryKey: [QUERY_KEYS.GRAFIK_SEARCH, term],
    queryFn: () => biServiceApi.searchGrafik(term),
    enabled: term.length >= 2,
    staleTime: 30 * 1000,
    gcTime: 60 * 1000,
    retry: 1,
  });
};

/** Overdue orders (all resources finished in the past, order not closed). */
export const useGrafikOverdue = (enabled: boolean) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GRAFIK_OVERDUE],
    queryFn: biServiceApi.getGrafikOverdue,
    enabled,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 1,
  });
};

/** Move/resize an assignment's time window (both ends snapped to 15 min server-side). */
export const useUpdateGrafikAssignment = () => {
  const queryClient = useQueryClient();
  return useMutation<
    GrafikEntryDto,
    unknown,
    { czsId: number; startTime: string; endTime: string }
  >({
    mutationFn: ({ czsId, startTime, endTime }) =>
      biServiceApi.updateGrafikAssignment(czsId, startTime, endTime),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.GRAFIK] });
    },
  });
};

export const searchContractors = (
  contractors: ContractorDto[],
  searchTerm: string
): ContractorDto[] => {
  if (!searchTerm.trim()) return contractors;
  
  const search = searchTerm.toLowerCase();
  return contractors.filter(
    (contractor) =>
      contractor.code.toLowerCase().includes(search) ||
      contractor.name.toLowerCase().includes(search)
  );
};

export const searchProducts = (
  products: ProductDto[],
  searchTerm: string
): ProductDto[] => {
  if (!searchTerm.trim()) return products;
  
  const search = searchTerm.toLowerCase();
  return products.filter(
    (product) =>
      product.code.toLowerCase().includes(search) ||
      product.name.toLowerCase().includes(search)
  );
};

export const formatPrice = (price: number | null | undefined): string => {
  if (price === null || price === undefined || isNaN(price) || price === 0) {
    return '';
  }
  
  if (price % 1 === 0) {
    return `${price.toFixed(2)}`;
  } else {
    const formatted = price.toFixed(4);
    return parseFloat(formatted).toString();
  }
};

export const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const epochDate = new Date('1970-01-01T00:00:00.000Z');
  
  if (date.getTime() === epochDate.getTime()) {
    return '';
  }
  
  return date.toLocaleDateString('pl-PL');
};

export const shouldShowPrice = (price: number | null | undefined): boolean => {
  return price !== null && price !== undefined && !isNaN(price) && price > 0;
};

export const shouldShowDate = (dateString: string | null | undefined): boolean => {
  if (!dateString) return false;
  
  const date = new Date(dateString);
  const epochDate = new Date('1970-01-01T00:00:00.000Z');
  
  return date.getTime() !== epochDate.getTime();
};

export const findContractorByCode = (
  contractors: ContractorDto[],
  code: string
): ContractorDto | undefined => {
  return contractors.find((c) => c.code === code);
};

export const findContractorByName = (
  contractors: ContractorDto[],
  name: string
): ContractorDto | undefined => {
  return contractors.find((c) => c.name === name);
};

export const findProductByCode = (
  products: ProductDto[],
  code: string
): ProductDto | undefined => {
  return products.find((p) => p.code === code);
};

export const findProductByName = (
  products: ProductDto[],
  name: string
): ProductDto | undefined => {
  return products.find((p) => p.name === name);
};