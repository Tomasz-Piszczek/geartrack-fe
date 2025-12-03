import apiClient from '../lib/api-client';

export interface QuoteMaterialDto {
  uuid?: string;
  name: string;
  purchasePrice: number;
  marginPercent: number;
  marginPln: number;
  quantity: number;
  ignoreMinQuantity: boolean;
}

export interface QuoteProductionActivityDto {
  uuid?: string;
  name: string;
  workTimeHours: number;
  workTimeMinutes: number;
  price: number;
  marginPercent: number;
  marginPln: number;
  ignoreMinQuantity: boolean;
}

export interface CreateQuoteDto {
  documentNumber: string;
  contractorCode: string;
  contractorName: string;
  productCode: string;
  productName: string;
  minQuantity: number;
  totalQuantity: number;
  materials: QuoteMaterialDto[];
  productionActivities: QuoteProductionActivityDto[];
}

export interface UpdateQuoteDto extends CreateQuoteDto {
  uuid: string;
}

export interface QuoteListDto {
  uuid: string;
  documentNumber: string;
  contractorCode: string;
  contractorName: string;
  productCode: string;
  productName: string;
  minQuantity: number;
  totalQuantity: number;
  createdAt: string;
  updatedAt: string;
}

export interface QuoteDetailsDto extends QuoteListDto {
  materials: QuoteMaterialDto[];
  productionActivities: QuoteProductionActivityDto[];
}

export interface NextQuoteNumberDto {
  nextQuoteNumber: string;
  sequenceNumber: number;
  month: number;
  year: number;
}

export interface QuotePaginationResponse {
  content: QuoteListDto[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

export const quotesApi = {
  createQuote: async (data: CreateQuoteDto): Promise<QuoteListDto> => {
    const response = await apiClient.post('/api/quotes', data);
    return response.data;
  },

  updateQuote: async (id: string, data: UpdateQuoteDto): Promise<QuoteListDto> => {
    const response = await apiClient.put(`/api/quotes/${id}`, data);
    return response.data;
  },

  getQuotes: async (page: number = 0, size: number = 20, search?: string): Promise<QuotePaginationResponse> => {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });
    
    if (search) {
      params.append('search', search);
    }

    const response = await apiClient.get(`/api/quotes?${params.toString()}`);
    return response.data;
  },

  getQuote: async (id: string): Promise<QuoteDetailsDto> => {
    const response = await apiClient.get(`/api/quotes/${id}`);
    return response.data;
  },

  deleteQuote: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/quotes/${id}`);
  },

  getNextQuoteNumber: async (): Promise<NextQuoteNumberDto> => {
    const response = await apiClient.get('/api/quotes/next-number');
    return response.data;
  },
};