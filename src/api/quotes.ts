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
  totalPrice?: number;
  note?: string;
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
  totalPrice?: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  createdByEmail?: string;
  approved: boolean;
}

export interface QuoteAttachmentDto {
  uuid: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  createdAt: string;
}

export interface QuoteDetailsDto extends QuoteListDto {
  note?: string;
  materials?: QuoteMaterialDto[];
  productionActivities?: QuoteProductionActivityDto[];
  attachments?: QuoteAttachmentDto[];
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

  getQuotes: async (page: number = 0, size: number = 20, search?: string, createdBy?: string): Promise<QuotePaginationResponse> => {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });

    if (search) {
      params.append('search', search);
    }

    if (createdBy) {
      params.append('createdBy', createdBy);
    }

    const response = await apiClient.get(`/api/quotes?${params.toString()}`);
    const raw = response.data;
    // Spring Boot 3.5 nests pagination metadata under `page` instead of the root.
    if (raw?.page && raw.totalPages === undefined) {
      const p = raw.page;
      return {
        content: raw.content,
        totalElements: p.totalElements,
        totalPages: p.totalPages,
        number: p.number,
        size: p.size,
        first: p.number === 0,
        last: p.number >= p.totalPages - 1,
      };
    }
    return raw;
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

  uploadAttachment: async (quoteId: string, file: File): Promise<QuoteAttachmentDto> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post(`/api/quotes/${quoteId}/attachments`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  downloadAttachment: async (quoteId: string, attachmentId: string): Promise<Blob> => {
    const response = await apiClient.get(`/api/quotes/${quoteId}/attachments/${attachmentId}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  deleteAttachment: async (quoteId: string, attachmentId: string): Promise<void> => {
    await apiClient.delete(`/api/quotes/${quoteId}/attachments/${attachmentId}`);
  },

  setQuoteApproval: async (id: string, approved: boolean): Promise<QuoteListDto> => {
    const response = await apiClient.patch(`/api/quotes/${id}/approved`, { approved });
    return response.data;
  },

};